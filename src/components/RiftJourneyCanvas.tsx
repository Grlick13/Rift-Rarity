import React, { useEffect, useRef } from 'react';
import { RIFT_ZONES, getZoneForProgress } from '../data/ranks';
import type { RankId } from '../types/game';
import { RANKS } from '../data/ranks';

interface RiftJourneyCanvasProps {
  progress: number; // 0..100
  lastRank?: RankId | null;
  burstKey?: number;
  reducedMotion: boolean;
  heightClass?: string;
}

interface AmbientParticle {
  x: number; // 0..100 world space
  y: number; // 0..1 normalized vertical
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface BurstParticle {
  wx: number;
  wy: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = parseHex(hexA);
  const [r2, g2, b2] = parseHex(hexB);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${b})`;
}

interface SkyStop {
  pos: number;
  top: string;
  mid: string;
  horizon: string;
  fog: string;
}

const SKY_STOPS: SkyStop[] = [
  { pos: 0, top: '#061224', mid: '#0c233f', horizon: '#144466', fog: '#38bdf8' },
  { pos: 15, top: '#071122', mid: '#10223c', horizon: '#1c3b5c', fog: '#0ea5e9' },
  { pos: 26, top: '#0b1021', mid: '#182238', horizon: '#36332c', fog: '#c8aa6e' },
  { pos: 38, top: '#051412', mid: '#0b2621', horizon: '#164234', fog: '#34d399' },
  { pos: 50, top: '#061522', mid: '#0d2b3b', horizon: '#194b5e', fog: '#22d3ee' },
  { pos: 62, top: '#170c0c', mid: '#2d1612', horizon: '#5a2515', fog: '#fb923c' },
  { pos: 74, top: '#120821', mid: '#21113b', horizon: '#3d1c63', fog: '#a855f7' },
  { pos: 86, top: '#190810', mid: '#32101a', horizon: '#5e1726', fog: '#f43f5e' },
  { pos: 100, top: '#1f0b12', mid: '#3f151b', horizon: '#7c2d12', fog: '#fcd34d' },
];

function sampleSky(progress: number): SkyStop {
  const p = clamp(progress, 0, 100);
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (p >= a.pos && p <= b.pos) {
      const t = (p - a.pos) / (b.pos - a.pos);
      return {
        pos: p,
        top: lerpColor(a.top, b.top, t),
        mid: lerpColor(a.mid, b.mid, t),
        horizon: lerpColor(a.horizon, b.horizon, t),
        fog: lerpColor(a.fog, b.fog, t),
      };
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1];
}

export const RiftJourneyCanvas: React.FC<RiftJourneyCanvasProps> = ({
  progress,
  lastRank,
  burstKey = 0,
  reducedMotion,
  heightClass = 'h-48 sm:h-56 md:h-64',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const animStateRef = useRef({
    displayProgress: progress,
    startProgress: progress,
    targetProgress: progress,
    animStartTime: 0,
    animDuration: 1200,
    isAnimating: false,
    reducedMotion,
  });

  const particlesRef = useRef<AmbientParticle[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const trailRef = useRef<{ p: number; age: number }[]>([]);

  // Initialize deterministic ambient particles across the 0..100 world
  useEffect(() => {
    const list: AmbientParticle[] = [];
    for (let i = 0; i < 190; i++) {
      list.push({
        x: (i * 53.7) % 100,
        y: 0.14 + ((i * 31.3) % 72) / 100,
        vx: (((i % 7) - 3) * 0.008),
        vy: -0.0005 - ((i % 5) * 0.0004),
        size: 1.2 + (i % 4) * 0.85,
        alpha: 0.35 + (i % 5) * 0.12,
        phase: i * 0.7,
      });
    }
    particlesRef.current = list;
  }, []);

  // Update reducedMotion flag
  useEffect(() => {
    animStateRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  // Trigger smooth travel transition when target progress changes
  useEffect(() => {
    const st = animStateRef.current;
    const clampedTarget = clamp(progress, 0, 100);
    if (Math.abs(clampedTarget - st.targetProgress) < 0.05 && !st.isAnimating) {
      st.displayProgress = clampedTarget;
      st.targetProgress = clampedTarget;
      return;
    }

    if (st.reducedMotion) {
      st.displayProgress = clampedTarget;
      st.startProgress = clampedTarget;
      st.targetProgress = clampedTarget;
      st.isAnimating = false;
      return;
    }

    st.startProgress = st.displayProgress;
    st.targetProgress = clampedTarget;
    st.animStartTime = performance.now();
    const delta = Math.abs(clampedTarget - st.startProgress);
    st.animDuration = clamp(650 + delta * 55, 700, 1650);
    st.isAnimating = true;
  }, [progress]);

  // Spawn celebratory burst particles on rank reveal
  useEffect(() => {
    if (burstKey === 0 || !lastRank || reducedMotion) return;
    const def = RANKS[lastRank];
    const count =
      def.tierIndex >= 8 ? 46 : def.tierIndex >= 6 ? 28 : def.tierIndex >= 3 ? 14 : 6;
    const wx = animStateRef.current.targetProgress;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (1.2 + Math.random() * 2.8) * (def.tierIndex >= 7 ? 1.35 : 1);
      burstsRef.current.push({
        wx,
        wy: 0.76,
        vx: Math.cos(angle) * speed * 0.035,
        vy: Math.sin(angle) * speed * 0.011 - 0.008,
        size: 1.8 + Math.random() * 2.8,
        life: 0,
        maxLife: 45 + Math.random() * 35,
        color: i % 3 === 0 ? '#ffffff' : def.color,
      });
    }
  }, [burstKey, lastRank, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!container || !canvas) return;
      width = Math.max(300, container.clientWidth);
      height = Math.max(150, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let rafId = 0;
    let lastFrame = performance.now();

    const WORLD_SPAN = 4200; // Total horizontal world pixels across 0..100

    const worldToScreenX = (worldPos0to100: number, camPos0to100: number, parallax: number) => {
      const travelerScreenX = width * 0.46;
      const deltaPx = ((worldPos0to100 - camPos0to100) / 100) * WORLD_SPAN * parallax;
      return travelerScreenX + deltaPx;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      const st = animStateRef.current;
      if (st.isAnimating) {
        const elapsed = now - st.animStartTime;
        const t = clamp(elapsed / st.animDuration, 0, 1);
        const eased = easeInOutCubic(t);
        st.displayProgress = lerp(st.startProgress, st.targetProgress, eased);
        if (t < 1 && !st.reducedMotion) {
          trailRef.current.push({ p: st.displayProgress, age: 0 });
        }
        if (t >= 1) {
          st.displayProgress = st.targetProgress;
          st.isAnimating = false;
        }
      }

      const cam = st.displayProgress;
      const tSec = now * 0.001;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. LAYER 0 — Dynamic Sky & Celestial Horizon
      const sky = sampleSky(cam);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, sky.top);
      skyGrad.addColorStop(0.55, sky.mid);
      skyGrad.addColorStop(1, sky.horizon);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars & distant Twin Moons (0.06x parallax)
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 193 - cam * 2.2) % (width + 60) + (width + 60)) % (width + 60) - 30;
        const sy = 10 + ((i * 67) % Math.max(40, height * 0.46));
        const twinkle = st.reducedMotion ? 0.55 : 0.3 + 0.45 * Math.sin(tSec * 1.4 + i);
        ctx.fillStyle = `rgba(240, 230, 210, ${twinkle.toFixed(2)})`;
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1.3, i % 5 === 0 ? 2 : 1.3);
      }

      const moonX = worldToScreenX(52, cam, 0.08);
      const moonY = height * 0.24;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 72);
      moonGlow.addColorStop(0, 'rgba(240, 230, 210, 0.35)');
      moonGlow.addColorStop(1, 'rgba(240, 230, 210, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4ebd9';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      ctx.fill();
      // Eclipse crescent bite
      ctx.fillStyle = sky.top;
      ctx.beginPath();
      ctx.arc(moonX + 6, moonY - 3, 13, 0, Math.PI * 2);
      ctx.fill();

      // 2. LAYER 1 — Distant Runeterra Mountain Ridges & Spires (0.25x parallax)
      ctx.fillStyle = 'rgba(10, 15, 28, 0.58)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -40; x <= width + 40; x += 28) {
        const worldU = (x - width * 0.46) / (WORLD_SPAN * 0.25) * 100 + cam;
        const ridge =
          Math.sin(worldU * 0.14) * 20 +
          Math.cos(worldU * 0.33) * 13 +
          Math.sin(worldU * 0.71) * 6;
        ctx.lineTo(x, height * 0.56 - ridge);
      }
      ctx.lineTo(width + 40, height);
      ctx.closePath();
      ctx.fill();

      // Secondary closer mountain silhouette (0.38x parallax)
      ctx.fillStyle = 'rgba(12, 18, 32, 0.78)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -40; x <= width + 40; x += 24) {
        const worldU = (x - width * 0.46) / (WORLD_SPAN * 0.38) * 100 + cam;
        const ridge = Math.sin(worldU * 0.2 + 1.2) * 15 + Math.cos(worldU * 0.48) * 9;
        ctx.lineTo(x, height * 0.66 - ridge);
      }
      ctx.lineTo(width + 40, height);
      ctx.closePath();
      ctx.fill();

      // 3. LAYER 2 — Midground Zone Landmarks (0.65x parallax)
      const groundY = height * 0.78;

      const drawLandmarkVisible = (pos: number, parallax: number, drawFn: (sx: number) => void) => {
        const sx = worldToScreenX(pos, cam, parallax);
        if (sx < -220 || sx > width + 220) return;
        drawFn(sx);
      };

      // Zone 1: Blue Fountain (pos 3)
      drawLandmarkVisible(2, cam, (sx) => {
        const glow = ctx.createRadialGradient(sx, groundY - 22, 4, sx, groundY - 22, 65);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, groundY - 22, 65, 0, Math.PI * 2);
        ctx.fill();
        // Fountain obelisk & steps
        ctx.fillStyle = '#17253d';
        ctx.fillRect(sx - 44, groundY - 10, 88, 10);
        ctx.fillRect(sx - 30, groundY - 18, 60, 8);
        ctx.beginPath();
        ctx.moveTo(sx - 12, groundY - 18);
        ctx.lineTo(sx, groundY - 72);
        ctx.lineTo(sx + 12, groundY - 18);
        ctx.closePath();
        ctx.fillStyle = '#1e3a5f';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Zone 2: Your Base (pos 14)
      drawLandmarkVisible(14, cam, (sx) => {
        // Blue Nexus / Inhibitor Shrine & Battlements
        ctx.fillStyle = '#111c30';
        ctx.fillRect(sx - 56, groundY - 38, 26, 38);
        ctx.fillRect(sx + 30, groundY - 42, 26, 42);
        // Floating Blue Crystal
        const bob = st.reducedMotion ? 0 : Math.sin(tSec * 2) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 72 + bob);
        ctx.lineTo(sx + 13, groundY - 44 + bob);
        ctx.lineTo(sx, groundY - 22 + bob);
        ctx.lineTo(sx - 13, groundY - 44 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Zone 3: Mid Lane Turrets & Arch (pos 25 & 30)
      drawLandmarkVisible(24, cam, (sx) => {
        // Blue Outer Turret
        ctx.fillStyle = '#172338';
        ctx.beginPath();
        ctx.moveTo(sx - 14, groundY);
        ctx.lineTo(sx - 8, groundY - 64);
        ctx.lineTo(sx + 8, groundY - 64);
        ctx.lineTo(sx + 14, groundY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(sx, groundY - 68, 7, 0, Math.PI * 2);
        ctx.fill();
      });
      drawLandmarkVisible(30, cam, (sx) => {
        // Ruined Mid Arch
        ctx.strokeStyle = '#333b4f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(sx, groundY - 6, 34, Math.PI, 0);
        ctx.stroke();
      });

      // Zone 4: The Jungle (trees & sentinel monoliths pos 34..43)
      for (let tPos = 33; tPos <= 43; tPos += 2.2) {
        drawLandmarkVisible(tPos, cam, (sx) => {
          const h = 50 + ((tPos * 13) % 28);
          ctx.fillStyle = '#0a1f19';
          ctx.beginPath();
          ctx.moveTo(sx, groundY - h);
          ctx.lineTo(sx + 20, groundY - 12);
          ctx.lineTo(sx - 20, groundY - 12);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#071410';
          ctx.fillRect(sx - 3, groundY - 14, 6, 14);
        });
      }
      drawLandmarkVisible(38, cam, (sx) => {
        // Glowing Blue Sentinel Stone Arch
        ctx.fillStyle = '#142d26';
        ctx.fillRect(sx - 24, groundY - 46, 10, 46);
        ctx.fillRect(sx + 14, groundY - 46, 10, 46);
        ctx.fillRect(sx - 28, groundY - 52, 56, 10);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(sx - 8, groundY - 49, 16, 4);
      });

      // Zone 5: The River (pos 45..55)
      drawLandmarkVisible(50, cam, (sx) => {
        const riverW = 240;
        const riverGrad = ctx.createLinearGradient(sx - riverW / 2, groundY - 6, sx + riverW / 2, groundY + 18);
        riverGrad.addColorStop(0, 'rgba(14, 116, 144, 0.2)');
        riverGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.45)');
        riverGrad.addColorStop(1, 'rgba(14, 116, 144, 0.2)');
        ctx.fillStyle = riverGrad;
        ctx.fillRect(sx - riverW / 2, groundY - 4, riverW, 24);
        // Shimmering water ripples
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.45)';
        ctx.lineWidth = 1.2;
        for (let r = 0; r < 5; r++) {
          const rx = sx - 80 + r * 38 + (st.reducedMotion ? 0 : Math.sin(tSec * 1.8 + r) * 8);
          const ry = groundY + 4 + (r % 2) * 6;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + 22, ry);
          ctx.stroke();
        }
      });

      // Zone 6: Dragon Pit (pos 62)
      drawLandmarkVisible(62, cam, (sx) => {
        // Caldera crags & glowing magma fissures
        ctx.fillStyle = '#241412';
        ctx.beginPath();
        ctx.moveTo(sx - 68, groundY);
        ctx.lineTo(sx - 44, groundY - 64);
        ctx.lineTo(sx - 16, groundY - 36);
        ctx.lineTo(sx + 18, groundY - 42);
        ctx.lineTo(sx + 48, groundY - 70);
        ctx.lineTo(sx + 72, groundY);
        ctx.closePath();
        ctx.fill();
        // Magma pool glow
        const dGlow = ctx.createRadialGradient(sx, groundY - 10, 4, sx, groundY - 10, 58);
        dGlow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
        dGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = dGlow;
        ctx.beginPath();
        ctx.arc(sx, groundY - 10, 58, 0, Math.PI * 2);
        ctx.fill();
      });

      // Zone 7: Baron Pit (pos 74)
      drawLandmarkVisible(74, cam, (sx) => {
        // Void Chasm Spires
        ctx.fillStyle = '#1b0f2e';
        ctx.beginPath();
        ctx.moveTo(sx - 62, groundY);
        ctx.lineTo(sx - 38, groundY - 76);
        ctx.lineTo(sx - 12, groundY - 26);
        ctx.lineTo(sx + 14, groundY - 30);
        ctx.lineTo(sx + 40, groundY - 80);
        ctx.lineTo(sx + 66, groundY);
        ctx.closePath();
        ctx.fill();
        // Pulsing Void Rift
        const vPulse = st.reducedMotion ? 0.6 : 0.45 + 0.25 * Math.sin(tSec * 2.5);
        const vGlow = ctx.createRadialGradient(sx, groundY - 24, 3, sx, groundY - 24, 54);
        vGlow.addColorStop(0, `rgba(192, 132, 252, ${vPulse.toFixed(2)})`);
        vGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = vGlow;
        ctx.beginPath();
        ctx.arc(sx, groundY - 24, 54, 0, Math.PI * 2);
        ctx.fill();
      });

      // Zone 8: Enemy Base (pos 85)
      drawLandmarkVisible(85, cam, (sx) => {
        ctx.fillStyle = '#250e16';
        ctx.fillRect(sx - 48, groundY - 56, 20, 56);
        ctx.fillRect(sx + 28, groundY - 56, 20, 56);
        ctx.fillRect(sx - 30, groundY - 46, 60, 12);
        // Red Turret glow
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(sx - 38, groundY - 62, 5, 0, Math.PI * 2);
        ctx.arc(sx + 38, groundY - 62, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Zone 9: Enemy Nexus (pos 96)
      drawLandmarkVisible(96, cam, (sx) => {
        const nexusGlow = ctx.createRadialGradient(sx, groundY - 42, 6, sx, groundY - 42, 85);
        nexusGlow.addColorStop(0, 'rgba(244, 63, 94, 0.6)');
        nexusGlow.addColorStop(0.5, 'rgba(252, 211, 77, 0.24)');
        nexusGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = nexusGlow;
        ctx.beginPath();
        ctx.arc(sx, groundY - 42, 85, 0, Math.PI * 2);
        ctx.fill();

        // Nexus Dais
        ctx.fillStyle = '#240b14';
        ctx.fillRect(sx - 42, groundY - 12, 84, 12);
        ctx.strokeStyle = '#c8aa6e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 42, groundY - 12, 84, 12);

        // Orbiting Golden Rings
        ctx.strokeStyle = '#fcd34d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(sx, groundY - 44, 28, 10, st.reducedMotion ? 0.2 : Math.sin(tSec) * 0.25, 0, Math.PI * 2);
        ctx.stroke();

        // Crimson Nexus Core Crystal
        const bob = st.reducedMotion ? 0 : Math.sin(tSec * 2.4) * 4;
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(sx, groundY - 78 + bob);
        ctx.lineTo(sx + 16, groundY - 46 + bob);
        ctx.lineTo(sx, groundY - 18 + bob);
        ctx.lineTo(sx - 16, groundY - 46 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });

      // 4. LAYER 3 — Continuous Pathway, Zone Beacons & Traveler Lantern (1.0x parallax)
      // Ground terrain strip
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, '#101829');
      groundGrad.addColorStop(1, '#070a12');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Luminous gold road edge
      ctx.strokeStyle = 'rgba(200, 170, 110, 0.36)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Zone milestone obelisk markers along the road
      for (const zone of RIFT_ZONES) {
        const mx = worldToScreenX(zone.minProgress, cam, 1.0);
        if (mx < -80 || mx > width + 80) continue;
        ctx.fillStyle = zone.accentColor;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(mx - 1.5, groundY - 10, 3, 10);
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(240, 230, 210, 0.62)';
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(zone.name, mx + 6, groundY + 14);
      }

      // Traveler Trail
      if (!st.reducedMotion) {
        trailRef.current = trailRef.current
          .map((item) => ({ ...item, age: item.age + dt }))
          .filter((item) => item.age < 0.7);
        for (const item of trailRef.current) {
          const tx = worldToScreenX(item.p, cam, 1.0);
          const alpha = (1 - item.age / 0.7) * 0.65;
          ctx.fillStyle = `rgba(10, 200, 185, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(tx, groundY - 14, 4 * (1 - item.age / 0.7) + 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Traveler Hextech Spirit Lantern at cam position
      const travX = worldToScreenX(cam, cam, 1.0);
      const travBob = st.reducedMotion ? 0 : Math.sin(tSec * 3.1) * 3;
      const travY = groundY - 16 + travBob;
      const travColor = lastRank ? RANKS[lastRank].color : '#0ac8b9';

      const lanternHalo = ctx.createRadialGradient(travX, travY, 2, travX, travY, 34);
      lanternHalo.addColorStop(0, `${travColor}cc`);
      lanternHalo.addColorStop(0.5, `${travColor}44`);
      lanternHalo.addColorStop(1, 'rgba(10, 200, 185, 0)');
      ctx.fillStyle = lanternHalo;
      ctx.beginPath();
      ctx.arc(travX, travY, 34, 0, Math.PI * 2);
      ctx.fill();

      // Diamond-shaped lantern beacon
      ctx.fillStyle = '#f0e6d2';
      ctx.strokeStyle = travColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(travX, travY - 10);
      ctx.lineTo(travX + 7, travY);
      ctx.lineTo(travX, travY + 10);
      ctx.lineTo(travX - 7, travY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 5. LAYER 4 — Zone-Specific Ambient Particles & Rank Bursts (1.2x parallax)
      const currentZone = getZoneForProgress(cam);
      for (const p of particlesRef.current) {
        if (!st.reducedMotion) {
          p.x = (p.x + p.vx * dt * 60 + 100) % 100;
          p.y += p.vy * dt * 60;
          if (p.y < 0.08) p.y = 0.78;
        }
        const sx = worldToScreenX(p.x, cam, 1.15);
        if (sx < -20 || sx > width + 20) continue;
        const pZone = getZoneForProgress(p.x);
        const sy = p.y * height + (st.reducedMotion ? 0 : Math.sin(tSec * 2 + p.phase) * 4);
        ctx.fillStyle = pZone.accentColor;
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Celebratory rank burst particles
      if (!st.reducedMotion && burstsRef.current.length > 0) {
        burstsRef.current = burstsRef.current.filter((b) => b.life < b.maxLife);
        for (const b of burstsRef.current) {
          b.life += dt * 60;
          b.wx += b.vx;
          b.wy += b.vy;
          b.vy += 0.0004;
          const bx = worldToScreenX(b.wx, cam, 1.0);
          const by = b.wy * height;
          const alpha = 1 - b.life / b.maxLife;
          ctx.fillStyle = b.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(bx, by, b.size * alpha + 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Soft bottom & side edge vignette
      const sideVig = ctx.createLinearGradient(0, 0, width, 0);
      sideVig.addColorStop(0, 'rgba(9, 13, 22, 0.75)');
      sideVig.addColorStop(0.1, 'rgba(9, 13, 22, 0)');
      sideVig.addColorStop(0.9, 'rgba(9, 13, 22, 0)');
      sideVig.addColorStop(1, 'rgba(9, 13, 22, 0.75)');
      ctx.fillStyle = sideVig;
      ctx.fillRect(0, 0, width, height);

      // Subtle zone atmosphere tint badge inside canvas corner (non-numeric, pure location name)
      ctx.fillStyle = 'rgba(9, 13, 22, 0.7)';
      ctx.fillRect(12, 10, 178, 34);
      ctx.strokeStyle = 'rgba(200, 170, 110, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(12, 10, 178, 34);
      ctx.fillStyle = currentZone.accentColor;
      ctx.font = '700 11px "Cinzel", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(currentZone.name.toUpperCase(), 22, 25);
      ctx.fillStyle = '#a09b8c';
      ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(currentZone.subtitle, 22, 38);

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} overflow-hidden rounded-xl border border-[#785a28]/45 bg-[#090d16] shadow-2xl`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" aria-label="Summoner's Rift journey map" />

      {/* Minimalist Zone Map Strip along bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-[#090d16]/80"
        aria-hidden="true"
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${clamp(progress, 0, 100)}%`,
            background: 'linear-gradient(90deg, #0ea5e9 0%, #34d399 45%, #a855f7 75%, #fcd34d 100%)',
          }}
        />
      </div>
    </div>
  );
};
