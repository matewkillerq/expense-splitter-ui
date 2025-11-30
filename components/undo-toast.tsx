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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 rounded-full shadow-lg"
        >
            <span className="text-xs font-medium whitespace-nowrap">{message}</span>
            <div className="h-4 w-[1px] bg-white/20 dark:bg-black/20" />
            <button
                onClick={onUndo}
                className="text-xs font-bold hover:opacity-80 transition-opacity flex items-center gap-1.5"
            >
                <RotateCcw className="h-3 w-3" />
                Deshacer
            </button>
        </motion.div>
    )
}
