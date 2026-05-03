const router = require('express').Router();
const controller = require('../../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rate-limit.middleware');
const { RegisterSchema, LoginSchema } = require('../../utils/validation-schemas');

router.post('/register', authLimiter, validate(RegisterSchema), controller.register);
router.post('/login', authLimiter, validate(LoginSchema), controller.login);
router.post('/refresh', authLimiter, controller.refresh);

module.exports = router;
