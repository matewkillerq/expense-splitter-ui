"use client"
export const dynamic = "force-dynamic"

import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ArrowDownUp, TrendingUp, TrendingDown, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AnimatedNumber } from "@/components/animated-number"
import { ExpenseCard } from "@/components/expense-card"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { ManageGroupModal } from "@/components/manage-group-modal"
import { SettleModal } from "@/components/settle-modal"
import { GroupSelector } from "@/components/group-selector"
import { CreateGroupModal } from "@/components/create-group-modal"
import { ProfileModal } from "@/components/profile-modal"
import { UndoToast } from "@/components/undo-toast"
import { useRouter } from "next/navigation"
import { authService, type User } from "@/lib/services/auth.service"
import { groupService, type Group } from "@/lib/services/group.service"
import { expenseService } from "@/lib/services/expense.service"
import { userService } from "@/lib/services/user.service"
import { createClient } from "@/lib/supabase/client"
import { type CurrencyCode } from "@/lib/utils/currency"
import { type BankCode, getBankAppLink, BANKS } from "@/lib/utils/bank"
import Image from "next/image"
import { useGroups } from "@/hooks/useGroups"
import { useExpenses } from "@/hooks/useExpenses"
import { useQueryClient } from "@/hooks/useQueryClient"
import { useMutation } from "@tanstack/react-query"

