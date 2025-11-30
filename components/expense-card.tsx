"use client"
import { motion, useMotionValue, useTransform, PanInfo, animate } from "framer-motion"
import { UserAvatar } from "@/components/user-avatar"
import { FormattedAmount } from "@/components/formatted-amount"
import { Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useState, useRef } from "react"

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
  const [isDeleting, setIsDeleting] = useState(false)
  const x = useMotionValue(0)
  const deleteButtonWidth = 80

  // Transformar la opacidad del icono de basura basado en la posición x
  const iconOpacity = useTransform(x, [-deleteButtonWidth, 0], [1, 0])
  const iconScale = useTransform(x, [-deleteButtonWidth, 0], [1, 0.8])

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

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Threshold for opening delete button
    const openThreshold = -60
    // Threshold for auto-delete (swipe far enough) - increased to prevent accidental deletes
    const deleteThreshold = -200
    // Velocity threshold for quick swipe - increased for more intentional swipes
    const velocityThreshold = -800

    if (offset < deleteThreshold || velocity < velocityThreshold) {
      // Strong swipe or very fast swipe -> delete
      handleDelete()
    } else if (offset < openThreshold) {
      // Medium swipe -> snap to open position
      animate(x, -deleteButtonWidth, {
        type: "spring",
        stiffness: 400,
        damping: 30
      })
    } else {
      // Light swipe or swipe right -> close
      animate(x, 0, {
        type: "spring",
        stiffness: 400,
        damping: 30
      })
    }
  }

  const handleDelete = () => {
    if (isDeleting || !onDelete) return

    setIsDeleting(true)

    // Call onDelete immediately (optimistic)
    onDelete()

    // Then animate out
    animate(x, -400, {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.3
    })
  }

  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleDelete()
  }

  const handleCardClick = () => {
    // If card is swiped open, close it on tap
    const currentX = x.get()
    if (currentX < -10) {
      animate(x, 0, {
        type: "spring",
        stiffness: 400,
        damping: 30
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{
        opacity: { duration: 0.2 },
        y: { type: "spring", stiffness: 300, damping: 25 },
        height: { duration: 0.2 },
        marginBottom: { duration: 0.2 }
      }}
      className="relative mb-3 overflow-hidden"
    >
      {/* Delete button background */}
      <div className="absolute inset-0 bg-destructive rounded-2xl flex items-center justify-end pr-6">
        <motion.button
          style={{ opacity: iconOpacity, scale: iconScale }}
          onClick={handleDeleteButtonClick}
          className="flex items-center justify-center w-12 h-12"
          aria-label="Eliminar"
        >
          <Trash2 className="h-6 w-6 text-destructive-foreground" />
        </motion.button>
      </div>

      {/* Card content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -deleteButtonWidth, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 relative cursor-grab active:cursor-grabbing touch-pan-y"
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
      </motion.div>

      {/* Desktop hover delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 hover:opacity-100 transition-opacity hidden md:block z-20"
          aria-label="Eliminar gasto"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}
