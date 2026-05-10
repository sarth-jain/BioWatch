import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Module-level component: card image with emoji fallback on load error
function SpeciesImage({ src, name, type, className }) {
    const [errored, setErrored] = useState(false);
    if (src && !errored) {
        return (
            <img
                src={src}
                alt={name}
                className={className}
                onError={() => setErrored(true)}
                loading="lazy"
            />
        );
    }
    return (
        <div className={`w-full h-full bg-gradient-to-br ${type === 'flora' ? 'from-green-100 to-eco-300' : 'from-amber-100 to-orange-200'} flex items-center justify-center text-5xl`}>
            {type === 'flora' ? '🌱' : '🦎'}
        </div>
    );
}

// Module-level component: modal image with emoji fallback
function ModalImage({ src, name, type }) {
    const [errored, setErrored] = useState(false);
    if (src && !errored) {
        return (
            <img
                src={src}
                alt={name}
                className="w-full h-full object-cover"
                onError={() => setErrored(true)}
            />
        );
    }
    return (
        <div className={`w-full h-full flex items-center justify-center text-7xl ${type === 'flora' ? 'bg-gradient-to-br from-green-100 to-eco-200' : 'bg-gradient-to-br from-amber-100 to-orange-200'}`}>
            {type === 'flora' ? '🌱' : '🦎'}
        </div>
    );
}

