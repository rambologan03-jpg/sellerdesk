import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ChevronLeft, Headphones } from 'lucide-react'

const ISSUE_TYPES = ['Payment delay', 'Wrong item', 'Return', 'Damaged']
const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved']

const STATUS_COLORS: Record<string, string> = {
    'Open': 'bg-red-100 text-red-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Resolved': 'bg-green-100 text-green-700',
}

const ISSUE_ICONS: Record<string, string> = {
    'Payment delay': '💰', 'Wrong item': '📦', 'Return': '↩️', 'Damaged': '💢'
}

const emptyForm = { orderId: '', issueType: 'Payment delay', description: '', status: 'Open' }

export default function TicketsPage() {
    const [params, setParams] = useSearchParams()
    const showAdd = params.get('add') === '1'
    const detailId = params.get('detail')

    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [detail, setDetail] = useState<any>(null)
    const [editStatus, setEditStatus] = useState('')

    const fetchTickets = useCallback(async () => {
        setLoading(true)
        const qs = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : ''
        const res = await fetch(`/api/tickets${qs}`, { credentials: 'include' })
        setTickets(await res.json())
        setLoading(false)
    }, [filterStatus])

    useEffect(() => { fetchTickets() }, [fetchTickets])

    useEffect(() => {
        if (detailId) {
            fetch(`/api/tickets/${detailId}`, { credentials: 'include' })
                .then(r => r.json()).then(d => { setDetail(d); setEditStatus(d.status) })
        } else { setDetail(null) }
    }, [detailId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.orderId || !form.description) { setFormError('All fields are required'); return }
        setSaving(true)
        setFormError('')
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error((await res.json()).error)
            setForm(emptyForm)
            setParams({})
            fetchTickets()
        } catch (err: any) { setFormError(err.message) }
        finally { setSaving(false) }
    }

    const handleUpdateStatus = async () => {
        await fetch(`/api/tickets/${detail.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: editStatus })
        })
        setDetail({ ...detail, status: editStatus })
        fetchTickets()
    }

    // Detail view
    if (detailId && detail) {
        return (
            <div className="page-enter">
                <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-6">
                    <button onClick={() => setParams({})} className="flex items-center gap-1 text-purple-200 text-sm mb-4">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-xl font-extrabold">Ticket Details</h1>
                    <p className="text-purple-200 text-sm">#{detail.id}</p>
                </div>
                <div className="px-4 py-4 space-y-4">
                    <div className="card space-y-3">
                        {[
                            { label: 'Order ID', val: detail.orderId },
                            { label: 'Issue Type', val: `${ISSUE_ICONS[detail.issueType]} ${detail.issueType}` },
                            { label: 'Status', val: detail.status },
                            { label: 'Date', val: new Date(detail.createdAt).toLocaleDateString('en-IN') },
                        ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                                <span className={`font-semibold text-sm ${label === 'Status' ? `px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[val]}` : 'text-gray-800'}`}>{String(val)}</span>
                            </div>
                        ))}
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</span>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{detail.description}</p>
                        </div>
                    </div>
                    <div className="card">
                        <p className="label mb-3">Update Status</p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {TICKET_STATUSES.map(s => (
                                <button key={s} onClick={() => setEditStatus(s)}
                                    className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${editStatus === s ? 'border-purple-700 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleUpdateStatus} className="btn-primary w-full">Update Status</button>
                    </div>
                </div>
            </div>
        )
    }

    // Add form
    if (showAdd) {
        return (
            <div className="page-enter">
                <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-6">
                    <button onClick={() => setParams({})} className="flex items-center gap-1 text-purple-200 text-sm mb-4">
                        <ChevronLeft size={16} /> Back
                    </button>
                    <h1 className="text-xl font-extrabold">New Support Ticket</h1>
                </div>
                <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
                    <div>
                        <label className="label">Order ID *</label>
                        <input className="input-field" placeholder="e.g. MO123456789" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} />
                    </div>
                    <div>
                        <label className="label">Issue Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ISSUE_TYPES.map(t => (
                                <button type="button" key={t} onClick={() => setForm(f => ({ ...f, issueType: t }))}
                                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5 ${form.issueType === t ? 'border-purple-700 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                                    <span>{ISSUE_ICONS[t]}</span> {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="label">Description *</label>
                        <textarea className="input-field resize-none" rows={4} placeholder="Describe the issue..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    {formError && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{formError}</p>}
                    <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-base">
                        {saving ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </form>
            </div>
        )
    }

    // List view
    return (
        <div className="page-enter">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-extrabold">Support Tickets</h1>
                    <button onClick={() => setParams({ add: '1' })} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center active:scale-95">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {['', ...TICKET_STATUSES].map(s => (
                        <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                            className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === s ? 'bg-white text-purple-700' : 'bg-white/15 text-white'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="px-4 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12">
                        <Headphones size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No tickets found</p>
                        <button onClick={() => setParams({ add: '1' })} className="btn-primary mt-4">+ New Ticket</button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tickets.map(ticket => (
                            <div key={ticket.id} onClick={() => setParams({ detail: String(ticket.id) })}
                                className="card flex items-center gap-3 cursor-pointer active:scale-98">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                                    {ISSUE_ICONS[ticket.issueType]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm text-gray-800">#{ticket.id} · {ticket.orderId}</p>
                                        <span className={`status-pill ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">{ticket.issueType}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{ticket.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
