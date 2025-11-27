export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    display_name: string
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    display_name: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    display_name?: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            groups: {
                Row: {
                    id: string
                    name: string
                    emoji: string
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    emoji: string
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    emoji?: string
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            group_members: {
                Row: {
                    id: string
                    group_id: string
                    user_id: string
                    joined_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    user_id: string
                    joined_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    user_id?: string
                    joined_at?: string
                }
            }
            expenses: {
                Row: {
                    id: string
                    group_id: string
                    title: string
                    amount: number
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    title: string
                    amount: number
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    title?: string
                    amount?: number
                    created_by?: string
                    created_at?: string
                }
            }
            expense_payers: {
                Row: {
                    id: string
                    expense_id: string
                    user_id: string | null
                    username: string | null
                }
                Insert: {
                    id?: string
                    expense_id: string
                    user_id?: string | null
                    username?: string | null
                }
                Update: {
                    id?: string
                    expense_id?: string
                    user_id?: string | null
                    username?: string | null
                }
            }
            expense_participants: {
                Row: {
                    id: string
                    expense_id: string
                    user_id: string | null
                    username: string | null
                }
                Insert: {
                    id?: string
                    expense_id: string
                    user_id?: string | null
                    username?: string | null
                }
                Update: {
                    id?: string
                    expense_id?: string
                    user_id?: string | null
                    username?: string | null
                }
            }
            pending_invitations: {
                Row: {
                    id: string
                    group_id: string
                    username: string
                    invited_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    username: string
                    invited_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    username?: string
                    invited_by?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
