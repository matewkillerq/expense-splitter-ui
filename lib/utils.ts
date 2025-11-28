import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea una fecha a un formato legible en español
 * - Menos de 24h: "7:25 AM"
 * - Menos de 7 días: "lun, 7:25"
 * - Más de 7 días: "28 nov"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    // Hoy: mostrar solo hora
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 168) { // 7 días
    // Esta semana: día de la semana + hora
    return date.toLocaleDateString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    // Más antiguo: día y mes
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }
}
