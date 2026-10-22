import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import { useAdminAuth } from './context/AdminAuthContext';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import AdminPaymentSettingsPage from './pages/AdminPaymentSettingsPage';



const ProtectedRoute = ({ children }) => {
    const { admin, loading } = useAdminAuth();
    
    if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
    if (!admin) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AdminLoginPage />} />
                <Route 
                    path="/dashboard" 
                    element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} 
                />
				<Route 
    path="/payment-settings" 
    element={<ProtectedRoute><AdminPaymentSettingsPage /></ProtectedRoute>} 
/>
                <Route 
                    path="/users" 
                    element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} 
                />
                <Route 
                    path="/transactions" 
                    element={<ProtectedRoute><AdminTransactionsPage /></ProtectedRoute>} 
                />
				<Route 
                     path="/user/:id" 
                       element={<ProtectedRoute><AdminUserDetailPage /></ProtectedRoute>} 
                 /> 
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;