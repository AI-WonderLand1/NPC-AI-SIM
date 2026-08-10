import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

interface Scene3DProps {
  templateId?: string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}

export const BuilderPage: React.FC<Scene3DProps> = ({ 
  templateId,
  isSubscribed = false, 
  onSubscribe 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (templateId) {
      setSearchParams({ template: templateId });
    }
  }, [templateId, setSearchParams]);

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

      const createNPC = (x: number, z: number, color: number, name: string) => {
        const group = new THREE.Group();
        group.name = name;
        group.position.set(x, 0, z);

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

      const guardian = createNPC(-3, 0, 0x3b82f6, 'Guardian Knight');
      const merchant = createNPC(3, 0, 0xf59e0b, 'Wandering Merchant');
      const beast = createNPC(0, -3, 0xef4444, 'Shadow Beast');

      scene.add(guardian, merchant, beast);

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

      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('click', handleClick);

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        
        [guardian, merchant, beast].forEach((npc, i) => {
          npc.rotation.y += delta * 0.3 * (i + 1) * 0.5;
          
          const labelDiv = (npc as any).labelDiv;
          if (labelDiv && containerRef.current) {
            const vector = new THREE.Vector3();
            npc.getWorldPosition(vector);
            vector.y += 3;
            vector.project(camera);
            
            const rect = containerRef.current.getBoundingClientRect();
            const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
            const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
            
            labelDiv.style.left = `${x}px`;
            labelDiv.style.top = `${y}px`;
            labelDiv.style.transform = 'translate(-50%, -100%)';
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
        containerRef.current?.removeEventListener('mousemove', handleMouseMove);
        containerRef.current?.removeEventListener('click', handleClick);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        [guardian, merchant, beast].forEach(npc => {
          const labelDiv = (npc as any).labelDiv;
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
  }, [isSubscribed, hasMounted]);

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
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-400">FPS</span>
              <span className="text-xs font-mono text-green-400">60</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-1">
              <span className="text-xs text-gray-400">Objects</span>
              <span className="text-xs font-mono text-white">3</span>
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
          {selectedObject ? (
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
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🖱️</div>
              <p className="text-sm">Select an object to inspect</p>
              <p className="text-xs text-gray-600 mt-1">Click on any NPC in the viewport</p>
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
              {[
                { name: 'Guardian Knight', type: 'Humanoid', icon: '🛡️', desc: 'Tactical combat AI' },
                { name: 'Wandering Merchant', type: 'Humanoid', icon: '🏪', desc: 'Dynamic trading system' },
                { name: 'Shadow Beast', type: 'Creature', icon: '🐺', desc: 'Pack hunting behavior' },
                { name: 'Scout Drone', type: 'Vehicle', icon: '🚁', desc: 'Aerial reconnaissance' },
                { name: 'Village Elder', type: 'Humanoid', icon: '👴', desc: 'Quest & dialogue NPC' },
                { name: 'Automated Sentry', type: 'Prop', icon: '🔫', desc: 'Networked defense unit' },
              ].map((asset) => (
                <div
                  key={asset.name}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors cursor-move"
                  draggable
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-gray-400">{asset.type} • {asset.desc}</p>
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