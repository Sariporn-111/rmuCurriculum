import { createContext, useState, useEffect } from 'react'
import api from '../services/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined)

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await api.get('/profile')

                setUser({
                    role: res.data.role_name,
                    first_name: res.data.first_name,
                    last_name: res.data.last_name
                })
            } catch {
                setUser(null)
            }
        }

        checkLogin()
    }, [])

    // loading auth
    if (user === undefined) {
        return null
    }

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}