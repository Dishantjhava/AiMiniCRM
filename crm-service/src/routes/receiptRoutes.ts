import { Router } from 'express'
import { processReceipt } from '../controllers/receiptController'

const router = Router()
router.post('/', processReceipt)
export default router
