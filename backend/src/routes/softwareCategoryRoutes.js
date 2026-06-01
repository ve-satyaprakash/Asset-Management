const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/softwareCategoryController');

const router = express.Router();

const validators = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
];

router.get('/all',  ctrl.getAllSoftwareCategories);
router.get('/',     ctrl.getSoftwareCategories);
router.get('/:id',  ctrl.getSoftwareCategory);
router.post('/',    validators, ctrl.createSoftwareCategory);
router.put('/:id',  validators, ctrl.updateSoftwareCategory);
router.delete('/:id', ctrl.deleteSoftwareCategory);

module.exports = router;
