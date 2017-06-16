const express = require('express');
const router = express.Router();

const controller = require('./controller.list.js');

router.get('/:listId/runQuery', controller.runQuery);
router.put('/:listId/updateQuery', controller.updateQuery);

router.get('/:listId/assoSubscribers', controller.assoSubscribers);

// all sync status (no provider)
router.get('/:listId/sync/', controller.getSyncStatus);
// sync status by provider
router.get('/:listId/providers/:providerId/sync/start', controller.providerStartSync);
router.get('/:listId/providers/:providerId/sync/stop', controller.providerStopSync);
router.get('/:listId/providers/:providerId/sync/', controller.providerGetSyncStatus);


router.get('/:listId', controller.show);
router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:listId', controller.update);
router.delete('/:listId', controller.destroy);

router.post('/:listId/providers/', controller.addProvider);
router.delete('/:listId/providers/:providerId', controller.removeProvider);

module.exports = router;
