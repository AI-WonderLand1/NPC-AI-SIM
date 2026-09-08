import React, { useEffect, useRef } from 'react';
import type { CognitivePhase } from '../../brain/cognitiveModel.js';

interface Props {
  phase: CognitivePhase;
  onStatusChange?: (status: string) => void;
}

type Mat4 = Float32Array;
type Color3 = [number, number, number];

type Mesh = {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  index: WebGLBuffer;
  count: number;
};

const PHASE_COLORS: Record<CognitivePhase, Color3> = {
  idle: [0.16, 0.58, 1.0],
  perceiving: [0.02, 0.95, 1.0],
  reasoning: [0.63, 0.28, 1.0],
  planning: [0.32, 0.52, 1.0],
  acting: [0.04, 1.0, 0.56],
  error: [1.0, 0.10, 0.20],
};

const BRAIN_POINTS: Array<[number, number, number, number, number]> = [
  [-0.96, 0.34, 0.05, 0.46, 1.18], [-0.82, 0.70, -0.03, 0.43, 1.20], [-0.55, 0.91, 0.02, 0.41, 1.16],
  [-0.25, 0.82, 0.10, 0.39, 1.12], [-1.08, 0.02, 0.02, 0.46, 1.24], [-0.86, -0.28, 0.08, 0.43, 1.20],
  [-0.56, -0.46, 0.08, 0.41, 1.18], [-0.27, -0.34, 0.15, 0.38, 1.10], [-0.70, 0.28, 0.40, 0.40, 1.13],
  [-0.48, 0.58, 0.36, 0.37, 1.10], [-0.67, -0.10, 0.40, 0.37, 1.12], [-0.36, 0.00, 0.46, 0.35, 1.08],
  [0.96, 0.34, 0.05, 0.46, 1.18], [0.82, 0.70, -0.03, 0.43, 1.20], [0.55, 0.91, 0.02, 0.41, 1.16],
  [0.25, 0.82, 0.10, 0.39, 1.12], [1.08, 0.02, 0.02, 0.46, 1.24], [0.86, -0.28, 0.08, 0.43, 1.20],
  [0.56, -0.46, 0.08, 0.41, 1.18], [0.27, -0.34, 0.15, 0.38, 1.10], [0.70, 0.28, 0.40, 0.40, 1.13],
  [0.48, 0.58, 0.36, 0.37, 1.10], [0.67, -0.10, 0.40, 0.37, 1.12], [0.36, 0.00, 0.46, 0.35, 1.08],
  [-0.58, 0.36, -0.39, 0.35, 1.10], [-0.28, 0.17, -0.46, 0.34, 1.06], [0.58, 0.36, -0.39, 0.35, 1.10],
  [0.28, 0.17, -0.46, 0.34, 1.06], [-0.40, -0.25, -0.34, 0.34, 1.09], [0.40, -0.25, -0.34, 0.34, 1.09],
];

function identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[row] * b[col * 4]
        + a[4 + row] * b[col * 4 + 1]
        + a[8 + row] * b[col * 4 + 2]
        + a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function translation(x: number, y: number, z: number): Mat4 {
  const out = identity();
  out[12] = x; out[13] = y; out[14] = z;
  return out;
}

function scaling(x: number, y: number, z: number): Mat4 {
  const out = identity();
  out[0] = x; out[5] = y; out[10] = z;
  return out;
}

