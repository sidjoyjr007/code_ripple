import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsUpDown, Network } from 'lucide-react';
import { BrutalAvatar, BrutalBadge } from './BrutalUI';
import { cn } from "@/lib/utils";

const Sidebar = ({ 
  brand = {},
  navigation = [],
  userProfile,
  className
}) => {
  const profile = userProfile || {
    name: "Developer",
    role: "Admin",
    email: "dev@local.host",
    avatar: null
  };

  return (
    <aside className={cn("w-full bg-card flex flex-col h-full shrink-0 z-20 border-r-[3px] border-border relative", className)}>
      {/* Brand Header */}
      {brand && (
        <div className="p-6 pb-8 border-b-[3px] border-border bg-accent relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full border-[3px] border-border bg-primary/40"></div>
          <div className="absolute -left-2 bottom-2 w-8 h-8 rotate-45 border-[3px] border-border bg-warning/40"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="bg-surface border-[3px] border-border shadow-brutal p-3 transform -rotate-2 hover:rotate-0 hover:scale-105 hover:shadow-brutal-sm transition-all duration-200 cursor-pointer inline-flex items-center w-max mx-auto gap-3 rounded-md">
              {brand.icon && (
                <div className="bg-primary border-[2px] border-border p-1 flex items-center justify-center">
                  {brand.icon}
                </div>
              )}
              <h1 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none text-left">
                {brand.title}<br/>
                {brand.subtitle && <span className="text-background bg-foreground px-1 inline-block mt-1">{brand.subtitle}</span>}
              </h1>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto mt-4 px-4 pb-4">
        {navigation.map((group, groupIdx) => (
          <nav key={groupIdx} className="flex flex-col gap-2 mb-6">
            {group.title && (
               <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 ml-2">{group.title}</div>
            )}
            {group.links.map((link, linkIdx) => (
              <NavLink 
                key={linkIdx}
                to={link.to} 
                className={({ isActive }) => 
                  `flex items-center space-x-4 px-4 py-3 border-[3px] font-black uppercase tracking-wide text-sm transition-all group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground border-border shadow-brutal-sm scale-[1.02] rounded-md' 
                      : 'bg-transparent border-transparent text-foreground hover:bg-muted hover:border-border hover:shadow-brutal-sm rounded-md'
                  }`
                }
              >
                {link.icon && <span className="group-hover:-translate-y-1 transition-transform">{link.icon}</span>}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        ))}
      </div>
      
      {/* User Profile Footer */}
      {profile && (
        <div className="p-3 border-t-[3px] border-border bg-card relative">
          <div 
            className="w-full flex items-center gap-2.5 p-2.5 border-[3px] border-border bg-card text-foreground shadow-brutal-sm select-none rounded-md"
          >
            <BrutalAvatar 
              src={profile.avatar} 
              fallback={profile.name?.charAt(0) || 'U'}
              className="w-8 h-8 border-[2px] border-border shadow-[2px_2px_0px_0px_var(--border)] text-xs flex items-center justify-center font-bold"
            />
            <div className="min-w-0 flex-1">
              <p className="font-black uppercase text-xs tracking-wide truncate leading-tight">
                {profile.name}
              </p>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider truncate">
                {profile.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
