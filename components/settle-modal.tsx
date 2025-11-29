"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BANKS, type BankCode } from "@/lib/utils/bank"
import Image from "next/image"

interface Settlement {
  from: string
  to: string
  amount: number
}

interface SettleModalProps {
  isOpen: boolean
  onClose: () => void
  settlements: Settlement[]
  simplifiedSettlements: Settlement[]
  onSettle: (settlement: Settlement) => void
  preferredBank?: BankCode | null
}

export function SettleModal({ isOpen, onClose, settlements, simplifiedSettlements, onSettle, preferredBank }: SettleModalProps) {
  const [useSimplified, setUseSimplified] = useState(true)
  const [showExplanation, setShowExplanation] = useState(false)

  const activeSettlements = useSimplified ? simplifiedSettlements : settlements
  const savedTransactions = settlements.length - simplifiedSettlements.length

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
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-card rounded-t-3xl md:rounded-3xl z-50 max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Saldar Cuentas</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              </div>

              {settlements.length > 0 && simplifiedSettlements.length < settlements.length && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <motion.button
                    onClick={() => setUseSimplified(!useSimplified)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${useSimplified ? "bg-accent/10 border-2 border-accent" : "bg-muted/30 border-2 border-transparent"
                      }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${useSimplified ? "bg-accent/20" : "bg-muted"}`}>
                        <Sparkles className={`h-5 w-5 ${useSimplified ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">Simplificar transacciones</p>
                        <p className="text-sm text-muted-foreground">
                          {savedTransactions > 0
                            ? `Ahorra ${savedTransactions} transacción${savedTransactions > 1 ? "es" : ""}`
                            : "Optimizado para mínimas transferencias"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 ${useSimplified ? "bg-accent justify-end" : "bg-muted justify-start"
                        }`}
                    >
                      <motion.div layout className="w-5 h-5 rounded-full bg-card shadow-sm" />
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    <span>Cómo funciona</span>
                    {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </motion.button>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-xl bg-muted/30 text-sm text-muted-foreground">
                          <p>
                            En lugar de que todos se paguen entre sí individualmente, calculamos el balance neto y
                            encontramos el número mínimo de transferencias necesarias. Por ejemplo, si A le debe a B $10 y B le debe a C $10,
                            A puede pagar directamente a C en lugar de dos transferencias separadas.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeSettlements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="p-4 rounded-full bg-accent/20">
                    <Check className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-lg font-medium text-foreground">¡Todo saldado!</p>
                  <p className="text-sm text-muted-foreground text-center">No hay balances pendientes en tu grupo</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {/* Bank Quick Access Card */}
                  {preferredBank && BANKS[preferredBank] && (
                    <motion.a
                      href={BANKS[preferredBank].appLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 hover:bg-primary/15 transition-colors border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/20">
                          <div className="relative w-6 h-6">
                            <Image
                              src={BANKS[preferredBank].icon}
                              alt={BANKS[preferredBank].name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Abrir {BANKS[preferredBank].name}</p>
                          <p className="text-xs text-muted-foreground">Acceso rápido para realizar pagos</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </motion.a>
                  )}

                  {/* Settlement Items */}
                  <AnimatePresence mode="popLayout">
                    {activeSettlements.map((settlement, index) => (
                      <motion.div
                        key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-destructive/10 text-destructive font-medium">
                              {settlement.from.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-accent/20 text-accent font-medium">
                              {settlement.to.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{settlement.from}</span>
                              {" → "}
                              <span className="font-medium text-foreground">{settlement.to}</span>
                            </p>
                            <p className="text-xl font-bold text-foreground tabular-nums">
                              ${settlement.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => onSettle(settlement)}
                          size="sm"
                          className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          Saldar
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {activeSettlements.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {activeSettlements.length} transferencia{activeSettlements.length > 1 ? "s" : ""} necesaria{activeSettlements.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
