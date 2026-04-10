import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DEPARTMENTS = [
  'Maharashtra Forest Department',
  'Wildlife SOS',
  'Wildlife Crime Control Bureau',
  'Maharashtra Pollution Control Board',
  'National Green Tribunal',
  'Ministry of Environment (MoEFCC)',
  'Bombay Natural History Society (BNHS)',
  'PMC Tree Authority',
  'PMC Environment Department',
  'PMC General Helpline',
];

const CATEGORIES  = ['tree', 'wildlife', 'environment'];

const BLANK_OFFICIAL = { name: '', designation: '', department: 'Maharashtra Forest Department', phone: '', email: '', office_address: '', zone: '' };
const BLANK_ADVISORY = { title: '', description: '', category: 'tree', source: '', source_url: '' };

export default function AdminOfficialResources() {
  const [tab, setTab]             = useState('officials');   // 'officials' | 'advisories'
  const [officials, setOfficials] = useState([]);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Modal state
  const [editOfficial, setEditOfficial] = useState(null);   // null | {} | {existing record}
  const [editAdvisory, setEditAdvisory] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id }

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [offRes, advRes] = await Promise.all([
        supabase.from('pmc_officials').select('*').order('department').order('name'),
        supabase.from('legal_advisories').select('*').order('category').order('title'),
      ]);
      setOfficials(offRes.data || []);
      setAdvisories(advRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function flash(msg, isErr = false) {
    if (isErr) { setError(msg); setTimeout(() => setError(''), 4000); }
    else        { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  }

  // ── OFFICIALS CRUD ──────────────────────────────────────────────
  async function saveOfficial(form) {
    setSaving(true);
    try {
      const payload = {
        name: form.name, designation: form.designation,
        department: form.department, phone: form.phone || null,
        email: form.email || null, office_address: form.office_address || null,
        zone: form.zone || null, is_active: true,
      };
      if (form.id) {
        const { error } = await supabase.from('pmc_officials').update(payload).eq('id', form.id);
        if (error) throw error;
        setOfficials(prev => prev.map(o => o.id === form.id ? { ...o, ...payload } : o));
        flash('Official updated ✅');
      } else {
        const { data, error } = await supabase.from('pmc_officials').insert(payload).select().single();
        if (error) throw error;
        setOfficials(prev => [...prev, data]);
        flash('Official added ✅');
      }
      setEditOfficial(null);
    } catch (err) { flash(err.message, true); }
    finally { setSaving(false); }
  }

  async function deleteOfficial(id) {
    setSaving(true);
    try {
      const { error } = await supabase.from('pmc_officials').delete().eq('id', id);
      if (error) throw error;
      setOfficials(prev => prev.filter(o => o.id !== id));
      flash('Official deleted');
    } catch (err) { flash(err.message, true); }
    finally { setSaving(false); setDeleteConfirm(null); }
  }

  // ── ADVISORIES CRUD ────────────────────────────────────────────
  async function saveAdvisory(form) {
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description,
        category: form.category, source: form.source || null,
        source_url: form.source_url || null, is_active: true,
      };
      if (form.id) {
        const { error } = await supabase.from('legal_advisories').update(payload).eq('id', form.id);
        if (error) throw error;
        setAdvisories(prev => prev.map(a => a.id === form.id ? { ...a, ...payload } : a));
        flash('Advisory updated ✅');
      } else {
        const { data, error } = await supabase.from('legal_advisories').insert(payload).select().single();
        if (error) throw error;
        setAdvisories(prev => [...prev, data]);
        flash('Advisory added ✅');
      }
      setEditAdvisory(null);
    } catch (err) { flash(err.message, true); }
    finally { setSaving(false); }
  }

  async function deleteAdvisory(id) {
    setSaving(true);
    try {
      const { error } = await supabase.from('legal_advisories').delete().eq('id', id);
      if (error) throw error;
      setAdvisories(prev => prev.filter(a => a.id !== id));
      flash('Advisory deleted');
    } catch (err) { flash(err.message, true); }
    finally { setSaving(false); setDeleteConfirm(null); }
  }

  const CAT_BADGE = { tree: 'bg-green-100 text-green-800', wildlife: 'bg-orange-100 text-orange-800', environment: 'bg-blue-100 text-blue-800' };
  const DEPT_BADGE = { 'Tree Authority': 'bg-green-100 text-green-800', 'Garden Department': 'bg-pink-100 text-pink-800', 'Environment Department': 'bg-blue-100 text-blue-800', 'PMC General': 'bg-gray-100 text-gray-700' };

  return (
    <div className="page-container animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="section-title">🏛️ Manage Official Resources</h1>
          <p className="text-gray-600">Add, edit, and remove PMC officials and legal advisories</p>
        </div>
        <Link to="/admin/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
      </div>

      {/* Feedback */}
      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">⚠️ {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">✅ {success}</div>}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-eco-200 mb-6">
        {[['officials','👤 PMC Officials'],['advisories','⚖️ Legal Advisories']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 -mb-px transition-all ${
              tab === id ? 'border-b-eco-600 text-eco-700 bg-eco-50' : 'border-b-transparent text-gray-500 hover:text-eco-700 hover:bg-eco-50/50'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── OFFICIALS TAB ── */}
      {tab === 'officials' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{officials.length} officials</p>
            <button onClick={() => setEditOfficial({ ...BLANK_OFFICIAL })} className="btn-primary text-sm">+ Add Official</button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-eco-50">
                  <tr>
                    {['Name & Role','Department','Contact','Zone','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-eco-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                  ) : officials.map(o => (
                    <tr key={o.id} className="hover:bg-eco-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-eco-900 text-sm">{o.name}</p>
                        <p className="text-xs text-gray-500">{o.designation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${DEPT_BADGE[o.department] || 'bg-gray-100'}`}>{o.department}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {o.phone && <p>📞 {o.phone}</p>}
                        {o.email && <p>✉️ {o.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.zone || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditOfficial(o)} className="text-xs px-2.5 py-1.5 bg-eco-100 text-eco-700 rounded-lg hover:bg-eco-200 transition-colors font-medium">✏️ Edit</button>
                          <button onClick={() => setDeleteConfirm({ type: 'official', id: o.id, name: o.name })} className="text-xs px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">🗑️ Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ADVISORIES TAB ── */}
      {tab === 'advisories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{advisories.length} advisories</p>
            <button onClick={() => setEditAdvisory({ ...BLANK_ADVISORY })} className="btn-primary text-sm">+ Add Advisory</button>
          </div>

          <div className="space-y-3">
            {advisories.map(a => (
              <div key={a.id} className="glass-card p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_BADGE[a.category] || 'bg-gray-100'}`}>{a.category}</span>
                    <p className="font-semibold text-eco-900 text-sm">{a.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{a.description}</p>
                  {a.source && <p className="text-xs text-eco-600 mt-1">📖 {a.source}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditAdvisory(a)} className="text-xs px-2.5 py-1.5 bg-eco-100 text-eco-700 rounded-lg hover:bg-eco-200 transition-colors font-medium">✏️ Edit</button>
                  <button onClick={() => setDeleteConfirm({ type: 'advisory', id: a.id, name: a.title })} className="text-xs px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Official Modal ── */}
      {editOfficial && <OfficialModal data={editOfficial} saving={saving} onSave={saveOfficial} onClose={() => setEditOfficial(null)} />}

      {/* ── Edit Advisory Modal ── */}
      {editAdvisory && <AdvisoryModal data={editAdvisory} saving={saving} onSave={saveAdvisory} onClose={() => setEditAdvisory(null)} />}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card max-w-sm w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-eco-900 text-lg mb-2">Confirm Delete</h3>
            <p className="text-gray-600 text-sm mb-5">Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button
                onClick={() => deleteConfirm.type === 'official' ? deleteOfficial(deleteConfirm.id) : deleteAdvisory(deleteConfirm.id)}
                disabled={saving}
                className="flex-1 text-sm px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
              >{saving ? 'Deleting...' : '🗑️ Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Official Form Modal ───────────────────────────────────────────
function OfficialModal({ data, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  const f = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-eco-900 text-lg mb-4">{data.id ? '✏️ Edit Official' : '➕ Add Official'}</h3>
        <div className="space-y-3">
          <input name="name" value={form.name} onChange={f} placeholder="Full Name *" className="input-field" />
          <input name="designation" value={form.designation} onChange={f} placeholder="Designation *" className="input-field" />
          <select name="department" value={form.department} onChange={f} className="select-field">
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <input name="phone" value={form.phone} onChange={f} placeholder="Phone (e.g. 020-25501000)" className="input-field" />
          <input name="email" value={form.email} onChange={f} placeholder="Email" className="input-field" type="email" />
          <input name="zone" value={form.zone} onChange={f} placeholder="Zone (e.g. Central, Zone 1)" className="input-field" />
          <textarea name="office_address" value={form.office_address} onChange={f} placeholder="Office Address" className="input-field resize-none" rows={2} />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={() => { if (!form.name || !form.designation) return; onSave(form); }}
            disabled={saving || !form.name || !form.designation}
            className="btn-primary flex-1 text-sm disabled:opacity-50"
          >{saving ? 'Saving...' : 'Save Official'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Advisory Form Modal ───────────────────────────────────────────
function AdvisoryModal({ data, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  const f = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-eco-900 text-lg mb-4">{data.id ? '✏️ Edit Advisory' : '➕ Add Advisory'}</h3>
        <div className="space-y-3">
          <input name="title" value={form.title} onChange={f} placeholder="Title *" className="input-field" />
          <select name="category" value={form.category} onChange={f} className="select-field">
            <option value="tree">🌳 Tree Protection</option>
            <option value="wildlife">🐆 Wildlife</option>
            <option value="environment">♻️ Environment</option>
          </select>
          <textarea name="description" value={form.description} onChange={f} placeholder="Description / Legal text *" className="input-field resize-none" rows={4} />
          <input name="source" value={form.source} onChange={f} placeholder="Source (e.g. Maharashtra Trees Act 1975)" className="input-field" />
          <input name="source_url" value={form.source_url} onChange={f} placeholder="Source URL (optional)" className="input-field" type="url" />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button
            onClick={() => { if (!form.title || !form.description) return; onSave(form); }}
            disabled={saving || !form.title || !form.description}
            className="btn-primary flex-1 text-sm disabled:opacity-50"
          >{saving ? 'Saving...' : 'Save Advisory'}</button>
        </div>
      </div>
    </div>
  );
}
