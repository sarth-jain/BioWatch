import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminVolunteers() {
    const [volunteers, setVolunteers] = useState([]);
    const [reports, setReports] = useState([]);
    const [proofReportIds, setProofReportIds] = useState(new Set()); // report IDs that have proof
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssigningId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [volRes, repRes, proofRes] = await Promise.all([
                supabase.from('volunteers').select('*').order('created_at', { ascending: false }),
                supabase.from('reports').select('id, category, description, status').neq('status', 'Closed'),
                supabase.from('proof_submissions').select('report_id'),
            ]);
            setVolunteers(volRes.data || []);
            setReports(repRes.data || []);
            // Build a Set of report IDs that have at least one proof submission
            const ids = new Set((proofRes.data || []).map(p => p.report_id));
            setProofReportIds(ids);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function assignReport(volunteerId, reportId) {
        setAssigningId(volunteerId);
        try {
            const { error } = await supabase
                .from('volunteers')
                .update({ assigned_report_id: reportId || null })
                .eq('id', volunteerId);

            if (error) throw error;
            setVolunteers(prev =>
                prev.map(v => v.id === volunteerId ? { ...v, assigned_report_id: reportId || null } : v)
            );
        } catch (err) { console.error(err); }
        finally { setAssigningId(null); }
    }

    if (loading) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="section-title">🤝 Manage Volunteers</h1>
                    <p className="text-gray-600">View registered volunteers and assign them to incidents</p>
                </div>
                <Link to="/admin/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="stat-card text-center">
                    <span className="text-2xl">👥</span>
                    <p className="text-3xl font-bold text-eco-600 mt-1">{volunteers.length}</p>
                    <p className="text-sm text-gray-500">Total Volunteers</p>
                </div>
                <div className="stat-card text-center">
                    <span className="text-2xl">✅</span>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {volunteers.filter(v => v.assigned_report_id).length}
                    </p>
                    <p className="text-sm text-gray-500">Assigned</p>
                </div>
                <div className="stat-card text-center">
                    <span className="text-2xl">🕐</span>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                        {volunteers.filter(v => !v.assigned_report_id).length}
                    </p>
                    <p className="text-sm text-gray-500">Available</p>
                </div>
                <div className="stat-card text-center">
                    <span className="text-2xl">📋</span>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{reports.length}</p>
                    <p className="text-sm text-gray-500">Open Reports</p>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-eco-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Interest</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Availability</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Assign to Report</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-eco-100">
                            {volunteers.map(vol => (
                                <tr key={vol.id} className="hover:bg-eco-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-eco-900 text-sm">{vol.name}</p>
                                        {vol.email && <p className="text-xs text-gray-500">{vol.email}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{vol.contact}</td>
                                    <td className="px-4 py-3">
                                        <span className="badge bg-eco-100 text-eco-800">{vol.interest_area}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{vol.availability}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={vol.assigned_report_id || ''}
                                            onChange={e => assignReport(vol.id, e.target.value)}
                                            disabled={assigningId === vol.id}
                                            className="text-xs border border-eco-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-eco-500 outline-none max-w-[180px]"
                                        >
                                            <option value="">Unassigned</option>
                                            {reports.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.category} - {r.description?.substring(0, 30)}...
                                                </option>
                                            ))}
                                        </select>
                                        {/* Proof badge */}
                                        {vol.assigned_report_id && proofReportIds.has(vol.assigned_report_id) && (
                                            <span className="mt-1.5 flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 font-medium">
                                                ✅ Proof Submitted
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {new Date(vol.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {volunteers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl">🤝</span>
                            <p className="mt-2">No volunteers registered yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
