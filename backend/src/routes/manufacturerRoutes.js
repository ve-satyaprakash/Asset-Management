const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/manufacturerController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',    ctrl.getAllManufacturers);
router.get('/',       ctrl.getManufacturers);
router.get('/:id',    ctrl.getManufacturer);
router.post('/',      validators, ctrl.createManufacturer);
router.put('/:id',    validators, ctrl.updateManufacturer);
router.delete('/:id', ctrl.deleteManufacturer);

module.exports = router;
