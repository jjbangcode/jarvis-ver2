import { useEffect, useRef } from "react";
import type { CoreState } from "@/types/core";
import { hexToRgb } from "@/lib/color";
import { generateCoreParticles } from "@/lib/coreParticles";
import { CORE_STATE_CONFIG } from "./jarvisCoreStates";
import styles from "./JarvisCore.module.css";

interface JarvisCoreProps {
  readonly state?: CoreState;
  readonly className?: string;
}

const PARTICLES = generateCoreParticles(340);
const RIPPLE_RING_COUNT = 3;

/**
 * Structural concentric rings encircling the core, always visible (not
 * only while "speaking" — that's the separate expanding-ripple cue below).
 * Each ring is a dashed circle whose dash offset animates over time, so it
 * reads as slowly rotating; sign of `speed` sets the direction. Radii are
 * fractions of the particle-sphere radius.
 */
const CORE_RINGS: readonly {
  readonly radiusFraction: number;
  readonly segments: number;
  readonly dashRatio: number;
  readonly speed: number;
  readonly width: number;
  readonly opacity: number;
}[] = [
  { radiusFraction: 0.36, segments: 28, dashRatio: 0.55, speed: 0.05, width: 1, opacity: 0.32 },
  { radiusFraction: 0.54, segments: 42, dashRatio: 0.45, speed: -0.035, width: 1, opacity: 0.26 },
  { radiusFraction: 0.72, segments: 60, dashRatio: 0.35, speed: 0.024, width: 1, opacity: 0.22 },
  { radiusFraction: 0.9, segments: 80, dashRatio: 0.28, speed: -0.016, width: 1.2, opacity: 0.2 },
];

/** Outer HUD dial arcs, in the band between the sphere and the tick ring. Radii are fractions of the canvas half-extent. */
const DIAL_ARCS: readonly {
  readonly radiusFraction: number;
  readonly startAngle: number;
  readonly sweep: number;
  readonly speed: number;
  readonly width: number;
}[] = [
  { radiusFraction: 0.87, startAngle: 0.35, sweep: 1.1, speed: 0.02, width: 2 },
  { radiusFraction: 0.87, startAngle: 3.4, sweep: 0.6, speed: -0.014, width: 2 },
  { radiusFraction: 0.94, startAngle: 5.1, sweep: 1.6, speed: 0.011, width: 1.4 },
];

const TICK_COUNT = 60;
const DOT_ORBIT_COUNT = 48;

/**
 * Central Jarvis Core visualization: a dense glowing particle sphere
 * (per reference) whose color follows the current state, with the inner
 * core pulsing/rippling dynamically while "speaking". Runs its own
 * imperative Canvas 2D render loop (no per-frame React state) and
 * respects prefers-reduced-motion by drawing a single static frame.
 */
