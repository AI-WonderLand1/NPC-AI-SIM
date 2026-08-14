import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import { SubtitleSystem } from '../SubtitleSystem.js';
import * as THREE from 'three';

export const BuilderPage: React.FC<{ 
  isSubscribed?: boolean; 
  onSubscribe?: () => void;
}> = ({ 
  isSubscribed = false, 
  onSubscribe 
}) => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [loadedAsset, setLoadedAsset] = useState<NPCAsset | null>(null);
  const [spawnedNPCs, setSpawnedNPCs] = useState<Array<{id: string; name: string; group: any; color: number; position: {x: number; z: number}}>>([]);
  const [voiceConfig, setVoiceConfig] = useState({
    enabled: true,
    voiceId: 'default',
    provider: 'elevenlabs',
    language: 'en-US',
    pitch: 1.0,
    speed: 1.0,
    volume: 1.0,
    tone: 'neutral',
    emotion: 'calm',
    speakingStyle: 'conversational',
    spatialAudio: true,
    subtitles: true,
    interruptible: true,
    maxDistance: 20,
    refDistance: 1,
    rolloffFactor: 1,
  });
  const [testVoiceText, setTestVoiceText] = useState('Hello, I am an NPC with voice synthesis.');
  const [subtitleSystem, setSubtitleSystem] = useState<SubtitleSystem | null>(null);
  const [dialogueQueue, setDialogueQueue] = useState<Array<{id: string; text: string; emotion: string; priority: number}>>([]);

  const asset = templateId ? npcAssets.find(a => a.id === templateId) : null;

  useEffect(() => {
    if (asset) {
      setLoadedAsset(asset);
    }
  }, [asset]);

  useEffect(() => {
    if (!isSubscribed || !containerRef.current || hasMounted) return;
    
    setHasMounted(true);
    
    import('three').then(THREE => {
      if (!containerRef.current) return;
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a1a);

      const camera = new THREE.PerspectiveCamera(
        60,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 5);

      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
      });
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);

      // Create SubtitleSystem
      const subtitleSys = new SubtitleSystem(camera, renderer);
      setSubtitleSystem(subtitleSys);

      const ambientLight = new THREE.AmbientLight(0x404040, 1);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const groundGeometry = new THREE.PlaneGeometry(50, 50);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.9,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.name = 'ground';
      scene.add(ground);

      const getTypeColor = (type: NPCAsset['type']) => {
        switch (type) {
          case 'humanoid': return 0x3b82f6;
          case 'creature': return 0xef4444;
          case 'vehicle': return 0x8b5cf6;
          case 'prop': return 0x6b7280;
        }
      };

      const createNPC = (x: number, z: number, color: number, name: string, assetData?: NPCAsset) => {
        const group = new THREE.Group();
        group.name = name;
        group.position.set(x, 0, z);
        (group as any).assetData = assetData;

        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.3,
          metalness: 0.7,
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        body.name = 'body';
        group.add(body);

        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
          color: 0xffe0bd,
          roughness: 0.5,
          metalness: 0.1,
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.4;
        head.castShadow = true;
        head.name = 'head';
        group.add(head);

        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.12, 2.45, 0.3);
        leftEye.name = 'leftEye';
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.12, 2.45, 0.3);
        rightEye.name = 'rightEye';
        group.add(rightEye);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'npc-label';
        labelDiv.textContent = name;
        labelDiv.style.cssText = `
          position: absolute;
          color: white;
          font-size: 12px;
          font-family: system-ui;
          pointer-events: none;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
          white-space: nowrap;
        `;
        document.body.appendChild(labelDiv);
        (group as any).labelDiv = labelDiv;

        return group;
      };

      let initialNPCs: Array<{group: any; color: number; name: string; position: {x: number; z: number}}> = [];

      if (loadedAsset) {
        const color = getTypeColor(loadedAsset.type);
        const npc = createNPC(0, 0, color, loadedAsset.name, loadedAsset);
        scene.add(npc);
        initialNPCs.push({ group: npc, color, name: loadedAsset.name, position: {x: 0, z: 0} });
        setSelectedObject(loadedAsset.name);
        setSpawnedNPCs(prev => [...prev, {id: loadedAsset.id, name: loadedAsset.name, group: npc, color, position: {x: 0, z: 0}}]);
      } else {
        const guardian = createNPC(-3, 0, 0x3b82f6, 'Guardian Knight');
        const merchant = createNPC(3, 0, 0xf59e0b, 'Wandering Merchant');
        const beast = createNPC(0, -3, 0xef4444, 'Shadow Beast');
        scene.add(guardian, merchant, beast);
        initialNPCs = [
          { group: guardian, color: 0x3b82f6, name: 'Guardian Knight', position: {x: -3, z: 0} },
          { group: merchant, color: 0xf59e0b, name: 'Wandering Merchant', position: {x: 3, z: 0} },
          { group: beast, color: 0xef4444, name: 'Shadow Beast', position: {x: 0, z: -3} }
        ];
        setSpawnedNPCs(prev => [...prev, 
          {id: 'guardian', name: 'Guardian Knight', group: guardian, color: 0x3b82f6, position: {x: -3, z: 0}},
          {id: 'merchant', name: 'Wandering Merchant', group: merchant, color: 0xf59e0b, position: {x: 3, z: 0}},
          {id: 'beast', name: 'Shadow Beast', group: beast, color: 0xef4444, position: {x: 0, z: -3}}
        ]);
      }

      const clock = new THREE.Clock();
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleMouseMove = (event: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const handleClick = () => {
        if (!containerRef.current) return;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
          let object = intersects[0].object;
          while (object.parent && object.parent !== scene) {
            object = object.parent;
          }
          if (object !== ground) {
            setSelectedObject(object.name);
          } else {
            setSelectedObject(null);
          }
        } else {
          setSelectedObject(null);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
          if (selectedObject && selectedObject !== 'ground') {
            const npcData = spawnedNPCs.find(n => n.name === selectedObject);
            if (npcData) {
              scene.remove(npcData.group);
              const labelDiv = (npcData.group as any).labelDiv;
              if (labelDiv && labelDiv.parentNode) {
                labelDiv.parentNode.removeChild(labelDiv);
              }
              setSpawnedNPCs(prev => prev.filter(n => n.name !== selectedObject));
              setSelectedObject(null);
            }
          }
        }
      };

      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('click', handleClick);
      window.addEventListener('keydown', handleKeyDown);

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        // Update subtitle system position
        if (subtitleSystem) {
          // Update subtitle positions for all NPCs
          spawnedNPCs.forEach((npcData) => {
            if (npcData.group) {
              const vector = new THREE.Vector3();
              npcData.group.getWorldPosition(vector);
              vector.y += 3; // Position above NPC head
              // We can't call updateSubtitlePosition directly as it's private
              // But we can call showSubtitle with empty text to update position
              // or just let the SubtitleSystem handle it when shown
            }
          });
        }
        
        spawnedNPCs.forEach((npcData, i) => {
          if (npcData.group) {
            npcData.group.rotation.y += delta * 0.3 * (i + 1) * 0.5;
            
            const labelDiv = (npcData.group as any).labelDiv;
            if (labelDiv && containerRef.current) {
              const vector = new THREE.Vector3();
              npcData.group.getWorldPosition(vector);
              vector.y += 3;
              vector.project(camera);
              
              const rect = containerRef.current.getBoundingClientRect();
              const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
              const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
              
              labelDiv.style.left = `${x}px`;
              labelDiv.style.top = `${y}px`;
              labelDiv.style.transform = 'translate(-50%, -100%)';
            }
          }
        });
        
        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!containerRef.current) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      };

      window.addEventListener('resize', handleResize);

      (window as any).__builderCleanup = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        containerRef.current?.removeEventListener('mousemove', handleMouseMove);
        containerRef.current?.removeEventListener('click', handleClick);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        spawnedNPCs.forEach(npcData => {
          const labelDiv = (npcData.group as any).labelDiv;
          if (labelDiv && labelDiv.parentNode) {
            labelDiv.parentNode.removeChild(labelDiv);
          }
        });
        renderer.dispose();
      };
    });

    return () => {
      const cleanup = (window as any).__builderCleanup;
      if (cleanup) cleanup();
    };
  }, [isSubscribed, hasMounted, loadedAsset, spawnedNPCs]);

  if (!isSubscribed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-center p-8">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Enter the Builder
          </h2>
          <p className="text-gray-400 mb-6">
            Subscribe to unlock the full 3D NPC Builder with drag-and-drop editing, 
            AI behavior configuration, and real-time preview.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Visual Node-Based Behavior Editor</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Real-Time AI Perception Preview</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Multi-NPC Scene Composition</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Export to Unity/Unreal/WebGL</span>
              </div>
            </div>
          </div>
          {onSubscribe && (
            <button
              onClick={onSubscribe}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Subscribe to Unlock Builder
            </button>
          )}
        </div>
      </div>
    );
  }

  const getTypeColor = (type: NPCAsset['type']) => {
    switch (type) {
      case 'humanoid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'creature': return 'bg-red-100 text-red-700 border-red-200';
      case 'vehicle': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'prop': return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full h-screen flex bg-gray-900">
      {/* Left Toolbar */}
      <aside className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">🔧</span>
            Tools
          </h3>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'select', icon: '🖱️', label: 'Select', shortcut: 'V' },
            { id: 'move', icon: '⤢', label: 'Move', shortcut: 'G' },
            { id: 'rotate', icon: '🔄', label: 'Rotate', shortcut: 'R' },
            { id: 'scale', icon: '🔍', label: 'Scale', shortcut: 'S' },
            { id: 'paint', icon: '🎨', label: 'Paint', shortcut: 'B' },
            { id: 'ai', icon: '🧠', label: 'AI Config', shortcut: 'A' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedObject(tool.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedObject === tool.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{tool.icon}</span>
              <span className="flex-1 text-left">{tool.label}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-500 font-mono">{tool.shortcut}</kbd>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setShowAssetPanel(!showAssetPanel)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              showAssetPanel
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span>Assets</span>
            </span>
            <svg className={`w-4 h-4 transition-transform ${showAssetPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 relative overflow-hidden">
        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ cursor: selectedObject === 'select' ? 'default' : 'crosshair' }}
        />
        
        {/* Viewport Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <Link
              to="/library"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Library</span>
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-medium">Builder</span>
            {loadedAsset && (
              <>
                <span className="text-gray-600">/</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(loadedAsset.type)}`}>
                  {loadedAsset.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-400">FPS</span>
              <span className="text-xs font-mono text-green-400">60</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-400">Objects</span>
              <span className="text-xs font-mono text-white">{spawnedNPCs.length}</span>
            </div>
          </div>
        </div>

        {/* Viewport Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-2 z-10">
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800" title="Toggle Grid">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm8 0v16M4 8h16M4 16h16" />
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-700 mx-1"></div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800" title="Toggle Gizmos">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800" title="Camera View">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        
        {/* Keyboard hint */}
        <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
          <div className="font-medium text-white mb-2">Shortcuts</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>Delete/Backspace</span><span className="text-right">Remove NPC</span>
            <span>G</span><span className="text-right">Move</span>
            <span>R</span><span className="text-right">Rotate</span>
            <span>S</span><span className="text-right">Scale</span>
          </div>
        </div>
      </main>

      {/* Right Inspector Panel */}
      <aside className={`w-80 bg-gray-900/50 border-l border-gray-800 flex flex-col transition-all duration-300 ${showInspector ? '' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm">⚙️</span>
            Inspector
          </h3>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedObject && selectedObject !== 'select' && selectedObject !== 'move' && selectedObject !== 'rotate' && selectedObject !== 'scale' && selectedObject !== 'paint' && selectedObject !== 'ai' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h4 className="text-white font-medium">{selectedObject}</h4>
                  <p className="text-xs text-gray-400">NPC Entity</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-gray-400 text-xs uppercase tracking-wider">Transform</h5>
                {['Position', 'Rotation', 'Scale'].map((prop) => (
                  <div key={prop} className="grid grid-cols-4 gap-2">
                    <label className="text-xs text-gray-500 col-span-1">{prop}</label>
                    {['X', 'Y', 'Z'].map((axis) => (
                      <input
                        key={axis}
                        type="number"
                        step="0.1"
                        className="col-span-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="0"
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                <h5 className="text-gray-400 text-xs uppercase tracking-wider">AI Behavior</h5>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                    <span className="text-sm text-gray-300">Enable AI Reasoning</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                    <span className="text-sm text-gray-300">Visual Perception</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-300">Audio Perception</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                    <span className="text-sm text-gray-300">Behavior Tree</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                <h5 className="text-gray-400 text-xs uppercase tracking-wider">Personality</h5>
                <div className="grid grid-cols-2 gap-2">
                  {['Brave', 'Cautious', 'Aggressive', 'Passive', 'Social', 'Solitary', 'Curious', 'Indifferent'].map((trait) => (
                    <button key={trait} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:border-indigo-500 hover:text-white transition-colors">
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                <h5 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center text-xs">🎤</span>
                  NPC Voice
                </h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                      checked={voiceConfig.enabled}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-300">Enabled</span>
                  </label>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Voice ID</label>
                    <select
                      value={voiceConfig.voiceId}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, voiceId: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="default">Default</option>
                      <option value="rachel">Rachel (ElevenLabs)</option>
                      <option value="domi">Domi (ElevenLabs)</option>
                      <option value="bella">Bella (ElevenLabs)</option>
                      <option value="antoni">Antoni (ElevenLabs)</option>
                      <option value="elli">Elli (ElevenLabs)</option>
                      <option value="josh">Josh (ElevenLabs)</option>
                      <option value="arnold">Arnold (ElevenLabs)</option>
                      <option value="adam">Adam (ElevenLabs)</option>
                      <option value="sam">Sam (ElevenLabs)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Provider</label>
                    <select
                      value={voiceConfig.provider}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="browser">Browser TTS</option>
                      <option value="openai">OpenAI TTS</option>
                      <option value="azure">Azure Speech</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Language</label>
                    <select
                      value={voiceConfig.language}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Spanish</option>
                      <option value="fr-FR">French</option>
                      <option value="de-DE">German</option>
                      <option value="ja-JP">Japanese</option>
                      <option value="ko-KR">Korean</option>
                      <option value="zh-CN">Chinese</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs text-gray-500">
                      <span>Pitch</span>
                      <span className="text-white">{voiceConfig.pitch.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceConfig.pitch}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs text-gray-500">
                      <span>Speed</span>
                      <span className="text-white">{voiceConfig.speed.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceConfig.speed}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-xs text-gray-500">
                      <span>Volume</span>
                      <span className="text-white">{voiceConfig.volume.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={voiceConfig.volume}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Tone</label>
                    <select
                      value={voiceConfig.tone}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="royal">Royal</option>
                      <option value="friendly">Friendly</option>
                      <option value="serious">Serious</option>
                      <option value="playful">Playful</option>
                      <option value="ominous">Ominous</option>
                      <option value="whisper">Whisper</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Emotion</label>
                    <select
                      value={voiceConfig.emotion}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, emotion: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="calm">Calm</option>
                      <option value="happy">Happy</option>
                      <option value="angry">Angry</option>
                      <option value="sad">Sad</option>
                      <option value="fearful">Fearful</option>
                      <option value="surprised">Surprised</option>
                      <option value="disgusted">Disgusted</option>
                      <option value="excited">Excited</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Speaking Style</label>
                    <select
                      value={voiceConfig.speakingStyle}
                      onChange={(e) => setVoiceConfig(prev => ({ ...prev, speakingStyle: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="conversational">Conversational</option>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="storytelling">Storytelling</option>
                      <option value="news">News Anchor</option>
                      <option value="poetry">Poetry</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        checked={voiceConfig.spatialAudio}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, spatialAudio: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-300">Spatial Audio (3D)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        checked={voiceConfig.subtitles}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, subtitles: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-300">Subtitles</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        checked={voiceConfig.interruptible}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, interruptible: e.target.checked }))}
                      />
                      <span className="text-sm text-gray-300">Interruptible</span>
                    </label>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-800">
                    <h6 className="text-xs text-gray-500 uppercase tracking-wider">Spatial Audio Settings</h6>
                    <div className="space-y-1">
                      <label className="flex items-center justify-between text-xs text-gray-500">
                        <span>Max Distance</span>
                        <span className="text-white">{voiceConfig.maxDistance}m</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={voiceConfig.maxDistance}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center justify-between text-xs text-gray-500">
                        <span>Ref Distance</span>
                        <span className="text-white">{voiceConfig.refDistance}m</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={voiceConfig.refDistance}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, refDistance: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center justify-between text-xs text-gray-500">
                        <span>Rolloff Factor</span>
                        <span className="text-white">{voiceConfig.rolloffFactor.toFixed(1)}</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={voiceConfig.rolloffFactor}
                        onChange={(e) => setVoiceConfig(prev => ({ ...prev, rolloffFactor: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <label className="text-xs text-gray-500">Test Text</label>
                    <textarea
                      value={testVoiceText}
                      onChange={(e) => setTestVoiceText(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-indigo-500 focus:outline-none resize-none"
                      placeholder="Enter text to test voice..."
                    />
                    <button
                      onClick={() => {
                        console.log('[Voice] Test Voice clicked:', { voiceConfig, testVoiceText });
                        alert(`Test Voice would call TTS with:\nProvider: ${voiceConfig.provider}\nVoice: ${voiceConfig.voiceId}\nText: "${testVoiceText}"`);
                      }}
                      className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">🔊</span>
                      <span>Test Voice</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                <h5 className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded flex items-center justify-center text-xs">💬</span>
                  Dialogue Queue
                </h5>
                <div className="space-y-2">
                  {dialogueQueue.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No dialogue queued</p>
                  ) : (
                    dialogueQueue.map((dlg, index) => (
                      <div key={dlg.id} className="bg-gray-800 border border-gray-700 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            dlg.priority >= 15 ? 'bg-red-900/50 text-red-400' :
                            dlg.priority >= 10 ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-green-900/50 text-green-400'
                          }`}>
                            P{dlg.priority}
                          </span>
                        </div>
                        <p className="text-sm text-white mt-1 truncate">{dlg.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Emotion:</span>
                          <span className="text-xs text-gray-300 capitalize">{dlg.emotion}</span>
                        </div>
                      </div>
                    ))
                  )}
                  {dialogueQueue.length > 0 && (
                    <button
                      onClick={() => setDialogueQueue([])}
                      className="w-full py-1 px-2 bg-red-600/20 border border-red-500/50 text-red-400 text-xs rounded hover:bg-red-600/30 transition-colors"
                    >
                      Clear Queue
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🖱️</div>
              <p className="text-sm">Select an object to inspect</p>
              <p className="text-xs text-gray-600 mt-1">Click on any NPC in the viewport</p>
              {loadedAsset && (
                <p className="text-xs text-indigo-400 mt-2">Loaded: {loadedAsset.name}</p>
              )}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-800">
          <button className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all">
            Publish Scene
          </button>
        </div>
      </aside>

      {/* Asset Panel (Slide-in) */}
      {showAssetPanel && (
        <aside className="w-72 bg-gray-900/50 border-l border-gray-800 flex flex-col fixed right-0 top-0 h-full z-20 animate-slide-in">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm">📦</span>
              Asset Library
            </h3>
            <button
              onClick={() => setShowAssetPanel(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {npcAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors cursor-move"
                  draggable
                  onClick={() => {
                    const color = asset.type === 'humanoid' ? 0x3b82f6 : 
                                 asset.type === 'creature' ? 0xef4444 : 
                                 asset.type === 'vehicle' ? 0x8b5cf6 : 0x6b7280;
                    // This would need integration with the Three.js scene
                    // For now just navigate to the template
                    navigate(`/builder/${asset.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset.thumbnail.startsWith('http') ? '' : asset.thumbnail}</span>
                    <img src={asset.thumbnail} alt="" className="w-8 h-8 rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-gray-400">{asset.type} • {asset.tags[0]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default BuilderPage;