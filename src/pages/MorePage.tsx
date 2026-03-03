import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut, Users, Plus, Trash2, Headphones, Settings, Info, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function MorePage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState<any[]>([])
    const [showAddStaff, setShowAddStaff] = useState(false)
    const [staffForm, setStaffForm] = useState({ name: '', pin: '', role: 'staff' })
    const [staffError, setStaffError] = useState('')
    const [staffSaving, setStaffSaving] = useState(false)

    const isOwner = user?.role === 'owner'

    useEffect(() => {
        if (isOwner) {
            fetch('/api/users', { credentials: 'include' }).then(r => r.json()).then(setUsers)
        }
    }, [isOwner])

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!staffForm.name || !staffForm.pin || staffForm.pin.length !== 4) {
            setStaffError('Name and 4-digit PIN required')
            return
        }
        setStaffSaving(true)
        setStaffError('')
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(staffForm)
            })
            if (!res.ok) throw new Error((await res.json()).error)
            const newUser = await res.json()
            setUsers(u => [...u, newUser])
            setStaffForm({ name: '', pin: '', role: 'staff' })
            setShowAddStaff(false)
        } catch (err: any) {
            setStaffError(err.message)
        } finally {
            setStaffSaving(false)
        }
    }

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Delete this user?')) return
        await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' })
        setUsers(u => u.filter(x => x.id !== id))
    }

    const handleLogout = async () => {
        if (confirm('Log out?')) await logout()
    }

    return (
        <div className="page-enter">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white px-4 pt-14 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                        {user?.role === 'owner' ? '👑' : '👤'}
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold">{user?.name}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${user?.role === 'owner' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                            {user?.role === 'owner' ? '👑 Owner' : '👤 Staff'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* Support Tickets shortcut */}
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Support</p>
                    <button
                        onClick={() => navigate('/tickets')}
                        className="card w-full flex items-center gap-3 active:scale-95 transition-all"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Headphones size={18} className="text-blue-600" />
                        </div>
                        <span className="font-semibold text-sm text-gray-700 flex-1 text-left">Support Tickets</span>
                        <ChevronRight size={16} className="text-gray-300" />
                    </button>
                </div>

                {/* Staff Management (Owner only) */}
                {isOwner && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Staff Management</p>
                            <button onClick={() => setShowAddStaff(!showAddStaff)}
                                className="flex items-center gap-1 text-purple-700 text-xs font-semibold">
                                <Plus size={12} /> Add
                            </button>
                        </div>

                        {showAddStaff && (
                            <form onSubmit={handleAddStaff} className="card bg-purple-50 border-purple-100 mb-3 space-y-3">
                                <p className="font-semibold text-sm text-purple-700">New Staff Member</p>
                                <div>
                                    <label className="label">Name *</label>
                                    <input className="input-field" placeholder="Staff name" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label">4-Digit PIN *</label>
                                    <input className="input-field" type="password" maxLength={4} pattern="[0-9]{4}" inputMode="numeric" placeholder="••••" value={staffForm.pin} onChange={e => setStaffForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <div className="flex gap-2">
                                        {['staff', 'owner'].map(r => (
                                            <button type="button" key={r} onClick={() => setStaffForm(f => ({ ...f, role: r }))}
                                                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${staffForm.role === r ? 'border-purple-700 bg-purple-100 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                                                {r === 'owner' ? '👑 Owner' : '👤 Staff'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {staffError && <p className="text-red-500 text-xs">{staffError}</p>}
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setShowAddStaff(false); setStaffForm({ name: '', pin: '', role: 'staff' }) }} className="flex-1 btn-secondary">Cancel</button>
                                    <button type="submit" disabled={staffSaving} className="flex-1 btn-primary">{staffSaving ? '...' : 'Add'}</button>
                                </div>
                            </form>
                        )}

                        <div className="card p-0 overflow-hidden">
                            {users.length === 0 ? (
                                <div className="px-4 py-6 text-center text-gray-400 text-sm">No users found</div>
                            ) : users.map((u: any, i: number) => (
                                <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${i < users.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-lg">
                                            {u.role === 'owner' ? '👑' : '👤'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{u.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                                        </div>
                                    </div>
                                    {u.id !== user?.id && (
                                        <button onClick={() => handleDeleteUser(u.id)} className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center active:scale-95">
                                            <Trash2 size={14} className="text-red-500" />
                                        </button>
                                    )}
                                    {u.id === user?.id && (
                                        <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">You</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* App info */}
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">About</p>
                    <div className="card flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Info size={18} className="text-purple-700" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">SellerDesk v1.0</p>
                            <p className="text-xs text-gray-400">Meesho Seller Management PWA</p>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-2xl text-red-600 active:scale-95 transition-all">
                    <LogOut size={18} />
                    <span className="font-semibold text-sm">Log Out</span>
                </button>
            </div>
        </div>
    )
}
