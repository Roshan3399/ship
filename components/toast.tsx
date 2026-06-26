"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
}

export function Toast({ message, visible, onClose }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible && !show) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Check className="h-4 w-4 text-emerald-400" />
      {message}
    </div>
  )
}
