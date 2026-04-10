import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authErr } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authErr) throw authErr;

            // Check if user is admin
            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            // If profiles table doesn't exist yet, allow authenticated login
            if (profileErr) {
                console.warn('Profiles check failed (schema may not be set up yet):', profileErr.message);
                // Still allow access so admin can set things up
                navigate('/admin/dashboard');
                return;
            }

            if (profile.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }

            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container flex items-center justify-center">
            <div className="max-w-md w-full animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl eco-gradient flex items-center justify-center text-4xl shadow-xl">
                        🔐
                    </div>
                    <h1 className="text-3xl font-bold text-eco-900">Admin Login</h1>
                    <p className="text-gray-500 mt-2">Access the BioWatch admin dashboard</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="glass-card p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-eco-900 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="admin@biowatch.in"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-eco-900 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Signing in...
                            </>
                        ) : (
                            <>🔑 Sign In</>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Admin access only. Contact system administrator for credentials.
                </p>
            </div>
        </div>
    );
}
