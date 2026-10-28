import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../api/authApi'
import { authService } from '../services/authService'
import { AuthContext } from './context'
import { useAuth } from './useAuth'

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        try {
            const response = await authApi.user()
            setUser(response.data)
            return response.data
        } catch {
            setUser(null)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let isCancelled = false

        const restoreSession = async () => {
            try {
                const response = await authApi.user()
                if (!isCancelled) setUser(response.data)
            } catch {
                if (!isCancelled) setUser(null)
            } finally {
                if (!isCancelled) setIsLoading(false)
            }
        }

        restoreSession()

        return () => {
            isCancelled = true
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await authService.handleLogout()
        } finally {
            setUser(null)
        }
    }, [])

    const value = useMemo(() => ({
        user,
        setUser,
        isLoading,
        refreshUser,
        logout,
    }), [isLoading, logout, refreshUser, user])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function AuthLoadingScreen() {
    return <div className="auth-loading-screen">Loading SkyData...</div>
}

export function ProtectedRoute({ children }) {
    const { user, isLoading } = useAuth()

    if (isLoading) return <AuthLoadingScreen />
    if (!user) return <Navigate to="/login" replace />

    return children
}

export function PublicRoute({ children }) {
    const { user, isLoading } = useAuth()

    if (isLoading) return <AuthLoadingScreen />
    if (user) return <Navigate to="/home" replace />

    return children
}
