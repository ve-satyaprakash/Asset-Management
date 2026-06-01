const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/vendorController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',  ctrl.getAllVendors);
router.get('/',     ctrl.getVendors);
router.get('/:id',  ctrl.getVendor);
router.post('/',    validators, ctrl.createVendor);
router.put('/:id',  validators, ctrl.updateVendor);
router.delete('/:id', ctrl.deleteVendor);

module.exports = router;
