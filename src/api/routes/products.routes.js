const router = require('express').Router();
const authMiddleware = require('../middlewares/auth.middleware');
const insightsController = require('../../controllers/insights.controller');

router.use(authMiddleware);

router.get('/:id/price-history', insightsController.priceTrend);
router.get('/:id/markets', insightsController.marketComparison);

module.exports = router;
