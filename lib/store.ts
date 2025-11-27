export interface User {
    username: string
    displayName: string
    avatarUrl: string | null
}

export interface Expense {
    id: string
    title: string
    amount: number
    paidBy: string[]
    participants: string[]
    date: string
}

export interface Group {
    id: string
    name: string
    emoji: string
    members: string[] // usernames
    expenses: Expense[]
}

const STORAGE_KEYS = {
    USERS: "expense-splitter-users",
    GROUPS: "expense-splitter-groups",
    CURRENT_USER: "expense-splitter-current-user",
}

// Helper to get data from localStorage
const get = <T>(key: string, defaultValue: T): T => {
    if (typeof window === "undefined") return defaultValue
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
}

// Helper to set data to localStorage
const set = <T>(key: string, value: T) => {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(value))
}

export const store = {
    // User Management
    getUsers: (): User[] => get(STORAGE_KEYS.USERS, []),

    getUser: (username: string): User | undefined => {
        const users = get<User[]>(STORAGE_KEYS.USERS, [])
        return users.find((u) => u.username === username.toLowerCase())
    },

    createUser: (user: User): boolean => {
        const users = get<User[]>(STORAGE_KEYS.USERS, [])
        const normalizedUser = { ...user, username: user.username.toLowerCase() }
        if (users.some((u) => u.username === normalizedUser.username)) return false
        set(STORAGE_KEYS.USERS, [...users, normalizedUser])
        return true
    },

    updateUser: (updatedUser: User) => {
        const users = get<User[]>(STORAGE_KEYS.USERS, [])
        const normalizedUser = { ...updatedUser, username: updatedUser.username.toLowerCase() }
        const index = users.findIndex((u) => u.username === normalizedUser.username)
        if (index !== -1) {
            users[index] = normalizedUser
            set(STORAGE_KEYS.USERS, users)
            // Also update current user session if it matches
            const currentUser = store.getCurrentUser()
            if (currentUser && currentUser.username === normalizedUser.username) {
                // No need to update session key as username doesn't change, but good to know
            }
        }
    },

    // Session Management
    login: (username: string): boolean => {
        const normalizedUsername = username.toLowerCase()
        const user = store.getUser(normalizedUsername)
        if (!user) return false
        set(STORAGE_KEYS.CURRENT_USER, normalizedUsername)
        return true
    },

    logout: () => {
        if (typeof window === "undefined") return
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    },

    getCurrentUser: (): User | null => {
        const username = get<string | null>(STORAGE_KEYS.CURRENT_USER, null)
        if (!username) return null
        return store.getUser(username) || null
    },

    // Group Management
    getGroups: (): Group[] => {
        return get(STORAGE_KEYS.GROUPS, [])
    },

    getUserGroups: (username: string): Group[] => {
        const groups = get<Group[]>(STORAGE_KEYS.GROUPS, [])
        return groups.filter((g) => g.members.includes(username))
    },

    createGroup: (group: Group) => {
        const groups = get<Group[]>(STORAGE_KEYS.GROUPS, [])
        set(STORAGE_KEYS.GROUPS, [...groups, group])
    },

    updateGroup: (updatedGroup: Group) => {
        const groups = get<Group[]>(STORAGE_KEYS.GROUPS, [])
        const index = groups.findIndex((g) => g.id === updatedGroup.id)
        if (index !== -1) {
            groups[index] = updatedGroup
            set(STORAGE_KEYS.GROUPS, groups)
        }
    },

    deleteGroup: (groupId: string) => {
        const groups = get<Group[]>(STORAGE_KEYS.GROUPS, [])
        set(STORAGE_KEYS.GROUPS, groups.filter((g) => g.id !== groupId))
    },

    // Debug/Reset
    clearAll: () => {
        if (typeof window === "undefined") return
        localStorage.clear()
    }
}
