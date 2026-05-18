import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import type { ActivityKind, ContactEstado, ContactInteres, DealEstado, DealTipo, PropertyEstado, PropertyTipo, TaskKind } from "./types";

// ─── Class name utility ──────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatters ─────────────────────────────────────────────────────

export function fmtARS(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtCurrency(
  n: number | null | undefined,
  currency: "ARS" | "USD" | null | undefined
): string {
  if (n == null) return "—";
  if (currency === "USD") return fmtUSD(n);
  return fmtARS(n);
}

// ─── String utilities ────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(" ") || "Sin nombre";
}

// ─── Date utilities ──────────────────────────────────────────────────────────

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  if (isToday(d)) return `Hoy, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Ayer, ${format(d, "HH:mm")}`;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

// ─── Activity kind mappings ──────────────────────────────────────────────────

export const activityKindConfig: Record<
  ActivityKind,
  { label: string; color: string; bgColor: string; iconName: string }
> = {
  nota: { label: "Nota", color: "#6b7280", bgColor: "#f3f4f6", iconName: "StickyNote" },
  llamada: { label: "Llamada", color: "#3b82f6", bgColor: "#eff6ff", iconName: "Phone" },
  email: { label: "Email", color: "#8b5cf6", bgColor: "#f5f3ff", iconName: "Mail" },
  visita: { label: "Visita", color: "#22c55e", bgColor: "#f0fdf4", iconName: "MapPin" },
  reunion: { label: "Reunión", color: "#f5912c", bgColor: "#fff4e8", iconName: "Users" },
  whatsapp: { label: "WhatsApp", color: "#25d366", bgColor: "#f0fdf4", iconName: "MessageCircle" },
  otro: { label: "Otro", color: "#6b7280", bgColor: "#f3f4f6", iconName: "Circle" },
};

export const taskKindConfig: Record<
  TaskKind,
  { label: string; color: string; bgColor: string }
> = {
  llamada: { label: "Llamada", color: "#3b82f6", bgColor: "#eff6ff" },
  visita: { label: "Visita", color: "#22c55e", bgColor: "#f0fdf4" },
  reunion: { label: "Reunión", color: "#f5912c", bgColor: "#fff4e8" },
  documentacion: { label: "Documentación", color: "#8b5cf6", bgColor: "#f5f3ff" },
  seguimiento: { label: "Seguimiento", color: "#eab308", bgColor: "#fefce8" },
  otro: { label: "Otro", color: "#6b7280", bgColor: "#f3f4f6" },
};

// ─── Contact estado mappings ─────────────────────────────────────────────────

export const contactEstadoConfig: Record<
  ContactEstado,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  nuevo: { label: "Nuevo", color: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  contactado: { label: "Contactado", color: "#eab308", bgColor: "#fefce8", textColor: "#854d0e" },
  visito: { label: "Visitó", color: "#8b5cf6", bgColor: "#f5f3ff", textColor: "#6d28d9" },
  negociacion: { label: "Negociación", color: "#f5912c", bgColor: "#fff4e8", textColor: "#b45309" },
  cerrado: { label: "Cerrado", color: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
  perdido: { label: "Perdido", color: "#ef4444", bgColor: "#fef2f2", textColor: "#b91c1c" },
};

// ─── Contact interes mappings ────────────────────────────────────────────────

export const contactInteresConfig: Record<
  ContactInteres,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  compra: { label: "Compra", color: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  venta: { label: "Venta", color: "#8b5cf6", bgColor: "#f5f3ff", textColor: "#6d28d9" },
  alquiler: { label: "Alquiler", color: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
  alquiler_temporal: { label: "Alq. Temporal", color: "#06b6d4", bgColor: "#ecfeff", textColor: "#0e7490" },
  inversion: { label: "Inversión", color: "#f5912c", bgColor: "#fff4e8", textColor: "#b45309" },
};

// ─── Deal tipo mappings ──────────────────────────────────────────────────────

export const dealTipoConfig: Record<
  DealTipo,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  venta: { label: "Venta", color: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  alquiler: { label: "Alquiler", color: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
  alquiler_temporal: { label: "Alq. Temporal", color: "#06b6d4", bgColor: "#ecfeff", textColor: "#0e7490" },
  inversion: { label: "Inversión", color: "#f5912c", bgColor: "#fff4e8", textColor: "#b45309" },
};

export const dealEstadoConfig: Record<
  DealEstado,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  activo: { label: "Activo", color: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  ganado: { label: "Ganado", color: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
  perdido: { label: "Perdido", color: "#ef4444", bgColor: "#fef2f2", textColor: "#b91c1c" },
  pausado: { label: "Pausado", color: "#6b7280", bgColor: "#f3f4f6", textColor: "#374151" },
};

// ─── Pipeline stage colors ───────────────────────────────────────────────────

export const stageColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  blue: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  yellow: { bg: "#fefce8", text: "#854d0e", dot: "#eab308" },
  purple: { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6" },
  orange: { bg: "#fff4e8", text: "#b45309", dot: "#f5912c" },
  green: { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  red: { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444" },
};

// ─── Property tipo / estado ──────────────────────────────────────────────────

export const propertyTipoConfig: Record<
  PropertyTipo,
  { label: string }
> = {
  casa: { label: "Casa" },
  departamento: { label: "Departamento" },
  local: { label: "Local Comercial" },
  oficina: { label: "Oficina" },
  terreno: { label: "Terreno" },
  galpon: { label: "Galpón" },
  campo: { label: "Campo" },
  otro: { label: "Otro" },
};

export const propertyEstadoConfig: Record<
  PropertyEstado,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  disponible: { label: "Disponible", color: "#22c55e", bgColor: "#f0fdf4", textColor: "#15803d" },
  reservado: { label: "Reservado", color: "#eab308", bgColor: "#fefce8", textColor: "#854d0e" },
  vendido: { label: "Vendido", color: "#3b82f6", bgColor: "#eff6ff", textColor: "#1d4ed8" },
  alquilado: { label: "Alquilado", color: "#8b5cf6", bgColor: "#f5f3ff", textColor: "#6d28d9" },
  no_disponible: { label: "No disponible", color: "#ef4444", bgColor: "#fef2f2", textColor: "#b91c1c" },
};

// ─── Number formatting ───────────────────────────────────────────────────────

export function fmtNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-AR").format(n);
}

export function fmtSqm(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${fmtNumber(n)} m²`;
}

// ─── Avatar color palette ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#f5912c", "#3b82f6", "#22c55e", "#8b5cf6", "#ef4444",
  "#eab308", "#06b6d4", "#ec4899", "#14b8a6", "#f97316",
];

export function getAvatarColor(name: string | null | undefined): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
