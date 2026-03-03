import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
    id: number
    name: string
    role: 'owner' | 'staff'
}

interface AuthContextType {
    user: AuthUser | null
    loading: boolean
    login: (pin: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if already logged in
        fetch('/api/auth/me', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setUser(data) })
            .finally(() => setLoading(false))
    }, [])

    const login = async (pin: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ pin })
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Login failed')
        }
        const data = await res.json()
        setUser(data)
    }

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
