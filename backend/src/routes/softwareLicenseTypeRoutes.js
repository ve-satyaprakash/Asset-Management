const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/softwareLicenseTypeController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',  ctrl.getAllSoftwareLicenseTypes);
router.get('/',     ctrl.getSoftwareLicenseTypes);
router.get('/:id',  ctrl.getSoftwareLicenseType);
router.post('/',    validators, ctrl.createSoftwareLicenseType);
router.put('/:id',  validators, ctrl.updateSoftwareLicenseType);
router.delete('/:id', ctrl.deleteSoftwareLicenseType);

module.exports = router;
