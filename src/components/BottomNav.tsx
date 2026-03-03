import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, BarChart2, MoreHorizontal } from 'lucide-react'

const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/more', label: 'More', icon: MoreHorizontal },
]

export default function BottomNav() {
    const location = useLocation()

    return (
        <nav className="bottom-nav">
            {navItems.map(({ to, label, icon: Icon }) => {
                const isActive = to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(to)
                return (
                    <NavLink key={to} to={to} className="nav-item">
                        <Icon
                            size={22}
                            className={isActive ? 'text-purple-700' : 'text-gray-400'}
                            strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        <span className={`text-[10px] font-semibold ${isActive ? 'text-purple-700' : 'text-gray-400'}`}>
                            {label}
                        </span>
                        {isActive && (
                            <div className="absolute bottom-1 w-4 h-0.5 bg-purple-700 rounded-full" />
                        )}
                    </NavLink>
                )
            })}
        </nav>
    )
}
