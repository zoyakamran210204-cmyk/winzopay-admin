import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DepositPage from './pages/DepositPage';
import BuyRPPage from './pages/BuyRPPage';
import MiningPage from './pages/MiningPage';
import SellRPPage from './pages/SellRPPage';
import WithdrawPage from './pages/WithdrawPage';
import LedgerPage from './pages/LedgerPage';
import ProfilePage from './pages/ProfilePage';

import BottomNav from './components/BottomNav'; 
import LiveSupport from './components/LiveSupport'; // 👈 Live Support Import kiya

function AppLayout() {
    const location = useLocation();
    
    // Agar user Login page (/) par hai, to BottomNav aur LiveSupport na dikhao
    const isAuthPage = location.pathname === '/';

    return (
        <div>
            <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/deposit" element={<DepositPage />} />
                <Route path="/buy-rp" element={<BuyRPPage />} />
                <Route path="/mining" element={<MiningPage />} />
                <Route path="/sell-rp" element={<SellRPPage />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/ledger" element={<LedgerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
               
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            {/* Bottom Navigation aur Live Support sirf tab dikhein jab user Login page par na ho */}
            {!isAuthPage && (
                <>
                    <BottomNav />
                    <LiveSupport /> {/* 👈 Har page par show hoga (login ke baad) */}
                </>
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}

export default App;