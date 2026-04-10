import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-eco-950 text-eco-100 border-t border-eco-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🌱</span>
                            <span className="text-xl font-bold text-white">
                                Bio<span className="text-eco-400">Watch</span>
                            </span>
                        </Link>
                        <p className="text-eco-300 text-sm leading-relaxed">
                            Citizen-centric environmental reporting and tracking system for Pune.
                            Protecting our city's green heritage, one report at a time.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { to: '/report', label: 'Report Issue' },
                                { to: '/map', label: 'View Map' },
                                { to: '/biodiversity', label: 'Biodiversity' },
                                { to: '/volunteer', label: 'Volunteer' },
                            ].map(link => (
                                <li key={link.to}>
                                    <Link to={link.to} className="text-eco-300 hover:text-eco-400 text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Report Categories</h3>
                        <ul className="space-y-2 text-sm text-eco-300">
                            <li>🌳 Illegal Tree Cutting</li>
                            <li>🐆 Wildlife Activity</li>
                            <li>🗑️ Garbage Dumping</li>
                            <li>⛰️ Landslide Risk</li>
                            <li>🔥 Forest Fire</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact</h3>
                        <ul className="space-y-2 text-sm text-eco-300">
                            <li>📍 Pune, Maharashtra</li>
                            <li>📧 contact@biowatch.in</li>
                            <li>📞 +91 8007968524</li>
                        </ul>
                        <div className="flex gap-3 mt-4">
                            <a href="#" className="w-8 h-8 rounded-full bg-eco-800 hover:bg-eco-700 flex items-center justify-center transition-colors text-xs">𝕏</a>
                            <a href="#" className="w-8 h-8 rounded-full bg-eco-800 hover:bg-eco-700 flex items-center justify-center transition-colors text-xs">📘</a>
                            <a href="#" className="w-8 h-8 rounded-full bg-eco-800 hover:bg-eco-700 flex items-center justify-center transition-colors text-xs">📸</a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-eco-800 mt-8 pt-8 text-center text-sm text-eco-400">
                    <p>© {new Date().getFullYear()} BioWatch Pune. Built for a greener tomorrow 🌍</p>
                </div>
            </div>
        </footer>
    );
}
