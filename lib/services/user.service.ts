import { createClient } from '@/lib/supabase/client'

export const userService = {
    /**
     * Obtener usuario por username
     */
    async getUserByUsername(username: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username.toLowerCase())
                .single()

            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error: error instanceof Error ? error.message : 'User not found' }
        }
    },

    /**
     * Actualizar perfil del usuario
     */
    async updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string }) {
        try {
            const supabase = createClient()
            const updateData: any = {}

            if (updates.displayName !== undefined) {
                updateData.display_name = updates.displayName
            }
            if (updates.avatarUrl !== undefined) {
                updateData.avatar_url = updates.avatarUrl
            }

            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single()

            if (error) throw error

            return {
                data: {
                    id: data.id,
                    username: data.username,
                    displayName: data.display_name,
                    avatarUrl: data.avatar_url,
                },
                error: null,
            }
        } catch (error) {
            return {
                data: null,
                error: error instanceof Error ? error.message : 'Failed to update profile',
            }
        }
    },
}
