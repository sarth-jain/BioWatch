import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Fallback static data (shown while DB loads or if tables are empty)
const STATIC_OFFICIALS = [
  { id: 's1', name: 'Pune Forest Division', designation: 'Chief Conservator of Forests — Pune', department: 'Maharashtra Forest Department', phone: '020-26122000', email: 'ccf.pune@mahaforest.gov.in', office_address: 'Aranya Bhavan, S P College Road, Shivajinagar, Pune - 411 005', zone: 'Pune Division' },
  { id: 's2', name: 'Wildlife SOS — 24×7 Helpline', designation: 'Rescue & Rapid Response', department: 'Wildlife SOS', phone: '1926', email: 'info@wildlifesos.org', office_address: 'Wildlife SOS India, Noida', zone: 'National' },
  { id: 's3', name: 'Junnar Forest Division', designation: 'DCF — Leopard Mitigation Cell', department: 'Maharashtra Forest Department', phone: '02132-225400', email: 'dcf.junnar@mahaforest.gov.in', office_address: 'Junnar Forest Division, Junnar, Pune District', zone: 'Junnar / Shirur Zone' },
  { id: 's4', name: 'WCCB Western Region', designation: 'Regional Deputy Director', department: 'Wildlife Crime Control Bureau', phone: '022-22027108', email: 'wccbmumbai@gov.in', office_address: 'CGO Complex, Churchgate, Mumbai - 400 020', zone: 'Maharashtra / West India' },
  { id: 's5', name: 'MPCB — Pune Office', designation: 'Regional Officer', department: 'Maharashtra Pollution Control Board', phone: '020-26058424', email: 'rp.pune@mpcb.gov.in', office_address: 'MPCB Regional Office, Shivajinagar, Pune - 411 005', zone: 'Pune' },
  { id: 's6', name: 'NGT Western Zone Bench', designation: 'Registrar, Western Zone', department: 'National Green Tribunal', phone: '020-25512626', email: 'ngtpune@nic.in', office_address: 'Phule Vastu Sangrahalya, Shivajinagar, Pune - 411 005', zone: 'Pune / Western India' },
  { id: 's7', name: 'PMC Tree Authority', designation: 'Tree Officer — Permits & Complaints', department: 'PMC Tree Authority', phone: '020-25501100', email: 'tree@punecorporation.org', office_address: 'PMC Main Building, Shivajinagar, Pune - 411 005', zone: 'Pune City' },
];

