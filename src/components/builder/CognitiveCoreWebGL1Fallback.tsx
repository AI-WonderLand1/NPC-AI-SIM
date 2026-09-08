import React, { useEffect, useRef } from 'react';
import type { CognitivePhase } from '../../brain/cognitiveModel.js';

interface Props {
  phase: CognitivePhase;
  onStatusChange?: (status: string) => void;
}

type Mat4 = Float32Array;

type Mesh = {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  index: WebGLBuffer;
  count: number;
};

const PHASE_COLORS: Record<CognitivePhase, [number, number, number]> = {
  idle: [0.18, 0.58, 1.0],
  perceiving: [0.08, 0.95, 1.0],
  reasoning: [0.62, 0.28, 1.0],
  planning: [0.32, 0.48, 1.0],
  acting: [0.08, 1.0, 0.55],
  error: [1.0, 0.12, 0.22],
};

const BRAIN_POINTS: Array<[number, number, number, number]> = [
  [-1.05, 0.30, 0.05, 0.52], [-0.86, 0.70, -0.02, 0.47], [-0.55, 0.92, 0.02, 0.45],
  [-0.22, 0.78, 0.05, 0.44], [-1.16, -0.02, 0.02, 0.49], [-0.92, -0.34, 0.04, 0.47],
  [-0.58, -0.55, 0.02, 0.46], [-0.25, -0.42, 0.10, 0.44], [-0.72, 0.22, 0.45, 0.46],
  [-0.50, 0.56, 0.42, 0.41], [-0.78, -0.18, 0.40, 0.42], [-0.37, -0.15, 0.48, 0.40],
  [1.05, 0.30, 0.05, 0.52], [0.86, 0.70, -0.02, 0.47], [0.55, 0.92, 0.02, 0.45],
  [0.22, 0.78, 0.05, 0.44], [1.16, -0.02, 0.02, 0.49], [0.92, -0.34, 0.04, 0.47],
  [0.58, -0.55, 0.02, 0.46], [0.25, -0.42, 0.10, 0.44], [0.72, 0.22, 0.45, 0.46],
  [0.50, 0.56, 0.42, 0.41], [0.78, -0.18, 0.40, 0.42], [0.37, -0.15, 0.48, 0.40],
  [-0.62, 0.36, -0.42, 0.40], [-0.28, 0.20, -0.48, 0.39], [0.62, 0.36, -0.42, 0.40],
  [0.28, 0.20, -0.48, 0.39], [-0.42, -0.30, -0.38, 0.38], [0.42, -0.30, -0.38, 0.38],
];

function identity(): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0]
        + a[1 * 4 + row] * b[col * 4 + 1]
        + a[2 * 4 + row] * b[col * 4 + 2]
        + a[3 * 4 + row] * b[col * 4 + 3];
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

function compose(position: [number, number, number], scale: [number, number, number], ry = 0, rx = 0): Mat4 {
  return multiply(translation(...position), multiply(rotationY(ry), multiply(rotationX(rx), scaling(...scale))));
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
    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(vec3(-0.35, 0.8, 0.65));
      vec3 V = normalize(uCamera - vWorld);
      vec3 H = normalize(L + V);
      float diff = max(dot(N, L), 0.0);
      float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);
      float spec = pow(max(dot(N, H), 0.0), mix(12.0, 80.0, uGloss));
      vec3 color = uColor * (0.18 + diff * 0.66) + uEmissive + spec * (0.45 + uGloss * 1.1) + rim * uColor * 0.55;
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

