const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/productController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
];

router.get('/all',                    ctrl.getAllProducts);
router.get('/',                       ctrl.getProducts);
router.get('/:id',                    ctrl.getProduct);
router.post('/',                      validators, ctrl.createProduct);
router.put('/:id',                    validators, ctrl.updateProduct);
router.delete('/:id',                 ctrl.deleteProduct);
router.post('/:id/images',            ctrl.uploadMiddleware, ctrl.uploadImage);
router.delete('/:id/images/:filename',ctrl.deleteImage);

module.exports = router;
