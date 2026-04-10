import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

const CATEGORY_CONFIG = {
    'Illegal Tree Cutting': { emoji: '🌳' },
    'Wildlife Activity':    { emoji: '🐆' },
    'Garbage Dumping':      { emoji: '🗑️' },
    'Landslide Risk Zone':  { emoji: '⛰️' },
    'Forest Fire':          { emoji: '🔥' },
    'Other':                { emoji: '🌿' },
};

const SEVERITY_COLORS = {
    Low:      '#16a34a',  // green
    Medium:   '#ca8a04',  // yellow
    High:     '#ea580c',  // orange
    Critical: '#dc2626',  // red
};

const CATEGORY_FALLBACK_COLORS = {
    'Illegal Tree Cutting': '#16a34a',
    'Wildlife Activity':    '#d97706',
    'Garbage Dumping':      '#dc2626',
    'Landslide Risk Zone':  '#ea580c',
    'Forest Fire':          '#be123c',
    'Other':                '#0891b2',
};

const STATUS_BADGES = {
    'Reported':     'badge-reported',
    'Under Review': 'badge-review',
    'Verified':     'badge-verified',
    'Forwarded':    'badge-forwarded',
    'Closed':       'badge-closed',
};

const SEVERITY_BADGE = {
    Low:      'bg-green-100 text-green-800',
    Medium:   'bg-yellow-100 text-yellow-800',
    High:     'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
};

function createMarkerIcon(report) {
    const config = CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG['Other'];
    const color = report.severity_level
        ? SEVERITY_COLORS[report.severity_level] || SEVERITY_COLORS.Low
        : CATEGORY_FALLBACK_COLORS[report.category] || '#0891b2';

    const mediaRing = report.media_flag
        ? `box-shadow:0 0 0 3px #a855f7,0 2px 8px rgba(0,0,0,0.3);`
        : 'box-shadow:0 2px 8px rgba(0,0,0,0.3);';

    const mediaIcon = report.media_flag
        ? `<div style="position:absolute;top:-8px;right:-8px;font-size:10px;background:#a855f7;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;">📢</div>`
        : '';

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative;display:inline-block;">
                 <div style="background:${color};width:30px;height:30px;border-radius:50%;border:3px solid white;${mediaRing}display:flex;align-items:center;justify-content:center;font-size:14px">
                   ${config.emoji}
                 </div>
                 ${mediaIcon}
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16],
    });
}

