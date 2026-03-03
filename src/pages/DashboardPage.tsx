import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ShoppingBag, AlertTriangle, Plus, Package, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface DashboardData {
    todayCount: number
    weekCount: number
    monthCount: number
    totalRevenue: number
    totalProfit: number
    lowStockItems: any[]
    recentOrders: any[]
}

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Packed: 'bg-blue-100 text-blue-700',
    Dispatched: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Returned: 'bg-orange-100 text-orange-700',
}

export default function DashboardPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports/dashboard', { credentials: 'include' })
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false))
    }, [])

    const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-8">
                <p className="text-purple-200 text-xs font-semibold uppercase tracking-wide">Welcome back</p>
                <h1 className="text-2xl font-extrabold mt-0.5">{user?.name} 👋</h1>
                <p className="text-purple-200 text-sm mt-1">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                {/* Quick stats row in header */}
                {data && (
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: 'Today', val: data.todayCount },
                            { label: 'This Week', val: data.weekCount },
                            { label: 'This Month', val: data.monthCount },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
                                <p className="text-2xl font-extrabold">{val}</p>
                                <p className="text-purple-200 text-xs mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-4 space-y-4">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {data && (
                    <>
                        {/* Revenue & Profit Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                                        <TrendingUp size={16} className="text-green-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Revenue</span>
                                </div>
                                <p className="text-xl font-extrabold text-green-700">{fmt(data.totalRevenue)}</p>
                                <p className="text-xs text-green-600 mt-0.5">All time (delivered)</p>
                            </div>
                            <div className={`card bg-gradient-to-br ${data.totalProfit >= 0 ? 'from-purple-50 to-violet-50 border-purple-100' : 'from-red-50 to-rose-50 border-red-100'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${data.totalProfit >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
                                        {data.totalProfit >= 0
                                            ? <TrendingUp size={16} className="text-purple-600" />
                                            : <TrendingDown size={16} className="text-red-600" />
                                        }
                                    </div>
                                    <span className={`text-xs font-semibold uppercase tracking-wide ${data.totalProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>Profit</span>
                                </div>
                                <p className={`text-xl font-extrabold ${data.totalProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>{fmt(data.totalProfit)}</p>
                                <p className={`text-xs mt-0.5 ${data.totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>All time (delivered)</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/orders?add=1')}
                                    className="card flex items-center gap-3 active:scale-95 transition-all"
                                >
                                    <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Plus size={20} className="text-purple-700" />
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">Add Order</span>
                                </button>
                                <button
                                    onClick={() => navigate('/inventory?add=1')}
                                    className="card flex items-center gap-3 active:scale-95 transition-all"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Package size={20} className="text-blue-700" />
                                    </div>
                                    <span className="font-semibold text-sm text-gray-700">Add Stock</span>
                                </button>
                            </div>
                        </div>

                        {/* Low Stock Alerts */}
                        {data.lowStockItems.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={14} className="text-red-500" />
                                    <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Low Stock Alerts ({data.lowStockItems.length})</p>
                                </div>
                                <div className="card p-0 overflow-hidden">
                                    {data.lowStockItems.map((item: any, i: number) => (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between px-4 py-3 ${i < data.lowStockItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800">{item.productName}</p>
                                                <p className="text-xs text-gray-500">{item.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="badge bg-red-100 text-red-600">{item.currentStock} left</span>
                                                <p className="text-xs text-gray-400 mt-0.5">Min: {item.minStockLevel}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Orders */}
                        {data.recentOrders.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recent Orders</p>
                                    <button onClick={() => navigate('/orders')} className="text-purple-700 text-xs font-semibold flex items-center gap-0.5">
                                        See all <ChevronRight size={12} />
                                    </button>
                                </div>
                                <div className="card p-0 overflow-hidden">
                                    {data.recentOrders.map((order: any, i: number) => (
                                        <div
                                            key={order.id}
                                            onClick={() => navigate(`/orders?detail=${order.id}`)}
                                            className={`flex items-center justify-between px-4 py-3 active:bg-gray-50 cursor-pointer ${i < data.recentOrders.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <ShoppingBag size={16} className="text-purple-700" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-800">{order.orderId}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{order.productName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`status-pill ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                                <p className="text-xs text-gray-500 mt-1">{fmt(order.salePrice * order.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.recentOrders.length === 0 && (
                            <div className="card text-center py-10">
                                <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No orders yet</p>
                                <p className="text-gray-400 text-sm mt-1">Add your first order to get started</p>
                                <button onClick={() => navigate('/orders?add=1')} className="btn-primary mt-4">
                                    Add Order
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
