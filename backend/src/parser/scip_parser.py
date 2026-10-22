import os
from . import scip_pb2

class SCIPParser:
    def __init__(self, db_client):
        self.db = db_client

    def parse_and_ingest(self, scip_file_path, repo_id):
        """
        Parses a SCIP index (Protobuf) and ingests the semantic AST graph into Neo4j in batches.
        """
        if not os.path.exists(scip_file_path):
            print(f"SCIP index not found at {scip_file_path}")
            return False

        print(f"Starting SCIP ingestion from {scip_file_path}")
        
        index = scip_pb2.Index()
        with open(scip_file_path, 'rb') as f:
            index.ParseFromString(f.read())

        self._ingest_to_neo4j(index, repo_id)
        print("SCIP semantic graph ingestion complete.")
        return True

    def _parse_symbol_details(self, symbol: str, sym_info=None):
        moniker = symbol.strip().split(" ")[-1]
        kind = sym_info.kind if sym_info else 0
        
        # 1. Classify Node Label: Class vs Function vs Variable
        # SCIP SymbolInformation.Kind enum:
        # Class = 7, Interface = 21
        # Function = 17, Method = 26, Constructor = 9, Macro = 25
        # Variable = 50, Constant = 8, Field = 15, Property = 46
        if kind in (7, 21):
            label = "Class"
        elif kind in (17, 26, 9, 25):
            label = "Function"
        elif kind in (50, 8, 15, 46):
            label = "Variable"
        else:
            # Fallback based on SCIP Descriptor syntax:
            # '#' indicates Type/Class/Interface
            # '()' indicates Method/Function
            # '.' indicates Field/Variable
            if "#" in moniker and not (moniker.endswith("().") or "()" in moniker.split("#")[-1]):
                label = "Class"
            elif "()" in moniker or moniker.endswith("/__init__:") or moniker.endswith("()"):
                label = "Function"
            elif moniker.endswith(".") and not moniker.endswith("/"):
                label = "Variable"
            else:
                label = "Function"

        # 2. Extract clean, human-readable identifier
        clean = moniker.rstrip(".()#: ")
        if "#" in clean:
            clean = clean.split("#")[-1]
        if "/" in clean:
            clean = clean.split("/")[-1]
        clean = clean.strip("`'\":(). ")
        if not clean:
            clean = moniker

        return label, clean

    def _flush_batch(self, session, batch):
        if not batch:
            return

        cypher = """
        UNWIND $batch AS row
        MERGE (s:Symbol {id: row.id, repo_id: row.repo_id})
        SET s.name = row.name,
            s.full_moniker = row.symbol
            
        FOREACH (_ IN CASE WHEN row.label = "Class" THEN [1] ELSE [] END | SET s:Class)
        FOREACH (_ IN CASE WHEN row.label = "Function" THEN [1] ELSE [] END | SET s:Function)
        FOREACH (_ IN CASE WHEN row.label = "Variable" THEN [1] ELSE [] END | SET s:Variable)
        
        WITH s, row
        OPTIONAL MATCH (f:File {repo_id: row.repo_id})
        WHERE f.relative_path = row.relative_path OR f.path ENDS WITH row.relative_path
        
        FOREACH (_ IN CASE WHEN f IS NOT NULL AND row.edge = "DEFINES" THEN [1] ELSE [] END | MERGE (f)-[:DEFINES]->(s))
        FOREACH (_ IN CASE WHEN f IS NOT NULL AND row.edge = "CALLS" THEN [1] ELSE [] END | MERGE (f)-[:CALLS]->(s))
        FOREACH (_ IN CASE WHEN f IS NOT NULL AND row.edge = "IMPORTS" THEN [1] ELSE [] END | MERGE (f)-[:IMPORTS]->(s))
        FOREACH (_ IN CASE WHEN f IS NOT NULL AND row.edge = "EXTENDS" THEN [1] ELSE [] END | MERGE (f)-[:EXTENDS]->(s))
        """
        session.run(cypher, batch=batch)

    def _ingest_to_neo4j(self, index, repo_id):
        # 1. Build fast O(1) symbol lookup map
        sym_info_map = {}
        for sym_info in index.external_symbols:
            sym_info_map[sym_info.symbol] = sym_info
        for doc in index.documents:
            for sym_info in doc.symbols:
                sym_info_map[sym_info.symbol] = sym_info

        batch = []
        batch_size = 500
        total_occurrences = 0

        with self.db.driver.session() as session:
            for doc in index.documents:
                relative_path = doc.relative_path.lstrip("./")
                seen_in_doc = set()

                for occ in doc.occurrences:
                    symbol = occ.symbol
                    if not symbol or "local" in symbol:
                        continue

                    roles = occ.symbol_roles

                    # Determine Edge Type from bitmask
                    # SymbolRole: Definition = 1, Import = 2, WriteAccess = 4, ReadAccess = 8
                    if roles & 2:
                        edge_type = "IMPORTS"
                    elif roles & 1:
                        edge_type = "DEFINES"
                    else:
                        edge_type = "CALLS"

                    sym_info = sym_info_map.get(symbol)
                    if sym_info:
                        for rel in sym_info.relationships:
                            if rel.is_implementation:
                                edge_type = "EXTENDS"
                                break

                    # Deduplicate repeated identical references within the same document
                    dedup_key = (relative_path, symbol, edge_type)
                    if dedup_key in seen_in_doc:
                        continue
                    seen_in_doc.add(dedup_key)

                    label, clean_name = self._parse_symbol_details(symbol, sym_info)
                    node_id = f"{symbol}_{repo_id}"

                    batch.append({
                        "id": node_id,
                        "repo_id": repo_id,
                        "relative_path": relative_path,
                        "symbol": symbol,
                        "name": clean_name,
                        "label": label,
                        "edge": edge_type
                    })
                    total_occurrences += 1

                    if len(batch) >= batch_size:
                        self._flush_batch(session, batch)
                        batch = []

            # Flush any remaining items in final batch
            if batch:
                self._flush_batch(session, batch)

        print(f"Native SCIP AST extraction complete for {repo_id} ({total_occurrences} semantic references ingested).")
