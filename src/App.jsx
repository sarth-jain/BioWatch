import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Report from './pages/Report';
import MapView from './pages/MapView';
import Biodiversity from './pages/Biodiversity';
import Volunteer from './pages/Volunteer';
import AdminLogin from './pages/AdminLogin';
import HighPriority from './pages/HighPriority';
import AdminDashboard from './pages/AdminDashboard';
import AdminBiodiversity from './pages/AdminBiodiversity';
import AdminVolunteers from './pages/AdminVolunteers';
import VolunteerProof from './pages/VolunteerProof';
import OfficialResources from './pages/OfficialResources';
import AdminOfficialResources from './pages/AdminOfficialResources';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="report" element={<Report />} />
          <Route path="map" element={<MapView />} />
          <Route path="biodiversity" element={<Biodiversity />} />
          <Route path="volunteer" element={<Volunteer />} />
          <Route path="high-priority" element={<HighPriority />} />
          <Route path="volunteer-proof" element={<VolunteerProof />} />
          <Route path="official-resources" element={<OfficialResources />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="biodiversity" element={<AdminBiodiversity />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="official-resources" element={<AdminOfficialResources />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
