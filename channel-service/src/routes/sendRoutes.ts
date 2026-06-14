import { Router } from 'express';
import { sendMessage } from '../controllers/sendController';

const router = Router();

router.post('/', sendMessage);

export default router;
