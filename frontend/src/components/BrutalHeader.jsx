import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrutalButton } from './BrutalButton';

export function BrutalHeader({ title, description, actions, onBack, showBack = true, backTooltip = "Go Back" }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-surface border-[3px] border-border shadow-brutal rounded-md">
      <div className="flex items-center gap-4">
        {showBack && (
          <BrutalButton onClick={handleBack} className="p-2 h-auto shrink-0" title={backTooltip}>
            <ArrowLeft strokeWidth={3} size={20} />
          </BrutalButton>
        )}
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {title}
          </h1>
          {description && (
            <p className="font-bold text-foreground/70 uppercase text-xs tracking-widest mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-4 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
