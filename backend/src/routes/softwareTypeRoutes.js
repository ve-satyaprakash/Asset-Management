const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/softwareTypeController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',  ctrl.getAllSoftwareTypes);
router.get('/',     ctrl.getSoftwareTypes);
router.get('/:id',  ctrl.getSoftwareType);
router.post('/',    validators, ctrl.createSoftwareType);
router.put('/:id',  validators, ctrl.updateSoftwareType);
router.delete('/:id', ctrl.deleteSoftwareType);

module.exports = router;
