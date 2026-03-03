import { Router } from 'express'
import { db } from '../db'
import { orders, inventory } from '../../shared/schema'
import { eq, like, and, gte, lte, desc } from 'drizzle-orm'

const router = Router()

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    next()
}

// GET all orders with optional filters
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status, from, to, search } = req.query as Record<string, string>
        let result = await db.select().from(orders).orderBy(desc(orders.createdAt))

        if (status) result = result.filter(o => o.status === status)
        if (from) result = result.filter(o => o.createdAt >= from)
        if (to) result = result.filter(o => o.createdAt <= to + 'T23:59:59')
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(o =>
                o.orderId.toLowerCase().includes(q) ||
                o.productName.toLowerCase().includes(q) ||
                o.sku.toLowerCase().includes(q)
            )
        }

        return res.json(result)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET single order
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const order = await db.select().from(orders).where(eq(orders.id, Number(req.params.id))).get()
        if (!order) return res.status(404).json({ error: 'Not found' })
        return res.json(order)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// Check duplicate order ID
router.get('/check-duplicate/:orderId', requireAuth, async (req, res) => {
    try {
        const existing = await db.select().from(orders).where(eq(orders.orderId, req.params.orderId))
        return res.json({ isDuplicate: existing.length > 0, count: existing.length })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// POST create order
router.post('/', requireAuth, async (req, res) => {
    try {
        const { orderId, productName, sku, quantity, salePrice, costPrice, customerState, status } = req.body

        // Reduce inventory stock if sku exists
        const invItem = await db.select().from(inventory).where(eq(inventory.sku, sku)).get()
        if (invItem) {
            const newStock = Math.max(0, invItem.currentStock - Number(quantity))
            await db.update(inventory)
                .set({ currentStock: newStock, updatedAt: new Date().toISOString() })
                .where(eq(inventory.sku, sku))
        }

        const [newOrder] = await db.insert(orders).values({
            orderId, productName, sku,
            quantity: Number(quantity),
            salePrice: Number(salePrice),
            costPrice: Number(costPrice),
            customerState,
            status: status || 'Pending'
        }).returning()

        return res.status(201).json(newOrder)
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// PATCH update order
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const [updated] = await db.update(orders)
            .set(req.body)
            .where(eq(orders.id, Number(req.params.id)))
            .returning()
        if (!updated) return res.status(404).json({ error: 'Not found' })
        return res.json(updated)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// DELETE order (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        if (req.session.role !== 'owner') return res.status(403).json({ error: 'Forbidden' })
        await db.delete(orders).where(eq(orders.id, Number(req.params.id)))
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