function rotationX(r: number): Mat4 {
  const c = Math.cos(r); const s = Math.sin(r);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotationY(r: number): Mat4 {
  const c = Math.cos(r); const s = Math.sin(r);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function rotationZ(r: number): Mat4 {
  const c = Math.cos(r); const s = Math.sin(r);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function compose(position: [number, number, number], scale: [number, number, number], ry = 0, rx = 0, rz = 0): Mat4 {
  return multiply(
    translation(...position),
    multiply(rotationY(ry), multiply(rotationX(rx), multiply(rotationZ(rz), scaling(...scale)))),
  );
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModel;
    uniform mat4 uViewProjection;
    varying vec3 vNormal;
    varying vec3 vWorld;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorld = world.xyz;
      vNormal = normalize(mat3(uModel) * aNormal);
      gl_Position = uViewProjection * world;
    }
  `);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vWorld;
    uniform vec3 uColor;
    uniform vec3 uEmissive;
    uniform vec3 uCamera;
    uniform float uGloss;
    uniform float uAlpha;
    uniform float uGlass;
    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(vec3(-0.34, 0.82, 0.72));
      vec3 V = normalize(uCamera - vWorld);
      vec3 H = normalize(L + V);
      float ndv = max(dot(N, V), 0.0);
      float diff = max(dot(N, L), 0.0);
      float rim = pow(1.0 - ndv, 2.5);
      float spec = pow(max(dot(N, H), 0.0), mix(14.0, 92.0, uGloss));
      float reflectionBand = pow(max(0.0, 1.0 - abs(sin(vWorld.x * 2.4 + vWorld.y * 0.85))), 18.0);
      if (uGlass > 0.5) {
        vec3 ice = mix(uColor, vec3(0.82, 0.94, 1.0), 0.52);
        float alpha = uAlpha * (0.10 + rim * 0.86 + spec * 0.75 + reflectionBand * 0.22);
        vec3 glassColor = ice * (0.30 + rim * 1.18) + vec3(spec * 1.45) + uEmissive * 0.24 + reflectionBand * vec3(0.34, 0.60, 0.90);
        gl_FragColor = vec4(glassColor, alpha);
        return;
      }
      vec3 color = uColor * (0.16 + diff * 0.72)
        + uEmissive
        + spec * (0.45 + uGloss * 1.25)
        + rim * uColor * 0.62;
      gl_FragColor = vec4(color, uAlpha);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create WebGL program');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
  return program;
}

function uploadMesh(gl: WebGLRenderingContext, positions: number[], normals: number[], indices: number[]): Mesh {
  const position = gl.createBuffer();
  const normal = gl.createBuffer();
  const index = gl.createBuffer();
  if (!position || !normal || !index) throw new Error('Unable to allocate WebGL buffers');
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return { position, normal, index, count: indices.length };
}

function sphereData(lat = 12, lon = 18) {
  const p: number[] = []; const n: number[] = []; const i: number[] = [];
  for (let y = 0; y <= lat; y += 1) {
    const v = y / lat; const phi = v * Math.PI;
    for (let x = 0; x <= lon; x += 1) {
      const u = x / lon; const theta = u * Math.PI * 2;
      const sx = Math.sin(phi) * Math.cos(theta); const sy = Math.cos(phi); const sz = Math.sin(phi) * Math.sin(theta);
      p.push(sx, sy, sz); n.push(sx, sy, sz);
    }
  }
  for (let y = 0; y < lat; y += 1) for (let x = 0; x < lon; x += 1) {
    const a = y * (lon + 1) + x; const b = a + lon + 1;
    i.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return { p, n, i };
}

function cylinderData(segments = 36) {
  const p: number[] = []; const n: number[] = []; const i: number[] = [];
  for (let y = 0; y <= 1; y += 1) for (let s = 0; s <= segments; s += 1) {
    const a = (s / segments) * Math.PI * 2; const x = Math.cos(a); const z = Math.sin(a);
    p.push(x, y * 2 - 1, z); n.push(x, 0, z);
  }
  for (let s = 0; s < segments; s += 1) {
    const a = s; const b = s + segments + 1;
    i.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return { p, n, i };
}

function torusData(majorSegments = 40, minorSegments = 7, minorRadius = 0.065) {
  const p: number[] = []; const n: number[] = []; const i: number[] = [];
  for (let a = 0; a <= majorSegments; a += 1) {
    const u = (a / majorSegments) * Math.PI * 2;
    for (let b = 0; b <= minorSegments; b += 1) {
      const v = (b / minorSegments) * Math.PI * 2;
      const cv = Math.cos(v); const sv = Math.sin(v); const cu = Math.cos(u); const su = Math.sin(u);
      const r = 1 + minorRadius * cv;
      p.push(r * cu, minorRadius * sv, r * su); n.push(cv * cu, sv, cv * su);
    }
  }
  const row = minorSegments + 1;
  for (let a = 0; a < majorSegments; a += 1) for (let b = 0; b < minorSegments; b += 1) {
    const x = a * row + b; const y = (a + 1) * row + b;
    i.push(x, y, x + 1, y, y + 1, x + 1);
  }
  return { p, n, i };
}

function boxData() {
  const p = [
    -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,
    1,-1,-1, -1,-1,-1, -1,1,-1, 1,1,-1,
    -1,1,1, 1,1,1, 1,1,-1, -1,1,-1,
    -1,-1,-1, 1,-1,-1, 1,-1,1, -1,-1,1,
    1,-1,1, 1,-1,-1, 1,1,-1, 1,1,1,
    -1,-1,-1, -1,-1,1, -1,1,1, -1,1,-1,
  ];
  const n = [
    0,0,1,0,0,1,0,0,1,0,0,1, 0,0,-1,0,0,-1,0,0,-1,0,0,-1,
    0,1,0,0,1,0,0,1,0,0,1,0, 0,-1,0,0,-1,0,0,-1,0,0,-1,0,
    1,0,0,1,0,0,1,0,0,1,0,0, -1,0,0,-1,0,0,-1,0,0,-1,0,0,
  ];
  const i: number[] = [];
  for (let face = 0; face < 6; face += 1) {
    const o = face * 4;
    i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  return { p, n, i };
}

export default function CognitiveCoreWebGL1Fallback({ phase, onStatusChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: false }) || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      onStatusChange?.('3D unavailable • browser exposes neither WebGL2 nor WebGL1');
      return;
    }

    let animationFrame = 0;
    let disposed = false;

    try {
      const program = createProgram(gl);
      const sphere = sphereData(); const cylinder = cylinderData(); const torus = torusData(); const box = boxData();
      const sphereMesh = uploadMesh(gl, sphere.p, sphere.n, sphere.i);
      const cylinderMesh = uploadMesh(gl, cylinder.p, cylinder.n, cylinder.i);
      const torusMesh = uploadMesh(gl, torus.p, torus.n, torus.i);
      const boxMesh = uploadMesh(gl, box.p, box.n, box.i);

      const aPosition = gl.getAttribLocation(program, 'aPosition');
      const aNormal = gl.getAttribLocation(program, 'aNormal');
      const uModel = gl.getUniformLocation(program, 'uModel');
      const uViewProjection = gl.getUniformLocation(program, 'uViewProjection');
      const uColor = gl.getUniformLocation(program, 'uColor');
      const uEmissive = gl.getUniformLocation(program, 'uEmissive');
      const uCamera = gl.getUniformLocation(program, 'uCamera');
      const uGloss = gl.getUniformLocation(program, 'uGloss');
      const uAlpha = gl.getUniformLocation(program, 'uAlpha');
      const uGlass = gl.getUniformLocation(program, 'uGlass');

      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      const camera: [number, number, number] = [0, 1.18, 8.2];
      const view = translation(-camera[0], -camera[1], -camera[2]);
      let vp = identity();

      const bind = (mesh: Mesh) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position); gl.enableVertexAttribArray(aPosition); gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal); gl.enableVertexAttribArray(aNormal); gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
      };

      const draw = (mesh: Mesh, model: Mat4, color: Color3, emissive: Color3, gloss = 0.5, alpha = 1, glass = false) => {
        bind(mesh);
        gl.uniformMatrix4fv(uModel, false, model); gl.uniform3fv(uColor, color); gl.uniform3fv(uEmissive, emissive);
        gl.uniform1f(uGloss, gloss); gl.uniform1f(uAlpha, alpha); gl.uniform1f(uGlass, glass ? 1 : 0);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
        const width = Math.max(1, Math.floor(rect.width * ratio)); const height = Math.max(1, Math.floor(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        gl.viewport(0, 0, width, height);
        vp = multiply(perspective(Math.PI / 5.5, width / height, 0.1, 60), view);
      };

      const observer = new ResizeObserver(resize);
      observer.observe(canvas); resize(); gl.uniform3fv(uCamera, camera);
      onStatusChange?.('Real-time 3D cognitive core • WebGL1 • transparent Fresnel glass • sci-fi chamber');

      const started = performance.now();
      const render = () => {
        if (disposed) return;
        animationFrame = requestAnimationFrame(render); resize();
        const time = (performance.now() - started) / 1000;
        const currentPhase = phaseRef.current; const phaseColor = PHASE_COLORS[currentPhase]; const active = currentPhase !== 'idle';
        const speed = currentPhase === 'reasoning' ? 1.75 : currentPhase === 'planning' ? 1.2 : currentPhase === 'acting' ? 2.2 : 0.72;
        const pulse = 1 + Math.sin(time * (active ? 3.2 : 1.45)) * (active ? 0.028 : 0.012);

        gl.clearColor(0.0025, 0.008, 0.022, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.uniformMatrix4fv(uViewProjection, false, vp);
        const metal: Color3 = [0.018, 0.055, 0.105]; const metalHi: Color3 = [0.055, 0.13, 0.22];
        const blue: Color3 = [0.16, 0.62, 1.0]; const cyan: Color3 = [0.12, 0.92, 1.0]; const violet: Color3 = [0.52, 0.28, 1.0];

        draw(boxMesh, compose([0, 1.15, -4.3], [5.2, 2.8, 0.12]), [0.012, 0.028, 0.06], [0.002, 0.008, 0.022], 0.64);
        draw(boxMesh, compose([0, -1.02, -0.5], [7.4, 0.08, 7.0]), [0.015, 0.035, 0.06], [0.004, 0.018, 0.045], 0.92);
        for (const side of [-1, 1]) {
          draw(boxMesh, compose([side * 4.15, 0.55, -2.9], [0.85, 1.55, 0.22], side * -0.08), metal, [0.004, 0.016, 0.04], 0.88);
          for (let row = 0; row < 5; row += 1) draw(boxMesh, compose([side * 4.02, -0.40 + row * 0.54, -2.58], [0.56, 0.024, 0.035], side * -0.08), blue, [0.03, 0.26, 0.72], 0.92);
        }

        draw(cylinderMesh, compose([0, -0.72, 0], [2.55, 0.22, 2.55]), metal, [0.004, 0.02, 0.06], 0.98);
        draw(cylinderMesh, compose([0, -0.45, 0], [2.28, 0.08, 2.28]), metalHi, [0.01, 0.05, 0.14], 0.92);
        draw(cylinderMesh, compose([0, 3.03, 0], [2.43, 0.18, 2.43]), metal, [0.004, 0.02, 0.06], 0.98);
        draw(cylinderMesh, compose([0, 2.79, 0], [2.18, 0.07, 2.18]), metalHi, [0.01, 0.05, 0.14], 0.92);

        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        [-0.38, -0.24, 2.62, 2.78].forEach((y, index) => {
          const radius = index % 2 ? 1.94 : 2.12;
          draw(torusMesh, compose([0, y, 0], [radius, radius, radius], time * (index % 2 ? -0.10 : 0.12)), index % 2 ? cyan : blue, index % 2 ? [0.06, 0.52, 0.82] : [0.04, 0.32, 0.85], 0.96, 0.82);
        });

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        for (let index = 0; index < 6; index += 1) {
          const angle = (index / 6) * Math.PI * 2; const x = Math.cos(angle) * 2.04; const z = Math.sin(angle) * 2.04;
          draw(boxMesh, compose([x, 1.20, z], [0.038, 1.55, 0.038], angle), metalHi, [0.01, 0.07, 0.17], 0.94, 0.88);
        }

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
        BRAIN_POINTS.forEach(([x, y, z, size, stretch], index) => {
          const wobble = 1 + Math.sin(time * speed + index * 0.29) * 0.009;
          draw(sphereMesh, compose([x, y + 1.18, z], [size * stretch * 1.10 * pulse * wobble, size * 0.86 * pulse * wobble, size * 0.88 * pulse * wobble], Math.sin(time * 0.18) * 0.065, Math.sin(time * 0.14) * 0.018), phaseColor, [phaseColor[0] * 0.48, phaseColor[1] * 0.48, phaseColor[2] * 0.62], 0.82, 0.10);
        });
        gl.depthMask(true); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        BRAIN_POINTS.forEach(([x, y, z, size, stretch], index) => {
          const wobble = 1 + Math.sin(time * speed + index * 0.29) * 0.007;
          const base: Color3 = [phaseColor[0] * 0.42 + 0.05, phaseColor[1] * 0.56 + 0.10, Math.min(1, phaseColor[2] * 0.92 + 0.08)];
          draw(sphereMesh, compose([x, y + 1.18, z], [size * stretch * pulse * wobble, size * 0.76 * pulse * wobble, size * 0.78 * pulse * wobble], Math.sin(time * 0.18) * 0.065, Math.sin(time * 0.14) * 0.018), base, [phaseColor[0] * 0.10, phaseColor[1] * 0.16, phaseColor[2] * 0.30], 0.98, 0.98);
        });

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        for (let index = 0; index < 16; index += 1) {
          const side = index < 8 ? -1 : 1; const local = index % 8; const x = side * (0.28 + (local % 3) * 0.22);
          const y = 0.95 + (local % 4) * 0.22; const z = 0.10 + ((local + 1) % 3) * 0.16; const radius = 0.28 + (local % 3) * 0.05;
          draw(torusMesh, compose([x, y, z], [radius, radius * 0.72, radius], side * 0.18, 0.58 + local * 0.12, local * 0.22), [0.62, 0.88, 1.0], index % 3 === 0 ? violet : phaseColor, 1, 0.62);
        }
        for (let index = 0; index < 12; index += 1) {
          const anchor = BRAIN_POINTS[index * 2]; const glowScale = 0.045 + (index % 3) * 0.012;
          draw(sphereMesh, compose([anchor[0], anchor[1] + 1.18, anchor[2] + 0.17], [glowScale, glowScale, glowScale]), [0.90, 0.98, 1.0], phaseColor, 1, 0.95);
        }
        draw(sphereMesh, compose([0, 1.25, 0.18], [0.16 * pulse, 0.16 * pulse, 0.16 * pulse]), [0.96, 0.99, 1.0], phaseColor, 1, 0.98);

        if (currentPhase === 'perceiving') {
          const scanY = 0.18 + ((time * 0.75) % 1) * 2.35;
          draw(torusMesh, compose([0, scanY, 0], [1.55, 1.55, 1.55], time * 0.18), phaseColor, phaseColor, 0.95, 0.42);
        }
        if (currentPhase === 'reasoning') {
          for (let k = 0; k < 6; k += 1) {
            const a = time * 1.15 + (k / 6) * Math.PI * 2;
            draw(sphereMesh, compose([Math.cos(a) * 1.62, 1.28 + Math.sin(a * 1.7) * 0.46, Math.sin(a) * 0.62], [0.055, 0.055, 0.055]), [0.94, 0.80, 1.0], phaseColor, 1, 0.94);
          }
        }
        if (currentPhase === 'planning') {
          for (let k = 0; k < 2; k += 1) {
            const s = 1.34 + k * 0.26;
            draw(torusMesh, compose([0, 1.24, 0], [s, s, s], time * (0.12 + k * 0.05), Math.PI / 2.8 + k * 0.30), phaseColor, [0.18, 0.30, 0.75], 0.98, 0.30);
          }
        }
        if (currentPhase === 'acting') draw(cylinderMesh, compose([0, 0.52, 0.15], [0.065 + Math.sin(time * 6) * 0.012, 1.18, 0.065]), phaseColor, phaseColor, 1, 0.58);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
        draw(cylinderMesh, compose([0, 1.20, 0], [2.12, 1.62, 2.12]), [0.48, 0.78, 1.0], [0.015, 0.08, 0.18], 1, 0.28, true);
        draw(cylinderMesh, compose([0, 1.20, 0], [1.99, 1.55, 1.99]), [0.68, 0.90, 1.0], [0.008, 0.035, 0.10], 1, 0.14, true);
        gl.enable(gl.CULL_FACE); gl.depthMask(true); gl.disable(gl.BLEND);
      };
      render();

      return () => {
        disposed = true; cancelAnimationFrame(animationFrame); observer.disconnect();
        [sphereMesh, cylinderMesh, torusMesh, boxMesh].forEach((mesh) => { gl.deleteBuffer(mesh.position); gl.deleteBuffer(mesh.normal); gl.deleteBuffer(mesh.index); });
        gl.deleteProgram(program);
      };
    } catch (error) {
      onStatusChange?.(`WebGL1 3D renderer error • ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    return () => { disposed = true; cancelAnimationFrame(animationFrame); };
  }, [onStatusChange]);

  return <canvas ref={canvasRef} className="npc-webgl1-core-canvas" aria-label="WebGL1 3D cognitive core compatibility renderer" />;
}
