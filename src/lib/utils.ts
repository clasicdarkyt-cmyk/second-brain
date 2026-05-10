import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  return format(d, "d MMM yyyy", { locale: es });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDatesInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cursor = startOfDay(start);
  const endDay = startOfDay(end);
  while (cursor <= endDay) {
    dates.push(dateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function calculateStreak(logs: { date: string; completed: boolean }[]): number {
  const completed = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let streak = 0;
  const cursor = new Date();
  // Check today first; if today not logged, start from yesterday
  if (!completed.has(dateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completed.has(dateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function calculateCompletionRate(
  logs: { date: string; completed: boolean }[],
  days = 30
): number {
  const since = dateString(addDays(new Date(), -days));
  const recent = logs.filter((l) => l.date >= since);
  if (recent.length === 0) return 0;
  const completed = recent.filter((l) => l.completed).length;
  return Math.round((completed / days) * 100);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "text-red-500";
    case "high":   return "text-orange-500";
    case "medium": return "text-yellow-500";
    case "low":    return "text-green-500";
    default:       return "text-muted-foreground";
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "urgent": return "Urgente";
    case "high":   return "Alta";
    case "medium": return "Media";
    case "low":    return "Baja";
    default:       return priority;
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "todo":        return "Por hacer";
    case "in_progress": return "En progreso";
    case "done":        return "Hecho";
    default:            return status;
  }
}

export function truncate(text: string, length = 100): string {
  return text.length > length ? text.slice(0, length) + "…" : text;
}
