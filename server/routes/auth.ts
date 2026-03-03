import { Router } from 'express'
import { db } from '../db'
import { users } from '../../shared/schema'
import { eq } from 'drizzle-orm'

const router = Router()

router.post('/login', async (req, res) => {
    try {
        const { pin } = req.body
        if (!pin || pin.length !== 4) {
            return res.status(400).json({ error: 'PIN must be 4 digits' })
        }

        const user = await db.select().from(users).where(eq(users.pin, String(pin))).get()

        if (!user) {
            return res.status(401).json({ error: 'Invalid PIN' })
        }

        req.session.userId = user.id
        req.session.role = user.role
        req.session.name = user.name

        return res.json({ id: user.id, name: user.name, role: user.role })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: 'Server error' })
    }
})

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ ok: true })
    })
})

router.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
    }
    return res.json({
        id: req.session.userId,
        name: req.session.name,
        role: req.session.role
    })
})

export default router
