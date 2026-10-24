// Estilo B3 (intermedio): entradas con un punto de rebote, como un paso de baile,
// pero más cortas que en la primera versión. Solo se animan posición, escala y opacidad.
export const pop = (i: number, base = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: base + i * 0.06, type: "spring" as const, stiffness: 260, damping: 24 },
});

// Nombre corto de cada estilo, para etiquetas y leyendas
export const STYLE: Record<string, string> = { sal: "Salón", bac: "Bachata", dan: "Danzas", pil: "Pilates" };
