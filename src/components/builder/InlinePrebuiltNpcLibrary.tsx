import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Brain, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PREBUILT_NPC_PRESETS } from '../../brain/prebuiltNpcPresets.js';
import '../../theme/npc-inline-prebuilt-library.css';

export default function InlinePrebuiltNpcLibrary() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.npc-sidebar-nav');
    if (!nav) return;

    const mount = document.createElement('div');
    mount.className = 'npc-inline-library-mount';
    nav.insertBefore(mount, nav.firstChild);
    setMountNode(mount);

    return () => {
      setMountNode(null);
      mount.remove();
    };
  }, []);

  if (!mountNode) return null;

  const openPreset = (presetId: string, title: string, role: string) => {
    const params = new URLSearchParams({
      npcId: `${presetId}-${Date.now().toString(36)}`,
      name: title,
      role,
      preset: presetId,
    });
    navigate(`/builder/new?${params.toString()}`);
    setOpen(false);
  };

  return createPortal(
    <section className={`npc-inline-prebuilt-library ${open ? 'is-open' : ''}`} aria-label="Prebuilt NPC Library">
      <button
        className="npc-prebuilt-library-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="npc-prebuilt-library-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="npc-prebuilt-brain-icon"><Brain size={16} /></span>
        <span className="npc-prebuilt-library-title">Prebuilt NPC Library</span>
        <ChevronDown className="npc-prebuilt-library-chevron" size={15} aria-hidden="true" />
      </button>

      <div id="npc-prebuilt-library-drawer" className="npc-prebuilt-library-drawer">
        <div className="npc-prebuilt-library-inner">
          <div className="npc-prebuilt-library-caption">AI Wonderland brain presets</div>
          {PREBUILT_NPC_PRESETS.map((preset) => (
            <button
              className="npc-prebuilt-preset-row"
              key={preset.id}
              type="button"
              onClick={() => openPreset(preset.id, preset.title, preset.role)}
              title={preset.description}
            >
              <Brain size={13} />
              <span>{preset.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>,
    mountNode,
  );
}
