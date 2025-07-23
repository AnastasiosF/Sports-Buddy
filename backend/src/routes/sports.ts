import { Router } from 'express';
import { getSports, getSport } from '../controllers/sportsController';

const router = Router();

router.get('/', getSports);
router.get('/:id', getSport);

export default router;
