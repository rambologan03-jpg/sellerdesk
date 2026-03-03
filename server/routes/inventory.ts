import { Router } from 'express'
import { db } from '../db'
import { inventory } from '../../shared/schema'
import { eq, desc } from 'drizzle-orm'

const router = Router()

function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    next()
}

function requireOwner(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    if (req.session.role !== 'owner') return res.status(403).json({ error: 'Forbidden' })
    next()
}

// GET all inventory
router.get('/', requireAuth, async (req, res) => {
    try {
        const { search } = req.query as Record<string, string>
        let result = await db.select().from(inventory).orderBy(desc(inventory.updatedAt))
        if (search) {
            const q = search.toLowerCase()
            result = result.filter(i =>
                i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
            )
        }
        return res.json(result)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET single item
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const item = await db.select().from(inventory).where(eq(inventory.id, Number(req.params.id))).get()
        if (!item) return res.status(404).json({ error: 'Not found' })
        return res.json(item)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// POST create inventory item
router.post('/', requireOwner, async (req, res) => {
    try {
        const { productName, sku, currentStock, minStockLevel, costPrice } = req.body
        const [item] = await db.insert(inventory).values({
            productName, sku,
            currentStock: Number(currentStock),
            minStockLevel: Number(minStockLevel),
            costPrice: Number(costPrice),
        }).returning()
        return res.status(201).json(item)
    } catch (err: any) {
        if (err.message?.includes('UNIQUE')) {
            return res.status(400).json({ error: 'SKU already exists' })
        }
        return res.status(500).json({ error: 'Server error' })
    }
})

// PATCH update inventory item
router.patch('/:id', requireOwner, async (req, res) => {
    try {
        const [updated] = await db.update(inventory)
            .set({ ...req.body, updatedAt: new Date().toISOString() })
            .where(eq(inventory.id, Number(req.params.id)))
            .returning()
        if (!updated) return res.status(404).json({ error: 'Not found' })
        return res.json(updated)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// DELETE inventory item
router.delete('/:id', requireOwner, async (req, res) => {
    try {
        await db.delete(inventory).where(eq(inventory.id, Number(req.params.id)))
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
