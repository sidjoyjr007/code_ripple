import React from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary Caught Crash", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-destructive/10 border-[3px] border-destructive p-8 max-w-lg shadow-brutal w-full rounded-md">
            <div className="flex items-center gap-4 mb-6">
              <ShieldAlert className="text-destructive h-12 w-12" />
              <h1 className="text-3xl font-black uppercase tracking-tighter text-destructive">
                Fatal Error
              </h1>
            </div>
            <p className="font-bold text-foreground mb-6">
              The application encountered an unexpected failure. Our telemetry has logged this event.
            </p>
            <div className="bg-black text-white p-4 font-mono text-sm mb-6 overflow-x-auto border-[3px] border-black">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-white font-black uppercase tracking-widest py-4 px-8 border-[3px] border-black shadow-brutal transition-all active:translate-x-1 active:translate-y-1 active:shadow-none rounded-md"
            >
              <RefreshCcw size={20} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
