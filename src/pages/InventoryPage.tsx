import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, AlertTriangle, X, ChevronLeft, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const emptyForm = { productName: '', sku: '', currentStock: '', minStockLevel: '', costPrice: '' }

export default function InventoryPage() {
    const { user } = useAuth()
    const [params, setParams] = useSearchParams()
    const showAdd = params.get('add') === '1'

    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)

    const fetchInventory = useCallback(async () => {
        setLoading(true)
        const qs = search ? `?search=${encodeURIComponent(search)}` : ''
        const res = await fetch(`/api/inventory${qs}`, { credentials: 'include' })
        const data = await res.json()
        setItems(data)
        setLoading(false)
    }, [search])

    useEffect(() => { fetchInventory() }, [fetchInventory])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.productName || !form.sku || !form.currentStock || !form.minStockLevel || !form.costPrice) {
            setFormError('All fields are required')
            return
        }
        setSaving(true)
        setFormError('')
        try {
            const url = editId ? `/api/inventory/${editId}` : '/api/inventory'
            const method = editId ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error((await res.json()).error)
            setForm(emptyForm)
            setEditId(null)
            setParams({})
            fetchInventory()
        } catch (err: any) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (item: any) => {
        setForm({
            productName: item.productName,
            sku: item.sku,
            currentStock: String(item.currentStock),
            minStockLevel: String(item.minStockLevel),
            costPrice: String(item.costPrice),
        })
        setEditId(item.id)
        setParams({ add: '1' })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this inventory item?')) return
        await fetch(`/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' })
        fetchInventory()
    }

    const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

    if (showAdd) {
        return (
            <div className="page-enter">
                <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-6">
                    <button onClick={() => { setParams({}); setEditId(null); setForm(emptyForm) }} className="flex items-center gap-1 text-purple-200 text-sm mb-4">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-xl font-extrabold">{editId ? 'Edit SKU' : 'Add New SKU'}</h1>
                </div>
                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
                    <div>
                        <label className="label">Product Name *</label>
                        <input className="input-field" placeholder="e.g. Cotton Saree Yellow" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label">SKU Code *</label>
                        <input className="input-field" placeholder="e.g. SAR-YLW-L" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} disabled={!!editId} />
                        {editId && <p className="text-xs text-gray-400 mt-1">SKU cannot be changed</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Current Stock *</label>
                            <input className="input-field" type="number" min="0" placeholder="0" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Min Stock Level *</label>
                            <input className="input-field" type="number" min="0" placeholder="5" value={form.minStockLevel} onChange={e => setForm(f => ({ ...f, minStockLevel: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Cost Price (₹) *</label>
                        <input className="input-field" type="number" placeholder="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
                    </div>
                    {formError && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{formError}</p>}
                    <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
                        {saving ? 'Saving...' : editId ? 'Update SKU' : 'Add SKU'}
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="page-enter">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-extrabold">Inventory</h1>
                    {user?.role === 'owner' && (
                        <button onClick={() => setParams({ add: '1' })} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center active:scale-95 transition-all">
                            <Plus size={20} />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-purple-300" />
                    <input
                        className="w-full bg-white/15 backdrop-blur-sm rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Search SKU or product..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-3"><X size={14} className="text-purple-300" /></button>}
                </div>
            </div>

            <div className="px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No inventory items</p>
                        {user?.role === 'owner' && (
                            <button onClick={() => setParams({ add: '1' })} className="btn-primary mt-4">+ Add SKU</button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-3">{items.length} SKU{items.length !== 1 ? 's' : ''}</p>
                        {items.map(item => {
                            const isLow = item.currentStock <= item.minStockLevel
                            return (
                                <div key={item.id} className={`card ${isLow ? 'border-red-200 bg-red-50/30' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-100' : 'bg-purple-100'}`}>
                                                <Package size={18} className={isLow ? 'text-red-500' : 'text-purple-700'} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{item.productName}</p>
                                                <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                                            </div>
                                        </div>
                                        {isLow && <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-center">
                                            <p className={`text-lg font-extrabold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{item.currentStock}</p>
                                            <p className="text-xs text-gray-400">In Stock</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-extrabold text-gray-800">{item.minStockLevel}</p>
                                            <p className="text-xs text-gray-400">Min Level</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-extrabold text-gray-800">{fmt(item.costPrice)}</p>
                                            <p className="text-xs text-gray-400">Cost Price</p>
                                        </div>
                                    </div>
                                    {isLow && (
                                        <div className="mt-2 bg-red-100 rounded-lg px-3 py-1.5">
                                            <p className="text-xs text-red-600 font-semibold">⚠️ Stock below minimum level!</p>
                                        </div>
                                    )}
                                    {user?.role === 'owner' && (
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleEdit(item)} className="flex-1 btn-secondary text-xs">Edit</button>
                                            <button onClick={() => handleDelete(item.id)} className="flex-1 btn-danger text-xs">Delete</button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
