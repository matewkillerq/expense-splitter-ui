"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, Users, Check } from "lucide-react"
import { useState } from "react"

interface Group {
  id: string
  name: string
  emoji: string
  membersCount: number
}

interface GroupSelectorProps {
  groups: Group[]
  selectedGroup: Group
  onSelectGroup: (group: Group) => void
  onCreateGroup: () => void
}

export function GroupSelector({ groups, selectedGroup, onSelectGroup, onCreateGroup }: GroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
        whileTap={{ scale: 0.97 }}
      >
        <span className="text-lg">{selectedGroup.emoji}</span>
        <span className="font-semibold text-foreground max-w-[120px] truncate">{selectedGroup.name}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-64 bg-card rounded-2xl shadow-xl border border-border/50 z-50 overflow-hidden"
            >
              <div className="p-2">
                {groups.map((group) => (
                  <motion.button
                    key={group.id}
                    onClick={() => {
                      onSelectGroup(group)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      selectedGroup.id === group.id ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{group.emoji}</span>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{group.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.membersCount} members
                        </p>
                      </div>
                    </div>
                    {selectedGroup.id === group.id && <Check className="h-4 w-4 text-primary" />}
                  </motion.button>
                ))}
              </div>
              <div className="border-t border-border/50 p-2">
                <motion.button
                  onClick={() => {
                    onCreateGroup()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-1 rounded-lg bg-muted">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Create new group</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
