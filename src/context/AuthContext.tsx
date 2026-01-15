import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "@/lib/api"
import type { Employee } from "@/types"

interface AuthContextType {
    user: Employee | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (token: string, user: Employee) => void
    logout: () => void
    impersonatedOrgId: string | null
    impersonateOrg: (orgId: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<Employee | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
    const [impersonatedOrgId, setImpersonatedOrgId] = useState<string | null>(localStorage.getItem("impersonatedOrgId"))
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("token")
            if (storedToken) {
                try {
                    // Verify token and get user details
                    api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
                    
                    // Restore Impersonation Header
                    const storedOrgId = localStorage.getItem("impersonatedOrgId");
                    if (storedOrgId) {
                        api.defaults.headers.common["x-impersonate-organisation-id"] = storedOrgId;
                        setImpersonatedOrgId(storedOrgId);
                    }

                    const response = await api.get("/me")
                    setUser(response.data)
                    setToken(storedToken)
                } catch (error) {
                    console.error("Failed to restore session:", error)
                    logout()
                }
            }
            setIsLoading(false)
        }

        initAuth()
    }, [])

    const login = (newToken: string, newUser: Employee) => {
        localStorage.setItem("token", newToken)
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
        
        // Clear impersonation on new login
        delete api.defaults.headers.common["x-impersonate-organisation-id"];
        localStorage.removeItem("impersonatedOrgId");
        setImpersonatedOrgId(null);
        
        setToken(newToken)
        setUser(newUser)
    }

    const logout = () => {
        localStorage.removeItem("token")
        delete api.defaults.headers.common["Authorization"]
        
        // Clear impersonation
        delete api.defaults.headers.common["x-impersonate-organisation-id"];
        localStorage.removeItem("impersonatedOrgId");
        setImpersonatedOrgId(null);

        setToken(null)
        setUser(null)
    }

    const impersonateOrg = (orgId: string | null) => {
         if (orgId) {
             api.defaults.headers.common["x-impersonate-organisation-id"] = orgId;
             localStorage.setItem("impersonatedOrgId", orgId);
             setImpersonatedOrgId(orgId);
         } else {
             delete api.defaults.headers.common["x-impersonate-organisation-id"];
             localStorage.removeItem("impersonatedOrgId");
             setImpersonatedOrgId(null);
         }
         // Reload to ensure all components fetch new data
         window.location.reload(); 
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
                impersonatedOrgId,
                impersonateOrg
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
