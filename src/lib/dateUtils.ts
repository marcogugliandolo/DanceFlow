import { format } from "date-fns";
import { es } from "date-fns/locale";

export function safeFormat(dateStr: string | number | Date | null | undefined, formatStr: string, fallback: string = "N/A") {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback;
  return format(d, formatStr, { locale: es });
}

export function isValidDateStr(dateStr: string | number | Date | null | undefined) {
  if (!dateStr) return false;
  return !isNaN(new Date(dateStr).getTime());
}
