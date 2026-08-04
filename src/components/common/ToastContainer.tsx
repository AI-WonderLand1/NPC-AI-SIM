import React from 'react';
import { CheckCircle2, Sparkles, AlertTriangle, XCircle, X, Video, Play, Camera } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
      {toasts.map((toast) => {
        let borderColor = 'border-blue-500/50';
        let bgColor = 'bg-[#1e1e26]/95';
        let IconComponent = Sparkles;
        let iconColor = 'text-blue-400';

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/50';
          IconComponent = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'warn') {
          borderColor = 'border-amber-500/50';
          IconComponent = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          borderColor = 'border-rose-500/50';
          IconComponent = XCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${bgColor} border ${borderColor} shadow-2xl rounded-sm p-3 text-xs text-gray-200 flex items-start justify-between gap-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2`}
          >
            <div className="flex items-start gap-2.5">
              <IconComponent className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="space-y-0.5">
                {toast.title && <div className="font-bold text-gray-100 text-[11px]">{toast.title}</div>}
                <div className="text-[11px] text-gray-300 leading-snug">{toast.message}</div>
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-500 hover:text-gray-200 transition shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
