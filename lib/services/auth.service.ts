import { createClient } from '@/lib/supabase/client'

const EMOJI_LIST = ["🐶", "🐱", "🦊", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲"]

function getRandomEmoji(): string {
    return EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)]
}

// Convertir username a email sintético para Supabase Auth
function usernameToEmail(username: string): string {
    return `${username.toLowerCase()}@app.local`
}

export interface SignUpData {
    username: string
    displayName: string
    password: string
}

export interface User {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
}

export const authService = {
    /**
     * Registrar nuevo usuario
     */
    async signUp(data: SignUpData): Promise<{ user: User | null; error: string | null }> {
        try {
            const supabase = createClient()
            const email = usernameToEmail(data.username)
            const avatarUrl = getRandomEmoji()

            // 1. Verificar si el username ya existe
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', data.username.toLowerCase())
                .single()

            if (existingProfile) {
                return { user: null, error: 'Username already exists' }
            }

            // 2. Crear cuenta en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: data.password,
                options: {
                    data: {
                        username: data.username.toLowerCase(),
                        display_name: data.displayName,
                    },
                },
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user returned from signup')

            // 3. Crear perfil en la tabla profiles
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                username: data.username.toLowerCase(),
                display_name: data.displayName,
                avatar_url: avatarUrl,
            })

            if (profileError) throw profileError

            // 4. Obtener el perfil completo
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (fetchError) throw fetchError

            return {
                user: {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.display_name,
                    avatarUrl: profile.avatar_url,
                },
                error: null,
            }
        } catch (error) {
            console.error('Signup error:', error)
            return {
                user: null,
                error: error instanceof Error ? error.message : 'An error occurred during signup',
            }
        }
    },

    /**
     * Iniciar sesión
     */
    async signIn(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
        try {
            const supabase = createClient()
            const email = usernameToEmail(username)

            // 1. Login con Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user returned from login')

            // 2. Obtener perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (profileError) throw profileError

            return {
                user: {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.display_name,
                    avatarUrl: profile.avatar_url,
                },
                error: null,
            }
        } catch (error) {
            console.error('Login error:', error)
            return {
                user: null,
                error: 'Invalid username or password',
            }
        }
    },

    /**
     * Cerrar sesión
     */
    async signOut(): Promise<{ error: string | null }> {
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            return { error: null }
        } catch (error) {
            console.error('Logout error:', error)
            return {
                error: error instanceof Error ? error.message : 'An error occurred during logout',
            }
        }
    },

    /**
     * Obtener usuario actual
     */
    async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
        try {
            const supabase = createClient()

            // 1. Obtener sesión actual
            const {
                data: { user: authUser },
                error: authError,
            } = await supabase.auth.getUser()

            if (authError) throw authError
            if (!authUser) return { user: null, error: null }

            // 2. Obtener perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (profileError) throw profileError

            return {
                user: {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.display_name,
                    avatarUrl: profile.avatar_url,
                },
                error: null,
            }
        } catch (error) {
            console.error('Get current user error:', error)
            return { user: null, error: null }
        }
    },
}
