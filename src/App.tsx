import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import OfflineIndicator from './components/OfflineIndicator'
import BottomNav from './components/BottomNav'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import TicketsPage from './pages/TicketsPage'
import MorePage from './pages/MorePage'
import ShippingLabelPage from './pages/ShippingLabelPage'

function AppRoutes() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-purple-700 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-3xl">🏪</span>
                    </div>
                    <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                </div>
            </div>
        )
    }

    if (!user) return <LoginPage />

    return (
        <div className="min-h-screen bg-gray-50">
            <OfflineIndicator />
            <div className="content-area">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/orders/*" element={<OrdersPage />} />
                    <Route path="/inventory/*" element={<InventoryPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/tickets/*" element={<TicketsPage />} />
                    <Route path="/more" element={<MorePage />} />
                    <Route path="/shipping/:orderId" element={<ShippingLabelPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            <BottomNav />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}
