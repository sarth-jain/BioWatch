import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const navLinks = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/report', label: 'Report', icon: '📢' },
    { to: '/map', label: 'Map', icon: '🗺️' },
    { to: '/biodiversity', label: 'Biodiversity', icon: '🌿' },
    { to: '/volunteer', label: 'Volunteer', icon: '🤝' },
    { to: '/volunteer-proof', label: 'Submit Proof', icon: '📸' },
    { to: '/official-resources', label: 'Official Resources', icon: '🏛️' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasCritical, setHasCritical] = useState(false);

    useEffect(() => {
        checkCritical();
    }, []);

    async function checkCritical() {
        try {
            const { count } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('severity_level', 'Critical')
                .neq('status', 'Closed');
            setHasCritical((count || 0) > 0);
        } catch {
            // silently fail — don't break nav
        }
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-eco-900/95 backdrop-blur-lg border-b border-eco-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <span className="text-2xl group-hover:animate-float">🌱</span>
                        <span className="text-xl font-bold text-white tracking-tight">
                            Bio<span className="text-eco-400">Watch</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === '/'}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${isActive
                                        ? 'bg-eco-600 text-white shadow-lg shadow-eco-600/30'
                                        : 'text-eco-100 hover:bg-eco-800 hover:text-white'
                                    }`
                                }
                            >
                                <span className="text-base">{link.icon}</span>
                                {link.label}
                            </NavLink>
                        ))}

                        {/* Conditional Critical Alerts link */}
                        {hasCritical && (
                            <NavLink
                                to="/high-priority"
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 animate-pulse ${
                                        isActive
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                                            : 'bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-white border border-red-500/50'
                                    }`
                                }
                            >
                                <span className="text-base">🚨</span>
                                Alerts
                            </NavLink>
                        )}

                        <Link
                            to="/admin/login"
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-eco-200 hover:bg-eco-800/50 hover:text-white transition-all duration-200 border border-eco-700 hover:border-eco-500"
                        >
                            🔐 Admin
                        </Link>
                    </div>

                    {/* Mobile burger */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg text-eco-200 hover:bg-eco-800 transition-colors"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-eco-900/98 backdrop-blur-lg border-t border-eco-700/50 animate-fade-in">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === '/'}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-eco-600 text-white'
                                        : 'text-eco-100 hover:bg-eco-800'
                                    }`
                                }
                            >
                                <span className="mr-2">{link.icon}</span>
                                {link.label}
                            </NavLink>
                        ))}
                        {hasCritical && (
                            <NavLink
                                to="/high-priority"
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-600/20 text-red-300 border border-red-500/50'
                                    }`
                                }
                            >
                                <span className="mr-2">🚨</span>
                                Critical Alerts
                            </NavLink>
                        )}
                        <Link
                            to="/admin/login"
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-3 rounded-lg text-sm font-medium text-eco-200 hover:bg-eco-800 border border-eco-700 mt-2"
                        >
                            🔐 Admin Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
