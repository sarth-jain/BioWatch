import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, []);

    async function checkAdmin() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // If profiles table doesn't exist, allow authenticated user through
            if (profileErr) {
                console.warn('Profiles check failed:', profileErr.message);
                setIsAdmin(true); // Allow access so admin can set up the DB
            } else {
                setIsAdmin(profile?.role === 'admin');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-eco-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-eco-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-eco-700 font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
