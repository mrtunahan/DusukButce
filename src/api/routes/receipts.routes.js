const router = require('express').Router();
const multer = require('multer');
const controller = require('../../controllers/receipts.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadLimiter } = require('../middlewares/rate-limit.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Only JPEG and PNG allowed'), { status: 400 }));
  },
});

router.use(authMiddleware);

router.post('/', uploadLimiter, upload.single('image'), controller.upload);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.get('/:id/status', controller.getStatus);
router.delete('/:id', controller.remove);

module.exports = router;
