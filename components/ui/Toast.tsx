'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

// Simple global toast state
let listeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify(listeners: ((t: Toast[]) => void)[], t: Toast[]) {
  listeners.forEach((l) => l([...t]))
}

export const toast = {
  success: (message: string) => {
    const t: Toast = { id: Date.now().toString(), type: 'success', message }
    toasts = [...toasts, t]
    notify(listeners, toasts)
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== t.id)
      notify(listeners, toasts)
    }, 4000)
  },
  error: (message: string) => {
    const t: Toast = { id: Date.now().toString(), type: 'error', message }
    toasts = [...toasts, t]
    notify(listeners, toasts)
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== t.id)
      notify(listeners, toasts)
    }, 5000)
  },
  info: (message: string) => {
    const t: Toast = { id: Date.now().toString(), type: 'info', message }
    toasts = [...toasts, t]
    notify(listeners, toasts)
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== t.id)
      notify(listeners, toasts)
    }, 4000)
  },
}

const icons: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
}

const styles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (t: Toast[]) => setItems(t)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm',
            'animate-in slide-in-from-right-5 duration-300',
            styles[item.type]
          )}
        >
          <span>{icons[item.type]}</span>
          <p className="flex-1">{item.message}</p>
        </div>
      ))}
    </div>
  )
}