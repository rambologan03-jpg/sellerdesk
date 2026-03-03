import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Delete } from 'lucide-react'

export default function LoginPage() {
    const { login } = useAuth()
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleKey = async (key: string) => {
        if (loading) return
        if (key === 'del') {
            setPin(p => p.slice(0, -1))
            setError('')
            return
        }
        if (pin.length >= 4) return
        const newPin = pin + key
        setPin(newPin)
        setError('')

        if (newPin.length === 4) {
            setLoading(true)
            try {
                await login(newPin)
            } catch (e: any) {
                setError(e.message || 'Invalid PIN')
                setPin('')
            } finally {
                setLoading(false)
            }
        }
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 flex flex-col items-center justify-center p-6">
            {/* Logo area */}
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-2xl">
                    <span className="text-4xl">🏪</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">SellerDesk</h1>
                <p className="text-purple-200 text-sm mt-1 font-medium">Meesho Seller Management</p>
            </div>

            {/* Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20">
                <p className="text-white/80 text-sm text-center mb-6 font-medium">Enter your PIN to login</p>

                {/* PIN dots */}
                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-5 h-5 rounded-full border-2 border-white/60 transition-all duration-200 ${i < pin.length ? 'bg-white scale-110' : 'bg-transparent'
                                }`}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-2 mb-6 text-center">
                        <p className="text-red-200 text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                    {keys.map((key, idx) => {
                        if (key === '') return <div key={idx} />
                        return (
                            <button
                                key={idx}
                                onClick={() => handleKey(key)}
                                disabled={loading}
                                className={`h-16 rounded-2xl font-semibold text-lg transition-all duration-150 active:scale-95 
                  ${key === 'del'
                                        ? 'bg-white/10 text-white/70 flex items-center justify-center'
                                        : 'bg-white/15 text-white hover:bg-white/25 shadow-sm'
                                    }`}
                            >
                                {key === 'del' ? <Delete size={20} /> : key}
                            </button>
                        )
                    })}
                </div>

                {loading && (
                    <div className="mt-6 flex justify-center">
                        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <p className="text-purple-300/60 text-xs mt-8 text-center">
                Default owner PIN: 1234
            </p>
        </div>
    )
}
