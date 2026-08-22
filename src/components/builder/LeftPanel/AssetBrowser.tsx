import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  User,
  Activity,
  GitFork,
  Box,
  Palette,
  Shield,
  Layers,
  FileCode,
  GripVertical,
  Move,
} from 'lucide-react';
import { TreeItem } from '../types';

interface AssetBrowserProps {
  treeData: TreeItem[];
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  onToggleFolder: (id: string) => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
  treeData,
  selectedItem,
  onSelectItem,
  onToggleFolder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggingAssetId, setDraggingAssetId] = useState<string | null>(null);

  const getItemIcon = (type: TreeItem['type'], isOpen?: boolean) => {
    switch (type) {
      case 'folder':
        return isOpen ? (
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        );
      case 'character':
        return <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'animation':
        return <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'behavior':
        return <GitFork className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'environment':
        return <Box className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      case 'shader':
        return <Palette className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'system':
        return <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
    }
  };

  const handleDragStart = (e: React.DragEvent, item: TreeItem) => {
    if (item.type === 'folder') {
      e.preventDefault();
      return;
    }
    setDraggingAssetId(item.id);
    const dragPayload = {
      source: 'asset-browser',
      id: item.id,
      name: item.name,
      type: item.type,
      category: item.type === 'character' ? 'character' : item.type === 'environment' ? 'prop' : 'structure',
      color: item.type === 'character' ? '#38bdf8' : item.type === 'shader' ? '#f43f5e' : '#f59e0b',
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.setData('text/plain', item.name);
    e.dataTransfer.effectAllowed = 'copyMove';

    if (e.dataTransfer.setDragImage) {
      const dragBadge = document.createElement('div');
      dragBadge.style.position = 'absolute';
      dragBadge.style.top = '-1000px';
      dragBadge.style.padding = '4px 8px';
      dragBadge.style.background = '#09090b';
      dragBadge.style.border = '1px solid #0ea5e9';
      dragBadge.style.color = '#38bdf8';
      dragBadge.style.borderRadius = '6px';
      dragBadge.style.fontSize = '11px';
      dragBadge.style.fontWeight = 'bold';
      dragBadge.style.fontFamily = 'monospace';
      dragBadge.innerText = `📦 ${item.name}`;
      document.body.appendChild(dragBadge);
      e.dataTransfer.setDragImage(dragBadge, 10, 10);
      setTimeout(() => document.body.removeChild(dragBadge), 0);
    }
  };

  const handleDragEnd = () => {
    setDraggingAssetId(null);
  };

  const renderTree = (items: TreeItem[], depth = 0) => {
    return (
      <div className="space-y-0.5">
        {items.map((item) => {
          const isSelected = selectedItem === item.id || selectedItem === item.name;
          const isMatch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());
          const isDraggable = item.type !== 'folder';
          const isCurrentlyDragging = draggingAssetId === item.id;

          if (!isMatch && item.type !== 'folder') return null;

          return (
            <div key={item.id}>
              <div
                draggable={isDraggable}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (item.type === 'folder') {
                    onToggleFolder(item.id);
                  } else {
                    onSelectItem(item.id, item.name);
                  }
                }}
                className={`flex items-center px-2 py-1 rounded transition-all text-xs select-none group relative ${
                  isDraggable ? 'cursor-grab active:cursor-grabbing hover:shadow-sm' : 'cursor-pointer'
                } ${
                  isCurrentlyDragging
                    ? 'opacity-40 border border-dashed border-sky-400 bg-sky-950/40'
                    : isSelected
                    ? 'bg-sky-950/80 text-sky-200 border-l-2 border-sky-400 font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
                }`}
                style={{ paddingLeft: `${Math.max(depth * 14 + 6, 6)}px` }}
                title={isDraggable ? `Drag & Drop "${item.name}" into 3D Viewport` : undefined}
              >
                {item.type === 'folder' && (
                  <span className="mr-1 text-zinc-500 group-hover:text-zinc-300">
                    {item.isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </span>
                )}

                {isDraggable && (
                  <span className="mr-0.5 text-zinc-600 group-hover:text-sky-400 opacity-40 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </span>
                )}

                <span className="mr-1.5">{getItemIcon(item.type, item.isOpen)}</span>
                <span className="truncate font-mono text-[11px] flex-1">{item.name}</span>

                {item.children && (
                  <span className="ml-auto text-[10px] text-zinc-500 font-mono">
                    {item.children.length}
                  </span>
                )}

                {isDraggable && (
                  <span className="opacity-0 group-hover:opacity-100 ml-1 text-[9px] text-sky-400 bg-sky-950/80 px-1 rounded border border-sky-800/50 font-mono transition-opacity">
                    DRAG
                  </span>
                )}
              </div>

              {item.type === 'folder' && item.isOpen && item.children && (
                <div className="border-l border-zinc-800/80 ml-3.5">
                  {renderTree(item.children, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[--color-bg-surface] border-b border-[--color-border-default]">
      <div className="px-3 py-2 border-b border-[--color-border-default] flex items-center justify-between bg-[--color-bg-elevated]">
        <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold text-xs tracking-wider">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>ASSET BROWSER & HIERARCHY</span>
        </div>
        <div className="flex items-center space-x-1 text-zinc-400">
          <button aria-label="Asset Options" className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded">
            <SlidersHorizontal className="w-3 h-3" />
          </button>
          <button aria-label="Filter Assets" className="p-1 hover:bg-zinc-800 hover:text-zinc-200 rounded">
            <Filter className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-2 border-b border-[--color-border-default]/70 bg-[--color-bg-input]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assets, behaviors, shaders..."
            className="w-full bg-[--color-bg-input] text-zinc-200 text-xs pl-8 pr-3 py-1.5 rounded border border-[--color-border-default] focus:outline-none focus:border-[--color-accent-blue] font-mono placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
        {renderTree(treeData)}
      </div>

      <div className="px-2.5 py-1.5 border-t border-[--color-border-default]/80 bg-[--color-bg-input] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center space-x-1">
          <Move className="w-3 h-3 text-sky-400" />
          <span>Drag asset to Viewport to assign</span>
        </div>
      </div>
    </div>
  );
};