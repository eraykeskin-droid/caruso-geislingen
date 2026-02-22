import React, { useState, useEffect, createContext, useContext } from 'react';

// Create a context for auth data
const AuthContext = createContext<{ role: 'admin' | 'staff' | null, logout: () => void }>({ role: null, logout: () => { } });
export const useAuth = () => useContext(AuthContext);

const AdminAuth = ({ children }: { children: React.ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/check-auth.php');
                const data = await res.json();
                setIsLoggedIn(data.logged_in);
                setUserRole(data.role || null);
            } catch (err) {
                setIsLoggedIn(false);
                setUserRole(null);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                setIsLoggedIn(true);
                setUserRole(data.role || null);
                setError('');
            } else {
                setError(data.error || 'Login fehlgeschlagen');
            }
        } catch (err) {
            setError('Server-Fehler beim Login');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/logout.php');
        setIsLoggedIn(false);
        setUserRole(null);
    };

    if (isLoggedIn === null) return <div className="min-h-screen bg-black flex items-center justify-center text-secondary">Lade...</div>;

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="w-full max-w-md p-8 rounded-none bg-white/[0.03] border border-white/10">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/images/caruso-logo-white.svg" alt="Logo" className="w-32 mb-4" />
                        <h1 className="text-xl uppercase tracking-widest text-secondary font-bold">Admin Panel</h1>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Passwort</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white w-full"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs italic">{error}</p>}

                        <button
                            type="submit"
                            className="w-full px-8 py-3 bg-secondary text-black font-bold uppercase tracking-widest transition-all hover:bg-white active:scale-95"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <AuthContext.Provider value={{ role: userRole, logout: handleLogout }}>
                {children}
            </AuthContext.Provider>
        </div>
    );
};

export default AdminAuth;
