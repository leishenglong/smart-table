import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import tableRoutes from './routes/table'
import dataRoutes from './routes/data'
import aiRoutes from './routes/ai'
import authRoutes from './routes/auth'
import tenantRoutes from './routes/tenant'
import orgRoutes from './routes/organization'
import userRoutes from './routes/user'
import roleRoutes from './routes/role'
import permissionRoutes from './routes/permission'
import supervisionRoutes from './routes/supervision'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/organizations', orgRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/permissions', permissionRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/supervision', supervisionRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// 错误处理
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app
