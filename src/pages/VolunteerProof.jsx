import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function VolunteerProof() {
    const [step, setStep] = useState('search'); // 'search' | 'submit' | 'success'
    const [volunteers, setVolunteers] = useState([]);
    const [selectedVol, setSelectedVol] = useState(null);
    const [assignedReport, setAssignedReport] = useState(null);
    const [loadingVols, setLoadingVols] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [searchName, setSearchName] = useState('');

    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [proofNotes, setProofNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const fileRef = useRef(null);

    useEffect(() => {
        fetchVolunteers();
    }, []);

    async function fetchVolunteers() {
        try {
            const { data } = await supabase
                .from('volunteers')
                .select('id, name, contact, interest_area, assigned_report_id')
                .not('assigned_report_id', 'is', null)
                .order('name');
            setVolunteers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingVols(false);
        }
    }

    async function selectVolunteer(vol) {
        setSelectedVol(vol);
        setAssignedReport(null);
        setLoadingReport(true);
        try {
            const { data } = await supabase
                .from('reports')
                .select('id, report_number, category, description, status, severity_level, created_at, latitude, longitude')
                .eq('id', vol.assigned_report_id)
                .single();
            setAssignedReport(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReport(false);
            setStep('submit');
        }
    }

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
        if (!proofFile && !proofNotes.trim()) {
            setUploadError('Please upload a photo or add a note describing the work done.');
            return;
        }
        setUploading(true);
        setUploadError('');
        let photoUrl = null;

        // ── Upload photo to Supabase Storage ──────────────────────
        if (proofFile) {
            try {
                const ext = proofFile.name.split('.').pop();
                // Use a folder path so storage policies apply cleanly
                const fileName = `proof/${assignedReport.id}_${Date.now()}.${ext}`;

                const { error: uploadErr } = await supabase.storage
                    .from('report-images')
                    .upload(fileName, proofFile, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadErr) {
                    // Provide a friendly message instead of raw Supabase error
                    setUploadError(
                        `Photo upload failed: ${uploadErr.message}. ` +
                        `Make sure you ran add-proof-of-work.sql in Supabase to allow public uploads.`
                    );
                    setUploading(false);
                    return;
                }

                const { data: urlData } = supabase.storage
                    .from('report-images')
                    .getPublicUrl(fileName);
                photoUrl = urlData.publicUrl;
            } catch (err) {
                setUploadError(`Upload error: ${err.message}`);
                setUploading(false);
                return;
            }
        }

        // ── Insert proof_submissions row ───────────────────────────
        // The DB trigger (auto_close_report_on_proof) will automatically
        // set the report's status to 'Closed' via SECURITY DEFINER.
        try {
            const { error } = await supabase
                .from('proof_submissions')
                .insert({
                    report_id: assignedReport.id,
                    submitted_by: selectedVol.name,
                    role: 'volunteer',
                    photo_url: photoUrl,
                    notes: proofNotes.trim() || null,
                });

            if (error) throw error;

            // Update local state so the success screen shows "Closed"
            setAssignedReport(prev => ({ ...prev, status: 'Closed' }));
            setStep('success');
        } catch (err) {
            setUploadError(`Submission failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    }

    function reset() {
        setStep('search');
        setSelectedVol(null);
        setAssignedReport(null);
        setProofFile(null);
        setProofPreview(null);
        setProofNotes('');
        setUploadError('');
    }

    const filteredVols = searchName.trim()
        ? volunteers.filter(v => v.name.toLowerCase().includes(searchName.toLowerCase()))
        : volunteers;

    const SEVERITY_COLOR = {
        Low:      'bg-green-100 text-green-800',
        Medium:   'bg-yellow-100 text-yellow-800',
        High:     'bg-orange-100 text-orange-800',
        Critical: 'bg-red-100 text-red-800',
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="max-w-2xl mx-auto">

                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-eco-100 text-4xl mb-4 shadow-inner">
                        📸
                    </div>
                    <h1 className="section-title mb-2">Submit Proof of Work</h1>
                    <p className="section-subtitle">
                        Upload a photo or note to confirm the action you took on your assigned environmental report.
                        <br />
                        <span className="text-eco-600 font-medium">The report will be marked as Closed automatically.</span>
                    </p>
                </div>

                {/* ── Step: Search / Select Volunteer ── */}
                {step === 'search' && (
                    <div className="glass-card p-6 animate-slide-up">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-xl">🤝</span>
                            <h2 className="font-bold text-eco-900 text-lg">Find Your Name</h2>
                        </div>

                        <input
                            type="text"
                            placeholder="Search your name..."
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            className="input-field mb-4"
                        />

                        {loadingVols ? (
                            <div className="flex items-center gap-3 py-6 text-gray-400">
                                <div className="w-5 h-5 border-2 border-eco-500 border-t-transparent rounded-full animate-spin" />
                                Loading volunteers...
                            </div>
                        ) : filteredVols.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <span className="text-4xl">🔍</span>
                                <p className="mt-3 font-medium">No volunteers found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {volunteers.length === 0
                                        ? 'No volunteers have been assigned to reports yet. Contact the admin.'
                                        : 'Try a different name search.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                {filteredVols.map(vol => (
                                    <button
                                        key={vol.id}
                                        onClick={() => selectVolunteer(vol)}
                                        className="w-full text-left px-4 py-3 rounded-xl border border-eco-200 hover:border-eco-500 hover:bg-eco-50 transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <p className="font-semibold text-eco-900">{vol.name}</p>
                                            <p className="text-xs text-gray-500">{vol.interest_area} · {vol.contact}</p>
                                        </div>
                                        <span className="text-eco-400 group-hover:text-eco-600 transition-colors text-lg">→</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Only volunteers with an assigned report are shown. Contact admin if you're not listed.
                        </p>
                    </div>
                )}

                {/* ── Step: Submit Proof ── */}
                {step === 'submit' && (
                    <div className="space-y-4 animate-slide-up">

                        {/* Back button */}
                        <button
                            onClick={() => { setStep('search'); setSelectedVol(null); }}
                            className="flex items-center gap-2 text-sm text-eco-600 hover:text-eco-800 transition-colors font-medium"
                        >
                            ← Back to volunteer list
                        </button>

                        {/* Volunteer card */}
                        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-l-eco-500">
                            <div className="w-12 h-12 rounded-xl bg-eco-100 flex items-center justify-center text-2xl shrink-0">
                                🤝
                            </div>
                            <div>
                                <p className="font-bold text-eco-900">{selectedVol?.name}</p>
                                <p className="text-sm text-gray-500">{selectedVol?.interest_area}</p>
                            </div>
                        </div>

                        {/* Assigned report card */}
                        {loadingReport ? (
                            <div className="glass-card p-6 flex items-center gap-3 text-gray-400">
                                <div className="w-5 h-5 border-2 border-eco-500 border-t-transparent rounded-full animate-spin" />
                                Loading assigned report...
                            </div>
                        ) : assignedReport ? (
                            <div className="glass-card p-4 border border-eco-200">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Assigned Report</p>
                                        <p className="font-bold text-eco-900">{assignedReport.category}</p>
                                        {assignedReport.report_number && (
                                            <p className="text-xs text-eco-600 font-mono font-semibold">
                                                BW-{assignedReport.report_number}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold shrink-0 ${SEVERITY_COLOR[assignedReport.severity_level] || 'bg-gray-100 text-gray-700'}`}>
                                        {assignedReport.severity_level}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">{assignedReport.description}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    📍 {assignedReport.latitude?.toFixed(4)}, {assignedReport.longitude?.toFixed(4)}
                                    &nbsp;·&nbsp; Status: <strong>{assignedReport.status}</strong>
                                </p>
                            </div>
                        ) : (
                            <div className="glass-card p-4 text-gray-400 text-sm">Report details not found.</div>
                        )}

                        {/* Upload form */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">📸</span>
                                <h3 className="font-bold text-eco-900">Upload Proof</h3>
                            </div>

                            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3 leading-relaxed">
                                📍 <strong>Tip:</strong> Use your phone camera to take a geotagged photo at the site. GPS coordinates embedded in the photo serve as verified proof of on-ground action. Submitting will automatically <strong>close this report</strong>.
                            </p>

                            {/* Photo upload */}
                            <div>
                                <label className="block text-sm font-semibold text-eco-900 mb-2">
                                    📷 Site Photo <span className="text-gray-400 font-normal">(recommended — geotagged)</span>
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
                                            <p className="text-xs text-gray-400">Click to change</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 py-4">
                                            <span className="text-5xl">📷</span>
                                            <p className="text-sm text-gray-500 mt-2">Click to upload site photo</p>
                                            <p className="text-xs text-gray-400">JPG, PNG, HEIC — max 10MB</p>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-eco-900 mb-2">
                                    📝 Work Summary <span className="text-gray-400 font-normal">(what did you do?)</span>
                                </label>
                                <textarea
                                    value={proofNotes}
                                    onChange={e => setProofNotes(e.target.value)}
                                    rows={3}
                                    className="input-field resize-none text-sm"
                                    placeholder="e.g. 'Removed 3 illegally dumped tires from Vetal Tekdi trail, area cleaned and photographed'"
                                />
                            </div>

                            {uploadError && (
                                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 leading-relaxed">
                                    <p className="font-semibold mb-1">⚠️ Error</p>
                                    <p>{uploadError}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={uploading}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>✅ Submit Proof &amp; Close Report</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step: Success ── */}
                {step === 'success' && (
                    <div className="glass-card p-10 text-center animate-slide-up">
                        <div className="text-7xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-2xl font-bold text-eco-900 mb-2">Proof Submitted!</h2>
                        <p className="text-gray-600 mb-3">
                            Thank you, <strong>{selectedVol?.name}</strong>! Your proof of work has been recorded.
                        </p>

                        {/* Report Closed badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-xl text-green-800 font-semibold text-sm mb-4">
                            ✅ Report <span className="font-mono">{assignedReport?.report_number ? `BW-${assignedReport.report_number}` : ''}</span> is now <strong>CLOSED</strong>
                        </div>

                        <p className="text-sm text-gray-500 mb-5">
                            The reporter can now see your proof on the <strong>High Priority Alerts</strong> page by searching their Report ID.
                        </p>

                        {proofPreview && (
                            <img
                                src={proofPreview}
                                alt="Your submitted proof"
                                className="max-h-40 mx-auto rounded-2xl shadow-lg object-cover mb-6 border-4 border-eco-200"
                            />
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button onClick={reset} className="btn-secondary">
                                Submit Another
                            </button>
                            <a href="/high-priority" className="btn-primary">
                                View Public Alerts
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
