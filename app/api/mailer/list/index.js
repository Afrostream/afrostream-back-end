const express = require('express');
const router = express.Router();

const controller = require('./controller.list.js');

router.get('/:id', controller.show);
router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