function sphereData(lat = 10, lon = 14) {
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

function cylinderData(segments = 32) {
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

function torusData(majorSegments = 32, minorSegments = 6, minorRadius = 0.075) {
  const p: number[] = []; const n: number[] = []; const i: number[] = [];
  for (let a = 0; a <= majorSegments; a += 1) {
    const u = (a / majorSegments) * Math.PI * 2;
    for (let b = 0; b <= minorSegments; b += 1) {
      const v = (b / minorSegments) * Math.PI * 2;
      const cv = Math.cos(v); const sv = Math.sin(v); const cu = Math.cos(u); const su = Math.sin(u);
      const r = 1 + minorRadius * cv;
      p.push(r * cu, minorRadius * sv, r * su);
      n.push(cv * cu, sv, cv * su);
    }
  }
  const row = minorSegments + 1;
  for (let a = 0; a < majorSegments; a += 1) for (let b = 0; b < minorSegments; b += 1) {
    const x = a * row + b; const y = (a + 1) * row + b;
    i.push(x, y, x + 1, y, y + 1, x + 1);
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
      const sphere = sphereData();
      const cylinder = cylinderData();
      const torus = torusData();
      const sphereMesh = uploadMesh(gl, sphere.p, sphere.n, sphere.i);
      const cylinderMesh = uploadMesh(gl, cylinder.p, cylinder.n, cylinder.i);
      const torusMesh = uploadMesh(gl, torus.p, torus.n, torus.i);

      const aPosition = gl.getAttribLocation(program, 'aPosition');
      const aNormal = gl.getAttribLocation(program, 'aNormal');
      const uModel = gl.getUniformLocation(program, 'uModel');
      const uViewProjection = gl.getUniformLocation(program, 'uViewProjection');
      const uColor = gl.getUniformLocation(program, 'uColor');
      const uEmissive = gl.getUniformLocation(program, 'uEmissive');
      const uCamera = gl.getUniformLocation(program, 'uCamera');
      const uGloss = gl.getUniformLocation(program, 'uGloss');
      const uAlpha = gl.getUniformLocation(program, 'uAlpha');
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      const camera: [number, number, number] = [0, 1.25, 7.4];
      const view = translation(-camera[0], -camera[1], -camera[2]);
      let vp = identity();

      const bind = (mesh: Mesh) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal);
        gl.enableVertexAttribArray(aNormal);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
      };

      const draw = (mesh: Mesh, model: Mat4, color: [number, number, number], emissive: [number, number, number], gloss = 0.5, alpha = 1) => {
        bind(mesh);
        gl.uniformMatrix4fv(uModel, false, model);
        gl.uniform3fv(uColor, color);
        gl.uniform3fv(uEmissive, emissive);
        gl.uniform1f(uGloss, gloss);
        gl.uniform1f(uAlpha, alpha);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
      };

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.35);
        const width = Math.max(1, Math.floor(rect.width * ratio));
        const height = Math.max(1, Math.floor(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        gl.viewport(0, 0, width, height);
        vp = multiply(perspective(Math.PI / 5, width / height, 0.1, 50), view);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();
      gl.uniform3fv(uCamera, camera);
      onStatusChange?.('Real-time 3D cognitive core • WebGL1 compatibility renderer • glossy glass chamber');

      const started = performance.now();
      const render = () => {
        if (disposed) return;
        animationFrame = requestAnimationFrame(render);
        resize();
        const time = (performance.now() - started) / 1000;
        const currentPhase = phaseRef.current;
        const phaseColor = PHASE_COLORS[currentPhase];
        const active = currentPhase !== 'idle';
        const speed = currentPhase === 'reasoning' ? 1.8 : currentPhase === 'planning' ? 1.25 : currentPhase === 'acting' ? 2.4 : 0.7;
        const pulse = 1 + Math.sin(time * (active ? 3.5 : 1.5)) * (active ? 0.045 : 0.018);

        gl.clearColor(0.003, 0.012, 0.03, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(uViewProjection, false, vp);

        // Metallic pedestal and top assembly.
        draw(cylinderMesh, compose([0, -0.78, 0], [2.52, 0.18, 2.52]), [0.015, 0.045, 0.09], [0.005, 0.02, 0.07], 0.95);
        draw(cylinderMesh, compose([0, -0.51, 0], [2.18, 0.08, 2.18]), [0.05, 0.11, 0.19], [0.01, 0.04, 0.12], 0.8);
        draw(cylinderMesh, compose([0, 3.28, 0], [2.42, 0.13, 2.42]), [0.015, 0.045, 0.09], [0.005, 0.02, 0.07], 0.95);

        // Emissive containment rings.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        [0, 1, 2, 3].forEach((index) => {
          const y = index < 2 ? -0.40 + index * 0.22 : 2.88 + (index - 2) * 0.22;
          const ringScale = (index % 2 ? 1.92 : 2.16) * (1 + Math.sin(time * 1.6 + index) * 0.012);
          draw(torusMesh, compose([0, y, 0], [ringScale, ringScale, ringScale], time * (index % 2 ? -0.16 : 0.20), 0), phaseColor, [phaseColor[0] * 0.8, phaseColor[1] * 0.8, phaseColor[2] * 0.8], 0.8, 0.92);
        });

        // Glowing brain halo, then glossy lobe surfaces.
        gl.depthMask(false);
        BRAIN_POINTS.forEach(([x, y, z, size], index) => {
          const phaseScale = pulse * (1 + Math.sin(time * speed + index * 0.37) * 0.015);
          const model = compose([x, y + 1.42, z], [size * 1.34 * phaseScale, size * 0.98 * phaseScale, size * 1.02 * phaseScale], Math.sin(time * 0.22) * 0.09, Math.sin(time * 0.13) * 0.025);
          draw(sphereMesh, model, phaseColor, [phaseColor[0] * 0.45, phaseColor[1] * 0.45, phaseColor[2] * 0.58], 0.85, 0.14);
        });
        gl.depthMask(true);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        BRAIN_POINTS.forEach(([x, y, z, size], index) => {
          const phaseScale = pulse * (1 + Math.sin(time * speed + index * 0.37) * 0.012);
          const model = compose([x, y + 1.42, z], [size * 1.18 * phaseScale, size * 0.86 * phaseScale, size * 0.88 * phaseScale], Math.sin(time * 0.22) * 0.09, Math.sin(time * 0.13) * 0.025);
          draw(sphereMesh, model, [phaseColor[0] * 0.55, phaseColor[1] * 0.68, phaseColor[2]], [phaseColor[0] * 0.18, phaseColor[1] * 0.24, phaseColor[2] * 0.42], 0.98, 0.96);
        });

        // Bright neural nucleus.
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        draw(sphereMesh, compose([0, 1.43, 0.12], [0.23 * pulse, 0.23 * pulse, 0.23 * pulse]), [0.92, 0.98, 1.0], phaseColor, 1, 0.98);

        // Phase-specific 3D effects.
        if (currentPhase === 'perceiving') {
          const scanY = 0.15 + ((time * 0.9) % 1) * 2.55;
          draw(torusMesh, compose([0, scanY, 0], [1.85, 1.85, 1.85], time * 0.25), phaseColor, phaseColor, 0.7, 0.62);
        }
        if (currentPhase === 'reasoning') {
          for (let k = 0; k < 5; k += 1) {
            const a = time * 1.4 + (k / 5) * Math.PI * 2;
            draw(sphereMesh, compose([Math.cos(a) * 2.0, 1.45 + Math.sin(a * 1.7) * 0.55, Math.sin(a) * 0.8], [0.075, 0.075, 0.075]), [0.9, 0.72, 1], phaseColor, 1, 0.95);
          }
        }
        if (currentPhase === 'planning') {
          for (let k = 0; k < 3; k += 1) {
            const s = 1.35 + k * 0.32;
            draw(torusMesh, compose([0, 1.43, 0], [s, s, s], time * (0.25 + k * 0.08), Math.PI / 2.7 + k * 0.25), phaseColor, [phaseColor[0] * 0.5, phaseColor[1] * 0.5, 1], 0.82, 0.45);
          }
        }
        if (currentPhase === 'acting') {
          draw(cylinderMesh, compose([0, 0.75, 0.22], [0.11 + Math.sin(time * 6) * 0.025, 1.55, 0.11]), phaseColor, phaseColor, 0.9, 0.78);
        }

        // Glass cylinder last, with normal alpha blending.
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.disable(gl.CULL_FACE);
        draw(cylinderMesh, compose([0, 1.42, 0], [2.12, 1.82, 2.12]), [0.42, 0.76, 1.0], [0.02, 0.10, 0.24], 1, 0.13);
        draw(cylinderMesh, compose([0, 1.42, 0], [1.98, 1.74, 1.98]), [0.65, 0.88, 1.0], [0.01, 0.05, 0.15], 1, 0.055);
        gl.enable(gl.CULL_FACE);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      };
      render();

      return () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        observer.disconnect();
        [sphereMesh, cylinderMesh, torusMesh].forEach((mesh) => {
          gl.deleteBuffer(mesh.position); gl.deleteBuffer(mesh.normal); gl.deleteBuffer(mesh.index);
        });
        gl.deleteProgram(program);
      };
    } catch (error) {
      onStatusChange?.(`WebGL1 3D renderer error • ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    return () => { disposed = true; cancelAnimationFrame(animationFrame); };
  }, [onStatusChange]);

  return <canvas ref={canvasRef} className="npc-webgl1-core-canvas" aria-label="WebGL1 3D cognitive core compatibility renderer" />;
}
