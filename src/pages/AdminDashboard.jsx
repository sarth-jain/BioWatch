import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { supabase } from '../lib/supabase';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const STATUS_OPTIONS = ['Reported', 'Under Review', 'Verified', 'Forwarded', 'Closed'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_BADGES = {
    'Reported':     'badge-reported',
    'Under Review': 'badge-review',
    'Verified':     'badge-verified',
    'Forwarded':    'badge-forwarded',
    'Closed':       'badge-closed',
};

const SEVERITY_STYLES = {
    Low:      { badge: 'bg-green-100 text-green-800 border-green-200',   row: '',               icon: '🟢' },
    Medium:   { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', row: 'bg-yellow-50/20', icon: '🟡' },
    High:     { badge: 'bg-orange-100 text-orange-800 border-orange-200', row: 'bg-orange-50/30', icon: '🟠' },
    Critical: { badge: 'bg-red-100 text-red-800 border-red-200',          row: 'bg-red-50/30',   icon: '🔴' },
};

function daysSince(dateStr) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ── Escalation Modal ─────────────────────────────────────────────
function EscalationModal({ report, onConfirm, onClose }) {
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleConfirm() {
        setSaving(true);
        await onConfirm(report.id, notes);
        setSaving(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">📢</span>
                    <div>
                        <h3 className="font-bold text-eco-900 text-lg">Escalate to Media</h3>
                        <p className="text-sm text-gray-500">This will make the report publicly visible</p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                    <strong>⚠️ Report:</strong> {report.category} — {report.description?.substring(0, 80)}...
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-eco-900 mb-2">Media Notes <span className="text-gray-400">(optional)</span></label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        className="input-field resize-none text-sm"
                        placeholder="Add context for media, e.g. 'Urgent — forest fire risk near residential area'"
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="flex-1 text-sm px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Escalating...' : '🚨 Escalate Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Notify Volunteers Modal ──────────────────────────────────────
function NotifyModal({ report, onClose }) {
    const [copied, setCopied] = useState(false);
    const days = daysSince(report.created_at);
    const msg = `🚨 URGENT — Volunteer Action Needed!\n\nCategory: ${report.category}\nSeverity: ${report.severity_level || 'Not set'}\nLocation: (${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)})\nDescription: ${report.description}\nDays Pending: ${days}\nStatus: ${report.status}\n\nPlease respond via BioWatch as soon as possible.\n#BioWatch #PuneEnvironment`;

    function copy() {
        if (navigator.clipboard) navigator.clipboard.writeText(msg);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🔔</span>
                    <h3 className="font-bold text-eco-900 text-lg">Notify Volunteers</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">Copy this pre-formatted message to share via WhatsApp, email, or SMS:</p>
                <pre className="bg-eco-50 border border-eco-200 rounded-xl p-3 text-xs text-eco-900 whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">{msg}</pre>
                <div className="flex gap-3">
                    <button onClick={onClose} className="btn-secondary flex-1 text-sm">Close</button>
                    <button onClick={copy} className="flex-1 text-sm px-4 py-2.5 bg-eco-600 text-white rounded-xl font-semibold hover:bg-eco-700 transition-all">
                        {copied ? '✅ Copied!' : '📋 Copy Message'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Proof of Work Modal ──────────────────────────────────────────
function ProofOfWorkModal({ report, onSubmitAndClose, onSkipAndClose, onCancel }) {
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [proofNotes, setProofNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileRef = useRef(null);

    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File must be under 10MB.');
            return;
        }
        setUploadError('');
        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
    }

    async function handleSubmit() {
        setUploading(true);
        setUploadError('');
        let proofUrl = null;

        if (proofFile) {
            try {
                const ext = proofFile.name.split('.').pop();
                const fileName = `proof_${report.id}_${Date.now()}.${ext}`;
                const { error: uploadErr } = await supabase.storage
                    .from('report-images')
                    .upload(fileName, proofFile);

                if (uploadErr) {
                    setUploadError(`Image upload failed: ${uploadErr.message}`);
                    setUploading(false);
                    return;
                }
                const { data: urlData } = supabase.storage
                    .from('report-images')
                    .getPublicUrl(fileName);
                proofUrl = urlData.publicUrl;
            } catch (err) {
                setUploadError('Upload error. Please try again.');
                setUploading(false);
                return;
            }
        }

        await onSubmitAndClose(report.id, proofUrl, proofNotes);
        setUploading(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📸</span>
                    <div>
                        <h3 className="font-bold text-eco-900 text-lg">Upload Proof of Work</h3>
                        <p className="text-sm text-gray-500">Closing: <strong>{report.category}</strong></p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mb-5 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-3">
                    📍 <strong>Tip:</strong> Upload photos taken at the site with your phone — geotagged photos automatically embed GPS coordinates in their metadata. This acts as verified proof of on-ground action.
                </p>

                {/* Photo Upload */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-eco-900 mb-2">
                        📷 Proof Photo <span className="text-gray-400 font-normal">(photo with geotag recommended)</span>
                    </label>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                            proofFile ? 'border-eco-400 bg-eco-50' : 'border-gray-300 hover:border-eco-400 hover:bg-eco-50'
                        }`}
                    >
                        {proofPreview ? (
                            <div className="space-y-2">
                                <img src={proofPreview} alt="Proof preview" className="max-h-48 mx-auto rounded-xl shadow-md object-cover" />
                                <p className="text-xs text-eco-600 font-medium">✅ {proofFile.name}</p>
                                <p className="text-xs text-gray-400">Click to change photo</p>
                            </div>
                        ) : (
                            <div className="space-y-2 py-4">
                                <span className="text-5xl">📷</span>
                                <p className="text-sm text-gray-500 mt-2">Click to upload proof photo</p>
                                <p className="text-xs text-gray-400">JPG, PNG, HEIC — max 10MB</p>
                            </div>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    {uploadError && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">⚠️ {uploadError}</p>
                    )}
                </div>

                {/* Notes */}
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-eco-900 mb-2">
                        📝 Work Summary <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                        value={proofNotes}
                        onChange={e => setProofNotes(e.target.value)}
                        rows={3}
                        className="input-field resize-none text-sm"
                        placeholder="Describe the action taken, e.g. 'Tree planting completed at Vetal Tekdi, 50 saplings planted by volunteer team'"
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {uploading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading & Closing...</>
                        ) : (
                            <>✅ Submit Proof &amp; Close Report</>
                        )}
                    </button>
                    <button
                        onClick={() => onSkipAndClose(report.id)}
                        disabled={uploading}
                        className="btn-secondary w-full text-sm disabled:opacity-50"
                    >
                        ⏭️ Skip Proof &amp; Close Anyway
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={uploading}
                        className="text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────
export default function AdminDashboard() {
    const [reports, setReports] = useState([]);
    const [proofMap, setProofMap] = useState({});   // { [report_id]: proof[] }
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [escalationTarget, setEscalationTarget] = useState(null);
    const [notifyTarget, setNotifyTarget] = useState(null);
    const [closingReport, setClosingReport] = useState(null);
    const [addProofReport, setAddProofReport] = useState(null);  // for adding proof to already-closed reports
    const [tableFilter, setTableFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    async function fetchReports() {
        try {
            const [repRes, proofRes] = await Promise.all([
                supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('proof_submissions')
                    .select('*')
                    .order('created_at', { ascending: false }),
            ]);

            if (repRes.error) throw repRes.error;

            const enriched = (repRes.data || []).map(r => ({
                ...r,
                severity_level: r.severity_level || 'Low',
            }));
            setReports(enriched);

            // Build proof map: report_id -> proof[]
            const pMap = {};
            (proofRes.data || []).forEach(p => {
                if (!pMap[p.report_id]) pMap[p.report_id] = [];
                pMap[p.report_id].push(p);
            });
            setProofMap(pMap);
        } catch (err) {
            console.error('Fetch reports failed:', err);
        } finally {
            setLoading(false);
        }
    }

    // ── Status update — intercepts "Closed" to show PoW modal ────
    async function handleStatusDropdownChange(report, newStatus) {
        if (newStatus === 'Closed' && report.status !== 'Closed') {
            setClosingReport(report);
            return;
        }
        await updateStatus(report.id, newStatus);
    }

    async function updateStatus(id, newStatus) {
        setUpdatingId(id + '_status');
        setUpdateError('');
        setUpdateSuccess('');
        try {
            const { data, error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Update blocked — check your admin role in Supabase.');

            setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
            setUpdateSuccess(`Status updated to "${newStatus}"`);
            setTimeout(() => setUpdateSuccess(''), 3000);
        } catch (err) {
            setUpdateError(`Status update failed: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    }

    // ── Severity update — ONLY updates severity_level ────────────
    async function updateSeverity(id, newSeverity) {
        setUpdatingId(id + '_severity');
        setUpdateError('');
        try {
            const { data, error } = await supabase
                .from('reports')
                .update({ severity_level: newSeverity })
                .eq('id', id)
                .select('id, severity_level');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Update blocked — check your admin role in Supabase.');

            setReports(prev => prev.map(r => r.id === id ? { ...r, severity_level: newSeverity } : r));
            setUpdateSuccess(`Severity updated to "${newSeverity}"`);
            setTimeout(() => setUpdateSuccess(''), 2500);
        } catch (err) {
            setUpdateError(`Severity update failed: ${err.message}. Make sure you ran fix-severity-columns.sql in Supabase.`);
        } finally {
            setUpdatingId(null);
        }
    }

    // ── Escalation — only updates columns guaranteed to exist ─────
    async function handleEscalate(id, notes) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .update({
                    media_flag: true,
                    public_visibility: true,
                    media_notes: notes || null,
                    media_shared_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Update blocked — check your admin role in Supabase.');

            setReports(prev => prev.map(r => r.id === id ? {
                ...r,
                media_flag: true,
                public_visibility: true,
                media_notes: notes || null,
            } : r));
            setEscalationTarget(null);
            setUpdateSuccess('Report escalated to media successfully.');
            setTimeout(() => setUpdateSuccess(''), 3000);
        } catch (err) {
            setUpdateError(`Escalation failed: ${err.message}. Make sure you ran fix-severity-columns.sql in Supabase.`);
            setEscalationTarget(null);
        }
    }

    // ── Proof of Work: submit proof then close ───────────────────
    async function handleSubmitProofAndClose(id, proofUrl, proofNotes) {
        setUpdateError('');
        try {
            const updates = { status: 'Closed' };
            const { data, error } = await supabase
                .from('reports')
                .update(updates)
                .eq('id', id)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Update blocked — check your admin role in Supabase.');

            // Also insert into proof_submissions
            if (proofUrl || proofNotes) {
                await supabase.from('proof_submissions').insert({
                    report_id: id,
                    submitted_by: 'Admin',
                    role: 'admin',
                    photo_url: proofUrl || null,
                    notes: proofNotes || null,
                });
            }

            setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
            setProofMap(prev => {
                const existing = prev[id] || [];
                const newEntry = proofUrl || proofNotes ? [{ submitted_by: 'Admin', role: 'admin', photo_url: proofUrl, notes: proofNotes, created_at: new Date().toISOString() }] : [];
                return { ...prev, [id]: [...newEntry, ...existing] };
            });
            setClosingReport(null);
            setAddProofReport(null);
            setUpdateSuccess('Report closed with proof of work uploaded. ✅');
            setTimeout(() => setUpdateSuccess(''), 4000);
        } catch (err) {
            setUpdateError(`Failed to close report: ${err.message}`);
            setClosingReport(null);
            setAddProofReport(null);
        }
    }

    // ── Add proof to already-closed report (no status change) ────
    async function handleAddProofOnly(id, proofUrl, proofNotes) {
        setUpdateError('');
        try {
            if (!proofUrl && !proofNotes) {
                setAddProofReport(null);
                return;
            }
            const { error } = await supabase.from('proof_submissions').insert({
                report_id: id,
                submitted_by: 'Admin',
                role: 'admin',
                photo_url: proofUrl || null,
                notes: proofNotes || null,
            });
            if (error) throw error;

            setProofMap(prev => {
                const existing = prev[id] || [];
                const newEntry = { submitted_by: 'Admin', role: 'admin', photo_url: proofUrl, notes: proofNotes, created_at: new Date().toISOString() };
                return { ...prev, [id]: [newEntry, ...existing] };
            });
            setAddProofReport(null);
            setUpdateSuccess('Proof of work added successfully. ✅');
            setTimeout(() => setUpdateSuccess(''), 3000);
        } catch (err) {
            setUpdateError(`Failed to add proof: ${err.message}`);
            setAddProofReport(null);
        }
    }

    // ── Skip proof, just close ───────────────────────────────────
    async function handleSkipProofAndClose(id) {
        setClosingReport(null);
        await updateStatus(id, 'Closed');
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/admin/login');
    }

    function exportCSV() {
        import('papaparse').then(Papa => {
            const csv = Papa.default.unparse(reports.map(r => ({
                ID: r.id,
                Category: r.category,
                Description: r.description,
                Status: r.status,
                Severity: r.severity_level,
                Media_Escalated: r.media_flag ? 'Yes' : 'No',
                Latitude: r.latitude,
                Longitude: r.longitude,
                Reporter: r.reporter_name || 'Anonymous',
                Contact: r.reporter_contact || 'N/A',
                PMC_Flag: r.pmc_flag ? 'Yes' : 'No',
                Proof_URL: r.proof_of_work_url || '',
                Date: new Date(r.created_at).toLocaleString(),
            })));
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `biowatch-reports-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Filtered reports for table
    const filteredReports = tableFilter === 'High Priority'
        ? reports.filter(r => r.severity_level === 'High' || r.severity_level === 'Critical' || r.media_flag)
        : tableFilter === 'Media Escalated'
        ? reports.filter(r => r.media_flag)
        : reports;

    // Chart data
    const categoryCounts = {};
    const statusCounts = {};
    const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    reports.forEach(r => {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        if (r.severity_level) severityCounts[r.severity_level] = (severityCounts[r.severity_level] || 0) + 1;
    });

    const barData = {
        labels: Object.keys(categoryCounts),
        datasets: [{ label: 'Reports', data: Object.values(categoryCounts), backgroundColor: ['#16a34a', '#d97706', '#dc2626', '#ea580c', '#be123c', '#0891b2'], borderRadius: 8 }],
    };
    const doughnutData = {
        labels: Object.keys(statusCounts),
        datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#6b7280'] }],
    };
    const sevBarData = {
        labels: ['Low', 'Medium', 'High', 'Critical'],
        datasets: [{ label: 'Count', data: [severityCounts.Low, severityCounts.Medium, severityCounts.High, severityCounts.Critical], backgroundColor: ['#16a34a', '#ca8a04', '#ea580c', '#dc2626'], borderRadius: 8 }],
    };

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-eco-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-eco-700 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const criticalCount = reports.filter(r => r.severity_level === 'Critical' && r.status !== 'Closed').length;
    const highCount = reports.filter(r => r.severity_level === 'High' && r.status !== 'Closed').length;
    const mediaCount = reports.filter(r => r.media_flag).length;

    return (
        <div className="page-container animate-fade-in">

            {/* ── Modals ── */}
            {escalationTarget && (
                <EscalationModal
                    report={escalationTarget}
                    onConfirm={handleEscalate}
                    onClose={() => setEscalationTarget(null)}
                />
            )}
            {notifyTarget && (
                <NotifyModal
                    report={notifyTarget}
                    onClose={() => setNotifyTarget(null)}
                />
            )}
            {closingReport && (
                <ProofOfWorkModal
                    report={closingReport}
                    onSubmitAndClose={handleSubmitProofAndClose}
                    onSkipAndClose={handleSkipProofAndClose}
                    onCancel={() => setClosingReport(null)}
                />
            )}
            {/* "Add proof" to an already-closed report */}
            {addProofReport && (
                <ProofOfWorkModal
                    report={addProofReport}
                    onSubmitAndClose={handleAddProofOnly}
                    onSkipAndClose={() => setAddProofReport(null)}
                    onCancel={() => setAddProofReport(null)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="section-title">🛡️ Admin Dashboard</h1>
                    <p className="text-gray-600">Manage reports, severity, escalations &amp; volunteers</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/admin/biodiversity" className="btn-secondary text-sm">🌿 Biodiversity</Link>
                    <Link to="/admin/volunteers" className="btn-secondary text-sm">🤝 Volunteers</Link>
                    <Link to="/admin/official-resources" className="btn-secondary text-sm">🏛️ Official Resources</Link>
                    <button onClick={handleLogout} className="btn-danger text-sm">Logout</button>
                </div>
            </div>

            {/* Feedback banners */}
            {updateError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                    <span className="text-lg shrink-0">⚠️</span>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">Error</p>
                        <p className="text-xs mt-1">{updateError}</p>
                    </div>
                    <button onClick={() => setUpdateError('')} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
                </div>
            )}
            {updateSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2">
                    <span>✅</span> {updateSuccess}
                </div>
            )}

            {/* Critical alert banner */}
            {criticalCount > 0 && (
                <div className="mb-6 p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3 shadow-lg">
                    <span className="text-2xl animate-pulse">🚨</span>
                    <div className="flex-1">
                        <p className="font-bold">{criticalCount} unresolved Critical report{criticalCount > 1 ? 's' : ''}</p>
                        <p className="text-red-200 text-sm">Immediate action required.</p>
                    </div>
                    <button onClick={() => setTableFilter('High Priority')} className="text-xs px-3 py-1.5 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all">
                        View →
                    </button>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                    { label: 'Total', value: reports.length, icon: '📊', color: 'text-eco-600' },
                    { label: 'Open', value: reports.filter(r => r.status !== 'Closed').length, icon: '🔔', color: 'text-amber-600' },
                    { label: 'Closed', value: reports.filter(r => r.status === 'Closed').length, icon: '✅', color: 'text-green-600' },
                    { label: 'Critical', value: criticalCount, icon: '🔴', color: 'text-red-600' },
                    { label: 'High', value: highCount, icon: '🟠', color: 'text-orange-600' },
                    { label: 'Media', value: mediaCount, icon: '📢', color: 'text-purple-600' },
                ].map((stat, i) => (
                    <div key={i} className="stat-card text-center">
                        <span className="text-2xl">{stat.icon}</span>
                        <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-eco-900 mb-4">Reports by Category</h3>
                    <div className="h-56"><Bar data={barData} options={chartOptions} /></div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="font-bold text-eco-900 mb-4">Reports by Status</h3>
                    <div className="h-56"><Doughnut data={doughnutData} options={chartOptions} /></div>
                </div>
                <div className="glass-card p-6">
                    <h3 className="font-bold text-eco-900 mb-4">Reports by Severity</h3>
                    <div className="h-56"><Bar data={sevBarData} options={chartOptions} /></div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="glass-card overflow-hidden">
                {/* Table header controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-eco-100 gap-4">
                    <h3 className="font-bold text-eco-900 text-lg">All Reports</h3>
                    <div className="flex flex-wrap gap-2">
                        {['All', 'High Priority', 'Media Escalated'].map(f => (
                            <button
                                key={f}
                                onClick={() => setTableFilter(f)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${tableFilter === f
                                    ? f === 'High Priority' ? 'bg-orange-500 text-white'
                                    : f === 'Media Escalated' ? 'bg-purple-600 text-white'
                                    : 'bg-eco-600 text-white'
                                    : 'bg-eco-50 text-eco-700 hover:bg-eco-100 border border-eco-200'
                                }`}
                            >
                                {f === 'High Priority' ? '🚨 ' : f === 'Media Escalated' ? '📢 ' : ''}{f}
                            </button>
                        ))}
                        <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1">
                            📥 Export CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-eco-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">#ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Reporter</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Severity</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Days</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Proof</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-eco-100">
                            {filteredReports.map(report => {
                                const sevStyle = SEVERITY_STYLES[report.severity_level] || SEVERITY_STYLES.Low;
                                const days = daysSince(report.created_at);
                                const isUpdatingSeverity = updatingId === report.id + '_severity';
                                const isUpdatingStatus = updatingId === report.id + '_status';
                                const reportProofs = proofMap[report.id] || [];

                                return (
                                    <tr
                                        key={report.id}
                                        className={`transition-colors hover:brightness-95 ${sevStyle.row} ${report.media_flag ? 'border-l-4 border-l-purple-400' : ''}`}
                                    >
                                        {/* Report ID */}
                                        <td className="px-4 py-3">
                                            {report.report_number ? (
                                                <span className="text-xs font-mono font-bold text-eco-600 bg-eco-50 border border-eco-200 px-2 py-1 rounded-lg">
                                                    BW-{report.report_number}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-eco-900 text-sm">{report.category}</p>
                                            {report.media_flag && (
                                                <span className="text-xs text-purple-600 font-medium">📢 Media</span>
                                            )}
                                        </td>

                                        {/* Description */}
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px]">
                                            <p className="truncate">{report.description}</p>
                                        </td>

                                        {/* Reporter */}
                                        <td className="px-4 py-3 text-sm">
                                            <p className="text-eco-900 font-medium">{report.reporter_name || 'Anonymous'}</p>
                                            {report.reporter_contact && <p className="text-xs text-gray-500">{report.reporter_contact}</p>}
                                        </td>

                                        {/* Severity */}
                                        <td className="px-4 py-3">
                                            <select
                                                value={report.severity_level || 'Low'}
                                                onChange={e => updateSeverity(report.id, e.target.value)}
                                                disabled={isUpdatingSeverity}
                                                className={`text-xs border rounded-lg px-2 py-1.5 font-semibold focus:ring-2 focus:ring-eco-500 outline-none cursor-pointer transition-opacity ${sevStyle.badge} ${isUpdatingSeverity ? 'opacity-50' : ''}`}
                                            >
                                                {SEVERITY_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {isUpdatingSeverity && <p className="text-xs text-gray-400 mt-0.5">Saving...</p>}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <select
                                                value={report.status}
                                                onChange={e => handleStatusDropdownChange(report, e.target.value)}
                                                disabled={isUpdatingStatus}
                                                className={`text-xs border border-eco-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-eco-500 outline-none transition-opacity ${isUpdatingStatus ? 'opacity-50' : ''}`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            {isUpdatingStatus && <p className="text-xs text-gray-400 mt-0.5">Saving...</p>}
                                        </td>

                                        {/* Days Pending */}
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                                                report.status === 'Closed' ? 'bg-gray-100 text-gray-500' :
                                                days > 14 ? 'bg-red-100 text-red-700' :
                                                days > 7 ? 'bg-orange-100 text-orange-700' :
                                                days > 3 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {days}d
                                            </span>
                                        </td>

                                        {/* Proof of Work */}
                                        <td className="px-4 py-3">
                                            {reportProofs.length > 0 ? (
                                                <div className="space-y-1">
                                                    {reportProofs.slice(0, 1).map((pf, idx) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            {pf.photo_url && (
                                                                <a href={pf.photo_url} target="_blank" rel="noopener noreferrer">
                                                                    <img src={pf.photo_url} alt="Proof" className="w-8 h-8 rounded-lg object-cover border border-eco-200" />
                                                                </a>
                                                            )}
                                                            <div>
                                                                <p className="text-xs text-eco-700 font-medium">{pf.submitted_by}</p>
                                                                {reportProofs.length > 1 && (
                                                                    <p className="text-xs text-gray-400">+{reportProofs.length - 1} more</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5">
                                                {!report.media_flag ? (
                                                    <button
                                                        onClick={() => setEscalationTarget(report)}
                                                        className="text-xs px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium whitespace-nowrap"
                                                    >
                                                        📢 Escalate
                                                    </button>
                                                ) : (
                                                    <span className="text-xs px-2.5 py-1.5 bg-purple-100 text-purple-700 rounded-lg font-medium text-center whitespace-nowrap">
                                                        ✅ Escalated
                                                    </span>
                                                )}
                                                {(report.severity_level === 'High' || report.severity_level === 'Critical') && (
                                                    <button
                                                        onClick={() => setNotifyTarget(report)}
                                                        className="text-xs px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium whitespace-nowrap"
                                                    >
                                                        🔔 Notify
                                                    </button>
                                                )}
                                                {/* Add proof button — for closed reports without proof */}
                                                {report.status === 'Closed' && (
                                                    <button
                                                        onClick={() => setAddProofReport(report)}
                                                        className="text-xs px-2.5 py-1.5 bg-eco-100 text-eco-700 rounded-lg hover:bg-eco-200 transition-colors font-medium whitespace-nowrap"
                                                    >
                                                        📸 Add Proof
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredReports.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl">📋</span>
                            <p className="mt-2">No reports match this filter</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
