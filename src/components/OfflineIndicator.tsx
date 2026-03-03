import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [wasOffline, setWasOffline] = useState(false)
    const [showBackOnline, setShowBackOnline] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            if (wasOffline) {
                setShowBackOnline(true)
                setTimeout(() => setShowBackOnline(false), 3000)
            }
        }
        const handleOffline = () => {
            setIsOnline(false)
            setWasOffline(true)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [wasOffline])

    if (!isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
                <WifiOff size={14} />
                No internet connection
            </div>
        )
    }

    if (showBackOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-pulse">
                <Wifi size={14} />
                Back online
            </div>
        )
    }

    return null
}
