const router = require('express').Router();
const authMiddleware = require('../middlewares/auth.middleware');
const controller = require('../../controllers/insights.controller');

router.use(authMiddleware);

router.get('/inflation', controller.basketInflation);
router.get('/anomalies', controller.anomalies);

module.exports = router;
