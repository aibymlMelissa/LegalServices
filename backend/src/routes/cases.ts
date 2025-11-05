import { Router } from 'express';
import { getCases, getCase, createCase, updateCase, deleteCase } from '../controllers/caseController';
import { authenticateToken } from '../middleware/auth';
import { validateCase } from '../middleware/validation';

const router = Router();

router.use(authenticateToken);

router.get('/', getCases);
router.get('/:id', getCase);
router.post('/', validateCase.create, createCase);
router.put('/:id', validateCase.update, updateCase);
router.delete('/:id', deleteCase);

export default router;