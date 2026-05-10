import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Fallback static data (shown while DB loads or if tables are empty)
const STATIC_OFFICIALS = [
  { id: 's1', name: 'Pune Forest Division', designation: 'Chief Conservator of Forests — Pune', department: 'Maharashtra Forest Department', phone: '020-26122000', email: 'ccf.pune@mahaforest.gov.in', office_address: 'Aranya Bhavan, S P College Road, Shivajinagar, Pune - 411 005', zone: 'Pune Division' },
  { id: 's2', name: 'Wildlife SOS — 24×7 Helpline', designation: 'Rescue & Rapid Response', department: 'Wildlife SOS', phone: '1926', email: 'info@wildlifesos.org', office_address: 'Wildlife SOS India, Noida', zone: 'National' },
  { id: 's3', name: 'Junnar Forest Division', designation: 'DCF — Leopard Mitigation Cell', department: 'Maharashtra Forest Department', phone: '02132-225400', email: 'dcf.junnar@mahaforest.gov.in', office_address: 'Junnar Forest Division, Junnar, Pune District', zone: 'Junnar / Shirur Zone' },
  { id: 's5', name: 'MPCB — Pune Office', designation: 'Regional Officer', department: 'Maharashtra Pollution Control Board', phone: '020-26058424', email: 'rp.pune@mpcb.gov.in', office_address: 'MPCB Regional Office, Shivajinagar, Pune - 411 005', zone: 'Pune' },
  { id: 's7', name: 'PMC Tree Authority', designation: 'Tree Officer — Permits & Complaints', department: 'PMC Tree Authority', phone: '020-25501100', email: 'tree@punecorporation.org', office_address: 'PMC Main Building, Shivajinagar, Pune - 411 005', zone: 'Pune City' },
];

