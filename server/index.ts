import express from 'express'
import session from 'express-session'
import cors from 'cors'
import path from 'path'
import { initializeDatabase } from './db'

import authRouter from './routes/auth'
import ordersRouter from './routes/orders'
import inventoryRouter from './routes/inventory'
import ticketsRouter from './routes/tickets'
import reportsRouter from './routes/reports'
import usersRouter from './routes/users'

// Session type augmentation
declare module 'express-session' {
    interface SessionData {
        userId: number
        role: 'owner' | 'staff'
        name: string
    }
}

const app = express()
const PORT = process.env.PORT || 3001

// Initialize database
initializeDatabase()

// Trust deployment proxies (like Railway)
app.set('trust proxy', 1)

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}))
app.use(express.json())
app.use(session({
    secret: process.env.SESSION_SECRET || "sellerdesk-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/users', usersRouter)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')))
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'))
    })
}

// Initialize database then start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 SellerDesk server running on http://localhost:${PORT}`)
    })
}).catch(err => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
})

export default app
