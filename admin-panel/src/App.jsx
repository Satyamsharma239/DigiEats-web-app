import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider } from "./contexts/AdminContext.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UsersManagement from "./pages/UsersManagement.jsx";
import ShopsManagement from "./pages/ShopsManagement.jsx";
import OrdersManagement from "./pages/OrdersManagement.jsx";
import Settings from "./pages/Settings.jsx";
import Reports from "./pages/Reports.jsx";

function App() {
  return (
    <AdminProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="shops" element={<ShopsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminProvider>
  );
}

export default App;
