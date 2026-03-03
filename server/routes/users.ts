import { Router } from 'express'
import { db } from '../db'
import { users } from '../../shared/schema'
import { eq } from 'drizzle-orm'

const router = Router()

function requireOwner(req: any, res: any, next: any) {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' })
    if (req.session.role !== 'owner') return res.status(403).json({ error: 'Forbidden' })
    next()
}

// GET all users (owner only)
router.get('/', requireOwner, async (req, res) => {
    try {
        const allUsers = await db.select({ id: users.id, name: users.name, role: users.role, createdAt: users.createdAt }).from(users)
        return res.json(allUsers)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// POST create staff user (owner only)
router.post('/', requireOwner, async (req, res) => {
    try {
        const { name, pin, role } = req.body
        if (!name || !pin || pin.length !== 4) {
            return res.status(400).json({ error: 'Name and 4-digit PIN required' })
        }
        // Check if PIN is already in use
        const existing = await db.select().from(users).where(eq(users.pin, pin)).get()
        if (existing) {
            return res.status(400).json({ error: 'PIN already in use' })
        }
        const [user] = await db.insert(users).values({ name, pin, role: role || 'staff' }).returning({
            id: users.id, name: users.name, role: users.role, createdAt: users.createdAt
        })
        return res.status(201).json(user)
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

// DELETE user (owner only, cannot delete self)
router.delete('/:id', requireOwner, async (req, res) => {
    try {
        if (Number(req.params.id) === req.session.userId) {
            return res.status(400).json({ error: 'Cannot delete yourself' })
        }
        await db.delete(users).where(eq(users.id, Number(req.params.id)))
        return res.json({ ok: true })
    } catch (err) {
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
