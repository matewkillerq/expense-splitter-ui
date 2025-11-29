"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CURRENCIES, type CurrencyCode } from "@/lib/utils/currency"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (group: { name: string; emoji: string; members: string[]; currency: CurrencyCode }) => void
}

const groupEmojis = ["👨‍👩‍👧‍👦", "🏠", "✈️", "🍕", "🎉", "⚽", "🏢", "🎓", "🏖️", "🎿", "🚗", "💼"]

export function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("👨‍👩‍👧‍👦")
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [members, setMembers] = useState<string[]>(["Tú"])
  const [newMember, setNewMember] = useState("")

  const handleAddMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()])
      setNewMember("")
    }
  }

  const handleRemoveMember = (member: string) => {
    if (member !== "Tú") {
      setMembers(members.filter((m) => m !== member))
    }
  }

  const handleCreate = () => {
    if (name.trim() && members.length > 0) {
      onCreate({ name: name.trim(), emoji, members, currency })
      setName("")
      setEmoji("👨‍👩‍👧‍👦")
      setCurrency("USD")
      setMembers(["Tú"])
      onClose()
    }
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card rounded-3xl z-50 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Nuevo Grupo</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">Elige un ícono</label>
                  <div className="flex gap-2 flex-wrap">
                    {groupEmojis.map((e) => (
                      <motion.button
                        key={e}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEmoji(e)}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted/50 hover:bg-muted"
                          }`}
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Nombre del grupo</label>
                  <Input
                    placeholder="ej: Viaje a Milán, Compañeros de piso..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-muted/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Moneda</label>
                  <div className="flex gap-2">
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                      <motion.button
                        key={code}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrency(code)}
                        className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all ${currency === code
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        <span className="text-lg">{CURRENCIES[code].symbol}</span>
                        <span className="text-sm font-medium">{code}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Miembros</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Agregar miembro..."
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                      className="h-11 rounded-xl border-border/50 bg-muted/30"
                    />
                    <Button
                      onClick={handleAddMember}
                      size="icon"
                      className="h-11 w-11 rounded-xl bg-foreground text-background"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map((member) => (
                      <motion.div
                        key={member}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 group"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{member}</span>
                        {member !== "Tú" && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveMember(member)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreate}
                disabled={!name.trim() || members.length === 0}
                className="w-full h-12 font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                Crear Grupo
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
