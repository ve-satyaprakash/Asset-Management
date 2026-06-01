const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/assetController');

const router = express.Router();

const validators = [
  body('productTypeId').notEmpty().isInt().withMessage('Product Type is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/',    ctrl.getAssets);
router.get('/:id', ctrl.getAsset);
router.post('/',   validators, ctrl.createAsset);
router.put('/:id', validators, ctrl.updateAsset);
router.delete('/:id', ctrl.deleteAsset);

module.exports = router;
