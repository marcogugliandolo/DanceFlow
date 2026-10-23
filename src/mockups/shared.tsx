import React, { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { DANCERS_PATH, DANCERS_VIEWBOX } from "../assets/dancers";

// Número que cuenta desde 0 al aparecer en pantalla
export const CountUp: React.FC<{ value: number; decimals?: number; suffix?: string; delay?: number; className?: string }> = ({
  value, decimals = 0, suffix = "", delay = 0, className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const fmt = (v: number) => v.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  useEffect(() => {
    if (!ref.current) return;
    if (reduce) { ref.current.textContent = fmt(value); return; }
    if (!inView) return;
    const c = animate(0, value, {
      duration: 1.1, delay, ease: [0.22, 1, 0.36, 1],
      onUpdate: v => { if (ref.current) ref.current.textContent = fmt(v); },
    });
    return () => c.stop();
  }, [inView, value]);
  return <span ref={ref} className={`tabular-nums ${className ?? ""}`}>{fmt(reduce ? value : 0)}</span>;
};

// Marca: la pareja del logo de la escuela
export const DancersMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox={DANCERS_VIEWBOX} className={className} aria-hidden>
    <path d={DANCERS_PATH} fillRule="evenodd" fill="currentColor" />
  </svg>
);

export const EASE = [0.22, 1, 0.36, 1] as const;
