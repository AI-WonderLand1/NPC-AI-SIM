import React, { useEffect, useRef, useState } from 'react';

interface Scene3DProps {
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}

export const Scene3D: React.FC<Scene3DProps> = ({ 
  isSubscribed = false, 
  onSubscribe 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

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

      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.2,
        metalness: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.y = 1;
      scene.add(sphere);

      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2a,
        roughness: 0.9,
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        sphere.rotation.y += delta * 0.5;
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

      // Store cleanup for later
      (window as any).__threecleanup = () => {
        window.removeEventListener('resize', handleResize);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    });

    return () => {
      const cleanup = (window as any).__threecleanup;
      if (cleanup) cleanup();
    };
  }, [isSubscribed, hasMounted]);

  if (!isSubscribed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-center p-8">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Enter the WonderPlay 3D World
          </h2>
          <p className="text-gray-400 mb-6">
            Subscribe to unlock immersive AI-powered 3D NPC experiences 
            with intelligent reasoning, visual perception, and behavior control.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Intelligent NPC Reasoning</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Visual Perception System</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-green-500 mr-3 flex-shrink-0"></div>
                <span className="text-gray-300">Behavior Tree Control</span>
              </div>
            </div>
          </div>
          {onSubscribe && (
            <button
              onClick={onSubscribe}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Subscribe Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
};