import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import WeatherWidget from '../components/WeatherWidget';

const categories = [
    { icon: '🌳', label: 'Tree Cutting', color: 'bg-green-100 text-green-800', desc: 'Report illegal tree felling' },
    { icon: '🐆', label: 'Wildlife', color: 'bg-amber-100 text-amber-800', desc: 'Report wildlife sightings' },
    { icon: '🗑️', label: 'Garbage', color: 'bg-red-100 text-red-800', desc: 'Report garbage dumping' },
    { icon: '⛰️', label: 'Landslide', color: 'bg-orange-100 text-orange-800', desc: 'Report landslide risks' },
    { icon: '🔥', label: 'Forest Fire', color: 'bg-rose-100 text-rose-800', desc: 'Report fire incidents' },
    { icon: '🌿', label: 'Other', color: 'bg-teal-100 text-teal-800', desc: 'Other environmental issues' },
];

const badges = [
    { name: 'Eco Supporter', icon: '🌱', threshold: 50, color: 'from-green-400 to-emerald-500' },
    { name: 'Green Guardian', icon: '🛡️', threshold: 150, color: 'from-emerald-500 to-teal-600' },
    { name: 'Bio Protector', icon: '🏆', threshold: 300, color: 'from-teal-500 to-cyan-600' },
];

export default function Home() {
    const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, volunteers: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const { count: total } = await supabase.from('reports').select('*', { count: 'exact', head: true });
            const { count: closed } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'Closed');
            const { count: volunteers } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
            setStats({
                total: total || 0,
                open: (total || 0) - (closed || 0),
                closed: closed || 0,
                volunteers: volunteers || 0,
            });
        } catch (err) {
            console.error('Stats fetch failed:', err);
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="hero-gradient text-white relative overflow-hidden min-h-[600px] flex items-center">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 text-8xl animate-float">🌳</div>
                    <div className="absolute top-40 right-20 text-6xl animate-float" style={{ animationDelay: '1s' }}>🦜</div>
                    <div className="absolute bottom-20 left-1/4 text-7xl animate-float" style={{ animationDelay: '2s' }}>🌿</div>
                    <div className="absolute bottom-40 right-1/3 text-5xl animate-float" style={{ animationDelay: '0.5s' }}>🌍</div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 bg-eco-600/30 backdrop-blur px-4 py-2 rounded-full text-eco-200 text-sm mb-6 border border-eco-500/30">
                            <span className="w-2 h-2 bg-eco-400 rounded-full animate-pulse"></span>
                            Live Environmental Monitoring
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                            Protect Pune's
                            <span className="block text-eco-300">Green Heritage</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-eco-100 mb-8 leading-relaxed max-w-2xl">
                            BioWatch empowers citizens to report environmental issues, track biodiversity,
                            and contribute to a greener Pune. Your voice matters for our planet.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/report" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                                📢 Report an Issue
                            </Link>
                            <Link to="/map" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20">
                                🗺️ View Map
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Reports', value: stats.total, icon: '📊', color: 'text-eco-600' },
                        { label: 'Open Issues', value: stats.open, icon: '🔔', color: 'text-amber-600' },
                        { label: 'Resolved', value: stats.closed, icon: '✅', color: 'text-green-600' },
                        { label: 'Volunteers', value: stats.volunteers, icon: '🤝', color: 'text-blue-600' },
                    ].map((stat, i) => (
                        <div key={i} className="stat-card text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <span className="text-3xl mb-2 block">{stat.icon}</span>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories + Weather */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="section-title">Report Categories</h2>
                        <p className="section-subtitle">Select a category to report an environmental concern</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.map((cat, i) => (
                                <Link
                                    key={i}
                                    to={`/report?category=${encodeURIComponent(cat.label)}`}
                                    className="glass-card p-5 card-hover flex items-start gap-4 group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                                    <div>
                                        <h3 className="font-semibold text-eco-900">{cat.label}</h3>
                                        <p className="text-sm text-gray-500">{cat.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <WeatherWidget />
                        {/* Gamification Preview */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-eco-900 mb-4">🏅 Earn Badges</h3>
                            <div className="space-y-3">
                                {badges.map((badge, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-eco-50 rounded-xl">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-xl shadow-lg`}>
                                            {badge.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-eco-900 text-sm">{badge.name}</p>
                                            <p className="text-xs text-gray-500">{badge.threshold}+ eco points</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-4">+10 pts per verified report · +5 pts per bio entry</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-eco-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', icon: '📸', title: 'Spot & Report', desc: 'See an environmental issue? Snap a photo and submit a quick report with location.' },
                            { step: '02', icon: '🔍', title: 'We Verify', desc: 'Our team reviews and verifies reports, forwarding critical issues to authorities.' },
                            { step: '03', icon: '✅', title: 'Track & Resolve', desc: 'Follow your report\'s status and see real impact on the interactive map.' },
                        ].map((item, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-eco-800 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    {item.icon}
                                </div>
                                <span className="text-eco-400 text-sm font-bold tracking-wider">STEP {item.step}</span>
                                <h3 className="text-xl font-bold mt-2 mb-2">{item.title}</h3>
                                <p className="text-eco-200 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="glass-card p-12 eco-gradient text-white rounded-3xl">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join the Movement</h2>
                    <p className="text-eco-100 text-lg mb-8 max-w-2xl mx-auto">
                        Every report counts. Be the change Pune needs. Register as a volunteer
                        or start reporting today.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/volunteer" className="px-8 py-4 bg-white text-eco-800 font-bold rounded-xl hover:bg-eco-50 transition-all shadow-xl hover:-translate-y-1">
                            Become a Volunteer
                        </Link>
                        <Link to="/biodiversity" className="px-8 py-4 bg-eco-800/50 text-white font-bold rounded-xl hover:bg-eco-800/70 transition-all border border-eco-400/30">
                            Explore Biodiversity
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
