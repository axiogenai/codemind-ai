import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../../context/ThemeContext';
import './styles.css';

export type PredictiveArcVariant = 
  | 'signal-particles'
  | 'predictive'
  | 'data-pixel'
  | 'halftone-flow'
  | 'amber-halftone'
  | 'ribbon-field';

export interface PredictiveArcCanvasProps {
  variant?: PredictiveArcVariant;
  mode?: 'dark' | 'light';
  speed?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
}

export const PredictiveArcCanvas: React.FC<PredictiveArcCanvasProps> = ({
  variant = 'signal-particles',
  mode,
  speed = 1.0,
  hue = 0,
  saturation = 1.0,
  brightness = 1.0,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDarkMode } = useTheme();

  const activeMode = mode || (isDarkMode ? 'dark' : 'light');

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let animationFrameId: number;
    let cleanUpFn: (() => void) | null = null;

    // ==============================================================
    // VARIANT 1: signal-particles (Exact Authored ThreeUI Canvas 2D Wave Matrix)
    // Source: https://threeui.com/backgrounds/predictive-arc/signal-particles
    // ==============================================================
    if (variant === 'signal-particles') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const spacing = 16;
      const dotRadius = 1.5;
      let time = 0;

      let width = container.clientWidth || window.innerWidth;
      let height = container.clientHeight || window.innerHeight;

      const handleResize = () => {
        if (!container || !canvas) return;
        width = container.clientWidth || window.innerWidth;
        height = container.clientHeight || window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const isDark = activeMode === 'dark';

      // Smooth interactive mouse parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / (rect.width || window.innerWidth) - 0.5) * 2;
        targetY = ((e.clientY - rect.top) / (rect.height || window.innerHeight) - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const draw = () => {
        animationFrameId = requestAnimationFrame(draw);

        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        ctx.clearRect(0, 0, width, height);

        const cols = Math.floor(width / spacing);
        const rows = Math.floor(height / spacing);

        const offsetX = (width - cols * spacing) / 2 + mouseX * 5;
        const offsetY = (height - rows * spacing) / 2 + mouseY * 5;

        for (let i = 0; i <= cols; i++) {
          for (let j = 0; j <= rows; j++) {
            const x = offsetX + i * spacing;
            const y = offsetY + j * spacing;

            const nx = i * 0.1;
            const ny = j * 0.1;

            const wave1 = Math.sin(nx + time * 0.5) * Math.cos(ny - time * 0.3);
            const wave2 = Math.sin(nx * 0.5 - ny * 0.5 + time * 0.8);
            const value = wave1 + wave2;

            if (value > 0.1) {
              ctx.beginPath();
              ctx.arc(x, y, dotRadius, 0, Math.PI * 2);

              const highlightCheck = Math.sin(i * 12.34) * Math.cos(j * 56.78);

              if (highlightCheck > 0.98) {
                // Blue highlight
                ctx.fillStyle = isDark ? '#3b82f6' : '#1d4ed8';
              } else if (highlightCheck < -0.98) {
                // Purple highlight
                ctx.fillStyle = isDark ? '#8b5cf6' : '#5b21b6';
              } else {
                const alpha = Math.min(0.6, (value - 0.1) * 0.8) * brightness;
                ctx.fillStyle = isDark
                  ? `rgba(148, 163, 184, ${alpha})`
                  : `rgba(100, 116, 139, ${alpha})`;
              }

              ctx.fill();
            }
          }
        }

        time += 0.02 * speed;
      };

      draw();

      cleanUpFn = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationFrameId);
      };
    }

    // ==============================================================
    // VARIANT: constellation (Three.js 3D Interconnected Line Sphere)
    // ==============================================================
    else if ((variant as string) === 'constellation') {
      const scene = new THREE.Scene();
      let width = container.clientWidth || window.innerWidth;
      let height = container.clientHeight || window.innerHeight;

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 4.5;

      let renderer: THREE.WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
      } catch {
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const group = new THREE.Group();
      scene.add(group);
      group.position.set(0, 0, 0);

      const isDark = activeMode === 'dark';
      let lineColor: THREE.Color;
      let pointColor: THREE.Color;

      if (hue !== 0) {
        lineColor = new THREE.Color().setHSL(hue / 360, saturation, isDark ? 0.65 * brightness : 0.35 * brightness);
        pointColor = new THREE.Color().setHSL(hue / 360, saturation, isDark ? 0.85 * brightness : 0.25 * brightness);
      } else if (isDark) {
        lineColor = new THREE.Color(0x38bdf8);
        pointColor = new THREE.Color(0x7dd3fc);
      } else {
        lineColor = new THREE.Color(0x18181b);
        pointColor = new THREE.Color(0x27272a);
      }

      const material = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: isDark ? 0.60 * brightness : 0.70 * brightness,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending
      });

      const particlesCount = 200;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particlesCount * 3);
      const r = 2.5;

      for (let i = 0; i < particlesCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const index: number[] = [];
      for (let i = 0; i < particlesCount; i++) {
        for (let j = i + 1; j < particlesCount; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 1.25) {
            index.push(i, j);
          }
        }
      }
      geometry.setIndex(index);

      const lines = new THREE.LineSegments(geometry, material);
      group.add(lines);

      const pointMaterial = new THREE.PointsMaterial({
        size: isDark ? 0.055 : 0.045,
        color: pointColor,
        transparent: true,
        opacity: isDark ? 0.85 * brightness : 0.65 * brightness,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geometry, pointMaterial);
      group.add(points);

      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;

        group.rotation.y += 0.002 * speed + mouseX * 0.004;
        group.rotation.x += 0.001 * speed + mouseY * 0.004;

        renderer?.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        width = container.clientWidth;
        height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        group.position.set(0, 0, 0);
      };
      window.addEventListener('resize', handleResize);

      cleanUpFn = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        geometry.dispose();
        material.dispose();
        pointMaterial.dispose();
        renderer?.dispose();
      };
    }

    // ==============================================================
    // VARIANT 2: predictive / data-pixel (Authored Purple Pixel Arc)
    // ==============================================================
    else if (variant === 'predictive' || variant === 'data-pixel') {
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance'
      });
      if (!gl) return;

      const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_is_dark;
        uniform float u_speed;
        uniform float u_brightness;

        void main() {
          vec2 fragCoord = gl_FragCoord.xy;
          vec2 res = u_resolution;
          
          float pixelSize = 5.2;
          vec2 cellId = floor(fragCoord / pixelSize) * pixelSize + pixelSize * 0.5;
          
          float cnx = (cellId.x / res.x) * 2.0 - 1.0;
          float cny = (cellId.y / res.y) * 2.0 - 1.0;
          
          cnx += u_mouse.x * 0.06;
          cny += u_mouse.y * 0.04;
          
          float archApex = 0.28;
          float archDrop = 0.72;
          float archY = archApex - archDrop * (cnx * cnx);
          
          float arcDist = abs(cny - archY);
          float bandThickness = 0.42;
          float arcBand = exp(-pow(arcDist / bandThickness, 2.2));
          
          float edgeFade = clamp(1.0 - pow(abs(cnx) / 1.18, 4.0), 0.0, 1.0);
          float arcIntensity = arcBand * edgeFade;
          
          float t = u_time * u_speed;
          float p1X = -0.18 + sin(t * 0.42) * 0.32;
          float p1Y = archApex - archDrop * (p1X * p1X);
          float p1 = exp(-(pow((cnx - p1X) / 0.30, 2.0) + pow((cny - p1Y) / 0.22, 2.0)));
          
          float p2X = 0.55 + cos(t * 0.36) * 0.26;
          float p2Y = archApex - archDrop * (p2X * p2X);
          float p2 = exp(-(pow((cnx - p2X) / 0.24, 2.0) + pow((cny - p2Y) / 0.18, 2.0)));
          
          float ambient = 0.16 * arcIntensity;
          float glow = (ambient + p1 * 1.05 + p2 * 0.85) * arcIntensity * u_brightness;
          
          vec2 f = fract(fragCoord / pixelSize);
          float cellGap = 0.18;
          float pixelMask = step(cellGap, f.x) * step(f.x, 1.0 - cellGap) * 
                            step(cellGap, f.y) * step(f.y, 1.0 - cellGap);
          
          vec3 baseColor = vec3(0.24, 0.09, 0.68);
          vec3 glowColor = vec3(0.58, 0.28, 0.98);
          vec3 coreColor = vec3(0.92, 0.84, 1.00);
          
          vec3 col = baseColor * (glow * 1.3) + glowColor * (p1 * 0.85 + p2 * 0.72) + coreColor * pow(p1 * 0.95 + p2 * 0.75, 2.4);
          
          if (u_is_dark < 0.5) {
            col = vec3(0.38, 0.22, 0.88) * (glow * 1.4) + vec3(0.55, 0.35, 0.95) * (p1 + p2);
          }
          
          col *= pixelMask;
          float alpha = clamp(glow * pixelMask * 1.6, 0.0, 0.95);
          
          gl_FragColor = vec4(col, alpha);
        }
      `;

      const createShader = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) return null;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(program, 'u_resolution');
      const uTime = gl.getUniformLocation(program, 'u_time');
      const uMouse = gl.getUniformLocation(program, 'u_mouse');
      const uIsDark = gl.getUniformLocation(program, 'u_is_dark');
      const uSpeed = gl.getUniformLocation(program, 'u_speed');
      const uBrightness = gl.getUniformLocation(program, 'u_brightness');

      const handleResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      const startTime = performance.now();
      const render = () => {
        animationFrameId = requestAnimationFrame(render);
        const elapsed = (performance.now() - startTime) * 0.001;

        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;

        gl.useProgram(program);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.uniform1f(uIsDark, activeMode === 'dark' ? 1.0 : 0.0);
        gl.uniform1f(uSpeed, speed);
        gl.uniform1f(uBrightness, brightness);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };
      render();

      cleanUpFn = () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    }

    // ==============================================================
    // VARIANT 3: halftone-flow / amber-halftone (Authored Halftone)
    // ==============================================================
    else {
      const scene = new THREE.Scene();
      let width = container.clientWidth || window.innerWidth;
      let height = container.clientHeight || window.innerHeight;

      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      let renderer: THREE.WebGLRenderer | null = null;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: true
        });
      } catch {
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const gridSize = 22;
      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const scales: number[] = [];

      for (let x = -gridSize; x <= gridSize; x++) {
        for (let y = -gridSize; y <= gridSize; y++) {
          positions.push(x * 0.15, y * 0.15, 0);
          scales.push(1);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));

      const isAmber = variant === 'amber-halftone';
      const c1 = isAmber ? new THREE.Color(0xFBBF24) : new THREE.Color(0x38bdf8);
      const c2 = new THREE.Color(0xffffff);

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: c1 },
          color2: { value: c2 }
        },
        vertexShader: `
          attribute float scale;
          varying vec2 vUv;
          varying float vScale;
          uniform float time;
          
          void main() {
            vUv = position.xy;
            float dist = length(position.xy);
            float animatedScale = scale * (sin(dist * 6.0 - time * 2.5) * 0.5 + 0.5);
            vScale = animatedScale;
            
            gl_PointSize = animatedScale * 5.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          varying float vScale;
          
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            if(length(coord) > 0.5) discard;
            
            vec3 finalColor = mix(color2, color1, (vUv.y + 1.0) * 0.5);
            gl_FragColor = vec4(finalColor, vScale * 0.6);
          }
        `,
        transparent: true
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const startTime = performance.now();
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        material.uniforms.time.value = (performance.now() - startTime) * 0.001 * speed;
        renderer?.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        width = container.clientWidth;
        height = container.clientHeight;
        const aspect = width / height;
        camera.left = -aspect;
        camera.right = aspect;
        camera.bottom = -1;
        camera.top = 1;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      cleanUpFn = () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        geometry.dispose();
        material.dispose();
        renderer?.dispose();
      };
    }

    return () => {
      if (cleanUpFn) cleanUpFn();
    };
  }, [variant, activeMode, speed, hue, saturation, brightness]);

  return (
    <div
      ref={containerRef}
      className={`predictive-arc-container ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="predictive-arc-canvas" />
    </div>
  );
};
