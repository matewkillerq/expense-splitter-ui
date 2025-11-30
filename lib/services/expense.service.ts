import { createClient } from '@/lib/supabase/client'

export const expenseService = {
    /**
     * Crear nuevo gasto
     */
    async createExpense(
        groupId: string,
        userId: string,
        data: {
            title: string
            amount: number
            paidBy: string[] // usernames
            participants: string[] // usernames
        }
    ): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Crear el gasto
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    group_id: groupId,
                    title: data.title,
                    amount: data.amount,
                    created_by: userId,
                })
                .select()
                .single()

            if (expenseError) throw expenseError

            // 2. Obtener IDs de usuarios
            const allUsernames = [...new Set([...data.paidBy, ...data.participants])]
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('username', allUsernames)

            if (profileError) throw profileError

            const usernameToId = new Map(profiles.map((p) => [p.username, p.id]))

            // 3. Insertar payers
            const payersToInsert = data.paidBy.map((username) => {
                const userId = usernameToId.get(username)
                return {
                    expense_id: expense.id,
                    user_id: userId || null,
                    username: userId ? null : username,
                }
            })

            const { error: payersError } = await supabase.from('expense_payers').insert(payersToInsert)

            if (payersError) throw payersError

            // 4. Insertar participants
            const participantsToInsert = data.participants.map((username) => {
                const userId = usernameToId.get(username)
                return {
                    expense_id: expense.id,
                    user_id: userId || null,
                    username: userId ? null : username,
                }
            })

            const { error: participantsError } = await supabase
                .from('expense_participants')
                .insert(participantsToInsert)

            if (participantsError) throw participantsError

            return { error: null }
        } catch (error) {
            console.error('Create expense error:', error)
            return {
                error: error instanceof Error ? error.message : 'Failed to create expense',
            }
        }
    },

    /**
     * Eliminar gasto
     */
    async deleteExpense(expenseId: string): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()

            // Las tablas expense_payers y expense_participants tienen ON DELETE CASCADE
            // así que se eliminarán automáticamente
            const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

            if (error) throw error
            return { error: null }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to delete expense',
            }
        }
    },

    /**
     * Obtener detalles de un gasto específico
     */
    async getExpenseDetails(expenseId: string): Promise<{ data: any | null; error: string | null }> {
        try {
            const supabase = createClient() as any

            // 1. Obtener el gasto
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', expenseId)
                .single()

            if (expenseError) throw expenseError

            // 2. Obtener payers
            const { data: payers } = await supabase
                .from('expense_payers')
                .select('user_id, username, profiles(username)')
                .eq('expense_id', expenseId)

            // 3. Obtener participants
            const { data: participants } = await supabase
                .from('expense_participants')
                .select('user_id, username, profiles(username)')
                .eq('expense_id', expenseId)

            return {
                data: {
                    id: expense.id,
                    title: expense.title,
                    amount: Number(expense.amount),
                    paidBy: payers?.map((p: any) => p.profiles?.username || p.username) || [],
                    participants: participants?.map((p: any) => p.profiles?.username || p.username) || [],
                    date: expense.created_at,
                    group_id: expense.group_id
                },
                error: null
            }
        } catch (error) {
            console.error('Get expense details error:', error)
            return {
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch expense details'
            }
        }
    },
}
