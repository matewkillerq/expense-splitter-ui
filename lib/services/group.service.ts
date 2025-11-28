import { createClient } from '@/lib/supabase/client'

export interface Group {
    id: string
    name: string
    emoji: string
    members: string[] // usernames
    memberDetails: { username: string; avatarUrl: string | null }[]
    expenses: Expense[]
}

// ... (Expense interface remains the same)

export const groupService = {
    /**
     * Obtener todos los grupos del usuario actual
     */
    async getUserGroups(userId: string): Promise<{ data: Group[] | null; error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Obtener IDs de grupos donde el usuario es miembro
            const { data: memberships, error: memberError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', userId)

            if (memberError) throw memberError

            if (!memberships || memberships.length === 0) {
                return { data: [], error: null }
            }

            const groupIds = memberships.map((m) => m.group_id)

            // 2. Obtener información de los grupos
            const { data: groups, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds)
                .order('created_at', { ascending: false })

            if (groupError) throw groupError

            // 3. Para cada grupo, obtener miembros y gastos
            const groupsWithData = await Promise.all(
                groups.map(async (group) => {
                    // Obtener miembros con avatar
                    const { data: memberData } = await supabase
                        .from('group_members')
                        .select('user_id, profiles(username, avatar_url)')
                        .eq('group_id', group.id)

                    const activeMembersDetails = memberData?.map((m: any) => ({
                        username: m.profiles?.username,
                        avatarUrl: m.profiles?.avatar_url
                    })).filter(m => m.username) || []

                    const activeMembers = activeMembersDetails.map(m => m.username)

                    // Obtener invitaciones pendientes
                    const { data: pendingData } = await supabase
                        .from('pending_invitations')
                        .select('username')
                        .eq('group_id', group.id)

                    const pendingMembers = pendingData?.map((p) => p.username) || []
                    const pendingMembersDetails = pendingMembers.map(username => ({ username, avatarUrl: null }))

                    // Combinar miembros activos y pendientes
                    const members = [...activeMembers, ...pendingMembers]
                    const memberDetails = [...activeMembersDetails, ...pendingMembersDetails]

                    // Obtener gastos
                    const { data: expenses } = await supabase
                        .from('expenses')
                        .select('*')
                        .eq('group_id', group.id)
                        .order('created_at', { ascending: false })

                    // Para cada gasto, obtener payers y participants
                    const expensesWithDetails = await Promise.all(
                        (expenses || []).map(async (expense) => {
                            const { data: payers } = await supabase
                                .from('expense_payers')
                                .select('user_id, username, profiles(username)')
                                .eq('expense_id', expense.id)

                            const { data: participants } = await supabase
                                .from('expense_participants')
                                .select('user_id, username, profiles(username)')
                                .eq('expense_id', expense.id)

                            return {
                                id: expense.id,
                                title: expense.title,
                                amount: Number(expense.amount),
                                paidBy: payers?.map((p: any) => p.profiles?.username || p.username) || [],
                                participants: participants?.map((p: any) => p.profiles?.username || p.username) || [],
                                date: expense.created_at,
                            }
                        })
                    )

                    return {
                        id: group.id,
                        name: group.name,
                        emoji: group.emoji,
                        members,
                        memberDetails,
                        expenses: expensesWithDetails,
                    }
                })
            )

            return { data: groupsWithData, error: null }
        } catch (error) {
            console.error('Get user groups error:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            return {
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch groups',
            }
        }
    },

    /**
     * Crear nuevo grupo
     */
    async createGroup(
        userId: string,
        data: { name: string; emoji: string; members: string[] }
    ): Promise<{ data: Group | null; error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Crear el grupo
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: data.name,
                    emoji: data.emoji,
                    created_by: userId,
                })
                .select()
                .single()

            if (groupError) throw groupError

            // 2. Obtener IDs de usuarios por username
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('username', data.members)

            if (profileError) throw profileError

            const userIds = profiles.map((p) => p.id)
            const usernames = profiles.map((p) => p.username)

            // 3. Agregar miembros al grupo
            const membersToInsert = userIds.map((id) => ({
                group_id: group.id,
                user_id: id,
            }))

            const { error: memberError } = await supabase.from('group_members').insert(membersToInsert)

            if (memberError) throw memberError

            return {
                data: {
                    id: group.id,
                    name: group.name,
                    emoji: group.emoji,
                    members: usernames,
                    memberDetails: usernames.map(u => ({ username: u, avatarUrl: null })), // Inicialmente sin avatar o null
                    expenses: [],
                },
                error: null,
            }
        } catch (error) {
            console.error('Create group error:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            return {
                data: null,
                error: error instanceof Error ? error.message : 'Failed to create group',
            }
        }
    },

    /**
     * Actualizar grupo
     */
    async updateGroup(
        groupId: string,
        updates: { name?: string; emoji?: string }
    ): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()
            const { error } = await supabase.from('groups').update(updates).eq('id', groupId)

            if (error) throw error
            return { error: null }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to update group',
            }
        }
    },

    /**
     * Eliminar grupo
     */
    async deleteGroup(groupId: string): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()
            const { error } = await supabase.from('groups').delete().eq('id', groupId)

            if (error) throw error
            return { error: null }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to delete group',
            }
        }
    },

    /**
   * Agregar miembro al grupo (permite usernames que no existen aún)
   */
    async addMember(groupId: string, username: string): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Obtener ID del usuario (si existe)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username.toLowerCase())
                .maybeSingle()

            if (profileError) throw profileError

            if (profile) {
                // Usuario existe - agregarlo directamente
                const { error: memberError } = await supabase.from('group_members').insert({
                    group_id: groupId,
                    user_id: profile.id,
                })

                if (memberError) {
                    if (memberError.code === '23505') {
                        throw new Error('User is already a member')
                    }
                    throw memberError
                }
            } else {
                // Usuario no existe - crear invitación pendiente
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Not authenticated')

                const { error: inviteError } = await supabase.from('pending_invitations').insert({
                    group_id: groupId,
                    username: username.toLowerCase(),
                    invited_by: user.id,
                })

                if (inviteError) {
                    if (inviteError.code === '23505') {
                        throw new Error('User already invited')
                    }
                    throw inviteError
                }
            }

            return { error: null }
        } catch (error) {
            console.error('Add member error:', error)
            return {
                error: error instanceof Error ? error.message : 'Failed to add member',
            }
        }
    },

    /**
   * Eliminar miembro del grupo (o invitación pendiente)
   */
    async removeMember(groupId: string, username: string): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Intentar eliminar invitación pendiente (por si acaso)
            await supabase
                .from('pending_invitations')
                .delete()
                .eq('group_id', groupId)
                .eq('username', username.toLowerCase())

            // 2. Obtener ID del usuario para eliminar de group_members
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username.toLowerCase())
                .maybeSingle()

            if (profileError) throw profileError

            if (profile) {
                // Eliminar de group_members si el usuario existe
                const { error: memberError } = await supabase
                    .from('group_members')
                    .delete()
                    .eq('group_id', groupId)
                    .eq('user_id', profile.id)

                if (memberError) throw memberError
            }

            return { error: null }
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to remove member',
            }
        }
    },
}
