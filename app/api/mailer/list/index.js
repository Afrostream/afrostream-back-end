const express = require('express');
const router = express.Router();

const controller = require('./controller.list.js');

router.get('/:listId/runQuery', controller.runQuery);
router.put('/:listId/updateQuery', controller.updateQuery);

router.get('/:listId/assoSubscribers', controller.assoSubscribers);

router.get('/:listId', controller.show);
router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:listId', controller.update);
router.delete('/:listId', controller.destroy);

router.post('/:listId/providers/', controller.addProvider);
router.delete('/:listId/providers/:providerId', controller.removeProvider);

module.exports = router;
