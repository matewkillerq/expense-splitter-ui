"use client"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { UserAvatar } from "@/components/user-avatar"
import { FormattedAmount } from "@/components/formatted-amount"
import { Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useState } from "react"

interface ExpenseCardProps {
  title: string
  amount: number
  paidBy: string[]
  participants: { username: string; avatarUrl?: string | null }[]
  date: string
  index: number
  currency?: string
  onDelete?: () => void
  currentUserId?: string
}

export function ExpenseCard({ title, amount, paidBy, participants, date, index, currency = 'USD', onDelete, currentUserId }: ExpenseCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const x = useMotionValue(0)

  // Transformar la opacidad del icono de basura basado en la posición x
  const iconOpacity = useTransform(x, [0, -40, -80], [0, 0.5, 1])
  const iconScale = useTransform(x, [0, -80], [0.5, 1])

  const paidByText =
    paidBy.length === 1
      ? paidBy[0]
      : paidBy.length === 2
        ? `${paidBy[0]} y ${paidBy[1]}`
        : `${paidBy[0]} +${paidBy.length - 1}`

  const amountPerParticipant = amount / participants.length
  const amountText = participants.length === 1
    ? (participants[0].username === currentUserId
      ? `$${amount.toFixed(2)} solo para ti`
      : `$${amount.toFixed(2)} solo para ${participants[0].username}`)
    : `$${amountPerParticipant.toFixed(2)} cada uno`

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = -80 // Must swipe at least 80px to trigger
    const deleteThreshold = -140 // Must swipe 140px to delete directly
    const velocityThreshold = 500 // Fast swipe velocity

    // Check if it's a fast swipe (velocity-based)
    const isFastSwipe = Math.abs(info.velocity.x) > velocityThreshold

    if (info.offset.x < deleteThreshold || (isFastSwipe && info.offset.x < swipeThreshold)) {
      // Fast swipe or long swipe -> Delete
      onDelete?.()
      setIsOpen(false)
    } else if (info.offset.x < swipeThreshold) {
      // Medium swipe -> Open delete button
      setIsOpen(true)
    } else {
      // Short swipe or swipe right -> Close
      setIsOpen(false)
    }
  }

  return (
    <div className="relative group touch-pan-y mb-3">
      {/* Fondo rojo con botón de eliminar */}
      <div className="absolute inset-0 bg-destructive rounded-2xl flex items-center justify-end pr-6 overflow-hidden">
        <motion.button
          style={{ opacity: iconOpacity, scale: iconScale }}
          onClick={() => {
            onDelete?.()
            setIsOpen(false)
          }}
          className="flex items-center justify-center"
          aria-label="Eliminar"
        >
          <Trash2 className="h-6 w-6 text-destructive-foreground" />
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          x: isOpen ? -80 : 0
        }}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={{ right: 0, left: 0.2 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35
        }}
        className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 relative z-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-semibold text-foreground text-base leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">
              Pagado por <span className="font-medium text-foreground">{paidByText}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-xl text-foreground tabular-nums">
              <FormattedAmount
                amount={amount}
                currency={currency as any}
                symbolClassName="mr-0.5"
                centsClassName="align-super text-xs"
              />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((participant, i) => (
                <UserAvatar
                  key={participant.username + i}
                  name={participant.username}
                  avatarUrl={participant.avatarUrl}
                  className="h-7 w-7 border-2 border-card"
                  fallbackClassName="text-xs bg-muted text-muted-foreground font-medium"
                />
              ))}
            </div>
            {participants.length > 4 && (
              <span className="text-xs text-muted-foreground ml-2">+{participants.length - 4}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
            {amountText}
          </span>
        </div>

        {/* Botón de eliminar para Desktop (hover) - Solo visible si no es touch device idealmente, 
            pero lo mantenemos oculto en mobile via media query si fuera necesario. 
            Aquí usamos group-hover que funciona bien en desktop. */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
            aria-label="Eliminar gasto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </div>
  )
}
