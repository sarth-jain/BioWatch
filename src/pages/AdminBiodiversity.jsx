import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminBiodiversity() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: '', scientific_name: '', type: 'flora', description: '', habitat: '', location: '', image_url: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchItems(); }, []);

    async function fetchItems() {
        try {
            const { data } = await supabase.from('biodiversity').select('*').order('name');
            setItems(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    function startEdit(item) {
        setEditing(item.id);
        setForm({
            name: item.name,
            scientific_name: item.scientific_name || '',
            type: item.type,
            description: item.description || '',
            habitat: item.habitat || '',
            location: item.location || '',
            image_url: item.image_url || '',
        });
        setShowForm(true);
    }

    function resetForm() {
        setEditing(null);
        setForm({ name: '', scientific_name: '', type: 'flora', description: '', habitat: '', location: '', image_url: '' });
        setShowForm(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editing) {
                await supabase.from('biodiversity').update(form).eq('id', editing);
            } else {
                await supabase.from('biodiversity').insert(form);
            }
            resetForm();
            fetchItems();
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this entry?')) return;
        try {
            await supabase.from('biodiversity').delete().eq('id', id);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) { console.error(err); }
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="section-title">🌿 Manage Biodiversity</h1>
                    <p className="text-gray-600">Add, edit, or remove flora & fauna entries</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/dashboard" className="btn-secondary text-sm">← Dashboard</Link>
                    <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm">
                        {showForm ? 'Cancel' : '+ Add Entry'}
                    </button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 animate-slide-up space-y-4">
                    <h3 className="font-bold text-eco-900">{editing ? 'Edit Entry' : 'New Entry'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Name *" required />
                        <input name="scientific_name" value={form.scientific_name} onChange={handleChange} className="input-field" placeholder="Scientific Name" />
                        <select name="type" value={form.type} onChange={handleChange} className="select-field">
                            <option value="flora">🌱 Flora</option>
                            <option value="fauna">🦎 Fauna</option>
                        </select>
                        <input name="habitat" value={form.habitat} onChange={handleChange} className="input-field" placeholder="Habitat (e.g. Deciduous forests)" />
                    </div>
                    <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="📍 Exact location in Pune (e.g. Sinhagad Fort, Pune)" />
                    <textarea name="description" value={form.description} onChange={handleChange} className="input-field resize-none" rows={3} placeholder="Description" />
                    <input name="image_url" value={form.image_url} onChange={handleChange} className="input-field" placeholder="Image URL" />
                    <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                        {submitting ? 'Saving...' : editing ? 'Update Entry' : 'Add Entry'}
                    </button>
                </form>
            )}

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-eco-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Scientific Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Habitat</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-eco-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-eco-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-eco-50/50 transition-colors">
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
                                            <span className="font-medium text-eco-900 text-sm">{item.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 italic">{item.scientific_name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${item.type === 'flora' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.habitat}</td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => startEdit(item)} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">Edit</button>
                                            <button onClick={() => handleDelete(item.id)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <span className="text-4xl">🌿</span>
                                <p className="mt-2">No biodiversity entries yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
