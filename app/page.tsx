"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ArrowDownUp, TrendingUp, TrendingDown, Users } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { authService, type User } from "@/lib/services/auth.service"
import { groupService, type Group } from "@/lib/services/group.service"
import { expenseService } from "@/lib/services/expense.service"
import { userService } from "@/lib/services/user.service"
import { createClient } from "@/lib/supabase/client"

export default function ExpenseSplitter() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isManageGroupOpen, setIsManageGroupOpen] = useState(false)
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // isRefreshing removed as it is no longer needed

  const router = useRouter()

  // Test Supabase connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/test-supabase').then(({ testSupabaseConnection }) => {
        testSupabaseConnection()
      })
    }
  }, [])

  const loadData = useCallback(async () => {
    const { user } = await authService.getCurrentUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    setCurrentUser(user)

    const { data: userGroups } = await groupService.getUserGroups(user.id)
    if (userGroups) {
      setGroups(userGroups)

      if (userGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(userGroups[0].id)
      } else if (userGroups.length === 0) {
        setSelectedGroupId(null)
      }
    }
  }, [router, selectedGroupId])

  // Real-time updates for active group
  useEffect(() => {
    if (!selectedGroupId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`group-${selectedGroupId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${selectedGroupId}` },
        () => {
          console.log('Realtime update: expenses changed')
          loadData()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${selectedGroupId}` },
        () => {
          console.log('Realtime update: group members changed')
          loadData()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${selectedGroupId}` },
        () => {
          console.log('Realtime update: group details changed')
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedGroupId, loadData])

  // Real-time updates for user (new groups/invites)
  useEffect(() => {
    if (!currentUser) return

    const supabase = createClient()

    const channel = supabase
      .channel(`user-${currentUser.username}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `username=eq.${currentUser.username}`
        },
        () => {
          console.log('Realtime update: user added/removed from group')
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, loadData])

  useEffect(() => {
    loadData().then(() => setIsLoading(false))
  }, [loadData])

  // handleRefresh removed as it is no longer needed

  const currentGroup = groups.find((g) => g.id === selectedGroupId)

  // Calculate user's balance
  const userBalance = useMemo(() => {
    if (!currentGroup || !currentUser) return 0

    let balance = 0

    currentGroup.expenses.forEach((expense) => {
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
    if (!currentGroup) return []

    const balances: Record<string, number> = {}

    currentGroup.members.forEach(member => {
      balances[member] = 0
    })

    currentGroup.expenses.forEach((expense) => {
      const amount = expense.amount
      const splitCount = expense.participants.length
      const payerCount = expense.paidBy.length

      const sharePerParticipant = amount / splitCount
      const sharePerPayer = amount / payerCount

      expense.paidBy.forEach((payer) => {
        balances[payer] = (balances[payer] || 0) + sharePerPayer
      })

      expense.participants.forEach((participant) => {
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

  const handleCreateGroup = async (groupData: { name: string; emoji: string; members: string[] }) => {
    if (!currentUser) return

    const members = Array.from(new Set([
      ...groupData.members
        .filter(m => m.toLowerCase() !== "you")
        .map(m => m.toLowerCase()),
      currentUser.username.toLowerCase()
    ]))

    const { data, error } = await groupService.createGroup(currentUser.id, {
      name: groupData.name,
      emoji: groupData.emoji,
      members,
    })

    if (!error && data) {
      await loadData()
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

    const { error } = await expenseService.createExpense(
      currentGroup.id,
      currentUser.id,
      expenseData
    )

    if (!error) {
      await loadData()
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentGroup) return

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

    const { error } = await expenseService.deleteExpense(expenseId)
    if (error) {
      // Rollback on error
      setGroups(previousGroups)
      console.error("Error deleting expense:", error)
    }
    // No need to await loadData() explicitly as Realtime will sync eventually, 
    // but we can call it silently to ensure consistency without blocking UI.
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
      // Realtime will replace the temp expense with the real one
    }
  }

  // ...

  const formattedMembers = currentGroup.members.map(m => {
    const details = currentGroup.memberDetails?.find(d => d.username === m)
    return {
      id: m,
      name: m.toLowerCase() === currentUser?.username.toLowerCase() ? `${m} (You)` : m,
      avatarUrl: details?.avatarUrl || null,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* ... header ... */}
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
                participants={expense.participants.map(p => {
                  const details = currentGroup.memberDetails?.find(d => d.username === p)
                  return {
                    username: p,
                    avatarUrl: details?.avatarUrl || null,
                  }
                })}
                date={expense.date}
                index={index}
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
    </div >
  )
}
