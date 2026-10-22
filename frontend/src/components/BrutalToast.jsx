import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, Info, Bell } from 'lucide-react';
import { cn } from "@/lib/utils";
import toast, { Toaster } from 'react-hot-toast';

// ----------------------------------------------------
// VARIANT TO COLOR & ICON CONFIG
// ----------------------------------------------------
const VARIANT_CONFIG = {
  primary: {
    bg: "bg-primary",
    text: "text-foreground",
    border: "border-black",
    icon: Info,
    badgeBg: "bg-black text-white",
  },
  secondary: {
    bg: "bg-secondary",
    text: "text-foreground",
    border: "border-black",
    icon: CheckCircle2,
    badgeBg: "bg-black text-white",
  },
  success: {
    bg: "bg-secondary",
    text: "text-foreground",
    border: "border-black",
    icon: CheckCircle2,
    badgeBg: "bg-black text-white",
  },
  warning: {
    bg: "bg-warning",
    text: "text-foreground",
    border: "border-black",
    icon: AlertTriangle,
    badgeBg: "bg-black text-white",
  },
  destructive: {
    bg: "bg-destructive",
    text: "text-white",
    border: "border-black",
    icon: AlertOctagon,
    badgeBg: "bg-black text-white",
  },
  error: {
    bg: "bg-destructive",
    text: "text-white",
    border: "border-black",
    icon: AlertOctagon,
    badgeBg: "bg-black text-white",
  },
  info: {
    bg: "bg-info",
    text: "text-foreground",
    border: "border-black",
    icon: Info,
    badgeBg: "bg-black text-white",
  },
  surface: {
    bg: "bg-surface",
    text: "text-foreground",
    border: "border-black",
    icon: Bell,
    badgeBg: "bg-muted text-foreground",
  },
};

// ----------------------------------------------------
// 1. REUSABLE INLINE NOTIFICATION / ALERT BANNER
// ----------------------------------------------------
export function BrutalNotification({
  title,
  message,
  children,
  variant = 'warning',
  icon: CustomIcon,
  onDismiss,
  action,
  className,
  ...props
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.warning;
  const IconComponent = CustomIcon || config.icon;

  return (
    <div
      className={cn(
        "relative w-full border-[3px] border-black shadow-brutal p-4 transition-all duration-200 rounded-md",
        config.bg,
        config.text,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3.5">
        <div className={cn("p-1.5 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] shrink-0", config.badgeBg)}>
          <IconComponent size={18} strokeWidth={3} />
        </div>

        <div className="flex-1 pr-6">
          {title && (
            <h5 className="font-black uppercase tracking-wider text-sm mb-0.5 leading-snug">
              {title}
            </h5>
          )}
          <div className="font-bold text-xs opacity-90 leading-relaxed">
            {message || children}
          </div>
          {action && <div className="mt-2.5">{action}</div>}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={14} strokeWidth={3} className="text-black hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. REUSABLE TOAST CARD (Used by react-hot-toast)
// ----------------------------------------------------
export function BrutalToastCard({
  t,
  title,
  message,
  variant = 'warning',
  icon: CustomIcon,
  onClose,
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.warning;
  const IconComponent = CustomIcon || config.icon;

  return (
    <div
      className={cn(
        "max-w-md w-full border-[3px] border-black shadow-brutal p-4 transition-all duration-300 relative pointer-events-auto rounded-md",
        config.bg,
        config.text,
        t?.visible ? "animate-in slide-in-from-top-4 duration-200" : "animate-out fade-out duration-150"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] shrink-0", config.badgeBg)}>
          <IconComponent size={18} strokeWidth={3} />
        </div>

        <div className="flex-1 pr-6">
          {title && (
            <h4 className="font-black uppercase tracking-wider text-sm mb-0.5 leading-tight">
              {title}
            </h4>
          )}
          <p className="font-bold text-xs opacity-90 leading-relaxed">
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 border-[2px] border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            aria-label="Close toast"
          >
            <X size={14} strokeWidth={3} className="text-black hover:text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. CONTROLLED COMPONENT <BrutalToast isOpen={...} ... />
// ----------------------------------------------------
export const BrutalToast = React.forwardRef(({
  message,
  title,
  isOpen,
  onClose,
  variant = 'warning',
  icon,
  duration = 5000,
  className,
  ...props
}, ref) => {
  useEffect(() => {
    if (isOpen && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-8 right-8 z-[9999] w-88 max-w-[calc(100vw-2rem)] animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto",
        className
      )}
      {...props}
    >
      <BrutalToastCard
        title={title}
        message={message}
        variant={variant}
        icon={icon}
        onClose={onClose}
      />
    </div>
  );
});

BrutalToast.displayName = "BrutalToast";

// ----------------------------------------------------
// 4. IMPERATIVE TOAST HELPER: brutalToast.success(...)
// ----------------------------------------------------
export const brutalToast = (message, options = {}) => {
  const {
    title,
    variant = 'primary',
    duration = 4500,
    icon,
    ...rest
  } = options;

  return toast.custom(
    (t) => (
      <BrutalToastCard
        t={t}
        title={title}
        message={message}
        variant={variant}
        icon={icon}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    { duration, ...rest }
  );
};

brutalToast.success = (message, options = {}) => {
  return brutalToast(message, {
    title: options.title || "SUCCESS",
    variant: 'secondary',
    ...options,
  });
};

brutalToast.error = (message, options = {}) => {
  return brutalToast(message, {
    title: options.title || "SYSTEM ALERT",
    variant: 'destructive',
    ...options,
  });
};

brutalToast.warning = (message, options = {}) => {
  return brutalToast(message, {
    title: options.title || "WARNING",
    variant: 'warning',
    ...options,
  });
};

brutalToast.info = (message, options = {}) => {
  return brutalToast(message, {
    title: options.title || "INFORMATION",
    variant: 'info',
    ...options,
  });
};

brutalToast.dismiss = (toastId) => toast.dismiss(toastId);

// ----------------------------------------------------
// 5. DROP-IN TOASTER PROVIDER <BrutalToaster />
// ----------------------------------------------------
export function BrutalToaster(props) {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: 24,
        right: 24,
      }}
      toastOptions={{
        duration: 4500,
        className: 'border-0 p-0 shadow-none bg-transparent',
      }}
      {...props}
    />
  );
}

export default BrutalToast;
