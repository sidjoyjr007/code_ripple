import logging
import sys

def get_agent_logger(agent_name: str) -> logging.Logger:
    """
    Returns a configured logger for the specified agent, ensuring uniform console formatting.
    """
    logger = logging.getLogger(agent_name)
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)
        
        # Format: 2023-10-25 15:30:00 - [Coder Agent] - INFO - Generating code diffs...
        formatter = logging.Formatter(
            '%(asctime)s - [%(name)s] - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
