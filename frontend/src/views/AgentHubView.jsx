import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldAlert, BookOpen, Rocket, Code2, Cpu } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';

export default function AgentHubView() {
  const navigate = useNavigate();

  const agents = [
    {
      id: 'implication',
      name: 'Implication Agent',
      description: 'Analyzes architectural blast radius, downstream dependencies, and cross-repo API contracts to predict what breaks when you change code.',
      icon: ShieldAlert,
      color: 'bg-warning',
    },
    {
      id: 'coder',
      name: 'Coder Agent',
      description: 'Reads architectural RFCs and traverses the Semantic Knowledge Graph to safely generate production-ready markdown code diffs.',
      icon: Code2,
      color: 'bg-[#FFD23F]',
    },
    {
      id: 'onboarding',
      name: 'Onboarding Agent',
      description: 'Generates comprehensive onboarding guides and documentation for new developers by semantically reading the entire codebase.',
      icon: BookOpen,
      color: 'bg-secondary',
    },
    {
      id: 'migration',
      name: 'Migration Planner',
      description: 'Helps plan database schema migrations and framework upgrades by tracking ORM dependencies.',
      icon: Rocket,
      color: 'bg-primary',
      disabled: true
    }
  ];

  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <PageHeader
        title="Agent Hub"
        description="Select an AI Agent to assist with your codebase"
        icon={Bot}
      />
      
      <div className="flex-1 overflow-auto p-4 md:p-8">
        {/* ADLC Supervisor Hero Card */}
        <div className="max-w-7xl mx-auto mb-8">
          <BrutalCard 
            className="flex flex-col md:flex-row items-center gap-6 bg-primary hover:-translate-y-1 hover:shadow-brutal-lg cursor-pointer transition-all"
            onClick={() => navigate('/projects/default/adlc')}
          >
            <div className="w-20 h-20 bg-white border-[3px] border-black flex items-center justify-center rounded-md shadow-brutal-sm shrink-0">
              <Cpu size={40} className="text-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-black text-2xl uppercase tracking-tight">ADLC Supervisor</h2>
                <span className="text-xs font-bold px-2 py-1 bg-black text-white rounded-full">RECOMMENDED</span>
              </div>
              <p className="font-bold text-sm opacity-90 max-w-2xl">
                Launch the End-to-End Agentic Development Life Cycle. This 5-agent swarm will plan the architecture, write the code, review for safety, generate tests, and write database migrations autonomously.
              </p>
            </div>
            <BrutalButton 
              className="w-full md:w-auto px-8 bg-white text-black border-[3px] border-black hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/projects/default/adlc');
              }}
            >
              Launch Swarm
            </BrutalButton>
          </BrutalCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {agents.map((agent) => (
            <BrutalCard 
              key={agent.id} 
              className={`flex flex-col h-full ${agent.disabled ? 'opacity-60 grayscale' : 'hover:-translate-y-1 hover:shadow-brutal-lg cursor-pointer transition-all'}`}
              onClick={() => !agent.disabled && navigate(`/rippleagent/${agent.id}`)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${agent.color} border-[3px] border-black flex items-center justify-center rounded-md shadow-brutal-sm`}>
                  <agent.icon size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tight">{agent.name}</h3>
                  {agent.disabled && <span className="text-xs font-bold px-2 py-1 bg-black text-white rounded-full ml-2">COMING SOON</span>}
                </div>
              </div>
              
              <p className="font-bold flex-1 text-sm opacity-80 mb-6">
                {agent.description}
              </p>
              
              <div className="mt-auto">
                <BrutalButton 
                  className="w-full" 
                  disabled={agent.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/rippleagent/${agent.id}`);
                  }}
                >
                  {agent.disabled ? 'Unavailable' : 'Launch Agent'}
                </BrutalButton>
              </div>
            </BrutalCard>
          ))}
        </div>
      </div>
    </div>
  );
}
