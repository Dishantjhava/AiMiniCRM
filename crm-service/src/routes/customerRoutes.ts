import { Router } from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController';

const router = Router();

router.get('/', getCustomers);
router.post('/', createCustomer);

export default router;
