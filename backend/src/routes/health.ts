import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get comprehensive health status
router.get('/status', async (req, res) => {
  try {
    const { enterpriseHealthService } = await import('../services/enterpriseHealthService');
    const status = await enterpriseHealthService.getHealthStatus();
    res.json(status);
  } catch (error) {
    console.error('Health status error:', error);
    res.status(500).json({ error: 'Failed to get health status' });
  }
});

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const { enterpriseHealthService } = await import('../services/enterpriseHealthService');
    const metrics = await enterpriseHealthService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// Run system benchmark tests
router.post('/benchmark', async (req, res) => {
  try {
    const { enterpriseHealthService } = await import('../services/enterpriseHealthService');
    const results = await enterpriseHealthService.runBenchmarkTests();
    res.json(results);
  } catch (error) {
    console.error('Benchmark error:', error);
    res.status(500).json({ error: 'Failed to run benchmark tests' });
  }
});

// Get system diagnostics
router.get('/diagnostics', async (req, res) => {
  try {
    const { enterpriseHealthService } = await import('../services/enterpriseHealthService');
    const diagnostics = await enterpriseHealthService.runBenchmarkTests();
    res.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics error:', error);
    res.status(500).json({ error: 'Failed to get system diagnostics' });
  }
});

export default router;