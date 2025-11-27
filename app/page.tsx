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

  useEffect(() => {
    loadData().then(() => setIsLoading(false))
  }, [loadData])

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
    const { error } = await expenseService.deleteExpense(expenseId)
    if (!error) {
      await loadData()
    }
  }

  const handleAddMember = async (username: string) => {
    if (!currentGroup) return

    const { error } = await groupService.addMember(currentGroup.id, username.trim().toLowerCase())
    if (error) {
      alert(error)
    } else {
      await loadData()
    }
  }

  const handleRemoveMember = async (username: string) => {
    if (!currentGroup) return

    const { error } = await groupService.removeMember(currentGroup.id, username)
    if (!error) {
      await loadData()
    }
  }

  const handleUpdateGroup = async (name: string, emoji: string) => {
    if (!currentGroup) return

    const { error } = await groupService.updateGroup(currentGroup.id, { name, emoji })
    if (!error) {
      await loadData()
    }
  }

  const handleDeleteGroup = async () => {
    if (!currentGroup) return

    const { error } = await groupService.deleteGroup(currentGroup.id)
    if (!error) {
      setSelectedGroupId(null)
      await loadData()
      setIsManageGroupOpen(false)
    }
  }

  const handleSettle = async (settlement: { from: string; to: string; amount: number }) => {
    if (!currentGroup || !currentUser) return

    const { error } = await expenseService.createExpense(
      currentGroup.id,
      currentUser.id,
      {
        title: `Settlement: ${settlement.from} → ${settlement.to}`,
        amount: settlement.amount,
        paidBy: [settlement.from],
        participants: [settlement.to],
      }
    )

    if (!error) {
      await loadData()
    }
  }

  const handleUpdateProfile = async (name: string, avatarUrl: string | null) => {
    if (!currentUser) return

    const { error } = await userService.updateProfile(currentUser.id, {
      displayName: name,
      avatarUrl: avatarUrl || undefined,
    })

    if (!error) {
      await loadData()
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
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Empty State
  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome, {currentUser?.displayName}!</h1>
            <p className="text-muted-foreground">You don't have any groups yet.</p>
          </div>
          <Button
            onClick={() => setIsCreateGroupOpen(true)}
            className="w-full h-14 text-lg rounded-2xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create your first group
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign out
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

  const groupsForSelector = groups.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    membersCount: g.members.length,
  }))

  const formattedMembers = currentGroup.members.map(m => ({
    id: m,
    name: m.toLowerCase() === currentUser?.username.toLowerCase() ? `${m} (You)` : m,
    avatarUrl: null, // We'll fetch this if needed
  }))

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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsManageGroupOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{currentGroup.members.length}</span>
            </motion.button>

            <GroupSelector
              groups={groupsForSelector}
              selectedGroup={groupsForSelector.find((g) => g.id === selectedGroupId) || groupsForSelector[0]}
              onSelectGroup={(g) => setSelectedGroupId(g.id)}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
            />

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
          <p className="text-sm text-muted-foreground text-center mb-2">Your balance</p>
          <AnimatedNumber value={userBalance} className="text-5xl font-bold tracking-tight" />
          <motion.div
            className="flex items-center justify-center gap-2 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {Math.abs(userBalance) < 0.01 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                <span className="text-xs font-medium">Settled up</span>
              </div>
            ) : userBalance > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">You're owed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/20 text-destructive">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">You owe</span>
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* Action Buttons */}
        <motion.section
          className="px-6 pb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex gap-3">
            <Button
              onClick={() => setIsSettleOpen(true)}
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-semibold border-border/50 hover:bg-muted/50 transition-all"
            >
              <ArrowDownUp className="h-5 w-5 mr-2" />
              Settle
            </Button>
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex-[2] h-14 rounded-2xl font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Expense
            </Button>
          </div>
        </motion.section>

        {/* Expenses List */}
        <section className="px-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Expenses</h2>
            <span className="text-xs text-muted-foreground">
              {currentGroup.expenses.length} expense{currentGroup.expenses.length !== 1 ? "s" : ""}
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
                  participants={expense.participants.map(p => ({
                    username: p,
                    avatarUrl: null,
                  }))}
                  date={expense.date}
                  index={index}
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
                <p className="text-lg font-medium">No expenses yet</p>
                <p className="text-sm mt-1">Add your first expense to get started</p>
              </motion.div>
            )}
          </div>
        </section>
      </div>

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
    </div>
  )
}