export default function ExpenseSplitter() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isManageGroupOpen, setIsManageGroupOpen] = useState(false)
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [undoData, setUndoData] = useState<{ expense: any; groupId: string } | null>(null)

  const router = useRouter()
  const queryClient = useQueryClient()

  // Test Supabase connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/test-supabase').then(({ testSupabaseConnection }) => {
        testSupabaseConnection()
      })
    }
  }, [])

  // Load current user
  useEffect(() => {
    (async () => {
      const { user } = await authService.getCurrentUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setCurrentUser(user)
    })()
  }, [router])

  // React Query hooks
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useGroups(currentUser?.id ?? null)
  const { data: expensesData, isLoading: expensesLoading } = useExpenses(selectedGroupId)

  // Sync groups state with query data
  useEffect(() => {
    if (groupsData !== undefined) {
      setGroups(groupsData)
      // Auto-select first group if none selected
      if (groupsData.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsData[0].id)
      }
    }
  }, [groupsData])

  // Set loading state
  useEffect(() => {
    setIsLoading(groupsLoading || (!!selectedGroupId && expensesLoading))
  }, [groupsLoading, expensesLoading, selectedGroupId])

  // Real-time updates for active group
  // Real-time updates for active group
  useEffect(() => {
    if (!currentUser) return

    const supabase = createClient()

    const channel = supabase
      .channel(`user-data-${currentUser.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          console.log('Realtime update: expenses changed')
          await queryClient.invalidateQueries({ queryKey: ['groups', currentUser.id] })
          await queryClient.refetchQueries({ queryKey: ['groups', currentUser.id] })
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_members' },
        async () => {
          console.log('Realtime update: group members changed')
          await queryClient.invalidateQueries({ queryKey: ['groups', currentUser.id] })
          await queryClient.refetchQueries({ queryKey: ['groups', currentUser.id] })
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'groups' },
        async () => {
          console.log('Realtime update: group details changed')
          await queryClient.invalidateQueries({ queryKey: ['groups', currentUser.id] })
          await queryClient.refetchQueries({ queryKey: ['groups', currentUser.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, currentUser])



  useEffect(() => {
    if (!groupsLoading && !expensesLoading) {
      setIsLoading(false)
    }
  }, [groupsLoading, expensesLoading])

  const currentGroup = groups.find((g) => g.id === selectedGroupId)

  // Calculate user's balance
  const userBalance = useMemo(() => {
    if (!currentGroup || !currentUser) return 0

    let balance = 0

    currentGroup.expenses?.forEach((expense) => {
      const paidByMe = expense.paidBy.includes(currentUser.username)
      const splitCount = expense.participants.length
      const payerCount = expense.paidBy.length

      const myShare = expense.participants.includes(currentUser.username)
        ? expense.amount / splitCount
        : 0

      const paidAmount = paidByMe ? expense.amount / payerCount : 0

      balance += paidAmount - myShare
    })

    return balance
  }, [currentGroup, currentUser])

  // Simplified Settlements Logic
  const settlements = useMemo(() => {
    if (!currentGroup?.members) return []

    const balances: Record<string, number> = {}

    currentGroup.members.forEach(member => {
      balances[member] = 0
    })

    currentGroup.expenses?.forEach((expense) => {
      const amount = expense.amount
      const splitCount = expense.participants.length
      const payerCount = expense.paidBy.length

      const sharePerParticipant = amount / splitCount
      const sharePerPayer = amount / payerCount

      expense.paidBy.forEach((payer: string) => {
        balances[payer] = (balances[payer] || 0) + sharePerPayer
      })

      expense.participants.forEach((participant: string) => {
        balances[participant] = (balances[participant] || 0) - sharePerParticipant
      })
    })

    const debtors = Object.entries(balances)
      .filter(([_, amount]) => amount < -0.01)
      .map(([name, amount]) => ({ name, amount: -amount }))
      .sort((a, b) => b.amount - a.amount)

    const creditors = Object.entries(balances)
      .filter(([_, amount]) => amount > 0.01)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)

    const result: { from: string; to: string; amount: number }[] = []

    let i = 0
    let j = 0

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]

      const amount = Math.min(debtor.amount, creditor.amount)

      if (amount > 0.01) {
        result.push({ from: debtor.name, to: creditor.name, amount })
      }

      debtor.amount -= amount
      creditor.amount -= amount

      if (debtor.amount < 0.01) i++
      if (creditor.amount < 0.01) j++
    }

    return result
  }, [currentGroup])

  const handleCreateGroup = async (groupData: { name: string; emoji: string; members: string[]; currency: CurrencyCode }) => {
    if (!currentUser) return

    const members = Array.from(new Set([
      ...groupData.members
        .filter(m => m.toLowerCase() !== "you" && m.toLowerCase() !== "tú")
        .map(m => m.toLowerCase()),
      currentUser.username.toLowerCase()
    ]))

    const { data, error } = await groupService.createGroup(currentUser.id, {
      name: groupData.name,
      emoji: groupData.emoji,
      members,
      currency: groupData.currency,
    })

    if (!error && data) {
      queryClient.invalidateQueries({ queryKey: ['groups', currentUser.id] })
      setSelectedGroupId(data.id)
    }
  }

  const handleAddExpense = async (expenseData: {
    title: string
    amount: number
    paidBy: string[]
    participants: string[]
  }) => {
    if (!currentGroup || !currentUser) return

    // Optimistic update
    const tempExpenseId = `temp-${Date.now()}`
    const tempExpense = {
      id: tempExpenseId,
      group_id: currentGroup.id,
      title: expenseData.title,
      amount: expenseData.amount,
      paidBy: expenseData.paidBy,
      participants: expenseData.participants,
      date: new Date().toISOString()
    }

    // Update local state immediately
    const previousGroups = [...groups]
    setGroups(groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          expenses: [tempExpense, ...g.expenses]
        }
      }
      return g
    }))

    const { error } = await expenseService.createExpense(
      currentGroup.id,
      currentUser.id,
      expenseData
    )

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentGroup.id] })
    } else {
      // Revert on error
      setGroups(previousGroups)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentGroup) return

    // Find the expense to delete
    const expenseToDelete = currentGroup.expenses.find(e => e.id === expenseId)
    if (!expenseToDelete) return

    // Optimistic update
    const previousGroups = [...groups]
    setGroups(groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          expenses: g.expenses.filter(e => e.id !== expenseId)
        }
      }
      return g
    }))

    // Show undo toast
    setUndoData({ expense: expenseToDelete, groupId: currentGroup.id })

    // Delete from DB
    const { error } = await expenseService.deleteExpense(expenseId)
    if (error) {
      // Rollback on error
      setGroups(previousGroups)
      setUndoData(null)
      console.error("Error deleting expense:", error)
    } else {
      // Invalidate queries to trigger real-time update for other users
      await queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
    }
  }

  const handleUndoDelete = async () => {
    if (!undoData) return

    const { expense, groupId } = undoData

    // Re-add expense optimistically
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          expenses: [...g.expenses, expense]
        }
      }
      return g
    }))

    // Re-create in DB
    const { error } = await expenseService.createExpense(
      groupId,
      currentUser!.id,
      {
        title: expense.title,
        amount: expense.amount,
        paidBy: expense.paidBy,
        participants: expense.participants
      }
    )

    if (error) {
      console.error("Error undoing delete:", error)
    } else {
      await queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
    }

    setUndoData(null)
  }

  // ... (handleSettle)

  const handleSettle = async (settlement: { from: string; to: string; amount: number }) => {
    if (!currentGroup || !currentUser) return

    const newExpense = {
      title: `Saldo: ${settlement.from} → ${settlement.to}`,
      amount: settlement.amount,
      paidBy: [settlement.from],
      participants: [settlement.to],
    }

    // Optimistic update
    const optimisticExpense = {
      id: `temp-${Date.now()}`,
      ...newExpense,
      date: new Date().toISOString(),
    }

    const previousGroups = [...groups]
    setGroups(groups.map(g => {
      if (g.id === currentGroup.id) {
        return {
          ...g,
          expenses: [optimisticExpense, ...g.expenses]
        }
      }
      return g
    }))

    const { error } = await expenseService.createExpense(
      currentGroup.id,
      currentUser.id,
      newExpense
    )

    if (error) {
      setGroups(previousGroups)
      console.error("Error creating settlement:", error)
    } else {
      queryClient.invalidateQueries({ queryKey: ['expenses', currentGroup.id] })
    }
  }

  const handleAddMember = async (username: string) => {
    if (!currentGroup) return

    const { error } = await groupService.addMember(currentGroup.id, username.trim().toLowerCase())
    if (error) {
      alert(error)
    } else {
      queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
    }
  }

  const handleRemoveMember = async (username: string) => {
    if (!currentGroup) return

    const { error } = await groupService.removeMember(currentGroup.id, username)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
    }
  }

  const handleUpdateGroup = async (name: string, emoji: string, currency: CurrencyCode, bank?: BankCode | null) => {
    if (!currentGroup) return

    // Optimistic update
    const previousGroups = [...groups]
    const updatedGroup = {
      ...currentGroup,
      name,
      emoji,
      currency,
      preferred_bank: bank
    }

    setGroups(groups.map(g => g.id === currentGroup.id ? updatedGroup : g))

    const { error } = await groupService.updateGroup(currentGroup.id, { name, emoji, currency, preferred_bank: bank })

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
    } else {
      console.error("Error updating group:", error)
      // Revert on error
      setGroups(previousGroups)

      const isBankUpdate = bank !== currentGroup.preferred_bank
      if (isBankUpdate) {
        alert("⚠️ No se pudo guardar el banco.\n\nEs probable que falte la columna 'preferred_bank' en la base de datos.\nPor favor ejecuta la migración 'add_preferred_bank_to_groups.sql' en Supabase.")
      } else {
        alert("Error al guardar los cambios del grupo. Verifica tu conexión.")
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (!currentGroup) return

    const { error } = await groupService.deleteGroup(currentGroup.id)
    if (!error) {
      setSelectedGroupId(null)
      queryClient.invalidateQueries({ queryKey: ['groups', currentUser?.id] })
      setIsManageGroupOpen(false)
    }
  }

  const handleUpdateProfile = async (name: string, avatarUrl: string | null) => {
    if (!currentUser) return

    const { error } = await userService.updateProfile(currentUser.id, {
      displayName: name,
      avatarUrl: avatarUrl || undefined,
    })

    if (!error) {
      // Refresh user data if needed, or just rely on local state update if we had one
      // For now, we might want to reload the page or invalidate user query if we had one
      // But we are using authService.getCurrentUser() in useEffect, so maybe we should invalidate that?
      // Or just update local state:
      setCurrentUser(prev => prev ? { ...prev, displayName: name, avatarUrl: avatarUrl || prev.avatarUrl } : null)
    }
  }

  const handleLogout = async () => {
    await authService.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">¡Bienvenido, {currentUser?.displayName}!</h1>
            <p className="text-muted-foreground">Aún no tienes ningún grupo.</p>
          </div>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="w-full h-14 text-lg rounded-2xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Crear tu primer grupo
          </Button>
        </div>
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      </div>
    )
  }

  if (!currentGroup) return null

  const groupsForSelector = groups?.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    membersCount: g.members?.length || 0,
  })) || []

  const formattedMembers = currentGroup?.members?.map(m => {
    const details = currentGroup.memberDetails?.find(d => d.username === m)
    return {
      id: m,
      name: m.toLowerCase() === currentUser?.username.toLowerCase() ? `${m} (You)` : m,
      avatarUrl: details?.avatarUrl || null,
    }
  }) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-32">
        {/* Header */}
        <motion.header
          className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between p-4">
            {/* Settings Button - Left */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsManageGroupOpen(true)}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </motion.button>

            {/* Group Selector - Center */}
            <GroupSelector
              groups={groupsForSelector}
              selectedGroup={groupsForSelector.find((g) => g.id === selectedGroupId) || groupsForSelector[0]}
              onSelectGroup={(g) => setSelectedGroupId(g.id)}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
            />

            {/* Profile - Right */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsProfileOpen(true)} className="relative">
              <Avatar className="h-9 w-9 border-2 border-border/50">
                <AvatarImage src={currentUser?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-muted font-medium">
                  {currentUser?.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.button>
          </div>
        </motion.header>

        {/* Balance Section */}
        <motion.section
          className="px-6 pt-8 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-muted-foreground text-center mb-2">Tu balance</p>
          <AnimatedNumber
            value={userBalance}
            currency={currentGroup?.currency}
            className="text-5xl font-bold tracking-tight"
          />
          <motion.div
            className="flex items-center justify-center gap-2 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {Math.abs(userBalance) < 0.01 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                <span className="text-xs font-medium">Saldado</span>
              </div>
            ) : userBalance > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Te deben</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/20 text-destructive">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Debes</span>
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* Settle Button - Centered and Subtle */}
        <motion.section
          className="px-6 pb-6 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            onClick={() => setIsSettleOpen(true)}
            variant="ghost"
            className="h-10 px-6 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all gap-2"
          >
            <ArrowDownUp className="h-4 w-4" />
            Saldar Cuentas
          </Button>
        </motion.section>

        {/* Floating Add Button */}
        <motion.button
          onClick={() => setIsAddExpenseOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-foreground text-background shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Plus className="h-7 w-7" />
        </motion.button>

        {/* Expenses List */}
        <section className="px-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Gastos</h2>
            <span className="text-xs text-muted-foreground">
              {currentGroup.expenses.length} gasto{currentGroup.expenses.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {currentGroup.expenses.map((expense, index) => (
                <ExpenseCard
                  key={expense.id}
                  title={expense.title}
                  amount={expense.amount}
                  paidBy={expense.paidBy}
                  participants={expense.participants.map((p: string) => {
                    const details = currentGroup.memberDetails?.find(d => d.username === p)
                    return {
                      username: p,
                      avatarUrl: details?.avatarUrl || null,
                    }
                  })}
                  date={expense.date}
                  index={index}
                  currency={currentGroup.currency}
                  currentUserId={currentUser?.username}
                  onDelete={() => handleDeleteExpense(expense.id)}
                />
              ))}
            </AnimatePresence>

            {currentGroup.expenses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg font-medium">Aún no hay gastos</p>
                <p className="text-sm mt-1">Agrega tu primer gasto para comenzar</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Modals */}
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onAdd={handleAddExpense}
          members={formattedMembers}
          currentUserId={currentUser?.username || ""}
        />
        <ManageGroupModal
          isOpen={isManageGroupOpen}
          onClose={() => setIsManageGroupOpen(false)}
          members={formattedMembers}
          groupName={currentGroup.name}
          groupEmoji={currentGroup.emoji}
          groupCurrency={currentGroup.currency}
          groupBank={currentGroup.preferred_bank}
          totalExpenses={currentGroup.expenses.reduce((sum, expense) => sum + expense.amount, 0)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
        <SettleModal
          isOpen={isSettleOpen}
          onClose={() => setIsSettleOpen(false)}
          settlements={settlements}
          simplifiedSettlements={settlements}
          onSettle={handleSettle}
          preferredBank={currentGroup?.preferred_bank}
        />
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={{
            id: currentUser?.username || "",
            display_name: currentUser?.displayName || "",
            avatar_url: currentUser?.avatarUrl || null
          }}
          onUpdateProfile={handleUpdateProfile}
        />

        <AnimatePresence>
          {undoData && (
            <UndoToast
              message={`Gasto "${undoData.expense.title}" eliminado`}
              onUndo={handleUndoDelete}
              onDismiss={() => setUndoData(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
