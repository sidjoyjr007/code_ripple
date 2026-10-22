import React from 'react';
import { Menu, Network, Bot } from 'lucide-react';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Outlet } from 'react-router-dom';

const sidebarConfig = {
  brand: {
    title: "Code Ripple",
    subtitle: "Codebase Analyzer",
    icon: <Network className="w-8 h-8 text-foreground" />
  },
  navigation: [
    {
      title: "Main Menu",
      links: [
        { to: "/projects", label: "Projects", icon: <Network size={20} strokeWidth={2} /> },
        { to: "/rippleagent", label: "Ripple Agents", icon: <Bot size={20} strokeWidth={2} /> },
      ]
    }
  ],
  userProfile: {
    name: "Developer",
    role: "Admin",
    email: "dev@local.host"
  }
};

export const Layout = () => {
  return (
    <div className="flex h-screen text-foreground overflow-hidden font-sans relative z-10 bg-background flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b-[3px] border-border bg-accent shrink-0">
        <div className="bg-card border-[3px] border-border shadow-brutal-sm p-2 transform -rotate-2 rounded-md">
          <h1 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none">
            Code Ripple
          </h1>
        </div>
        <Sheet>
          <SheetTrigger className="p-2 border-[3px] border-border bg-card shadow-brutal-sm rounded-md hover:bg-muted transition-colors">
            <Menu strokeWidth={3} size={20} />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-[3px] border-border">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar className="flex" {...sidebarConfig} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full w-72 shrink-0 border-r-[3px] border-border">
        <Sidebar {...sidebarConfig} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-background">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto flex flex-col h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
