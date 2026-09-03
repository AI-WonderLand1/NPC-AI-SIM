import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { npcAssets, type NPCAsset } from './LibraryPage.js';
import { SubtitleSystem } from '../SubtitleSystem.js';
import * as THREE from 'three';
import EditorShell from './builder/EditorShell.js';

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

      return (
    <EditorShell
      viewport={
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ cursor: selectedObject === 'select' ? 'default' : 'crosshair' }}
        />
      }
      selectedItem={selectedObject || ''}
      onSelectItem={(_id, name) => setSelectedObject(name)}
      npcNames={npcAssets.map((npc) => npc.name)}
      objectCount={spawnedNPCs.length}
    />
  );
};

export default BuilderPage;