// ── Department configuration (icon + colour per department)
const DEPT_CONFIG = {
  'Maharashtra Forest Department': { icon: '🌲', color: 'bg-green-100 text-green-800 border-green-200', accent: 'border-l-green-600' },
  'Wildlife SOS': { icon: '🐆', color: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'border-l-orange-500' },
  'Wildlife Crime Control Bureau': { icon: '🔍', color: 'bg-red-100 text-red-800 border-red-200', accent: 'border-l-red-500' },
  'Maharashtra Pollution Control Board': { icon: '🏭', color: 'bg-blue-100 text-blue-800 border-blue-200', accent: 'border-l-blue-500' },
  'National Green Tribunal': { icon: '⚖️', color: 'bg-purple-100 text-purple-800 border-purple-200', accent: 'border-l-purple-500' },
  'Ministry of Environment (MoEFCC)': { icon: '🇮🇳', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', accent: 'border-l-indigo-500' },
  'Bombay Natural History Society (BNHS)': { icon: '🦋', color: 'bg-teal-100 text-teal-800 border-teal-200', accent: 'border-l-teal-500' },
  'PMC Tree Authority': { icon: '🌳', color: 'bg-lime-100 text-lime-800 border-lime-200', accent: 'border-l-lime-500' },
  'PMC Environment Department': { icon: '♻️', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', accent: 'border-l-emerald-500' },
  'PMC General Helpline': { icon: '📞', color: 'bg-gray-100 text-gray-700 border-gray-200', accent: 'border-l-gray-400' },
};
const DEFAULT_DEPT = { icon: '🏛️', color: 'bg-gray-100 text-gray-700 border-gray-200', accent: 'border-l-gray-400' };

// Department filter groups
const DEPT_GROUPS = [
  { id: 'All', label: 'All Departments', icon: '📋' },
  { id: 'Maharashtra Forest Department', label: 'Forest Dept', icon: '🌲' },
  { id: 'Wildlife SOS', label: 'Wildlife SOS', icon: '🐆' },
  { id: 'Maharashtra Pollution Control Board', label: 'MPCB', icon: '🏭' },
  { id: 'PMC', label: 'PMC (Reference)', icon: '🏛️' }, // grouped — any dept starting with "PMC"
];

const CATEGORY_CONFIG = {
  tree: { icon: '🌳', label: 'Tree Protection', color: 'bg-green-100 text-green-800 border-green-200', accent: 'border-l-green-500' },
  wildlife: { icon: '🐆', label: 'Wildlife', color: 'bg-orange-100 text-orange-800 border-orange-200', accent: 'border-l-orange-500' },
  environment: { icon: '♻️', label: 'Environment', color: 'bg-blue-100 text-blue-800 border-blue-200', accent: 'border-l-blue-500' },
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
    { id: 'tree_authority', label: 'Tree Authority', icon: '🌳' },
    { id: 'circulars', label: 'Official Circulars', icon: '📄' },
    { id: 'legal', label: 'Legal Guidelines', icon: '⚖️' },
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
              Forest Dept · Wildlife SOS · MPCB · MoEFCC · PMC
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
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl border-b-2 transition-all -mb-px ${activeTab === tab.id
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
                  className={`text-xs px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1 ${deptFilter === g.id
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
          TAB — Tree Authority Members
      ════════════════════════════════════════════════════════════ */}
      {activeTab === 'tree_authority' && (
        <div className="animate-fade-in space-y-6">

          {/* Hero Header */}
          <div className="relative bg-gradient-to-r from-[#8B1A2B] via-[#A0243D] to-[#8B1A2B] rounded-2xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-8 text-6xl">🌳</div>
              <div className="absolute bottom-2 right-8 text-6xl">🏛️</div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🌳</span>
                <h2 className="text-2xl sm:text-3xl font-bold">PMC Tree Authority</h2>
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                Pune Municipal Corporation — Tree Authority Members & Expert Committee
              </p>
              <a
                href="https://www.pmc.gov.in/en/tree-authority-members"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-xs bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-3 py-1.5 transition-all"
              >
                🔗 View on PMC Portal →
              </a>
            </div>
          </div>

          {/* Authority Members Table */}
          <div className="glass-card overflow-hidden">
            <div className="bg-eco-50 px-5 py-3 border-b border-eco-200">
              <h3 className="font-bold text-eco-900 flex items-center gap-2">
                <span>🏛️</span> Tree Authority Members
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#8B1A2B] text-white text-left">
                    <th className="px-4 py-3 font-semibold w-16">Sr. No</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-eco-100 hover:bg-eco-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-eco-700">1</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-eco-900">Hon. Shri. Naval Kishore Ram</p>
                      <p className="text-xs text-gray-500">Municipal Commissioner</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">President Tree Authority</td>
                  </tr>
                  <tr className="border-b border-eco-100 hover:bg-eco-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-eco-700">2</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-eco-900">Hon. Dr. Ashok Ghorpade</p>
                      <p className="text-xs text-gray-500">Joint Municipal Commissioner and Chief Garden Superintendent</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">Member Secretary, Tree Authority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expert Committee Table */}
          <div className="glass-card overflow-hidden">
            <div className="bg-eco-50 px-5 py-3 border-b border-eco-200">
              <h3 className="font-bold text-eco-900 flex items-center gap-2">
                <span>👨‍🔬</span> Members of the Expert Committee
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#8B1A2B] text-white text-left">
                    <th className="px-4 py-3 font-semibold w-16">No.</th>
                    <th className="px-4 py-3 font-semibold">Members of the Expert Committee</th>
                    <th className="px-4 py-3 font-semibold">Contact Details</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { no: 1, name: 'Dr. Vinodkumar Mohan', contact: '9423968204' },
                    { no: 2, name: 'Shri. Vijay Mehta', contact: '7350022999' },
                    { no: 3, name: 'Shri. Digambar Mokat', contact: '9420907098' },
                    { no: 4, name: 'Dr. Sandeep Jadhav', contact: '9665043400' },
                    { no: 5, name: 'Dr. K. N. Dhumal', contact: '9604393523' },
                  ].map((member) => (
                    <tr key={member.no} className="border-b border-eco-100 hover:bg-eco-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-eco-700">{member.no}.</td>
                      <td className="px-4 py-3 font-medium text-eco-900">{member.name}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`tel:${member.contact}`}
                          className="inline-flex items-center gap-1.5 text-[#8B1A2B] hover:text-[#6B1323] font-mono font-semibold hover:underline transition-colors"
                        >
                          📞 {member.contact}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ward-wise Tree Authority Officers */}
          <div className="glass-card overflow-hidden">
            <div className="bg-eco-50 px-5 py-3 border-b border-eco-200 flex items-center justify-between">
              <h3 className="font-bold text-eco-900 flex items-center gap-2">
                <span>🗺️</span> Tree Authority Officers — Ward-wise
              </h3>
              <a
                href="https://www.pmc.gov.in/en/tree-authority-officers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-eco-600 hover:text-eco-800 hover:underline transition-colors"
              >
                Source: PMC Portal →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#8B1A2B] text-white text-left">
                    <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Zone</th>
                    <th className="px-3 py-2.5 font-semibold">Ward Name</th>
                    <th className="px-3 py-2.5 font-semibold">Tree Officer</th>
                    <th className="px-3 py-2.5 font-semibold">Asst. Garden Superintendent</th>
                    <th className="px-3 py-2.5 font-semibold">Horticulture In-charge</th>
                    <th className="px-3 py-2.5 font-semibold">Authorized Tree Cutting Agency</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      zone: 1, ward: 'Dhanakwadi-Sahakarnagar',
                      officer: { name: 'Shri. Amol Chavan', email: 'amol.chavan@punecorporation.org', phone: '9922193323' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9922113010' },
                      horticulture: { name: 'Shri. Sambhaji Katkar', phone: '' },
                      agency: 'M/s. Shree Ganesh Enterprises\n9011506344 / 8975418167'
                    },
                    {
                      zone: 1, ward: 'Nagar Road - Vadgaonsheri',
                      officer: { name: 'Shri. Rajesh Kumar', email: 'rajesh.kumar@punecorporation.org', phone: '' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9922113010' },
                      horticulture: { name: 'Shri. Anil Salve', phone: '8308901747' },
                      agency: 'M/s. Rohani Enterprises\n8600424331 / 9960077770'
                    },
                    {
                      zone: 1, ward: 'Ghole Road',
                      officer: { name: 'Shri. Satish Sonawane Patil', email: '', phone: '8100996445' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9922113010' },
                      horticulture: { name: 'Shri. Sambhaji', phone: '' },
                      agency: 'M/s. Mahadev Enterprises\n9423129307 / 9921304945'
                    },
                    {
                      zone: 1, ward: 'Aundh - Baner',
                      officer: { name: 'Shri. Vikas Bhosale', email: 'aundh.garden@punecorporation.org', phone: '9689994700' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9922113010' },
                      horticulture: { name: 'Smt. Sandhya', phone: '8308901181' },
                      agency: 'M/s. Kite Enterprises\n8412084289 / 9403130601'
                    },
                    {
                      zone: 2, ward: 'Karve Road',
                      officer: { name: 'Smt. Suman Jadhav', email: 'suman.jadhav@punecorporation.org', phone: '9689647110' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '8806681800' },
                      horticulture: { name: 'Shri. Devidas Mote', phone: '' },
                      agency: 'M/s. Gayatri Enterprises\n7218826300 / 9665014427'
                    },
                    {
                      zone: 2, ward: 'Shivaji Nagar - Ghole Road (West)',
                      officer: { name: 'Shri. Hanumant Wadhe', email: 'shivajinagar.garden@punecorporation.org', phone: '9689647198' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '8806681800' },
                      horticulture: { name: '', phone: '' },
                      agency: 'M/s. Saraswati Enterprises\n8805946452 / 9011340437'
                    },
                    {
                      zone: 3, ward: 'Hadapsar - Mundhwa',
                      officer: { name: 'Shri. Vijaykumar Raghuvanshi', email: 'hadapsar.garden@punecorporation.org', phone: '9922193035' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '8806681800' },
                      horticulture: { name: 'Shri. Manoj Wable', phone: '' },
                      agency: 'M/s. Atal Enterprises\n8805946452 / 9011907770'
                    },
                    {
                      zone: 3, ward: 'Dhanakwadi - Sahakar Nagar',
                      officer: { name: 'Shri. Sureshbahurao', email: '', phone: '9764102437' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '7703075213' },
                      horticulture: { name: 'Shri. Ganesh', phone: '' },
                      agency: 'M/s. Mahadev Namdev Enterprises\n9764964421 / 8831052100'
                    },
                    {
                      zone: 4, ward: 'Wanawadi-Ramtekdi',
                      officer: { name: 'Shri. Amol Patil', email: 'amol.patil@punecorporation.org', phone: '9689880310' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '' },
                      horticulture: { name: '', phone: '' },
                      agency: 'M/s. Shri Ganesh Shrirya\n8308901138 / 7799139855'
                    },
                    {
                      zone: 4, ward: 'Kondhwa - Yewalewadi',
                      officer: { name: 'Shri. Chandan Patil', email: 'kondhwa.garden@punecorporation.org', phone: '9860847978' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '' },
                      horticulture: { name: '', phone: '' },
                      agency: 'M/s. Chiranjeevi Enterprises\n9860496971 / 7798139676'
                    },
                    {
                      zone: 5, ward: 'Kasba - Vishrambaug',
                      officer: { name: 'Shri. Anil Bhalerao', email: '', phone: '9922193323' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '' },
                      horticulture: { name: 'Shri. Eknath', phone: '' },
                      agency: 'M/s. Mahammed Ali Entreprises\n8308901170 / 9595015446'
                    },
                    {
                      zone: 5, ward: 'Bibwewadi',
                      officer: { name: 'Smt. Anita Jagtap', email: '', phone: '' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '' },
                      horticulture: { name: '', phone: '' },
                      agency: 'M/s. Global Enterprises\n9421224011 / 7030575468'
                    },
                    {
                      zone: 6, ward: 'Warje - Karvenagar',
                      officer: { name: 'Smt. Preetika Ranka', email: 'warje.garden@punecorporation.org', phone: '' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '' },
                      horticulture: { name: '', phone: '' },
                      agency: ''
                    },
                    {
                      zone: 6, ward: 'Kothrud',
                      officer: { name: 'Smt. Vaishali Mohite', email: '', phone: '9423200287' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9921131010' },
                      horticulture: { name: '', phone: '' },
                      agency: 'M/s. Mauli Enterprises\n9923254960'
                    },
                    {
                      zone: 7, ward: 'Bhawani Peth',
                      officer: { name: 'Shri. Tanaji Jadhav', email: '', phone: '' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9823508414' },
                      horticulture: { name: '', phone: '' },
                      agency: ''
                    },
                    {
                      zone: 7, ward: 'Yerawada',
                      officer: { name: 'Smt. Deepika Wende', email: '', phone: '9423200287' },
                      superintendent: { name: 'Shri. Natthurao Kamble', phone: '9921131010' },
                      horticulture: { name: 'Shri. Vilas N.', phone: '9923254960' },
                      agency: ''
                    },
                  ].map((row, i) => (
                    <tr key={i} className={`border-b border-eco-100 hover:bg-eco-50/80 transition-colors ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-3 py-2.5 font-bold text-eco-700 text-center">{row.zone}</td>
                      <td className="px-3 py-2.5 font-semibold text-eco-900 whitespace-nowrap">{row.ward}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-eco-900">{row.officer.name}</p>
                        {row.officer.email && (
                          <a href={`mailto:${row.officer.email}`} className="text-eco-600 hover:underline block truncate max-w-[180px]">✉️ {row.officer.email}</a>
                        )}
                        {row.officer.phone && (
                          <a href={`tel:${row.officer.phone}`} className="text-[#8B1A2B] font-mono hover:underline">📞 {row.officer.phone}</a>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{row.superintendent.name}</p>
                        {row.superintendent.phone && (
                          <a href={`tel:${row.superintendent.phone}`} className="text-[#8B1A2B] font-mono hover:underline">📞 {row.superintendent.phone}</a>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.horticulture.name ? (
                          <>
                            <p className="font-medium text-gray-800">{row.horticulture.name}</p>
                            {row.horticulture.phone && (
                              <a href={`tel:${row.horticulture.phone}`} className="text-[#8B1A2B] font-mono hover:underline">📞 {row.horticulture.phone}</a>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.agency ? (
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{row.agency}</p>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Member Secretary info */}
          <div className="glass-card p-5 border-l-4 border-l-[#8B1A2B]">
            <h4 className="font-bold text-eco-900 text-sm mb-2 flex items-center gap-2">
              <span>📋</span> Member Secretary, Tree Authority Office
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-eco-50 rounded-lg p-3">
                <p className="font-semibold text-eco-900">Shri. Hanumant Yemmede</p>
                <p className="text-gray-500 mt-0.5">Member Secretary, Tree Authority Office</p>
                <a href="tel:9423200778" className="text-[#8B1A2B] font-mono font-semibold hover:underline block mt-1">📞 9423200778</a>
              </div>
              <div className="bg-eco-50 rounded-lg p-3">
                <p className="font-semibold text-eco-900">Shri. Vikas Madhukarrao</p>
                <p className="text-gray-500 mt-0.5">Junior Clerk</p>
                <a href="tel:9604007840" className="text-[#8B1A2B] font-mono font-semibold hover:underline block mt-1">📞 9604007840</a>
              </div>
            </div>
          </div>

          {/* Toll-free note */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <span className="font-bold shrink-0">📞</span>
            <div>
              <p><strong>PMC Toll-Free Helpline:</strong> <a href="tel:18001030222" className="font-mono font-bold hover:underline">1800-103-0222</a></p>
              <p className="mt-1">For tree-related complaints, permissions, and objections, contact the Tree Authority office at your ward or call the toll-free number above.</p>
            </div>
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
              { id: 'all', label: 'All', icon: '📋' },
              { id: 'tree', label: 'Tree Protection', icon: '🌳' },
              { id: 'wildlife', label: 'Wildlife', icon: '🐆' },
              { id: 'environment', label: 'Environment', icon: '♻️' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCatFilter(f.id)}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all ${catFilter === f.id
                    ? f.id === 'tree' ? 'bg-green-600 text-white shadow-sm'
                      : f.id === 'wildlife' ? 'bg-orange-600 text-white shadow-sm'
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
              { cat: 'tree', icon: '🌳', label: 'Tree Laws', color: 'text-green-600' },
              { cat: 'wildlife', icon: '🐆', label: 'Wildlife Laws', color: 'text-orange-600' },
              { cat: 'environment', icon: '♻️', label: 'Env. Laws', color: 'text-blue-600' },
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
