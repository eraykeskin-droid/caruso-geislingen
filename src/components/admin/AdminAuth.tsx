import React, { useState, useEffect } from 'react';

const AdminAuth = ({ children }: { children: React.ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if session exists in localStorage
        const auth = localStorage.getItem('caruso_admin_auth');
        if (auth === 'true') {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple persistent password check for now (as requested: once logged in, stay logged in)
        if (password === 'Caruso2024!') {
            localStorage.setItem('caruso_admin_auth', 'true');
            setIsLoggedIn(true);
            setError('');
        } else {
            setError('Falsches Passwort');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('caruso_admin_auth');
        setIsLoggedIn(false);
    };

    if (isLoggedIn === null) return <div className="min-h-screen bg-black flex items-center justify-center text-secondary">Lade...</div>;

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="w-full max-w-md p-8 rounded-none bg-white/[0.03] border border-white/10">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/caruso-logo-white.svg" alt="Logo" className="w-32 mb-4" />
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
            <nav className="border-b border-white/5 bg-black sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/caruso-logo-white.svg" alt="Logo" className="h-8" />
                        <span className="text-xs uppercase tracking-widest text-secondary font-bold border-l border-white/10 pl-4 hidden md:block">Management</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-xs uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </nav>
            {children}
        </div>
    );
};

export default AdminAuth;
