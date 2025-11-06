import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateAuth } from '../middleware/validation';

const router = Router();

router.post('/register', validateAuth.register, register);
router.post('/login', validateAuth.login, login);
router.get('/profile', authenticateToken, getProfile);

// Enterprise auth endpoints
router.get('/security-dashboard', authenticateToken, async (req, res) => {
  try {
    const { enterpriseAuthService } = await import('../services/enterpriseAuthService');
    const dashboard = await enterpriseAuthService.getSecurityDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error('Security dashboard error:', error);
    res.status(500).json({ error: 'Failed to get security dashboard' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { enterpriseAuthService } = await import('../services/enterpriseAuthService');
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    const result = await enterpriseAuthService.changePassword(userId, currentPassword, newPassword, ip);
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;