import React from 'react';
import { Trash2, RotateCcw, Database, Cpu, Copy, Check } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  hasSelection: boolean;
  onDelete: () => void;
  onRedo: () => void;
  onDatabaseOption: () => void;
  onAiTypeOption: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  hasSelection,
  onDelete,
  onRedo,
  onDatabaseOption,
  onAiTypeOption,
}) => {
  if (!isOpen) return null;

  const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.context-menu')) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: 'Delete',
      icon: Trash2,
      shortcut: 'Del',
      disabled: !hasSelection,
      onClick: onDelete,
      danger: true,
    },
    {
      label: 'Redo',
      icon: RotateCcw,
      shortcut: 'Ctrl+Y',
      onClick: onRedo,
    },
    { type: 'separator' as const },
    {
      label: 'Copy Node Data',
      icon: Copy,
      shortcut: 'Ctrl+C',
      disabled: !hasSelection,
      onClick: () => {},
    },
    { type: 'separator' as const },
    {
      label: 'Database Options',
      icon: Database,
      onClick: onDatabaseOption,
    },
    {
      label: 'AI Type Options',
      icon: Cpu,
      onClick: onAiTypeOption,
    },
  ];

  return (
    <div
      className="context-menu fixed z-50 bg-[--color-bg-elevated] border border-[--color-border-default] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ left: x, top: y }}
      role="menu"
    >
      <div className="py-1">
        {menuItems.map((item, idx) => {
          if (item.type === 'separator') {
            return <div key={idx} className="h-px bg-[--color-border-default] mx-2 my-1" />;
          }
          return (
            <button
              key={idx}
              onClick={() => { item.onClick(); onClose(); }}
              disabled={item.disabled}
              className={`w-full px-3 py-2 text-left flex items-center space-x-2 text-sm transition-colors ${
                item.disabled
                  ? 'text-zinc-600 cursor-not-allowed'
                  : item.danger
                  ? 'text-rose-400 hover:bg-rose-950/50'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.danger ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-[10px] text-zinc-500 font-mono">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};