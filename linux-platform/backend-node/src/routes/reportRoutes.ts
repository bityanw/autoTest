import { Router } from 'express';

const router = Router();

// 报告相关路由（待实现）
router.get('/list', (req, res) => {
  res.json({ success: true, reports: [] });
});

export default router;
