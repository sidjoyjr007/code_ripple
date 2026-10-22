import React from 'react';
import { Bot, Wrench, Cpu } from 'lucide-react';

export default function ResourceAvatar({ type }) {
  const renderIcon = () => {
    switch (type) {
      case 'agent':
        return <Bot size={24} strokeWidth={3} className="text-foreground" />;
      case 'tool':
        return <Wrench size={24} strokeWidth={3} className="text-foreground" />;
      case 'llm':
        return <Cpu size={24} strokeWidth={3} className="text-foreground" />;
      default:
        return <Bot size={24} strokeWidth={3} className="text-foreground" />;
    }
  };

  return (
    <div className="bg-primary p-2 border-[3px] border-border shadow-brutal-sm transform -rotate-3 rounded-md">
      {renderIcon()}
    </div>
  );
}
