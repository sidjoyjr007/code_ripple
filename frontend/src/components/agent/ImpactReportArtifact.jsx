import React, { useRef, useState } from 'react';
import { BrutalCard } from '../BrutalCard';
import { AlertTriangle, Activity, Database, Download, CheckCircle, FileCode, ListChecks, BarChart as BarChartIcon, Clock, Crosshair } from 'lucide-react';
import { BrutalButton } from '../BrutalButton';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const getScoreColor = (score) => {
  if (score < 30) return 'text-success';
  if (score < 70) return 'text-warning';
  return 'text-destructive';
};

const getComplexityColor = (c) => {
  const comp = c?.toUpperCase() || 'UNKNOWN';
  if (comp.includes('LOW')) return '#22c55e'; // success
  if (comp.includes('MEDIUM')) return '#f59e0b'; // warning
  return '#ef4444'; // destructive
};

export const ImpactReportArtifact = ({ dashboardData }) => {
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!dashboardData) {
    return (
      <BrutalCard className="h-full flex flex-col items-center justify-center border-[4px] bg-background gap-4 text-center">
        <div className="w-16 h-16 bg-surface border-4 border-black flex items-center justify-center opacity-50 rounded-md">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="font-black text-xl uppercase tracking-widest opacity-50">No Analytics Data Yet</h2>
          <p className="font-bold opacity-40 mt-2">Query the agent to build the SDLC Impact Report.</p>
        </div>
      </BrutalCard>
    );
  }

  const { 
    executive_summary, 
    overall_risk_score,
    sdlc_phases,
    risk_radar,
    database_migrations,
    downtime_risk,
    action_items
  } = dashboardData;

  let files_impacted_by_repo = dashboardData.files_impacted_by_repo;
  
  // The LLM sometimes sends nested JSON as a raw string to bypass schema constraints.
  // If it's a string, try to parse it into an object so we don't treat it as an array of characters.
  if (typeof files_impacted_by_repo === 'string') {
    try {
      files_impacted_by_repo = JSON.parse(files_impacted_by_repo);
    } catch (e) {
      console.warn("Could not parse files_impacted_by_repo string:", e);
    }
  }

  // Defensively calculate total files
  let totalFiles = dashboardData.files_impacted ?? '?';
  if (files_impacted_by_repo && typeof files_impacted_by_repo === 'object') {
    if (Array.isArray(files_impacted_by_repo)) {
      totalFiles = files_impacted_by_repo.length;
    } else {
      totalFiles = Object.values(files_impacted_by_repo).reduce((acc, files) => {
        if (Array.isArray(files)) return acc + files.length;
        return acc + 1; // If it's an object/string, just count it as 1 to prevent exploding lengths
      }, 0);
    }
  }

  const handleDownload = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    const originalHeight = dashboardRef.current.style.height;
    const originalOverflow = dashboardRef.current.style.overflow;
    
    try {
      dashboardRef.current.style.height = 'max-content';
      dashboardRef.current.style.overflow = 'visible';
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: dashboardRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('sdlc-analytics-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      dashboardRef.current.style.height = originalHeight;
      dashboardRef.current.style.overflow = originalOverflow;
      setIsExporting(false);
    }
  };

  return (
    <BrutalCard className="h-full flex flex-col overflow-hidden border-[4px] bg-background shadow-none" noPadding>
      {/* Header - Actions Only */}
      <div className="bg-secondary border-b-[4px] border-black p-2 px-4 flex items-center justify-end shrink-0">
        <BrutalButton variant="primary" size="sm" onClick={handleDownload} loading={isExporting} className="uppercase font-black text-[10px] h-7 px-2">
          <Download size={12} className="mr-1" /> Export Deck
        </BrutalButton>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="dashboard-content" ref={dashboardRef}>
        
        {/* Tier 1: Executive Summary & Top Metrics */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-card border-[3px] border-black p-5 shadow-brutal-sm rounded-md">
            <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-primary">
              <Activity size={16} /> Executive Summary
            </h3>
            <p className="font-bold text-[15px] leading-relaxed">{executive_summary || 'No summary provided.'}</p>
          </div>
          
          <BrutalCard className="border-[3px] bg-surface flex flex-col gap-2 shadow-brutal-sm min-w-[150px] rounded-md" noPadding>
            <div className="p-3 border-b-[3px] border-black flex items-center justify-between opacity-80 font-black text-xs uppercase tracking-widest">
              <span>Risk Score</span>
              <span className={`text-sm ${getScoreColor(overall_risk_score)}`}>/100</span>
            </div>
            <div className={`p-3 font-black text-4xl uppercase tracking-wider ${getScoreColor(overall_risk_score)}`}>
              {overall_risk_score ?? '?'}
            </div>
          </BrutalCard>
          
          <BrutalCard className="border-[3px] bg-surface flex flex-col gap-2 shadow-brutal-sm min-w-[150px] rounded-md" noPadding>
            <div className="p-3 border-b-[3px] border-black flex items-center gap-2 opacity-80 font-black text-xs uppercase tracking-widest">
              <FileCode size={14} /> Scope
            </div>
            <div className="p-3 flex flex-col">
              <span className="font-black text-3xl">{totalFiles}</span>
              <span className="font-bold text-xs opacity-60 uppercase tracking-wider mt-1">Files Impacted</span>
            </div>
          </BrutalCard>
        </div>

        {/* Tier 2: SDLC Pipeline (Middle) */}
        {sdlc_phases && sdlc_phases.length > 0 && (
          <BrutalCard className="border-[3px] bg-card flex flex-col shadow-brutal-sm h-[320px] rounded-md">
            <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-primary border-b-[2px] border-black pb-2 shrink-0">
              <BarChartIcon size={16} /> SDLC Effort & Complexity (Days)
            </h3>
            <div className="flex-1 w-full mt-2 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                <BarChart data={sdlc_phases} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" opacity={0.1} vertical={false} />
                  <XAxis dataKey="phase" tick={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ border: '3px solid #000', borderRadius: '0', backgroundColor: '#fff', fontWeight: 'bold', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                    itemStyle={{ color: '#000' }}
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  />
                  <Bar dataKey="days" stroke="#000" strokeWidth={2}>
                    {
                      sdlc_phases.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getComplexityColor(entry.complexity)} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BrutalCard>
        )}

        {/* Tier 3: Radar Chart & Action Items */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Left Column: Radar Chart */}
          <BrutalCard className="border-[3px] bg-card flex flex-col shadow-brutal-sm min-h-[350px] rounded-md">
            <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-primary border-b-[2px] border-black pb-2">
              <Crosshair size={16} /> Multi-Dimensional Risk Radar
            </h3>
            <div className="flex-1 w-full flex items-center justify-center">
              {risk_radar && risk_radar.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={risk_radar}>
                    <PolarGrid stroke="#000" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#000', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Risk Score" dataKey="score" stroke="#ef4444" strokeWidth={3} fill="#ef4444" fillOpacity={0.4} />
                    <Tooltip 
                      contentStyle={{ border: '3px solid #000', borderRadius: '0', backgroundColor: '#fff', fontWeight: 'bold', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                      itemStyle={{ color: '#000' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="font-bold opacity-50">No radar data available.</p>
              )}
            </div>
          </BrutalCard>

          {/* Right Column: Deployment Risk & Action Items */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <BrutalCard className="border-[3px] bg-card flex flex-col shadow-brutal-sm rounded-md">
                <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-primary border-b-[2px] border-black pb-2">
                  <Database size={16} /> DB Migrations
                </h3>
                <div className={`font-black text-lg uppercase tracking-wider ${database_migrations ? 'text-destructive' : 'text-success'}`}>
                  {database_migrations ? 'REQUIRED' : 'NONE'}
                </div>
              </BrutalCard>

              <BrutalCard className="border-[3px] bg-card flex flex-col shadow-brutal-sm rounded-md">
                <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-destructive border-b-[2px] border-black pb-2">
                  <Clock size={16} /> Downtime Risk
                </h3>
                <div className="font-black text-lg uppercase tracking-widest">{downtime_risk || 'UNKNOWN'}</div>
              </BrutalCard>
            </div>

            <BrutalCard className="border-[3px] bg-card flex-1 flex flex-col shadow-brutal-sm rounded-md">
              <h3 className="font-black text-sm uppercase tracking-widest mb-3 flex items-center gap-2 text-success-foreground border-b-[2px] border-black pb-2">
                <ListChecks size={16} /> Strategic Action Items
              </h3>
              {action_items && action_items.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {action_items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 font-bold text-sm">
                      <div className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center text-xs font-black mt-0.5">{idx + 1}</div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-bold text-sm opacity-50">No actions specified.</p>
              )}
            </BrutalCard>
          </div>
          
        </div>

        {/* Tier 4: Detailed File Analysis */}
        {files_impacted_by_repo && typeof files_impacted_by_repo === 'object' && Object.keys(files_impacted_by_repo).length > 0 && (
          <BrutalCard className="border-[3px] bg-card flex flex-col shadow-brutal-sm mt-2 rounded-md">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2 text-primary border-b-[2px] border-black pb-2">
              <FileCode size={16} /> Impacted Files Breakdown
            </h3>
            <div className="flex flex-col gap-6">
              {Array.isArray(files_impacted_by_repo) ? (
                <div className="flex flex-col gap-3">
                  <ul className="flex flex-col gap-2">
                    {files_impacted_by_repo.map((file, idx) => (
                      <li key={idx} className="flex flex-col p-3 border-[2px] border-black bg-surface">
                        <span className="font-black text-sm text-primary mb-1 break-all">
                          {typeof file === 'string' ? file : (file.filepath || 'Unknown File')}
                        </span>
                        <span className="font-bold text-xs opacity-70 leading-relaxed">
                          {typeof file === 'string' ? 'No explanation provided.' : (file.reason || 'No explanation provided.')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                Object.entries(files_impacted_by_repo).map(([repoName, files]) => (
                  <div key={repoName} className="flex flex-col gap-3">
                    <h4 className="font-black text-sm bg-black text-white py-1 px-3 w-max uppercase tracking-widest">
                      {repoName}
                    </h4>
                    <ul className="flex flex-col gap-2">
                      {Array.isArray(files) ? files.map((file, idx) => (
                        <li key={idx} className="flex flex-col p-3 border-[2px] border-black bg-surface">
                          <span className="font-black text-sm text-primary mb-1 break-all">
                            {typeof file === 'string' ? file : (file.filepath || 'Unknown File')}
                          </span>
                          <span className="font-bold text-xs opacity-70 leading-relaxed">
                            {typeof file === 'string' ? 'No explanation provided.' : (file.reason || 'No explanation provided.')}
                          </span>
                        </li>
                      )) : (
                        <li className="flex flex-col p-3 border-[2px] border-black bg-surface">
                          <span className="font-bold text-xs opacity-70 leading-relaxed text-destructive">
                            Format Error: Expected array of files, got {typeof files}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </BrutalCard>
        )}

      </div>
    </BrutalCard>
  );
};