export function JarvisCore({ state = "idle", className = "" }: JarvisCoreProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<CoreState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const holder = holderRef.current;
    const canvas = canvasRef.current;
    if (!holder || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;

    const resize = (rect?: DOMRectReadOnly) => {
      const box = rect ?? holder.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      width = box.width;
      height = box.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function draw(elapsedMs: number) {
      if (!ctx || width === 0 || height === 0) return;
      const motion = !reducedMotionQuery.matches;
      const t = elapsedMs / 1000;
      const cx = width / 2;
      const cy = height / 2;
      // maxRadius is the canvas half-extent; the particle sphere only fills
      // part of it so the outer HUD dial (ticks/arcs/dotted orbit) has room.
      const maxRadius = (Math.min(width, height) / 2) * 0.98;
      const outerRadius = maxRadius * 0.62;

      const config = CORE_STATE_CONFIG[stateRef.current];
      const [pr, pg, pb] = hexToRgb(config.accentPrimary);
      const [sr, sg, sb] = hexToRgb(config.accentSecondary);

      ctx.clearRect(0, 0, width, height);

      // Soft ambient nebula wash behind the whole sphere.
      const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius * 1.15);
      ambient.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.14)`);
      ambient.addColorStop(0.55, `rgba(${sr}, ${sg}, ${sb}, 0.05)`);
      ambient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);

      // Outer HUD dial: tick marks, arc segments and a dotted orbit ring in
      // the band between the particle sphere and the canvas edge.
      for (let i = 0; i < TICK_COUNT; i += 1) {
        const isMajor = i % 5 === 0;
        const angle = (i / TICK_COUNT) * Math.PI * 2;
        const rInner = maxRadius * (isMajor ? 0.8 : 0.83);
        const rOuter = maxRadius * (isMajor ? 0.94 : 0.885);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${isMajor ? 0.38 : 0.16})`;
        ctx.lineWidth = isMajor ? 1.4 : 0.8;
        ctx.moveTo(Math.cos(angle) * rInner, Math.sin(angle) * rInner);
        ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
        ctx.stroke();
      }

      for (const dialArc of DIAL_ARCS) {
        const r = maxRadius * dialArc.radiusFraction;
        const rotation = motion ? t * dialArc.speed : 0;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, 0.3)`;
        ctx.lineWidth = dialArc.width;
        ctx.arc(0, 0, r, dialArc.startAngle + rotation, dialArc.startAngle + rotation + dialArc.sweep);
        ctx.stroke();
      }

      const dotOrbitRadius = maxRadius * 0.965;
      const dotOrbitRotation = motion ? t * 0.012 : 0;
      for (let i = 0; i < DOT_ORBIT_COUNT; i += 1) {
        const angle = (i / DOT_ORBIT_COUNT) * Math.PI * 2 + dotOrbitRotation;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, 0.28)`;
        ctx.arc(Math.cos(angle) * dotOrbitRadius, Math.sin(angle) * dotOrbitRadius, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dense particle field: the sphere itself.
      for (const particle of PARTICLES) {
        const angle = particle.angle + (motion ? t * particle.angularSpeed : 0);
        const r = outerRadius * particle.radius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const pulse = motion ? 0.45 + 0.55 * Math.sin(t * particle.pulseSpeed + particle.phase) : 0.7;
        const [cr, cg, cb] =
          particle.palette === 0 ? [255, 255, 255] : particle.palette === 1 ? [pr, pg, pb] : [sr, sg, sb];
        ctx.shadowBlur = particle.size * 2.2;
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${pulse * 0.7})`;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${pulse})`;
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Structural concentric rings around the core — always visible, each
      // rotating at its own speed/direction via an animated dash offset.
      for (const ring of CORE_RINGS) {
        const r = outerRadius * ring.radiusFraction;
        const circumference = 2 * Math.PI * r;
        const period = circumference / ring.segments;
        const dashLen = period * ring.dashRatio;
        ctx.save();
        ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${ring.opacity})`;
        ctx.lineWidth = ring.width;
        ctx.setLineDash([dashLen, period - dashLen]);
        ctx.lineDashOffset = motion ? t * ring.speed * circumference : 0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Expanding ripple rings while speaking — the "inner circle moves" cue.
      if (config.dynamic) {
        for (let i = 0; i < RIPPLE_RING_COUNT; i += 1) {
          const cycle = motion ? (t * 0.7 + i / RIPPLE_RING_COUNT) % 1 : i / RIPPLE_RING_COUNT;
          const ringRadius = outerRadius * 0.12 * (1 + cycle * 3.4);
          const alpha = (1 - cycle) * (motion ? 0.4 : 0.18);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Core glow: color follows state. While speaking, the inner circle
      // itself breathes using a small sum of sines (voice-like motion).
      const corePulse =
        config.dynamic && motion
          ? 1 + 0.16 * Math.sin(t * 7) + 0.08 * Math.sin(t * 13.7 + 1.1) + 0.05 * Math.sin(t * 21 + 2.4)
          : 1;
      const coreRadius = outerRadius * 0.15 * corePulse;

      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 2.6);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.3, `rgba(${pr}, ${pg}, ${pb}, 0.7)`);
      glow.addColorStop(0.6, `rgba(${pr}, ${pg}, ${pb}, 0.28)`);
      glow.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(0, 0, coreRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    let rafId: number | null = null;
    let startTime = performance.now();

    const frame = (now: number) => {
      draw(now - startTime);
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reducedMotionQuery.matches) {
        draw(0);
        return;
      }
      startTime = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    start();

    const handleMotionPreferenceChange = () => {
      stop();
      start();
    };
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    const resizeObserver = new ResizeObserver((entries) => {
      resize(entries[0]?.contentRect);
      if (reducedMotionQuery.matches) draw(0);
    });
    resizeObserver.observe(holder);

    return () => {
      stop();
      resizeObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);

  const label = CORE_STATE_CONFIG[state].label;

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div ref={holderRef} className={styles.holder}>
        <canvas ref={canvasRef} role="img" aria-label={`Jarvis core visualization, state ${label}`} />
      </div>
      <p className={styles.caption}>{label}</p>
    </div>
  );
}
