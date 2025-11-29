"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (expense: {
    title: string
    amount: number
    paidBy: string[]
    participants: string[]
  }) => void
  members: { id: string; name: string; avatarUrl?: string | null }[]
  currentUserId: string
}

export function AddExpenseModal({ isOpen, onClose, onAdd, members, currentUserId }: AddExpenseModalProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState<string[]>([currentUserId || members[0]?.id || ""])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(members.map((m) => m.id))

  useEffect(() => {
    if (isOpen) {
      setSelectedParticipants(members.map((m) => m.id))
      setPaidBy([currentUserId || members[0]?.id || ""])
    }
  }, [isOpen, members, currentUserId])

  const togglePayer = (id: string) => {
    setPaidBy((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const handleSubmit = () => {
    if (!amount || selectedParticipants.length === 0 || paidBy.length === 0) return

    onAdd({
      title: title.trim() || "Gasto",
      amount: Number.parseFloat(amount),
      paidBy: paidBy, // Send IDs (usernames)
      participants: selectedParticipants, // Send IDs (usernames)
    })

    setTitle("")
    setAmount("")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-t-3xl md:rounded-3xl z-50 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Agregar Gasto</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-16 text-3xl font-bold pl-10 rounded-xl border-border/50 bg-muted/30 tabular-nums"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Descripción (opcional)</label>
                  <Input
                    placeholder="¿Para qué es este gasto?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-14 text-lg rounded-xl border-border/50 bg-muted/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Pagado por <span className="text-xs opacity-70">(selecciona uno o más)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <motion.button
                        key={member.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => togglePayer(member.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${paidBy.includes(member.id)
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        <UserAvatar
                          name={member.name}
                          avatarUrl={member.avatarUrl}
                          className="h-6 w-6"
                          fallbackClassName={`text-xs ${paidBy.includes(member.id) ? "bg-background/20 text-background" : ""}`}
                        />
                        <span className="text-sm font-medium">{member.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">Dividir entre</label>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <motion.button
                        key={member.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleParticipant(member.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${selectedParticipants.includes(member.id)
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        {selectedParticipants.includes(member.id) && <Check className="h-4 w-4" />}
                        <span className="text-sm font-medium">{member.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!amount || selectedParticipants.length === 0 || paidBy.length === 0}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
              >
                Agregar Gasto
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
