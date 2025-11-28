"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Trash2, Users, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@/components/user-avatar"

interface ManageGroupModalProps {
  isOpen: boolean
  onClose: () => void
  members: { id: string; name: string; avatarUrl?: string | null }[]
  groupName: string
  groupEmoji: string
  totalExpenses: number
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
  onUpdateGroup: (name: string, emoji: string) => void
  onDeleteGroup?: () => void
}

const groupEmojis = ["👨‍👩‍👧‍👦", "🏠", "✈️", "🍕", "🎉", "⚽", "🏢", "🎓", "🏖️", "🎿"]

export function ManageGroupModal({
  isOpen,
  onClose,
  members,
  groupName,
  groupEmoji,
  totalExpenses,
  onAddMember,
  onRemoveMember,
  onUpdateGroup,
  onDeleteGroup,
}: ManageGroupModalProps) {
  const [newMemberName, setNewMemberName] = useState("")
  const [editingGroup, setEditingGroup] = useState(false)
  const [tempGroupName, setTempGroupName] = useState(groupName)
  const [tempGroupEmoji, setTempGroupEmoji] = useState(groupEmoji)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim())
      setNewMemberName("")
    }
  }

  const handleGuardarGroup = () => {
    if (tempGroupName.trim()) {
      onUpdateGroup(tempGroupName.trim(), tempGroupEmoji)
      setEditingGroup(false)
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
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Administrar Grupo</h2>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Group Info */}
              <div className="p-4 rounded-2xl bg-muted/30">
                {editingGroup ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {groupEmojis.map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setTempGroupEmoji(emoji)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${tempGroupEmoji === emoji ? "bg-primary/20 ring-2 ring-primary" : "bg-muted/50"
                            }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                    <Input
                      value={tempGroupName}
                      onChange={(e) => setTempGroupName(e.target.value)}
                      className="h-12 rounded-xl border-border/50 bg-card"
                      placeholder="Nombre del grupo"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleGuardarGroup} className="flex-1 h-10 rounded-xl">
                        Guardar
                      </Button>
                      <Button
                        onClick={() => setEditingGroup(false)}
                        variant="outline"
                        className="flex-1 h-10 rounded-xl"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => {
                      setTempGroupName(groupName)
                      setTempGroupEmoji(groupEmoji)
                      setEditingGroup(true)
                    }}
                    className="w-full flex items-center gap-3 text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-3xl">{groupEmoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">{groupName}</p>
                      <p className="text-sm text-muted-foreground">Total gastado: ${totalExpenses.toFixed(2)}</p>
                    </div>
                  </motion.button>
                )}
              </div>

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

              <p className="text-center text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""} in group
              </p>

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
