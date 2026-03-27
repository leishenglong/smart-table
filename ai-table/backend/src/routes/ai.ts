import { Router, Request, Response } from 'express'
import { parseTableFromNaturalLanguage } from '../services/aiService'
import { authenticate } from '../middleware/authMiddleware'

const router = Router()

// 引入 authentication 中间件
router.use(authenticate)

// 自然语言解析生成表格配置
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { text } = req.body
    
    if (!text) {
      return res.status(400).json({ success: false, message: '请输入表格描述' })
    }
    
    const result = await parseTableFromNaturalLanguage(text)
    
    res.json({ success: true, data: result })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'AI解析失败，请重试' })
  }
})

export default router
