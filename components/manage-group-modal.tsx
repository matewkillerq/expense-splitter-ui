"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Settings, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"
import { CURRENCIES, type CurrencyCode } from "@/lib/utils/currency"
import { BANKS, type BankCode } from "@/lib/utils/bank"
import { FormattedAmount } from "@/components/formatted-amount"
import Image from "next/image"

interface ManageGroupModalProps {
  isOpen: boolean
  onClose: () => void
  members: { id: string; name: string; avatarUrl?: string | null }[]
  groupName: string
  groupEmoji: string
  groupCurrency: CurrencyCode
  groupBank?: BankCode | null
  totalExpenses: number
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
  onUpdateGroup: (name: string, emoji: string, currency: CurrencyCode, bank?: BankCode | null) => void
  onDeleteGroup?: () => void
}

const groupEmojis = ["👨‍👩‍👧‍👦", "🏠", "✈️", "🍕", "🎉", "⚽", "🏢", "🎓", "🏖️", "🎿"]

export function ManageGroupModal({
  isOpen,
  onClose,
  members,
  groupName,
  groupEmoji,
  groupCurrency,
  groupBank,
  totalExpenses,
  onAddMember,
  onRemoveMember,
  onUpdateGroup,
  onDeleteGroup,
}: ManageGroupModalProps) {
  const [newMemberName, setNewMemberName] = useState("")
  const [tempGroupName, setTempGroupName] = useState(groupName)
  const [tempGroupEmoji, setTempGroupEmoji] = useState(groupEmoji)
  const [tempGroupCurrency, setTempGroupCurrency] = useState<CurrencyCode>(groupCurrency)
  const [tempGroupBank, setTempGroupBank] = useState<BankCode | null>(groupBank || null)

  useEffect(() => {
    if (isOpen) {
      setTempGroupName(groupName)
      setTempGroupEmoji(groupEmoji)
      setTempGroupCurrency(groupCurrency)
      setTempGroupBank(groupBank || null)
    }
  }, [isOpen, groupName, groupEmoji, groupCurrency, groupBank])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim())
      setNewMemberName("")
    }
  }

  const handleGuardarGroup = () => {
    if (tempGroupName.trim()) {
      onUpdateGroup(tempGroupName.trim(), tempGroupEmoji, tempGroupCurrency, tempGroupBank)
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
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Configuración del Grupo</h2>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Group Identity */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2 overflow-x-auto w-full justify-center pb-2 no-scrollbar px-4">
                  {groupEmojis.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setTempGroupEmoji(emoji)}
                      layout
                      className={`flex-shrink-0 rounded-2xl flex items-center justify-center gap-2 transition-all ${tempGroupEmoji === emoji
                        ? "bg-primary text-primary-foreground shadow-lg px-4 h-12"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted w-12 h-12"
                        }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      {tempGroupEmoji === emoji && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-sm font-semibold whitespace-nowrap"
                        >
                          {tempGroupName || "Grupo"}
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </div>

                <Input
                  value={tempGroupName}
                  onChange={(e) => setTempGroupName(e.target.value)}
                  className="h-14 text-center text-2xl font-bold border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  placeholder="Nombre del grupo"
                />
              </div>

              {/* Settings Section */}
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-2xl p-1 flex gap-1">
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => setTempGroupCurrency(code)}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium transition-all ${tempGroupCurrency === code
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <span>{CURRENCIES[code].symbol}</span>
                      {code}
                    </button>
                  ))}
                </div>

                <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Banco Preferido</label>
                    {tempGroupBank && (
                      <button
                        onClick={() => setTempGroupBank(null)}
                        className="text-xs text-primary hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(BANKS) as BankCode[]).map((code) => (
                      <motion.button
                        key={code}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTempGroupBank(tempGroupBank === code ? null : code)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${tempGroupBank === code
                          ? "bg-background ring-2 ring-primary shadow-sm"
                          : "bg-background/50 hover:bg-background"
                          }`}
                        title={BANKS[code].name}
                      >
                        <div className="relative w-6 h-6">
                          <Image
                            src={BANKS[code].icon}
                            alt={BANKS[code].name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  {tempGroupBank && (
                    <p className="text-xs text-center text-muted-foreground">
                      Seleccionado: <span className="font-medium text-foreground">{BANKS[tempGroupBank].name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleGuardarGroup}
                className="w-full h-12 rounded-xl text-lg font-semibold"
                disabled={
                  tempGroupName === groupName &&
                  tempGroupEmoji === groupEmoji &&
                  tempGroupCurrency === groupCurrency &&
                  tempGroupBank === groupBank
                }
              >
                Guardar Cambios
              </Button>

              {/* Agregar Miembro */}
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar miembro (nombre de usuario)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  className="h-12 rounded-xl border-border/50 bg-muted/30"
                />
                <Button
                  onClick={handleAddMember}
                  size="icon"
                  className="h-12 w-12 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              {/* Miembros List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={member.name}
                          avatarUrl={member.avatarUrl}
                          className="h-10 w-10"
                          fallbackClassName="bg-primary/10 text-primary font-medium"
                        />
                        <span className="font-medium text-foreground">{member.name}</span>
                      </div>
                      {members.length > 1 && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onRemoveMember(member.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {onDeleteGroup && (
                <div className="pt-4 border-t border-border/50">
                  {!confirmDelete ? (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Grupo
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-center text-destructive font-medium flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={onDeleteGroup}
                          className="flex-1"
                        >
                          Yes, delete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
