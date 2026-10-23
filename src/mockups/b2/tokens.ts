// Estilo B v2 · tokens: color propio por clase (variables CSS, claro y oscuro) y entradas.
export type Hue = "salon" | "bachata" | "danzas" | "pilates";
export const HUE_OF: Record<string, Hue> = { sal: "salon", bac: "bachata", dan: "danzas", pil: "pilates" };

export const C = {
  bg: "bg-[var(--bg)]", surface: "bg-[var(--surface)]", fill: "bg-[var(--fill)]",
  line: "border-[var(--line)]", ink: "text-[var(--ink)]", muted: "text-[var(--muted)]", faint: "text-[var(--faint)]",
};

export const hueBg = (h: Hue) => ({ backgroundColor: `var(--${h})` });
export const hueSoft = (h: Hue) => ({ backgroundColor: `var(--${h}-soft)` });
export const hueInk = (h: Hue) => ({ color: `var(--${h}-ink)` });
export const hueColor = (h: Hue) => `var(--${h})`;

// Entrada corta y sobria; el rebote se reserva para piezas pequeñas
export const enter = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: base + i * 0.045, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
});
export const EASE = [0.22, 1, 0.36, 1] as const;
