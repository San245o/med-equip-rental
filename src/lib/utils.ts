import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const startStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(startDate)
  
  const endStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(endDate)
  
  return `${startStr} - ${endStr}`
}

export function getDaysBetween(start: string | Date, end: string | Date): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateRentalCost(
  dailyRate: number,
  weeklyRate: number | null | undefined,
  monthlyRate: number | null | undefined,
  days: number
): number {
  if (monthlyRate && days >= 30) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return months * monthlyRate + remainingDays * dailyRate
  }
  
  if (weeklyRate && days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    return weeks * weeklyRate + remainingDays * dailyRate
  }
  
  return days * dailyRate
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || colors.pending
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'Brand New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
  }
  return labels[condition] || condition
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
