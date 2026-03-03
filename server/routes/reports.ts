import { Router } from 'express'
import { db } from '../db'
import { orders, inventory } from '../../shared/schema'
import { desc } from 'drizzle-orm'

const router = Router()

function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    next()
}

// GET P&L report (daily or monthly)
router.get('/pnl', requireAuth, async (req, res) => {
    try {
        const { type, from, to } = req.query as Record<string, string>
        let allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt))

        // Filter delivered orders for P&L
        if (from) allOrders = allOrders.filter(o => o.createdAt >= from)
        if (to) allOrders = allOrders.filter(o => o.createdAt <= to + 'T23:59:59')

        const delivered = allOrders.filter(o => o.status === 'Delivered')

        const totalRevenue = delivered.reduce((s, o) => s + o.salePrice * o.quantity, 0)
        const totalCost = delivered.reduce((s, o) => s + o.costPrice * o.quantity, 0)
        const totalProfit = totalRevenue - totalCost

        // Group by date or month
        const grouped: Record<string, { revenue: number; cost: number; profit: number; orders: number }> = {}
        for (const o of delivered) {
            const key = type === 'monthly'
                ? o.createdAt.substring(0, 7)
                : o.createdAt.substring(0, 10)
            if (!grouped[key]) grouped[key] = { revenue: 0, cost: 0, profit: 0, orders: 0 }
            grouped[key].revenue += o.salePrice * o.quantity
            grouped[key].cost += o.costPrice * o.quantity
            grouped[key].profit += (o.salePrice - o.costPrice) * o.quantity
            grouped[key].orders++
        }

        return res.json({
            summary: { totalRevenue, totalCost, totalProfit, totalOrders: delivered.length },
            breakdown: Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, data]) => ({ date, ...data }))
        })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET state-wise order count
router.get('/state-wise', requireAuth, async (req, res) => {
    try {
        const { from, to } = req.query as Record<string, string>
        let allOrders = await db.select().from(orders)
        if (from) allOrders = allOrders.filter(o => o.createdAt >= from)
        if (to) allOrders = allOrders.filter(o => o.createdAt <= to + 'T23:59:59')

        const stateMap: Record<string, { orders: number; revenue: number }> = {}
        for (const o of allOrders) {
            if (!stateMap[o.customerState]) stateMap[o.customerState] = { orders: 0, revenue: 0 }
            stateMap[o.customerState].orders++
            stateMap[o.customerState].revenue += o.salePrice * o.quantity
        }

        const result = Object.entries(stateMap)
            .map(([state, data]) => ({ state, ...data }))
            .sort((a, b) => b.orders - a.orders)

        return res.json(result)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET order status summary
router.get('/status-summary', requireAuth, async (req, res) => {
    try {
        const { from, to } = req.query as Record<string, string>
        let allOrders = await db.select().from(orders)
        if (from) allOrders = allOrders.filter(o => o.createdAt >= from)
        if (to) allOrders = allOrders.filter(o => o.createdAt <= to + 'T23:59:59')

        const statusMap: Record<string, number> = {}
        for (const o of allOrders) {
            statusMap[o.status] = (statusMap[o.status] || 0) + 1
        }

        const result = Object.entries(statusMap).map(([status, count]) => ({ status, count }))
        return res.json(result)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET SKU-wise sales report
router.get('/sku-wise', requireAuth, async (req, res) => {
    try {
        const { from, to } = req.query as Record<string, string>
        let allOrders = await db.select().from(orders).where()
        if (from) allOrders = allOrders.filter(o => o.createdAt >= from)
        if (to) allOrders = allOrders.filter(o => o.createdAt <= to + 'T23:59:59')

        const skuMap: Record<string, { productName: string; sku: string; quantity: number; revenue: number; profit: number }> = {}
        for (const o of allOrders) {
            if (!skuMap[o.sku]) skuMap[o.sku] = { productName: o.productName, sku: o.sku, quantity: 0, revenue: 0, profit: 0 }
            skuMap[o.sku].quantity += o.quantity
            skuMap[o.sku].revenue += o.salePrice * o.quantity
            skuMap[o.sku].profit += (o.salePrice - o.costPrice) * o.quantity
        }

        const result = Object.values(skuMap).sort((a, b) => b.revenue - a.revenue)
        return res.json(result)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET dashboard stats
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt))
        const allInventory = await db.select().from(inventory)

        const now = new Date()
        const todayStr = now.toISOString().substring(0, 10)
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const todayOrders = allOrders.filter(o => o.createdAt.startsWith(todayStr))
        const weekOrders = allOrders.filter(o => new Date(o.createdAt) >= weekStart)
        const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart)

        const deliveredOrders = allOrders.filter(o => o.status === 'Delivered')
        const totalRevenue = deliveredOrders.reduce((s, o) => s + o.salePrice * o.quantity, 0)
        const totalProfit = deliveredOrders.reduce((s, o) => s + (o.salePrice - o.costPrice) * o.quantity, 0)

        const lowStockItems = allInventory.filter(i => i.currentStock <= i.minStockLevel)

        return res.json({
            todayCount: todayOrders.length,
            weekCount: weekOrders.length,
            monthCount: monthOrders.length,
            totalRevenue,
            totalProfit,
            lowStockItems,
            recentOrders: allOrders.slice(0, 10)
        })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
