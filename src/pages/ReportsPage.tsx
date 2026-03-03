import { useState, useEffect, useCallback } from 'react'
import { BarChart2, TrendingUp, MapPin, PieChart, Tag, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TABS = [
    { id: 'pnl', label: 'P&L', icon: TrendingUp },
    { id: 'state', label: 'State-wise', icon: MapPin },
    { id: 'status', label: 'Status', icon: PieChart },
    { id: 'sku', label: 'SKU-wise', icon: Tag },
]

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Packed: 'bg-blue-100 text-blue-700',
    Dispatched: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Returned: 'bg-orange-100 text-orange-700',
}

export default function ReportsPage() {
    const { user } = useAuth()
    const [tab, setTab] = useState('pnl')
    const [pnlType, setPnlType] = useState<'daily' | 'monthly'>('daily')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    const fmtDec = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

    const buildQs = () => {
        const qs = new URLSearchParams()
        if (fromDate) qs.set('from', fromDate)
        if (toDate) qs.set('to', toDate)
        return qs.toString()
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        setData(null)
        try {
            if (tab === 'pnl') {
                const qs = new URLSearchParams({ type: pnlType })
                if (fromDate) qs.set('from', fromDate)
                if (toDate) qs.set('to', toDate)
                const res = await fetch(`/api/reports/pnl?${qs}`, { credentials: 'include' })
                setData(await res.json())
            } else if (tab === 'state') {
                const res = await fetch(`/api/reports/state-wise?${buildQs()}`, { credentials: 'include' })
                setData(await res.json())
            } else if (tab === 'status') {
                const res = await fetch(`/api/reports/status-summary?${buildQs()}`, { credentials: 'include' })
                setData(await res.json())
            } else {
                const res = await fetch(`/api/reports/sku-wise?${buildQs()}`, { credentials: 'include' })
                setData(await res.json())
            }
        } finally {
            setLoading(false)
        }
    }, [tab, pnlType, fromDate, toDate])

    useEffect(() => { fetchData() }, [fetchData])

    return (
        <div className="page-enter">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-4">
                <h1 className="text-xl font-extrabold mb-4">Reports</h1>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === id ? 'bg-white text-purple-700' : 'bg-white/15 text-white'}`}
                        >
                            <Icon size={14} />{label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date filters */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
                <div className="flex gap-2 items-center">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    <input type="date" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <span className="text-gray-400 text-xs">to</span>
                    <input type="date" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
                {tab === 'pnl' && (
                    <div className="flex gap-2 mt-2">
                        {(['daily', 'monthly'] as const).map(t => (
                            <button key={t} onClick={() => setPnlType(t)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${pnlType === t ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {t === 'daily' ? 'Daily' : 'Monthly'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-4">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* P&L Report */}
                {!loading && tab === 'pnl' && data && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="card text-center">
                                <p className="text-lg font-extrabold text-green-600">{fmt(data.summary.totalRevenue)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Revenue</p>
                            </div>
                            <div className="card text-center">
                                <p className="text-lg font-extrabold text-red-500">{fmt(data.summary.totalCost)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Cost</p>
                            </div>
                            <div className={`card text-center ${data.summary.totalProfit >= 0 ? '' : 'bg-red-50'}`}>
                                <p className={`text-lg font-extrabold ${data.summary.totalProfit >= 0 ? 'text-purple-700' : 'text-red-600'}`}>{fmt(data.summary.totalProfit)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Profit</p>
                            </div>
                        </div>
                        <div className="card p-0 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Breakdown</p>
                            </div>
                            {data.breakdown.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-400 text-sm">No delivered orders in range</div>
                            ) : data.breakdown.map((row: any) => (
                                <div key={row.date} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="font-semibold text-sm">{row.date}</p>
                                        <p className="text-xs text-gray-400">{row.orders} orders</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-gray-800">{fmt(row.revenue)}</p>
                                        <p className={`text-xs font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {row.profit >= 0 ? '+' : ''}{fmt(row.profit)} profit
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* State-wise */}
                {!loading && tab === 'state' && Array.isArray(data) && (
                    <div className="card p-0 overflow-hidden">
                        {data.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">No data in range</div>
                        ) : (
                            <>
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-3">
                                    <p className="text-xs font-bold text-gray-500">State</p>
                                    <p className="text-xs font-bold text-gray-500 text-center">Orders</p>
                                    <p className="text-xs font-bold text-gray-500 text-right">Revenue</p>
                                </div>
                                {data.map((row: any) => (
                                    <div key={row.state} className="grid grid-cols-3 px-4 py-3 border-b border-gray-50 last:border-0">
                                        <p className="font-semibold text-sm text-gray-800">{row.state}</p>
                                        <p className="text-center font-bold text-purple-700 text-sm">{row.orders}</p>
                                        <p className="text-right text-sm font-semibold text-gray-600">{fmt(row.revenue)}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Status Summary */}
                {!loading && tab === 'status' && Array.isArray(data) && (
                    <div className="space-y-3">
                        {data.length === 0 ? (
                            <div className="card text-center py-8 text-gray-400 text-sm">No data in range</div>
                        ) : data.map((row: any) => {
                            const total = data.reduce((s: number, r: any) => s + r.count, 0)
                            const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
                            return (
                                <div key={row.status} className="card">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`status-pill ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-600'}`}>{row.status}</span>
                                        <div className="text-right">
                                            <span className="font-extrabold text-xl text-gray-800">{row.count}</span>
                                            <span className="text-gray-400 text-sm ml-1">({pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-purple-700 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* SKU-wise */}
                {!loading && tab === 'sku' && Array.isArray(data) && (
                    <div className="card p-0 overflow-hidden">
                        {data.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">No data in range</div>
                        ) : (
                            <>
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">SKU Performance</p>
                                </div>
                                {data.map((row: any) => (
                                    <div key={row.sku} className="px-4 py-3 border-b border-gray-50 last:border-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800">{row.productName}</p>
                                                <p className="text-xs font-mono text-gray-400 mt-0.5">{row.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{fmt(row.revenue)}</p>
                                                <p className={`text-xs font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {fmt(row.profit)} profit
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Qty sold: {row.quantity}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
