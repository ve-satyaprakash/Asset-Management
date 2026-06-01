const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/assetStateController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',    ctrl.getAllAssetStates);
router.get('/',       ctrl.getAssetStates);
router.get('/:id',    ctrl.getAssetState);
router.post('/',      validators, ctrl.createAssetState);
router.put('/:id',    validators, ctrl.updateAssetState);
router.delete('/:id', ctrl.deleteAssetState);

module.exports = router;
