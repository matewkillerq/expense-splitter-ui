"use client"
import { motion } from "framer-motion"
import { UserAvatar } from "@/components/user-avatar"
import { Trash2 } from "lucide-react"

interface ExpenseCardProps {
  title: string
  amount: number
  paidBy: string[]
  participants: { username: string; avatarUrl?: string | null }[]
  date: string
  index: number
  onDelete?: () => void
}

export function ExpenseCard({ title, amount, paidBy, participants, date, index, onDelete }: ExpenseCardProps) {
  const paidByText =
    paidBy.length === 1
      ? paidBy[0]
      : paidBy.length === 2
        ? `${paidBy[0]} y ${paidBy[1]}`
        : `${paidBy[0]} +${paidBy.length - 1}`

  // Determinar el texto del monto por participante
  const amountPerParticipant = amount / participants.length
  const amountText = participants.length === 1
    ? `$${amount.toFixed(2)} solo para ti`
    : `$${amountPerParticipant.toFixed(2)} cada uno`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 active:scale-[0.98] transition-transform group relative"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-foreground text-base leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Pagado por <span className="font-medium text-foreground">{paidByText}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-xl text-foreground tabular-nums">${amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
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

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
              onDelete()
            }
          }}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-90 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          aria-label="Eliminar gasto"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}