// Zoo info section component
function ZooInfoSection() {
    const [expanded, setExpanded] = useState(false);

    const zooAnimals = [
        { name: 'Royal Bengal Tiger', icon: '🐅' },
        { name: 'Indian Leopard', icon: '🐆' },
        { name: 'Sloth Bear', icon: '🐻' },
        { name: 'Spotted Deer', icon: '🦌' },
        { name: 'Indian Peafowl', icon: '🦚' },
        { name: 'Mugger Crocodile', icon: '🐊' },
        { name: 'Indian Python', icon: '🐍' },
        { name: 'Various Birds', icon: '🦜' },
    ];

    return (
        <div className="mt-12 glass-card overflow-hidden">
            {/* Zoo Header Banner */}
            <div className="relative bg-gradient-to-r from-eco-700 via-eco-600 to-emerald-500 p-6 sm:p-8">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-8 text-6xl">🌳</div>
                    <div className="absolute bottom-2 right-8 text-6xl">🦁</div>
                    <div className="absolute top-4 right-1/3 text-4xl">🦋</div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🏛️</span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Rajiv Gandhi Zoological Park</h2>
                    </div>
                    <p className="text-eco-100 text-lg">Katraj, Pune — A Haven for Wildlife Conservation</p>
                </div>
            </div>

            {/* Zoo Content */}
            <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* About Section */}
                    <div>
                        <h3 className="font-bold text-eco-900 text-lg mb-3 flex items-center gap-2">
                            <span>📖</span> About the Zoo
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Rajiv Gandhi Zoological Park, commonly known as <strong>Katraj Zoo</strong>, is located in the 
                            Katraj area of Pune, Maharashtra. Established in 1999 and spread over <strong>130 acres</strong>, 
                            it is one of the most visited zoos in western India. The zoo was relocated from its original 
                            location at Peshwe Park in the heart of Pune to this larger, greener site at Katraj.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            The zoo is home to a wide variety of animals, birds, and reptiles, and also features a 
                            <strong> Snake Park</strong> and an <strong>orphaned animal rescue centre</strong>. 
                            It plays a vital role in wildlife conservation, breeding programmes, and environmental education 
                            for the citizens of Pune.
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-eco-900 text-lg mb-3 flex items-center gap-2">
                            <span>ℹ️</span> Visitor Information
                        </h3>
                        <div className="bg-eco-50 border border-eco-100 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">📍</span>
                                <div>
                                    <p className="text-xs font-semibold text-eco-700 uppercase tracking-wide">Location</p>
                                    <p className="text-sm text-gray-700">Katraj, Satara Road, Pune 411046</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">🕐</span>
                                <div>
                                    <p className="text-xs font-semibold text-eco-700 uppercase tracking-wide">Timings</p>
                                    <p className="text-sm text-gray-700">9:30 AM – 6:00 PM (Closed on Wednesdays)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">🎟️</span>
                                <div>
                                    <p className="text-xs font-semibold text-eco-700 uppercase tracking-wide">Entry Fee</p>
                                    <p className="text-sm text-gray-700">₹30 for Adults, ₹10 for Children (approx.)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">📐</span>
                                <div>
                                    <p className="text-xs font-semibold text-eco-700 uppercase tracking-wide">Area</p>
                                    <p className="text-sm text-gray-700">130 acres of lush green habitat</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Animals */}
                <div className="mt-6">
                    <h3 className="font-bold text-eco-900 text-lg mb-3 flex items-center gap-2">
                        <span>🐾</span> Key Animals at the Zoo
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {zooAnimals.map((animal, i) => (
                            <div key={i} className="bg-gradient-to-br from-white to-eco-50 border border-eco-100 rounded-xl p-3 text-center hover:shadow-md transition-shadow duration-200">
                                <span className="text-2xl block mb-1">{animal.icon}</span>
                                <p className="text-sm font-medium text-eco-800">{animal.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Highlights */}
                <div className="mt-6">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 text-eco-700 font-semibold hover:text-eco-900 transition-colors"
                    >
                        <span>{expanded ? '▼' : '▶'}</span>
                        <span>Special Attractions & Highlights</span>
                    </button>
                    {expanded && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <h4 className="font-semibold text-amber-800 mb-1">🐍 Snake Park</h4>
                                <p className="text-sm text-gray-700">Houses various species of Indian snakes including King Cobra, Indian Cobra, Russell's Viper, and Python with educational displays.</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="font-semibold text-blue-800 mb-1">🦋 Butterfly Garden</h4>
                                <p className="text-sm text-gray-700">A dedicated butterfly enclosure with native flowering plants that attract dozens of butterfly species throughout the year.</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <h4 className="font-semibold text-purple-800 mb-1">🌊 Katraj Lake</h4>
                                <p className="text-sm text-gray-700">The adjacent Katraj Lake adds scenic beauty and supports migratory bird watching during winter months.</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <h4 className="font-semibold text-green-800 mb-1">🏥 Animal Rescue Centre</h4>
                                <p className="text-sm text-gray-700">Operates a rescue and rehabilitation centre for orphaned, injured, and confiscated wild animals from across Maharashtra.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Biodiversity() {
    const [items, setItems] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        let result = items;
        if (typeFilter !== 'all') {
            result = result.filter(i => i.type === typeFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.scientific_name?.toLowerCase().includes(q) ||
                i.description?.toLowerCase().includes(q) ||
                i.location?.toLowerCase().includes(q) ||
                i.habitat?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [search, typeFilter, items]);

    async function fetchItems() {
        try {
            const { data, error } = await supabase
                .from('biodiversity')
                .select('*')
                .order('name');
            if (error) throw error;
            setItems(data || []);
            setFiltered(data || []);
        } catch (err) {
            console.error('Failed to fetch biodiversity:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page-container animate-fade-in">
            <h1 className="section-title">🌿 Biodiversity Explorer</h1>
            <p className="section-subtitle">Discover the rich flora and fauna of Pune's ecosystem</p>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, location, or description..."
                        className="input-field pl-11"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'flora', 'fauna'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${typeFilter === type
                                ? 'bg-eco-600 text-white shadow-lg'
                                : 'bg-white/80 text-gray-700 hover:bg-eco-100 border border-eco-200'
                            }`}
                        >
                            {type === 'all' ? '🌍 All' : type === 'flora' ? '🌱 Flora' : '🦎 Fauna'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="glass-card animate-pulse">
                            <div className="h-48 bg-eco-200 rounded-t-2xl"></div>
                            <div className="p-5">
                                <div className="h-4 bg-eco-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-eco-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-6xl">🔍</span>
                    <p className="text-gray-500 text-lg mt-4">No species found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className="glass-card card-hover cursor-pointer group overflow-hidden"
                        >
                            <div className="relative h-48 overflow-hidden rounded-t-2xl">
                                <SpeciesImage
                                    src={item.image_url}
                                    name={item.name}
                                    type={item.type}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3">
                                    <span className={`badge ${item.type === 'flora' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {item.type === 'flora' ? '🌱 Flora' : '🦎 Fauna'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-eco-900 text-lg leading-tight">{item.name}</h3>
                                <p className="text-sm text-eco-600 italic mb-2">{item.scientific_name}</p>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
                                {item.location && (
                                    <div className="flex items-start gap-1.5 bg-eco-50 rounded-lg px-2.5 py-1.5">
                                        <span className="text-xs mt-0.5 shrink-0">📍</span>
                                        <p className="text-xs text-eco-700 font-medium leading-snug">{item.location}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="stat-card text-center">
                    <span className="text-3xl">🌍</span>
                    <p className="text-2xl font-bold text-eco-900 mt-2">{items.length}</p>
                    <p className="text-sm text-gray-500">Total Species</p>
                </div>
                <div className="stat-card text-center">
                    <span className="text-3xl">🌱</span>
                    <p className="text-2xl font-bold text-eco-900 mt-2">{items.filter(i => i.type === 'flora').length}</p>
                    <p className="text-sm text-gray-500">Flora</p>
                </div>
                <div className="stat-card text-center">
                    <span className="text-3xl">🦎</span>
                    <p className="text-2xl font-bold text-eco-900 mt-2">{items.filter(i => i.type === 'fauna').length}</p>
                    <p className="text-sm text-gray-500">Fauna</p>
                </div>
            </div>

            {/* Rajiv Gandhi Zoo Section */}
            <ZooInfoSection />

            {/* Detail Modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-full h-56 overflow-hidden rounded-t-2xl">
                            <ModalImage
                                src={selected.image_url}
                                name={selected.name}
                                type={selected.type}
                            />
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`badge ${selected.type === 'flora' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {selected.type === 'flora' ? '🌱 Flora' : '🦎 Fauna'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-eco-900 mt-2">{selected.name}</h2>
                            <p className="text-eco-600 italic mb-4">{selected.scientific_name}</p>
                            <p className="text-gray-700 leading-relaxed mb-4">{selected.description}</p>

                            <div className="space-y-3">
                                {selected.location && (
                                    <div className="bg-eco-50 border border-eco-100 p-3 rounded-xl flex items-start gap-2">
                                        <span className="text-lg">📍</span>
                                        <div>
                                            <p className="text-xs font-semibold text-eco-700 uppercase tracking-wide mb-0.5">Where to Find in Pune</p>
                                            <p className="text-sm text-gray-700">{selected.location}</p>
                                        </div>
                                    </div>
                                )}
                                {selected.habitat && (
                                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2">
                                        <span className="text-lg">🏕️</span>
                                        <div>
                                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Habitat</p>
                                            <p className="text-sm text-gray-700">{selected.habitat}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setSelected(null)}
                                className="btn-primary w-full mt-5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
