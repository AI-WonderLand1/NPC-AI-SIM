import React from 'react';
import ReferenceEditorShell from './ReferenceEditorShell.js';

interface EditorShellProps {
  viewport: React.ReactNode;
  selectedItem: string;
  onSelectItem: (id: string, name: string) => void;
  npcNames: string[];
  objectCount: number;
}

/**
 * Compatibility wrapper for older imports.
 *
 * The legacy EditorShell previously owned a second left-side Details inspector
 * and other editor controls that duplicated the cognition-first bottom config
 * workspace. NPC-AI-SIM now has one authoritative editor surface:
 *
 * - left: navigation only
 * - center: 3D cognitive core
 * - right: live/read-only cognition inspection
 * - bottom: editable brain configuration
 *
 * Keeping this wrapper prevents stale routes/imports from resurrecting the old
 * duplicate control system while callers are migrated to ReferenceEditorShell.
 */
export const EditorShell: React.FC<EditorShellProps> = ({
  viewport,
  selectedItem,
  onSelectItem,
  npcNames,
  objectCount,
}) => (
  <ReferenceEditorShell
    viewport={viewport}
    selectedItem={selectedItem}
    onSelectItem={onSelectItem}
    npcNames={npcNames}
    objectCount={objectCount}
  />
);

export default EditorShell;
