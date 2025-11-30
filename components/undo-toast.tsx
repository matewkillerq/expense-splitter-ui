"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw } from "lucide-react"
import { useEffect } from "react"

interface UndoToastProps {
    message: string
    onUndo: () => void
    onDismiss: () => void
    duration?: number
}

export function UndoToast({ message, onUndo, onDismiss, duration = 3000 }: UndoToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onDismiss])

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[90vw]"
        >
            <RotateCcw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium text-foreground flex-1">{message}</p>
            <button
                onClick={onUndo}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1"
            >
                Deshacer
            </button>
            <button
                onClick={onDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    )
}
