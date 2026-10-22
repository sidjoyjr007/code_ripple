import React from 'react';
import { BrutalModal } from './BrutalModal';
import { BrutalButton } from './BrutalButton';
import { AlertOctagon } from 'lucide-react';

export function BrutalConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  onConfirm,
  onCancel,
  isDestructive = true
}) {
  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={AlertOctagon}
      headerClassName={isDestructive ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}
    >
      {/* Modal Body */}
      <div className="p-8 bg-surface">
        <p className="text-xl font-black leading-snug text-foreground tracking-tight">
          {description}
        </p>
      </div>

      {/* Modal Footer */}
      <div className="p-6 bg-card border-t-[4px] border-border flex flex-col-reverse sm:flex-row justify-end gap-4 sm:space-x-0">
        <BrutalButton 
          variant="outline" 
          onClick={onCancel}
          className="px-8 h-14 text-sm font-black w-full sm:w-auto"
        >
          {cancelText}
        </BrutalButton>
        <BrutalButton 
          variant={isDestructive ? "destructive" : "primary"}
          onClick={onConfirm}
          className="px-8 h-14 text-sm font-black w-full sm:w-auto shadow-brutal-md hover:shadow-brutal-sm hover:translate-y-1 transition-all rounded-md"
        >
          {confirmText}
        </BrutalButton>
      </div>
    </BrutalModal>
  );
}
