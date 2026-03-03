import { Router } from 'express'
import { db } from '../db'
import { tickets } from '../../shared/schema'
import { eq, desc } from 'drizzle-orm'

const router = Router()

function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    next()
}

// GET all tickets
router.get('/', requireAuth, async (req, res) => {
    try {
        const { status } = req.query as Record<string, string>
        let result = await db.select().from(tickets).orderBy(desc(tickets.createdAt))
        if (status) result = result.filter(t => t.status === status)
        return res.json(result)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// GET single ticket
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const ticket = await db.select().from(tickets).where(eq(tickets.id, Number(req.params.id))).get()
        if (!ticket) return res.status(404).json({ error: 'Not found' })
        return res.json(ticket)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// POST create ticket
router.post('/', requireAuth, async (req, res) => {
    try {
        const { orderId, issueType, description, status } = req.body
        const [ticket] = await db.insert(tickets).values({
            orderId, issueType, description, status: status || 'Open'
        }).returning()
        return res.status(201).json(ticket)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// PATCH update ticket
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const [updated] = await db.update(tickets)
            .set(req.body)
            .where(eq(tickets.id, Number(req.params.id)))
            .returning()
        if (!updated) return res.status(404).json({ error: 'Not found' })
        return res.json(updated)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// DELETE ticket (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        if (req.session.role !== 'owner') return res.status(403).json({ error: 'Forbidden' })
        await db.delete(tickets).where(eq(tickets.id, Number(req.params.id)))
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
