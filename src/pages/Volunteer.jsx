import { useState } from 'react';
import { supabase } from '../lib/supabase';

const INTEREST_AREAS = [
    'Tree Planting',
    'Wildlife Monitoring',
    'Clean-up Drives',
    'Awareness Campaigns',
    'Data Collection',
    'Emergency Response',
    'Education & Training',
];

const AVAILABILITY_OPTIONS = [
    'Weekdays',
    'Weekends',
    'Mornings Only',
    'Evenings Only',
    'Full Time',
    'On-Call',
];

export default function Volunteer() {
    const [form, setForm] = useState({
        name: '',
        contact: '',
        email: '',
        interest_area: '',
        availability: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) return setError('Please enter your name');
        if (!form.contact.trim()) return setError('Please enter your contact number');
        if (!form.interest_area) return setError('Please select an interest area');
        if (!form.availability) return setError('Please select your availability');

        setSubmitting(true);
        try {
            const { error: insertErr } = await supabase.from('volunteers').insert(form);
            if (insertErr) throw insertErr;
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to register. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="page-container flex items-center justify-center">
                <div className="glass-card p-12 text-center max-w-md animate-slide-up">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-eco-900 mb-2">Welcome Aboard!</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for volunteering! You're now part of Pune's environmental protection force.
                        We'll contact you soon with opportunities matching your interests.
                    </p>
                    <button
                        onClick={() => { setSubmitted(false); setForm({ name: '', contact: '', email: '', interest_area: '', availability: '' }); }}
                        className="btn-primary"
                    >
                        Register Another Volunteer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="max-w-2xl mx-auto">
                <h1 className="section-title">🤝 Become a Volunteer</h1>
                <p className="section-subtitle">Join our growing community of eco-warriors in Pune</p>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { icon: '🌱', title: 'Make Impact', desc: 'Directly contribute to environmental protection' },
                        { icon: '🏅', title: 'Earn Badges', desc: 'Get recognized for your contributions' },
                        { icon: '🤝', title: 'Community', desc: 'Connect with like-minded eco-warriors' },
                    ].map((b, i) => (
                        <div key={i} className="glass-card p-4 text-center">
                            <span className="text-3xl">{b.icon}</span>
                            <h3 className="font-semibold text-eco-900 mt-2">{b.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">{b.desc}</p>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-eco-900 mb-2">Full Name *</label>
                        <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Enter your full name" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-eco-900 mb-2">Contact Number *</label>
                            <input name="contact" value={form.contact} onChange={handleChange} className="input-field" placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-eco-900 mb-2">Email (Optional)</label>
                            <input name="email" value={form.email} onChange={handleChange} type="email" className="input-field" placeholder="you@example.com" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-eco-900 mb-2">Interest Area *</label>
                        <select name="interest_area" value={form.interest_area} onChange={handleChange} className="select-field">
                            <option value="">Select your area of interest...</option>
                            {INTEREST_AREAS.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-eco-900 mb-2">Availability *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {AVAILABILITY_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, availability: opt }))}
                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${form.availability === opt
                                            ? 'border-eco-500 bg-eco-50 text-eco-800'
                                            : 'border-eco-200 bg-white/80 text-gray-600 hover:border-eco-300'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Registering...
                            </>
                        ) : (
                            <>🤝 Register as Volunteer</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
