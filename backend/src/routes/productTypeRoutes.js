const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/productTypeController');

const router = express.Router();

const ASSET_TYPES      = ['Asset', 'Consumable', 'Component'];
const ASSET_CATEGORIES = ['IT', 'Non IT'];
const CATEGORIES       = ['Hardware', 'Software', 'Network', 'Peripheral', 'Furniture', 'Vehicle', 'Other'];

const validators = [
  body('displayName').trim().notEmpty().withMessage('Display Name is required.'),
  body('displayPluralName').trim().notEmpty().withMessage('Display Plural Name is required.'),
  body('apiName')
    .trim()
    .notEmpty()
    .withMessage('API Name is required.')
    .matches(/^[a-zA-Z0-9_\-]+$/)
    .withMessage('API Name may only contain letters, numbers, hyphens, and underscores.'),
  body('apiPluralName')
    .trim()
    .notEmpty()
    .withMessage('API Plural Name is required.')
    .matches(/^[a-zA-Z0-9_\-]+$/)
    .withMessage('API Plural Name may only contain letters, numbers, hyphens, and underscores.'),
  body('category')
    .notEmpty()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),
  body('assetType')
    .notEmpty()
    .isIn(ASSET_TYPES)
    .withMessage(`Asset Type must be one of: ${ASSET_TYPES.join(', ')}.`),
  body('assetCategory')
    .notEmpty()
    .isIn(ASSET_CATEGORIES)
    .withMessage(`Asset Category must be one of: ${ASSET_CATEGORIES.join(', ')}.`),
];

router.get('/all', ctrl.getAllProductTypes);
router.get('/',    ctrl.getProductTypes);
router.get('/:id', ctrl.getProductType);
router.post('/',   validators, ctrl.createProductType);
router.put('/:id', validators, ctrl.updateProductType);
router.delete('/:id', ctrl.deleteProductType);

module.exports = router;
