import React from 'react';
import { PluginItem } from '../../types';
import { Puzzle, Check, X, Settings, ExternalLink } from 'lucide-react';

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: PluginItem[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginItem[]>>;
}

export const PluginManager: React.FC<PluginManagerProps> = ({
  isOpen,
  onClose,
  plugins,
  setPlugins
}) => {
  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#1c1c20] border border-[#2e2e38] rounded-xl shadow-2xl flex flex-col overflow-hidden text-xs text-gray-300">
        {/* Modal Header */}
        <div className="h-11 bg-[#24242a] border-b border-[#2e2e38] px-4 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 text-gray-100 font-semibold text-sm">
            <Puzzle className="w-4 h-4 text-amber-400" />
            <span>MeshForge Studio Plugin & Extension Manager</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#2e2e38] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plugin List */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-[#222226] border border-[#2e2e38] rounded-lg p-3 flex items-center justify-between gap-3 shadow"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-100 text-xs">
                    {plugin.name}
                  </span>
                  <span className="text-[10px] bg-[#18181b] border border-[#33333b] text-blue-400 font-mono px-1.5 py-0.2 rounded">
                    {plugin.version}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    by {plugin.author}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{plugin.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Settings for ${plugin.name} opened.`)}
                  className="p-1.5 bg-[#18181b] hover:bg-[#2e2e38] text-gray-400 hover:text-white rounded border border-[#2e2e38] transition"
                  title="Plugin Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                {/* Enable / Disable Toggle Switch */}
                <button
                  onClick={() => handleToggle(plugin.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${
                    plugin.enabled ? 'bg-blue-600' : 'bg-[#141417]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      plugin.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="h-12 bg-[#24242a] border-t border-[#2e2e38] px-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 italic">
            Architected for custom C++ & Python web assembly plugin modules.
          </span>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
