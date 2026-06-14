import { Router } from 'express';
import { generateAudience } from '../controllers/audienceController';

const router = Router();

router.post('/generate', generateAudience);

export default router;
