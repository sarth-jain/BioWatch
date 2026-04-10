import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
    'Illegal Tree Cutting',
    'Wildlife Activity',
    'Garbage Dumping',
    'Landslide Risk Zone',
    'Forest Fire',
    'Other',
];

// Pans the map whenever the position changes (GPS / manual input)
function MapController({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom());
    }, [position, map]);
    return null;
}

function LocationPicker({ position, onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return position ? (
        <Marker
            position={position}
            icon={L.divIcon({
                className: 'custom-marker',
                html: '<div style="background:#059669;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            })}
        />
    ) : null;
}

export default function Report() {
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState({
        category: searchParams.get('category') || '',
        description: '',
        reporter_name: '',
        reporter_contact: '',
        pmc_flag: false,
        pmc_id: '',
    });
    const [position, setPosition] = useState(null);
    const [manualLat, setManualLat] = useState('');
    const [manualLng, setManualLng] = useState('');
    const [locationName, setLocationName] = useState('');
    const [geocoding, setGeocoding] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedReport, setSubmittedReport] = useState(null);
    const [error, setError] = useState('');
    const fileRef = useRef(null);
    const geocodeTimeout = useRef(null);

    // Match category from URL params
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            const match = CATEGORIES.find(c => c.toLowerCase().includes(cat.toLowerCase()));
            if (match) setForm(f => ({ ...f, category: match }));
        }
    }, [searchParams]);

    // Reverse geocode using Nominatim (free, no API key needed)
    const reverseGeocode = useCallback(async (lat, lng) => {
        setGeocoding(true);
        setLocationName('');
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
                setLocationName(data.display_name);
            }
        } catch {
            setLocationName('');
        } finally {
            setGeocoding(false);
        }
    }, []);

    // Debounce geocoding so we don't call on every keystroke
    const scheduleGeocode = useCallback((lat, lng) => {
        if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
        geocodeTimeout.current = setTimeout(() => reverseGeocode(lat, lng), 600);
    }, [reverseGeocode]);

    // Central function to update position + sync manual fields + trigger geocode
    function applyPosition(pos) {
        setPosition(pos);
        setManualLat(pos[0].toFixed(6));
        setManualLng(pos[1].toFixed(6));
        scheduleGeocode(pos[0], pos[1]);
    }

    // GPS fetch on button click
    function fetchGPS() {
        setGpsError('');
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser.');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                applyPosition([pos.coords.latitude, pos.coords.longitude]);
                setGpsLoading(false);
            },
            err => {
                setGpsLoading(false);
                if (err.code === 1) setGpsError('Location access denied. Please allow location permission or enter coordinates manually.');
                else if (err.code === 2) setGpsError('Your position is currently unavailable. Please enter coordinates manually.');
                else setGpsError('Could not fetch location. Please try again or enter manually.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

    // Manual coordinate input
    function handleManualCoords(e) {
        const { name, value } = e.target;
        if (name === 'manualLat') setManualLat(value);
        if (name === 'manualLng') setManualLng(value);

        const lat = name === 'manualLat' ? parseFloat(value) : parseFloat(manualLat);
        const lng = name === 'manualLng' ? parseFloat(value) : parseFloat(manualLng);

        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            setPosition([lat, lng]);
            scheduleGeocode(lat, lng);
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }

    function handleImage(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be under 5MB');
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.category) return setError('Please select a category');
        if (!form.description.trim()) return setError('Please add a description');
        if (!form.reporter_name.trim()) return setError('Please enter your full name');
        if (!form.reporter_contact.trim()) return setError('Please enter your contact number');
        if (!position) return setError('Please set a location — use GPS, enter coordinates, or click on the map');

        setSubmitting(true);

        try {
            let image_url = null;

            if (image) {
                try {
                    const ext = image.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
                    const { error: uploadErr } = await supabase.storage
                        .from('report-images')
                        .upload(fileName, image);

                    if (uploadErr) {
                        console.warn('Image upload failed:', uploadErr.message);
                    } else {
                        const { data: urlData } = supabase.storage
                            .from('report-images')
                            .getPublicUrl(fileName);
                        image_url = urlData.publicUrl;
                    }
                } catch (imgErr) {
                    console.warn('Image upload error:', imgErr);
                }
            }

            const { data: insertedData, error: insertErr } = await supabase
                .from('reports')
                .insert({
                    category: form.category,
                    description: form.description,
                    latitude: position[0],
                    longitude: position[1],
                    image_url,
                    is_anonymous: false,
                    reporter_name: form.reporter_name.trim(),
                    reporter_contact: form.reporter_contact.trim(),
                    pmc_flag: form.pmc_flag,
                    pmc_id: form.pmc_flag ? form.pmc_id : null,
                })
                .select('id, report_number, category')
                .single();

            if (insertErr) throw insertErr;
            setSubmittedReport(insertedData);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to submit report. Please try again.');
            console.error('Submit error:', err);
        } finally {
            setSubmitting(false);
        }
    }

    function resetForm() {
        setSubmitted(false);
        setSubmittedReport(null);
        setForm({ category: '', description: '', reporter_name: '', reporter_contact: '', pmc_flag: false, pmc_id: '' });
        setImage(null);
        setImagePreview(null);
        setPosition(null);
        setManualLat('');
        setManualLng('');
        setLocationName('');
        setGpsError('');
    }

    if (submitted) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="glass-card p-12 text-center max-w-md animate-slide-up">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-eco-900 mb-2">Report Submitted!</h2>

                    {/* Report ID badge */}
                    {submittedReport?.report_number && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-eco-100 border border-eco-300 rounded-xl text-eco-800 font-mono font-bold text-lg mb-4 shadow-inner">
                            <span>🆔</span> BW-{submittedReport.report_number}
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mb-1">
                        Save this ID to track your report status on the <strong>High Priority Alerts</strong> page.
                    </p>

                    <p className="text-gray-600 mb-6 mt-3">
                        Thank you for helping protect Pune's environment. Your report has been recorded and will be reviewed.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={resetForm} className="btn-primary">Submit Another</button>
                        <a href="/high-priority" className="btn-secondary">Track Status</a>
                    </div>
                </div>
            </div>
        );
    }

    const defaultCenter = [18.5204, 73.8567]; // Pune

    return (
        <div className="page-container animate-fade-in">
            <div className="max-w-4xl mx-auto">
                <h1 className="section-title">📢 Report an Issue</h1>
                <p className="section-subtitle">Help us protect Pune's environment. Your report takes less than a minute.</p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Left Column ── */}
                        <div className="space-y-5">

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-eco-900 mb-2">Category *</label>
                                <select name="category" value={form.category} onChange={handleChange} className="select-field">
                                    <option value="">Select a category...</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>

                                {/* Contextual PMC contact hint */}
                                {form.category && (() => {
                                    const HINTS = {
                                        'Illegal Tree Cutting': { icon: '🌳', dept: 'PMC Tree Authority', phone: '020-25501100', email: 'tree@punecorporation.org', color: 'bg-green-50 border-green-200 text-green-800' },
                                        'Wildlife Activity':    { icon: '🐆', dept: 'Wildlife SOS & Forest Dept', phone: '1926', email: null, color: 'bg-orange-50 border-orange-200 text-orange-800' },
                                        'Garbage Dumping':      { icon: '🗑️', dept: 'PMC Environment Department', phone: '020-25501300', email: 'environment@punecorporation.org', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                                        'Forest Fire':          { icon: '🔥', dept: 'PMC Control Room (Emergency)', phone: '18001030222', email: 'info@punecorporation.org', color: 'bg-red-50 border-red-200 text-red-800' },
                                        'Landslide Risk Zone':  { icon: '⛰️', dept: 'PMC Control Room', phone: '18001030222', email: null, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
                                        'Other':                { icon: '🏛️', dept: 'PMC Helpline (24×7)', phone: '18001030222', email: 'info@punecorporation.org', color: 'bg-gray-50 border-gray-200 text-gray-700' },
                                    };
                                    const hint = HINTS[form.category];
                                    if (!hint) return null;
                                    return (
                                        <div className={`mt-2 p-3 rounded-xl border text-xs leading-relaxed animate-fade-in ${hint.color}`}>
                                            <p className="font-bold mb-1">{hint.icon} Relevant Authority: {hint.dept}</p>
                                            <div className="flex flex-wrap gap-3">
                                                <a href={`tel:${hint.phone}`} className="font-mono hover:underline">📞 {hint.phone}</a>
                                                {hint.email && <a href={`mailto:${hint.email}`} className="hover:underline">✉️ {hint.email}</a>}
                                            </div>
                                            <a href="/official-resources" className="mt-1 inline-block hover:underline opacity-70">View all officials →</a>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-eco-900 mb-2">Description *</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="input-field resize-none"
                                    placeholder="Describe the issue in detail..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-eco-900 mb-2">📸 Upload Photo</label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-eco-300 rounded-xl p-6 text-center cursor-pointer hover:border-eco-500 hover:bg-eco-50 transition-all"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow" />
                                    ) : (
                                        <>
                                            <span className="text-4xl">📷</span>
                                            <p className="text-gray-500 text-sm mt-2">Click to upload (max 5MB)</p>
                                        </>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                            </div>

                            {/* Reporter Info */}
                            <div className="glass-card p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">👤</span>
                                    <p className="font-semibold text-eco-900">Reporter Information <span className="text-red-500">*</span></p>
                                </div>
                                <input
                                    name="reporter_name"
                                    value={form.reporter_name}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Full Name *"
                                    required
                                />
                                <input
                                    name="reporter_contact"
                                    value={form.reporter_contact}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Contact Number *"
                                    required
                                />
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                                    <span className="font-bold">⚠️ Disclaimer: </span>
                                    Your name and contact number are collected solely for verification and follow-up purposes by BioWatch administrators. This information will <strong>not</strong> be shared publicly. By submitting, you consent to BioWatch using your details to validate and act on this report.
                                </div>
                            </div>

                            {/* PMC */}
                            <div className="glass-card p-4 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" name="pmc_flag" checked={form.pmc_flag} onChange={handleChange}
                                        className="w-5 h-5 rounded border-eco-300 text-eco-600 focus:ring-eco-500" />
                                    <span className="text-sm text-eco-900 font-medium">Reported to PMC official portal?</span>
                                </label>
                                {form.pmc_flag && (
                                    <input name="pmc_id" value={form.pmc_id} onChange={handleChange}
                                        className="input-field animate-fade-in" placeholder="PMC Complaint ID (optional)" />
                                )}
                            </div>
                        </div>

                        {/* ── Right Column — Location ── */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-eco-900">📍 Location *</label>

                            {/* GPS Button */}
                            <button
                                type="button"
                                onClick={fetchGPS}
                                disabled={gpsLoading}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-eco-400 bg-eco-50 text-eco-800 font-semibold text-sm hover:bg-eco-100 hover:border-eco-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {gpsLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-eco-600 border-t-transparent rounded-full animate-spin" />
                                        Fetching your location...
                                    </>
                                ) : (
                                    <>📡 Use My Current Location</>
                                )}
                            </button>

                            {gpsError && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    ⚠️ {gpsError}
                                </p>
                            )}

                            {/* Manual Coordinate Entry */}
                            <div className="glass-card p-3 space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Or enter coordinates manually</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Latitude</label>
                                        <input
                                            type="number"
                                            name="manualLat"
                                            value={manualLat}
                                            onChange={handleManualCoords}
                                            step="any"
                                            placeholder="e.g. 18.5204"
                                            className="input-field text-sm py-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Longitude</label>
                                        <input
                                            type="number"
                                            name="manualLng"
                                            value={manualLng}
                                            onChange={handleManualCoords}
                                            step="any"
                                            placeholder="e.g. 73.8567"
                                            className="input-field text-sm py-1.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Resolved Location Name */}
                            {(locationName || geocoding) && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 animate-fade-in">
                                    <span className="mt-0.5 shrink-0">📌</span>
                                    {geocoding ? (
                                        <span className="text-gray-400 italic text-xs">Looking up location name...</span>
                                    ) : (
                                        <span className="leading-snug text-xs">{locationName}</span>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-gray-400">💡 You can also click anywhere on the map to drop a pin</p>

                            {/* Map */}
                            <div className="h-[340px] rounded-2xl overflow-hidden shadow-lg border-2 border-eco-200">
                                <MapContainer center={position || defaultCenter} zoom={13} className="h-full w-full">
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationPicker position={position} onMapClick={applyPosition} />
                                    {position && <MapController position={position} />}
                                </MapContainer>
                            </div>

                            {position && (
                                <p className="text-xs text-gray-400 text-right">
                                    🌐 {position[0].toFixed(5)}, {position[1].toFixed(5)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>📤 Submit Report</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
