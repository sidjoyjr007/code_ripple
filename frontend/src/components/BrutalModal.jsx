import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

export function BrutalModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  headerClassName = "bg-primary text-primary-foreground",
  children,
  maxWidth = "max-w-lg",
  hideClose = false
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        showCloseButton={false}
        className={`p-0 border-[4px] border-border shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-md w-full ${maxWidth} bg-card gap-0 overflow-hidden`}
      >
        
        {/* Aggressive Header */}
        <DialogHeader className={`p-6 border-b-[4px] border-border flex flex-row items-center justify-between space-y-0 text-left ${headerClassName}`}>
          <div className="flex items-center gap-4">
            {Icon && <Icon size={40} strokeWidth={3} className="shrink-0" />}
            <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter m-0 leading-none">
              {title}
            </DialogTitle>
            <DialogDescription className="hidden">Modal Dialog</DialogDescription>
          </div>
          {!hideClose && (
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 hover:bg-black/20 rounded-md cursor-pointer transition-colors shrink-0 ml-4"
            >
              <X size={28} strokeWidth={4} />
            </button>
          )}
        </DialogHeader>
        
        {/* Modal Body / Footer */}
        {children}
        
      </DialogContent>
    </Dialog>
  );
}