// ── Department configuration (icon + colour per department)
const DEPT_CONFIG = {
  'Maharashtra Forest Department':    { icon: '🌲', color: 'bg-green-100 text-green-800 border-green-200',   accent: 'border-l-green-600' },
  'Wildlife SOS':                     { icon: '🐆', color: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'border-l-orange-500' },
  'Wildlife Crime Control Bureau':    { icon: '🔍', color: 'bg-red-100 text-red-800 border-red-200',          accent: 'border-l-red-500' },
  'Maharashtra Pollution Control Board': { icon: '🏭', color: 'bg-blue-100 text-blue-800 border-blue-200',   accent: 'border-l-blue-500' },
  'National Green Tribunal':          { icon: '⚖️', color: 'bg-purple-100 text-purple-800 border-purple-200', accent: 'border-l-purple-500' },
  'Ministry of Environment (MoEFCC)': { icon: '🇮🇳', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', accent: 'border-l-indigo-500' },
  'Bombay Natural History Society (BNHS)': { icon: '🦋', color: 'bg-teal-100 text-teal-800 border-teal-200', accent: 'border-l-teal-500' },
  'PMC Tree Authority':               { icon: '🌳', color: 'bg-lime-100 text-lime-800 border-lime-200',       accent: 'border-l-lime-500' },
  'PMC Environment Department':       { icon: '♻️', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', accent: 'border-l-emerald-500' },
  'PMC General Helpline':             { icon: '📞', color: 'bg-gray-100 text-gray-700 border-gray-200',       accent: 'border-l-gray-400' },
};
const DEFAULT_DEPT = { icon: '🏛️', color: 'bg-gray-100 text-gray-700 border-gray-200', accent: 'border-l-gray-400' };

// Department filter groups
const DEPT_GROUPS = [
  { id: 'All', label: 'All Departments', icon: '📋' },
  { id: 'Maharashtra Forest Department', label: 'Forest Dept', icon: '🌲' },
  { id: 'Wildlife SOS', label: 'Wildlife SOS', icon: '🐆' },
  { id: 'Wildlife Crime Control Bureau', label: 'WCCB', icon: '🔍' },
  { id: 'Maharashtra Pollution Control Board', label: 'MPCB', icon: '🏭' },
  { id: 'National Green Tribunal', label: 'NGT', icon: '⚖️' },
  { id: 'PMC', label: 'PMC (Reference)', icon: '🏛️' }, // grouped — any dept starting with "PMC"
];

const CATEGORY_CONFIG = {
  tree:        { icon: '🌳', label: 'Tree Protection', color: 'bg-green-100 text-green-800 border-green-200',   accent: 'border-l-green-500' },
  wildlife:    { icon: '🐆', label: 'Wildlife',         color: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'border-l-orange-500' },
  environment: { icon: '♻️', label: 'Environment',      color: 'bg-blue-100 text-blue-800 border-blue-200',     accent: 'border-l-blue-500' },
};

const PMC_CIRCULARS = [
  { title: 'Garden Department Circulars & Dockets', date: 'PMC Official Portal', desc: 'Access PMC garden-related circulars, orders, and policy dockets including tree-cutting permissions, garden development plans, and seasonal advisories.' },
  { title: 'Tree Authority Meeting Notices', date: 'Monthly', desc: 'Agendas and minutes of Tree Authority committee meetings: tree permission approvals, objection hearings, and public notices.' },
  { title: 'Maharashtra Forest Department Notifications', date: 'State Government', desc: 'Official orders from Aranya Bhavan covering wildlife management, forest reserve boundaries, and eco-sensitive zone regulations for Pune district.' },
];

// ── Official Card ─────────────────────────────────────────────────
function OfficialCard({ official }) {
  const dept = DEPT_CONFIG[official.department] || DEFAULT_DEPT;
  return (
    <div className={`glass-card p-5 border-l-4 ${dept.accent} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-xl shrink-0">
            {dept.icon}
          </div>
          <div>
            <p className="font-bold text-eco-900 text-sm leading-tight">{official.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{official.designation}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 leading-snug ${dept.color}`}>
          {official.department.replace('Maharashtra ', '').replace(' (BNHS)', '').replace(' (MoEFCC)', '')}
        </span>
      </div>

      {official.zone && (
        <p className="text-xs text-gray-400 mb-2">📍 {official.zone}</p>
      )}

      <div className="space-y-1.5 pt-3 border-t border-eco-100">
        {official.phone && (
          <a href={`tel:${official.phone}`} className="flex items-center gap-2 text-xs text-eco-700 hover:text-eco-900 transition-colors group">
            <span className="w-5 h-5 rounded-full bg-eco-100 flex items-center justify-center text-xs group-hover:bg-eco-200 transition-colors shrink-0">📞</span>
            {official.phone}
          </a>
        )}
        {official.email && (
          <a href={`mailto:${official.email}`} className="flex items-center gap-2 text-xs text-eco-700 hover:text-eco-900 transition-colors group">
            <span className="w-5 h-5 rounded-full bg-eco-100 flex items-center justify-center text-xs group-hover:bg-eco-200 transition-colors shrink-0">✉️</span>
            <span className="truncate">{official.email}</span>
          </a>
        )}
        {official.office_address && (
          <p className="flex items-start gap-2 text-xs text-gray-500">
            <span className="shrink-0 mt-0.5">🏢</span>
            {official.office_address}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Advisory Accordion Card ───────────────────────────────────────
function AdvisoryCard({ advisory }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_CONFIG[advisory.category] || CATEGORY_CONFIG.environment;
  return (
    <div className={`glass-card border-l-4 ${cat.accent} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-5 flex items-start justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">{cat.icon}</span>
          <div>
            <p className="font-semibold text-eco-900 text-sm leading-snug">{advisory.title}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>
              {cat.label}
            </span>
          </div>
        </div>
        <span className={`text-eco-500 text-lg shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="bg-eco-50 rounded-xl p-4 mb-3">
            <p className="text-sm text-gray-700 leading-relaxed">{advisory.description}</p>
          </div>
          {advisory.source && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📖 Source:</span>
              {advisory.source_url ? (
                <a href={advisory.source_url} target="_blank" rel="noopener noreferrer"
                  className="text-eco-600 hover:text-eco-800 underline underline-offset-2 transition-colors">
                  {advisory.source}
                </a>
              ) : (
                <span>{advisory.source}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function OfficialResources() {
  const [activeTab, setActiveTab] = useState('officials');
  const [officials, setOfficials] = useState(STATIC_OFFICIALS);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('all');
  const [searchOfficials, setSearchOfficials] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [offRes, advRes] = await Promise.all([
        supabase.from('pmc_officials').select('*').eq('is_active', true).order('department').order('name'),
        supabase.from('legal_advisories').select('*').eq('is_active', true).order('category').order('title'),
      ]);
      if (offRes.data && offRes.data.length > 0) setOfficials(offRes.data);
      setAdvisories(advRes.data || []);
    } catch (err) {
      console.error('Failed to fetch official resources:', err);
    } finally {
      setLoading(false);
    }
  }

  // For the "PMC" group filter, match any dept starting with "PMC"
  const filteredOfficials = officials.filter(o => {
    const matchesDept =
      deptFilter === 'All' ? true :
      deptFilter === 'PMC' ? o.department.startsWith('PMC') :
      o.department === deptFilter;
    const q = searchOfficials.toLowerCase().trim();
    const matchesSearch = !q ||
      o.name.toLowerCase().includes(q) ||
      o.designation.toLowerCase().includes(q) ||
      (o.zone || '').toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  const filteredAdvisories = catFilter === 'all'
    ? advisories
    : advisories.filter(a => a.category === catFilter);

  const TABS = [
    { id: 'officials', label: 'Contacts', icon: '👤' },
    { id: 'circulars', label: 'Official Circulars', icon: '📄' },
    { id: 'legal',     label: 'Legal Guidelines', icon: '⚖️' },
  ];

  return (
    <div className="page-container animate-fade-in">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🏛️</span>
          <div>
            <h1 className="section-title mb-0">Official Resources</h1>
            <p className="text-sm text-eco-600 font-medium mt-0.5">
              Forest Dept · Wildlife SOS · WCCB · MPCB · NGT · MoEFCC · PMC
            </p>
          </div>
        </div>
        <p className="section-subtitle mt-2">
          Government contacts, environmental circulars and legal guidelines across all departments — not just a single authority.
        </p>
      </div>

      {/* ── Emergency / Helpline Banner ── */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-red-200">🆘 Emergency Helplines</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '🐆 Wildlife SOS', number: '1926' },
            { label: '🌲 Forest Helpline', number: '1800-209-4300' },
            { label: '🚨 WCCB Hotline', number: '1800-102-7219' },
            { label: '☎️ PMC Control Room', number: '1800-103-0222' },
          ].map(h => (
            <a key={h.number} href={`tel:${h.number}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-bold transition-all">
              {h.label}: <span className="font-mono">{h.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-2 border-b border-eco-200 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${
              activeTab === tab.id
                ? 'border-b-eco-600 text-eco-700 bg-eco-50'
                : 'border-b-transparent text-gray-500 hover:text-eco-700 hover:bg-eco-50/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1 — Contacts
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'officials' && (
        <div className="animate-fade-in">

          {/* Search + Filter */}
          <div className="mb-5 space-y-3">
            <input
              type="text"
              placeholder="Search by name, role, zone, or department..."
              value={searchOfficials}
              onChange={e => setSearchOfficials(e.target.value)}
              className="input-field"
            />
            <div className="flex gap-2 flex-wrap">
              {DEPT_GROUPS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setDeptFilter(g.id)}
                  className={`text-xs px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                    deptFilter === g.id
                      ? 'bg-eco-600 text-white shadow-sm'
                      : 'bg-eco-50 text-eco-700 hover:bg-eco-100 border border-eco-200'
                  }`}
                >
                  {g.icon} {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-gray-400 mb-4">
            Showing {filteredOfficials.length} of {officials.length} contacts
          </p>

          {/* Officials grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-4 bg-eco-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-eco-100 rounded w-1/2 mb-4" />
                  <div className="h-3 bg-eco-100 rounded w-full mb-1" />
                  <div className="h-3 bg-eco-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredOfficials.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl">🔍</span>
              <p className="mt-3">No contacts found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOfficials.map(o => <OfficialCard key={o.id} official={o} />)}
            </div>
          )}

          {/* Note about PMC contacts */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">ℹ️ Note:</span> PMC contacts are listed for reference only, as they handle tree permissions and civic complaints within Pune city limits. For wildlife or pollution emergencies, always contact the relevant state/central departments listed above.
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2 — Official Circulars
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'circulars' && (
        <div className="animate-fade-in space-y-6">

          {/* Hero CTA */}
          <div className="glass-card p-6 bg-gradient-to-br from-eco-50 to-blue-50 border border-eco-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-eco-900 mb-1">📄 Official Environmental Circulars</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Access official circulars, orders and policy dockets published by the PMC Garden Department and Maharashtra Forest Department.
                  These circulars cover tree permissions, wildlife management, and environmental regulations.
                </p>
              </div>
              <a
                href="https://www.pmc.gov.in/en/u/garden_docket"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary shrink-0 flex items-center gap-2"
              >
                📋 View PMC Circulars →
              </a>
            </div>
          </div>

          {/* Circular category cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PMC_CIRCULARS.map((c, i) => (
              <a
                key={i}
                href="https://www.pmc.gov.in/en/u/garden_docket"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-5 border-l-4 border-l-eco-500 hover:shadow-lg transition-all group block"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">📑</span>
                  <div>
                    <p className="font-semibold text-eco-900 text-sm group-hover:text-eco-600 transition-colors">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.date}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{c.desc}</p>
                <p className="text-xs text-eco-600 font-semibold mt-3 group-hover:underline">View on PMC Portal →</p>
              </a>
            ))}
          </div>

          {/* Other dept portals — 2 only, no title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="https://mahaforest.gov.in" target="_blank" rel="noopener noreferrer"
              className="glass-card p-5 flex items-center gap-4 hover:shadow-md transition-all group border border-green-200">
              <span className="text-3xl">🌲</span>
              <div>
                <p className="font-semibold text-eco-900 text-sm group-hover:text-eco-600 transition-colors">Maharashtra Forest Department</p>
                <p className="text-xs text-gray-500 mt-0.5">Notifications, eco-sensitive zones, wildlife orders</p>
                <p className="text-xs text-green-600 font-semibold mt-1 group-hover:underline">mahaforest.gov.in →</p>
              </div>
            </a>
            <a href="https://mpcb.gov.in" target="_blank" rel="noopener noreferrer"
              className="glass-card p-5 flex items-center gap-4 hover:shadow-md transition-all group border border-blue-200">
              <span className="text-3xl">🏭</span>
              <div>
                <p className="font-semibold text-eco-900 text-sm group-hover:text-eco-600 transition-colors">Maharashtra Pollution Control Board</p>
                <p className="text-xs text-gray-500 mt-0.5">Pollution norms, show-cause notices, plant reports</p>
                <p className="text-xs text-blue-600 font-semibold mt-1 group-hover:underline">mpcb.gov.in →</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3 — Legal Guidelines
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'legal' && (
        <div className="animate-fade-in">

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'all',         label: 'All', icon: '📋' },
              { id: 'tree',        label: 'Tree Protection', icon: '🌳' },
              { id: 'wildlife',    label: 'Wildlife', icon: '🐆' },
              { id: 'environment', label: 'Environment', icon: '♻️' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCatFilter(f.id)}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all ${
                  catFilter === f.id
                    ? f.id === 'tree'        ? 'bg-green-600 text-white shadow-sm'
                    : f.id === 'wildlife'    ? 'bg-orange-600 text-white shadow-sm'
                    : f.id === 'environment' ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-eco-600 text-white shadow-sm'
                    : 'bg-eco-50 text-eco-700 hover:bg-eco-100 border border-eco-200'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { cat: 'tree',        icon: '🌳', label: 'Tree Laws',     color: 'text-green-600' },
              { cat: 'wildlife',    icon: '🐆', label: 'Wildlife Laws', color: 'text-orange-600' },
              { cat: 'environment', icon: '♻️', label: 'Env. Laws',    color: 'text-blue-600' },
            ].map(s => (
              <div key={s.cat} className="stat-card text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>
                  {advisories.filter(a => a.category === s.cat).length || '—'}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Accordion */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-4 bg-eco-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-eco-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredAdvisories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl">⚖️</span>
              <p className="mt-3 font-medium">No guidelines loaded yet.</p>
              <p className="text-sm mt-1">
                Run <code className="bg-eco-100 text-eco-800 px-1.5 py-0.5 rounded font-mono">official-resources-schema.sql</code> in Supabase to populate data.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdvisories.map(a => <AdvisoryCard key={a.id} advisory={a} />)}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <span className="font-bold">⚠️ Disclaimer:</span> This information is for general citizen awareness only. For legal proceedings, please consult a qualified environmental lawyer or approach the relevant official authority. Content is sourced from publicly available legislation, government portals, and wildlife organisations.
          </div>
        </div>
      )}
    </div>
  );
}
