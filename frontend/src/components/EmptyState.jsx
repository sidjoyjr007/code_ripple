import React from 'react';
import { Card } from "@/components/ui/card";

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white border-[3px] border-black border-dashed shadow-brutal rounded-md">
      <div className="w-16 h-16 rounded-md bg-[#fef08a] border-2 border-black flex items-center justify-center mb-6 text-black shadow-brutal-sm">
        {Icon && <Icon className="w-8 h-8" strokeWidth={2.5} />}
      </div>
      <h3 className="text-3xl font-black text-black mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-black font-medium max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </Card>
  );
}