export default function MapView() {
    const [reports, setReports] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        let result = reports;
        if (activeFilter !== 'All') {
            result = result.filter(r => r.category === activeFilter);
        }
        if (severityFilter !== 'All') {
            result = result.filter(r => r.severity_level === severityFilter);
        }
        setFiltered(result);
    }, [activeFilter, severityFilter, reports]);

    async function fetchReports() {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
            setFiltered(data || []);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    }

    const filterTabs = ['All', ...Object.keys(CATEGORY_CONFIG)];
    const severityTabs = ['All', 'Low', 'Medium', 'High', 'Critical'];

    return (
        <div className="page-container animate-fade-in">
            <h1 className="section-title">🗺️ Environmental Map</h1>
            <p className="section-subtitle">View all reported environmental issues across Pune</p>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
                {filterTabs.map(cat => {
                    const config = CATEGORY_CONFIG[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${activeFilter === cat
                                    ? 'bg-eco-600 text-white shadow-lg shadow-eco-600/30'
                                    : 'bg-white/80 text-gray-700 hover:bg-eco-100 border border-eco-200'
                                }`}
                        >
                            {config ? <span>{config.emoji}</span> : <span>🌍</span>}
                            {cat === 'All' ? `All (${reports.length})` : cat.split(' ').slice(-1)[0]}
                        </button>
                    );
                })}
            </div>

            {/* Severity Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs text-gray-500 font-medium self-center">Severity:</span>
                {severityTabs.map(sev => (
                    <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                            severityFilter === sev
                                ? sev === 'Critical' ? 'bg-red-600 text-white border-red-600'
                                : sev === 'High' ? 'bg-orange-500 text-white border-orange-500'
                                : sev === 'Medium' ? 'bg-yellow-500 text-white border-yellow-500'
                                : sev === 'Low' ? 'bg-green-600 text-white border-green-600'
                                : 'bg-eco-600 text-white border-eco-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {sev === 'Critical' ? '🔴' : sev === 'High' ? '🟠' : sev === 'Medium' ? '🟡' : sev === 'Low' ? '🟢' : '🌍'} {sev}
                    </button>
                ))}
            </div>

            {/* Map */}
            <div className="h-[580px] rounded-2xl overflow-hidden shadow-xl border-2 border-eco-200">
                {loading ? (
                    <div className="h-full flex items-center justify-center bg-eco-50">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-eco-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-eco-700">Loading map data...</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer center={[18.5204, 73.8567]} zoom={12} className="h-full w-full">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {filtered.map(report => (
                            <Marker
                                key={report.id}
                                position={[report.latitude, report.longitude]}
                                icon={createMarkerIcon(report)}
                            >
                                <Popup>
                                    <div className="min-w-[240px] p-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">{CATEGORY_CONFIG[report.category]?.emoji || '🌿'}</span>
                                            <div>
                                                <h3 className="font-bold text-eco-900 text-sm leading-tight">{report.category}</h3>
                                                {report.severity_level && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_BADGE[report.severity_level] || 'bg-gray-100 text-gray-600'}`}>
                                                        {report.severity_level === 'Critical' ? '🔴' : report.severity_level === 'High' ? '🟠' : report.severity_level === 'Medium' ? '🟡' : '🟢'} {report.severity_level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-xs mb-2 leading-relaxed">{report.description}</p>
                                        {report.media_flag && (
                                            <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg mb-2">
                                                <span>📢</span> <span>Media Escalated</span>
                                            </div>
                                        )}
                                        {report.image_url && (
                                            <img src={report.image_url} alt="Report" className="w-full h-24 object-cover rounded-lg mb-2" />
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className={`badge ${STATUS_BADGES[report.status] || 'badge-reported'}`}>
                                                {report.status}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {report.priority_score > 0 && (
                                            <div className="mt-1.5 text-xs text-gray-500">🎯 Priority Score: <strong>{report.priority_score}</strong></div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4">
                    <h3 className="font-semibold text-eco-900 mb-3 text-sm">📂 Category Legend</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                            <div key={cat} className="flex items-center gap-1.5 text-xs">
                                <span>{config.emoji}</span>
                                <span className="text-gray-700">{cat.split(' ').slice(-1)[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-card p-4">
                    <h3 className="font-semibold text-eco-900 mb-3 text-sm">⚠️ Severity Legend</h3>
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                            <div key={sev} className="flex items-center gap-1.5 text-xs">
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }}></div>
                                <span className="text-gray-700">{sev}</span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-4 h-4 rounded-full border-2 border-purple-500" style={{ backgroundColor: '#9333ea' }}></div>
                            <span className="text-gray-700">📢 Media Alert</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                    const count = reports.filter(r => r.severity_level === sev).length;
                    const color = sev === 'Critical' ? 'text-red-600' : sev === 'High' ? 'text-orange-600' : sev === 'Medium' ? 'text-yellow-600' : 'text-green-600';
                    const icon = sev === 'Critical' ? '🔴' : sev === 'High' ? '🟠' : sev === 'Medium' ? '🟡' : '🟢';
                    return (
                        <div key={sev} className="glass-card p-3 text-center">
                            <span className="text-xl">{icon}</span>
                            <p className={`text-2xl font-bold mt-1 ${color}`}>{count}</p>
                            <p className="text-xs text-gray-500">{sev}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
