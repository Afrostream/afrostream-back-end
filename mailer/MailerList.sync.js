const assert = require('better-assert');

const Mailer = require('./Mailer.js');

const worker = require('./MailerList.sync.worker.js');

/*
 * SYNC between list <-> provider
 */
module.exports.start = (mailerList, mailerProvider, options) => {
  assert(mailerList instanceof Mailer.List);
  assert(mailerProvider instanceof Mailer.Provider);
  assert(options && options.logger);

  //
  // we need to compute a DIFF between
  //  List <-> Subscribers               (MailerAssoListsSubscribers)
  //  List <-> [Subscribers,Providers]   (MailerAssoListsSubscribersProviders)
  //
  // reporting the diff can be quite long, so we write in the database our "process number"
  // & test if this process number still exists during the process.
  //
  const syncId = Math.round(Math.random() * 1000000);
  const providerName = mailerProvider.getName();
  const logger = options.logger.prefix(`SYNC-${syncId}-${providerName}`);

  logger.log(`start`);

  return mailerList.getAssoProvider(mailerProvider)
    .then(assoListProvider => {
      // check if sync process is not already in progress.
      if (assoListProvider.pApiStatus && assoListProvider.pApiStatus.id) {
        throw new Error('sync already started');
      }
      // saving new syncId
      return assoListProvider.updatePApiStatus({ sync: { id: syncId, startedAt: new Date() }});
    })
    .then(assoListProvider => {
      // to sync, we need to :
      // - fetch all asso ListSubscriber
      // - compare these asso.state to all asso ListSubsciberProvider state
      const f = () => worker(syncId, mailerList, mailerProvider, assoListProvider, logger);

      if (options.sync) {
        return f();
      } else {
        setTimeout(f, 50);
      }
    })
    .then(() => {
      return mailerList.getSyncStatus(mailerProvider);
    });
};


module.exports.stop = (mailerList, mailerProvider, options) => {
  const providerName = mailerProvider.getName();
  const logger = options.logger.prefix(`SYNC-unknown-${providerName}`);

  logger.log(`stop`);
  return mailerList.getAssoProvider(mailerProvider)
    .then(assoListProvider => {
      logger.log(`[stopSync] assoListProvider found, updating PApiStatus to sync.id = null`);
      return assoListProvider.updatePApiStatus({ sync: { id: null } });
    });
};

module.exports.status = (mailerList, mailerProvider, options) => {
  const providerName = mailerProvider.getName();
  const logger = options.logger.prefix(`SYNC-unknown-${providerName}`);

  logger.log('status');
  return mailerList.getAssoProvider(mailerProvider);
};
