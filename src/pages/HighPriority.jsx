import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SEVERITY_CONFIG = {
    Low:      { color: 'bg-green-100 text-green-800 border-green-200',  dot: 'bg-green-500',  badge: '🟢', ring: 'ring-green-400' },
    Medium:   { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500', badge: '🟡', ring: 'ring-yellow-400' },
    High:     { color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', badge: '🟠', ring: 'ring-orange-400' },
    Critical: { color: 'bg-red-100 text-red-800 border-red-200',        dot: 'bg-red-500',    badge: '🔴', ring: 'ring-red-400' },
};

const CATEGORY_EMOJI = {
    'Illegal Tree Cutting': '🌳',
    'Wildlife Activity': '🐆',
    'Garbage Dumping': '🗑️',
    'Landslide Risk Zone': '⛰️',
    'Forest Fire': '🔥',
    'Other': '🌿',
};

function daysSince(dateStr) {
    const ms = Date.now() - new Date(dateStr).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function getPressureBadge(days, severity) {
    if (severity === 'Critical' || days > 14) return { icon: '🔥', label: 'Public Concern', cls: 'bg-red-50 text-red-700 border-red-200' };
    if (severity === 'High' || days > 7) return { icon: '🚨', label: 'Critical Delay', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { icon: '⚠️', label: 'Needs Attention', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
}

// ── Proof of Work display ─────────────────────────────────────────
function ProofBadge({ proof }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-green-800 w-full text-left"
            >
                <span>✅</span>
                <span>Work Done by {proof.submitted_by}</span>
                <span className="ml-auto text-green-600 text-xs">{open ? '▲ Hide' : '▼ View'}</span>
            </button>
            {open && (
                <div className="mt-3 space-y-2 animate-fade-in">
                    {proof.photo_url && (
                        <a href={proof.photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                                src={proof.photo_url}
                                alt="Proof of work"
                                className="w-full max-h-48 object-cover rounded-lg border border-green-300 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                            />
                        </a>
                    )}
                    {proof.notes && (
                        <p className="text-xs text-green-900 leading-relaxed bg-white rounded-lg p-2 border border-green-100">
                            📝 {proof.notes}
                        </p>
                    )}
                    <p className="text-xs text-green-600">
                        Submitted {new Date(proof.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Track Report Card ─────────────────────────────────────────────
function TrackReport() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    async function handleSearch(e) {
        e.preventDefault();
        const cleaned = query.trim().toUpperCase().replace('BW-', '');
        const num = parseInt(cleaned, 10);
        if (!cleaned || isNaN(num)) {
            setError('Enter a valid Report ID (e.g. BW-1001 or just 1001)');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        setProofs([]);
        setSearched(false);

        try {
            const { data: rep, error: repErr } = await supabase
                .from('reports')
                .select('id, report_number, category, description, status, severity_level, created_at, latitude, longitude')
                .eq('report_number', num)
                .single();

            if (repErr || !rep) {
                setError(`No report found with ID BW-${num}. Double-check your report ID.`);
                setSearched(true);
                setLoading(false);
                return;
            }

            setResult(rep);

            // Fetch proof submissions for this report
            const { data: proofData } = await supabase
                .from('proof_submissions')
                .select('*')
                .eq('report_id', rep.id)
                .order('created_at', { ascending: false });

            setProofs(proofData || []);
        } catch (err) {
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
            setSearched(true);
        }
    }

    const STATUS_COLOR = {
        'Reported': 'bg-yellow-100 text-yellow-800',
        'Under Review': 'bg-blue-100 text-blue-800',
        'Verified': 'bg-green-100 text-green-800',
        'Forwarded': 'bg-purple-100 text-purple-800',
        'Closed': 'bg-gray-100 text-gray-700',
    };

    return (
        <div className="glass-card p-6 mb-8 border-l-4 border-l-eco-500">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔍</span>
                <div>
                    <h2 className="font-bold text-eco-900 text-lg">Track Your Report</h2>
                    <p className="text-sm text-gray-500">Enter your Report ID (e.g. <span className="font-mono">BW-1001</span>) to see the latest status and proof of work.</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="BW-1001 or just 1001"
                    className="input-field flex-1 font-mono"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-5 flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🔍'}
                    {loading ? '' : 'Search'}
                </button>
            </form>

            {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                    ⚠️ {error}
                </p>
            )}

            {searched && result && (
                <div className="mt-4 animate-fade-in">
                    <div className="bg-white border border-eco-200 rounded-2xl p-4 shadow-sm">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <span className="text-xs font-mono font-bold text-eco-600 bg-eco-50 px-2 py-0.5 rounded-lg">
                                    BW-{result.report_number}
                                </span>
                                <h3 className="font-bold text-eco-900 text-base mt-1">{result.category}</h3>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-lg font-semibold shrink-0 ${STATUS_COLOR[result.status] || 'bg-gray-100'}`}>
                                {result.status}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{result.description}</p>

                        {/* Timeline */}
                        <div className="flex items-center gap-1 mb-3">
                            {['Reported', 'Under Review', 'Verified', 'Forwarded', 'Closed'].map((s, i) => {
                                const statuses = ['Reported', 'Under Review', 'Verified', 'Forwarded', 'Closed'];
                                const currentIdx = statuses.indexOf(result.status);
                                const isPast = i <= currentIdx;
                                return (
                                    <div key={s} className="flex items-center flex-1">
                                        <div className={`w-3 h-3 rounded-full shrink-0 ${isPast ? 'bg-eco-500' : 'bg-eco-200'}`} />
                                        {i < 4 && <div className={`h-0.5 flex-1 ${isPast && i < currentIdx ? 'bg-eco-500' : 'bg-eco-100'}`} />}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mb-3">
                            {['Reported', 'Under Review', 'Verified', 'Forwarded', 'Closed'].map(s => (
                                <p key={s} className={`text-xs text-center leading-tight ${result.status === s ? 'text-eco-700 font-bold' : 'text-gray-400'}`} style={{ flex: 1 }}>
                                    {s}
                                </p>
                            ))}
                        </div>

                        {/* Proof of work */}
                        {proofs.length > 0 ? (
                            <div className="space-y-2">
                                {proofs.map(p => <ProofBadge key={p.id} proof={p} />)}
                            </div>
                        ) : result.status === 'Closed' ? (
                            <div className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-center">
                                This report is closed. No proof of work was submitted.
                            </div>
                        ) : (
                            <div className="mt-3 text-xs text-gray-400 bg-eco-50 rounded-xl p-3 text-center">
                                🕒 Your report is being worked on. Proof will appear here once volunteers or admins submit it.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HighPriority() {
    const [reports, setReports] = useState([]);
    const [resolvedReports, setResolvedReports] = useState([]);
    const [proofMap, setProofMap] = useState({});    // { [report_id]: proof[] }
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [searchParams] = useSearchParams();
    const highlightId = searchParams.get('id');
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    // Scroll to highlighted report if ?id= param is present
    useEffect(() => {
        if (highlightId && !loading) {
            const el = document.getElementById(`report-${highlightId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-eco-500');
                setTimeout(() => el.classList.remove('ring-4', 'ring-eco-500'), 3000);
            }
        }
    }, [highlightId, loading]);

    async function fetchReports() {
        try {
            // Active (open) high/critical/escalated reports
            const { data: active, error: e1 } = await supabase
                .from('reports')
                .select('id, report_number, category, description, latitude, longitude, severity_level, priority_score, status, media_flag, media_notes, created_at, public_visibility')
                .or('public_visibility.eq.true,severity_level.in.(High,Critical)')
                .neq('status', 'Closed')
                .order('priority_score', { ascending: false });

            if (e1) throw e1;

            // Recently resolved with proof
            const { data: resolved, error: e2 } = await supabase
                .from('reports')
                .select('id, report_number, category, description, latitude, longitude, severity_level, status, created_at')
                .eq('status', 'Closed')
                .order('created_at', { ascending: false })
                .limit(20);

            if (e2) throw e2;

            setReports(active || []);

            // Fetch proofs for all reports
            const allIds = [...(active || []).map(r => r.id), ...(resolved || []).map(r => r.id)];
            if (allIds.length > 0) {
                const { data: proofData } = await supabase
                    .from('proof_submissions')
                    .select('*')
                    .in('report_id', allIds)
                    .order('created_at', { ascending: false });

                const pMap = {};
                (proofData || []).forEach(p => {
                    if (!pMap[p.report_id]) pMap[p.report_id] = [];
                    pMap[p.report_id].push(p);
                });
                setProofMap(pMap);

                // Only show resolved reports that have proof
                setResolvedReports((resolved || []).filter(r => pMap[r.id]?.length > 0));
            } else {
                setResolvedReports([]);
            }
        } catch (err) {
            console.error('Failed to fetch high-priority reports:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleCopySummary(report) {
        const days = daysSince(report.created_at);
        const msg = `🚨 Urgent environmental issue reported in Pune!\n\n📍 Location: (${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)})\n🏷️ Category: ${report.category}\n⚠️ Severity: ${report.severity_level}\n📝 ${report.description}\n⏱️ Reported ${days} day(s) ago — Status: ${report.status}${report.report_number ? `\n🆔 Report ID: BW-${report.report_number}` : ''}\n\nView all alerts: ${window.location.origin}/high-priority\n\n#BioWatch #SaveNature #PuneEnvironment`;
        copyToClipboard(msg);
        setCopiedId(report.id + '_summary');
        setTimeout(() => setCopiedId(null), 2000);
    }

    function handleCopyLink(report) {
        const link = `${window.location.origin}/high-priority?id=${report.id}`;
        copyToClipboard(link);
        setCopiedId(report.id + '_link');
        setTimeout(() => setCopiedId(null), 2000);
    }

    const criticalCount = reports.filter(r => r.severity_level === 'Critical').length;
    const highCount = reports.filter(r => r.severity_level === 'High').length;
    const mediaCount = reports.filter(r => r.media_flag).length;

    function ReportCard({ report, isResolved = false }) {
        const sev = SEVERITY_CONFIG[report.severity_level] || SEVERITY_CONFIG.Low;
        const days = daysSince(report.created_at);
        const pressure = getPressureBadge(days, report.severity_level);
        const emoji = CATEGORY_EMOJI[report.category] || '🌿';
        const reportProofs = proofMap[report.id] || [];

        return (
            <div
                key={report.id}
                id={`report-${report.id}`}
                className={`glass-card p-5 border-l-4 transition-all duration-300 ${
                    isResolved ? 'border-l-green-500' :
                    report.severity_level === 'Critical' ? 'border-l-red-500' :
                    report.severity_level === 'High' ? 'border-l-orange-500' :
                    report.severity_level === 'Medium' ? 'border-l-yellow-500' :
                    'border-l-green-500'
                }`}
            >
                {/* Top row: severity + media + pressure */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {report.report_number && (
                        <span className="text-xs font-mono font-bold text-eco-600 bg-eco-50 border border-eco-200 px-2 py-0.5 rounded-lg">
                            BW-{report.report_number}
                        </span>
                    )}
                    <span className={`badge border ${sev.color} font-semibold`}>
                        {sev.badge} {report.severity_level}
                    </span>
                    {report.media_flag && (
                        <span className="badge bg-purple-100 text-purple-800 border border-purple-200">
                            📢 Media Alert
                        </span>
                    )}
                    {isResolved ? (
                        <span className="badge bg-green-100 text-green-800 border border-green-200 ml-auto">
                            ✅ Resolved
                        </span>
                    ) : (
                        <span className={`badge border ${pressure.cls} ml-auto`}>
                            {pressure.icon} {pressure.label}
                        </span>
                    )}
                </div>

                {/* Category + title */}
                <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{emoji}</span>
                    <div>
                        <h3 className="font-bold text-eco-900 text-base leading-tight">{report.category}</h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-3">{report.description}</p>
                    </div>
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>📍</span>
                        <span>{report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500">⏱️ <strong className="text-gray-700">{days} day{days !== 1 ? 's' : ''}</strong> {isResolved ? 'ago' : 'pending'}</span>
                        {report.priority_score > 0 && (
                            <span className="text-gray-500">🎯 Priority: <strong className="text-eco-700">{report.priority_score}</strong></span>
                        )}
                        <span className={`badge ${
                            report.status === 'Reported' ? 'badge-reported' :
                            report.status === 'Under Review' ? 'badge-review' :
                            report.status === 'Verified' ? 'badge-verified' :
                            report.status === 'Forwarded' ? 'badge-forwarded' : 'badge-closed'
                        }`}>{report.status}</span>
                    </div>
                    {report.media_notes && (
                        <div className="flex items-start gap-2 bg-purple-50 rounded-lg p-2 border border-purple-100">
                            <span className="text-purple-500 text-xs shrink-0 mt-0.5">📋</span>
                            <p className="text-xs text-purple-800 leading-relaxed">{report.media_notes}</p>
                        </div>
                    )}
                </div>

                {/* Proof of Work section */}
                {reportProofs.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {reportProofs.map(p => <ProofBadge key={p.id} proof={p} />)}
                    </div>
                )}

                {/* Action buttons (only on active reports) */}
                {!isResolved && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => handleCopySummary(report)}
                            className="flex-1 text-xs px-3 py-2 bg-eco-600 text-white rounded-xl hover:bg-eco-700 transition-all font-medium flex items-center justify-center gap-1.5"
                        >
                            {copiedId === report.id + '_summary' ? '✅ Copied!' : '📋 Copy Report Summary'}
                        </button>
                        <button
                            onClick={() => handleCopyLink(report)}
                            className="flex-1 text-xs px-3 py-2 bg-white border border-eco-200 text-eco-700 rounded-xl hover:bg-eco-50 transition-all font-medium flex items-center justify-center gap-1.5"
                        >
                            {copiedId === report.id + '_link' ? '✅ Copied!' : '🔗 Copy Share Link'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl animate-pulse">🚨</span>
                    <h1 className="section-title mb-0">High Priority Alerts</h1>
                </div>
                <p className="section-subtitle">
                    Environmental issues requiring immediate public attention in Pune
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Alerts', value: reports.length, icon: '📊', color: 'text-eco-600' },
                    { label: 'Critical', value: criticalCount, icon: '🔴', color: 'text-red-600' },
                    { label: 'High Priority', value: highCount, icon: '🟠', color: 'text-orange-600' },
                    { label: 'Media Escalated', value: mediaCount, icon: '📢', color: 'text-purple-600' },
                ].map((stat, i) => (
                    <div key={i} className="stat-card text-center">
                        <span className="text-2xl">{stat.icon}</span>
                        <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Track Report section ── */}
            <TrackReport />

            {/* ── Active Reports ── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card animate-pulse">
                            <div className="h-4 bg-eco-200 rounded w-1/3 mb-3"></div>
                            <div className="h-3 bg-eco-100 rounded w-full mb-2"></div>
                            <div className="h-3 bg-eco-100 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-6xl">✅</span>
                    <p className="text-gray-500 text-lg mt-4">No high-priority alerts right now.</p>
                    <p className="text-gray-400 text-sm mt-2">All critical issues have been addressed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map(report => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}

            {/* ── Recently Resolved with Proof ── */}
            {!loading && resolvedReports.length > 0 && (
                <div className="mt-12">
                    <button
                        onClick={() => setShowResolved(s => !s)}
                        className="flex items-center gap-3 mb-6 group"
                    >
                        <div className="h-px flex-1 bg-eco-200" />
                        <span className="flex items-center gap-2 text-sm font-semibold text-eco-700 bg-eco-50 border border-eco-200 px-4 py-2 rounded-full group-hover:bg-eco-100 transition-colors whitespace-nowrap">
                            ✅ Recently Resolved ({resolvedReports.length})
                            <span className="text-eco-500">{showResolved ? '▲' : '▼'}</span>
                        </span>
                        <div className="h-px flex-1 bg-eco-200" />
                    </button>
                    {showResolved && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            {resolvedReports.map(report => (
                                <ReportCard key={report.id} report={report} isResolved={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Footer note */}
            <div className="mt-10 glass-card p-5 bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800 leading-relaxed">
                    <span className="font-bold">ℹ️ About this page:</span> This page shows reports marked as High or Critical severity, or reports escalated to media by admins. Use the <strong>Track Report</strong> tool above to look up your complaint by ID. Proof of work uploaded by volunteers and admins will be visible here once submitted.
                </p>
            </div>
        </div>
    );
}
