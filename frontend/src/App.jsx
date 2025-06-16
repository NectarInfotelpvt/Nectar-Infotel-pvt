import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";         // Login/Register page
import AdminPanel from "./pages/AdminPanel";       // Your admin panel
import MainDashboard from "./pages/MainDashboard"; // User's main dashboard
import SuperAdminPanel from "./pages/SuperAdminPanel"; // Your super admin panel

import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} /> {/* Public Login/Registration Page */}

        {/* User Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']} />}> {/* Anyone logged in can see MainDashboard */}
          <Route path="/user" element={<MainDashboard />} />
        </Route>

        {/* Admin Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}> {/* Only Admins and SuperAdmins can see AdminPanel */}
          <Route path="/admin" element={<AdminPanel />} />
        </Route>

        {/* SuperAdmin Protected Route */}
        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}> {/* Only SuperAdmins can see SuperAdminPanel */}
          <Route path="/superadmin" element={<SuperAdminPanel />} />
        </Route>

        {/* Optional: Handle 404 Not Found or redirect to Dashboard */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;