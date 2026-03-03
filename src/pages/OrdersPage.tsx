import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, X, Search, ChevronLeft, Filter, AlertCircle, Tag, Printer } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STATUSES = ['Pending', 'Packed', 'Dispatched', 'Delivered', 'Cancelled', 'Returned']
const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
]

const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Packed: 'bg-blue-100 text-blue-700',
    Dispatched: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Returned: 'bg-orange-100 text-orange-700',
}

const emptyForm = {
    orderId: '', productName: '', sku: '', quantity: '', salePrice: '',
    costPrice: '', customerState: '', status: 'Pending'
}

export default function OrdersPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const showAdd = params.get('add') === '1'
    const detailId = params.get('detail')

    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [showFilter, setShowFilter] = useState(false)

    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [duplicate, setDuplicate] = useState(false)
    const [dupChecking, setDupChecking] = useState(false)

    const [detail, setDetail] = useState<any>(null)
    const [editStatus, setEditStatus] = useState('')

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        const qs = new URLSearchParams()
        if (search) qs.set('search', search)
        if (filterStatus) qs.set('status', filterStatus)
        if (fromDate) qs.set('from', fromDate)
        if (toDate) qs.set('to', toDate)
        const res = await fetch(`/api/orders?${qs}`, { credentials: 'include' })
        const data = await res.json()
        setOrders(data)
        setLoading(false)
    }, [search, filterStatus, fromDate, toDate])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    useEffect(() => {
        if (detailId) {
            fetch(`/api/orders/${detailId}`, { credentials: 'include' })
                .then(r => r.json()).then(d => { setDetail(d); setEditStatus(d.status) })
        } else {
            setDetail(null)
        }
    }, [detailId])

    // Duplicate check
    useEffect(() => {
        if (!form.orderId || form.orderId.length < 3) { setDuplicate(false); return }
        const timeout = setTimeout(async () => {
            setDupChecking(true)
            const res = await fetch(`/api/orders/check-duplicate/${encodeURIComponent(form.orderId)}`, { credentials: 'include' })
            const data = await res.json()
            setDuplicate(data.isDuplicate)
            setDupChecking(false)
        }, 400)
        return () => clearTimeout(timeout)
    }, [form.orderId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.orderId || !form.productName || !form.sku || !form.quantity || !form.salePrice || !form.costPrice || !form.customerState) {
            setFormError('All fields are required')
            return
        }
        setSaving(true)
        setFormError('')
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error((await res.json()).error)
            setForm(emptyForm)
            setParams({})
            fetchOrders()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateStatus = async () => {
        if (!detail) return
        await fetch(`/api/orders/${detail.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: editStatus })
        })
        setDetail({ ...detail, status: editStatus })
        fetchOrders()
    }

    const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

    // Detail View
    if (detailId && detail) {
        return (
            <div className="page-enter">
                <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-6">
                    <button onClick={() => setParams({})} className="flex items-center gap-1 text-purple-200 text-sm mb-4">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-xl font-extrabold">Order Details</h1>
                    <p className="text-purple-200 text-sm">{detail.orderId}</p>
                </div>
                <div className="px-4 py-4 space-y-4">
                    <div className="card space-y-3">
                        {[
                            { label: 'Order ID', val: detail.orderId },
                            { label: 'Product', val: detail.productName },
                            { label: 'SKU', val: detail.sku },
                            { label: 'Quantity', val: detail.quantity },
                            { label: 'Sale Price', val: fmt(detail.salePrice) },
                            { label: 'Cost Price', val: fmt(detail.costPrice) },
                            { label: 'Profit', val: fmt((detail.salePrice - detail.costPrice) * detail.quantity) },
                            { label: 'State', val: detail.customerState },
                            { label: 'Date', val: new Date(detail.createdAt).toLocaleDateString('en-IN') },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                                <span className="font-semibold text-sm text-gray-800">{String(val)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Update Status */}
                    <div className="card">
                        <p className="label mb-3">Update Status</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {STATUSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setEditStatus(s)}
                                    className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${editStatus === s ? 'border-purple-700 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleUpdateStatus} className="btn-primary w-full">Update Status</button>
                    </div>

                    {/* Generate label */}
                    <button
                        onClick={() => navigate(`/shipping/${detail.id}`)}
                        className="w-full card flex items-center justify-center gap-2 text-purple-700 font-semibold active:scale-95 transition-all"
                    >
                        <Printer size={18} /> Generate Shipping Label
                    </button>
                </div>
            </div>
        )
    }

    // Add Order Form
    if (showAdd) {
        return (
            <div className="page-enter">
                <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-6">
                    <button onClick={() => setParams({})} className="flex items-center gap-1 text-purple-200 text-sm mb-4">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-xl font-extrabold">Add New Order</h1>
                </div>
                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
                    {/* Order ID with duplicate check */}
                    <div>
                        <label className="label">Order ID *</label>
                        <div className="relative">
                            <input
                                className={`input-field pr-10 ${duplicate ? 'border-red-400 focus:ring-red-300' : ''}`}
                                placeholder="e.g. MO123456789"
                                value={form.orderId}
                                onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                            />
                            {dupChecking && (
                                <div className="absolute right-3 top-3.5 w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                            )}
                            {duplicate && !dupChecking && (
                                <AlertCircle size={16} className="absolute right-3 top-3.5 text-red-500" />
                            )}
                        </div>
                        {duplicate && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> Duplicate Order ID detected!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="label">Product Name *</label>
                        <input className="input-field" placeholder="e.g. Cotton Saree Yellow" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label">SKU Code *</label>
                        <div className="relative">
                            <Tag size={14} className="absolute left-3 top-3.5 text-gray-400" />
                            <input className="input-field pl-9" placeholder="e.g. SAR-YLW-L" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label">Qty *</label>
                            <input className="input-field" type="number" min="1" placeholder="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Sale ₹ *</label>
                            <input className="input-field" type="number" placeholder="0" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Cost ₹ *</label>
                            <input className="input-field" type="number" placeholder="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Customer State *</label>
                        <select className="input-field" value={form.customerState} onChange={e => setForm(f => ({ ...f, customerState: e.target.value }))}>
                            <option value="">Select state</option>
                            {STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUSES.map(s => (
                                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.status === s ? 'border-purple-700 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    {formError && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{formError}</p>}
                    <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
                        {saving ? 'Saving...' : 'Add Order'}
                    </button>
                </form>
            </div>
        )
    }

    // Orders List
    return (
        <div className="page-enter">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-extrabold">Orders</h1>
                    <button onClick={() => setParams({ add: '1' })} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center active:scale-95 transition-all">
                        <Plus size={20} />
                    </button>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-purple-300" />
                    <input
                        className="w-full bg-white/15 backdrop-blur-sm rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Search orders..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {['', ...STATUSES].map(s => (
                        <button
                            key={s || 'all'}
                            onClick={() => setFilterStatus(s)}
                            className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {s || 'All'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <input type="date" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <span className="text-gray-400 text-xs self-center">to</span>
                    <input type="date" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" value={toDate} onChange={e => setToDate(e.target.value)} />
                    {(fromDate || toDate) && (
                        <button onClick={() => { setFromDate(''); setToDate('') }} className="text-gray-400">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 py-3">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 font-medium">No orders found</p>
                        <button onClick={() => setParams({ add: '1' })} className="btn-primary mt-4">+ Add Order</button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-3">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
                        {orders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setParams({ detail: String(order.id) })}
                                className="card flex items-center gap-3 active:scale-98 cursor-pointer"
                            >
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Tag size={16} className="text-purple-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm text-gray-800">{order.orderId}</p>
                                        <span className={`status-pill ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{order.productName} · {order.sku}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-gray-400">{order.customerState} · Qty {order.quantity}</p>
                                        <p className="text-sm font-bold text-gray-700">{fmt(order.salePrice * order.quantity)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
