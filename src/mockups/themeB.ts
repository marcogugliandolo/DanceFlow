// Colores por clase y entrada con rebote del estilo B
export const HUE = {
  rose: { bg: "bg-rose-50", ink: "text-rose-600", solid: "bg-rose-500", soft: "bg-rose-100", ring: "ring-rose-200" },
  violet: { bg: "bg-violet-50", ink: "text-violet-600", solid: "bg-violet-500", soft: "bg-violet-100", ring: "ring-violet-200" },
  amber: { bg: "bg-amber-50", ink: "text-amber-600", solid: "bg-amber-400", soft: "bg-amber-100", ring: "ring-amber-200" },
  teal: { bg: "bg-teal-50", ink: "text-teal-600", solid: "bg-teal-500", soft: "bg-teal-100", ring: "ring-teal-200" },
} as const;

export const pop = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 18, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: base + i * 0.07, type: "spring" as const, stiffness: 260, damping: 20 },
});
