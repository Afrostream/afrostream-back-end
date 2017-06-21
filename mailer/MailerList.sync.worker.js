const assert = require('better-assert');

const Mailer = require('./Mailer.js');

const Q = require('q');

const sqldb = rootRequire('sqldb');

const _ = require('lodash');

module.exports = (syncId, mailerList, mailerProvider, assoListProvider, logger) => {
  assert(syncId);
  assert(mailerList instanceof Mailer.List);
  assert(mailerProvider instanceof Mailer.Provider);
  assert(assoListProvider);
  assert(logger);

  /*
   *
   *
   *   W O R K E R       B E G I N
   *
   * (we are in the worker id=syncId)
   *
   */
  logger = logger.prefix('WORKER');
  logger.log(`START`);

  // the worker is async.
  // the worker check periodicaly if syncId is still his own in the database
  //  if not => it stops the processing.
  //
  Q.all([
    sqldb.MailerAssoListsSubscribers.findAll({
      where:{listId:this.getId()}
    }),
    sqldb.MailerAssoListsSubscribersProviders.findAll({
      where:{listId:this.getId(),providerId:mailerProvider.getId()}
    })
  ])
  .then(([assoLS, assoLSP]) => {
    // assoLS  = assoListsSubscribers
    // assoLSP = assoListsSubscribersProviders
    const assoLSSubscribersIds = assoLS.map(o => o.subscriberId);
    const assoLSPSubscribersIds = assoLSP.map(o => o.subscriberId);

    logger.log(`assoLS: ${assoLSSubscribersIds.join(',')}`);
    logger.log(`assoLSP: ${assoLSPSubscribersIds.join(',')}`);

    const toCreate = _.difference(assoLSSubscribersIds, assoLSPSubscribersIds)
      .map(subscriberId => { return {
        listId: this.getId(),
        subscriberId: subscriberId,
        providerId: mailerProvider.getId()
      }; });

    logger.log(`creating: ${toCreate.length} id`);

    return sqldb.MailerAssoListsSubscribersProviders.bulkCreate(
      toCreate, { individualHooks: true }
    );
  })
  .then(() => {
    logger.log(`fetching data`);

    return Q.all([
      sqldb.MailerAssoListsSubscribers.findAll({
        where: {listId: this.getId(), state: 'ACTIVE', disabled: false},
        include: [{model: sqldb.MailerSubscriber, required: true, as: 'subscriber'}]
      }),
      sqldb.MailerAssoListsSubscribersProviders.findAll({
        where: {listId: this.getId(), providerId: mailerProvider.getId()},
        include: [{model: sqldb.MailerSubscriber, required: true, as: 'subscriber'}]
      })
    ]);
  })
  .then(([assoLS, assoLSP]) => {
    // assoLS  = assoListsSubscribers
    // assoLSP = assoListsSubscribersProviders

    //
    // list of subscribers to activate in the providers
    //  <=> assoListsSubscribersActive without corresponding assoListsSubscribersProviders
    //        with state !== null.
    //
    // the algorithm is :
    //  - we flag the asso "list suscriber provider" to P-ACTIVE (pending)
    //  - we create the subscriber using pApi
    //  - if ok,  we flag the user ACTIVE
    //  - if nok, we flag the user E-ACTIVE (error)
    //
    const idToAssoLSP = { /* subscriberId : assoLSP */ };
    const idToAssoLS = { /* subscriberId : assoLS */ };

    assoLSP.forEach(asso => idToAssoLSP[asso.subscriberId] = asso);
    assoLS.forEach(asso => idToAssoLS[asso.subscriberId] = asso);

    logger.log(`data fetched`);

    // toCreate & toDelete are assoLSP models.
    const assoLSPtoCreate = assoLS
      .filter(asso =>
        asso.subscriberId &&
        // next status allowed to be ACTIVE
        idToAssoLSP[asso.subscriberId].subscriberCanBeCreatedInProviderAPI() &&
        //
        (assoListProvider.get('canReactive') === true ||
         !idToAssoLSP[asso.subscriberId].subscriberIsOrWasActiveInProviderAPI())
      )
      .map(asso => idToAssoLSP[asso.subscriberId]);
    const assoLSPtoDelete = assoLSP.filter(asso =>
      typeof idToAssoLS[asso.subscriberId] === 'undefined' &&
      asso.susbcriberCanBeDeletedInProviderAPI()
    );
    const pApi = mailerProvider.getAPIInterface();

    logger.log(`assoLSPtoCreate = [${assoLSPtoCreate.map(a=>a.subscriberId+':'+a.subscriber.referenceEmail).join(',')}]`);
    logger.log(`assoLSPtoDelete = [${assoLSPtoDelete.map(a=>a.subscriberId+':'+a.subscriber.referenceEmail).join(',')}]`);

    return this.getAssoProvider(mailerProvider)
      .then(assoListProvider => {
        if (!assoListProvider) throw new Error('asso list provider');
        const pListId = assoListProvider.pApiId;
        if (!pListId) throw new Error('pListId');

        logger.log(`pListId ${pListId} processing assoLSPtoDelete`);

        // first, disabling old ones
        return assoLSPtoDelete.reduce((p, alsp, i) => {
          return p.then(() => {
            logger.log(`assoLSPtoDelete: ensureSyncCanProceed`);
            // first , we check if we can proceed
            return assoListProvider.ensureSyncCanProceed(syncId)
              .then(() => {
                logger.log(`assoLSPtoDelete: setStatusPendingActive`);
                return alsp.setStatusPendingActive();
              })
              .then(() => {
                logger.log(`assoLSPtoDelete: deleteSubscriber subscriberId=${alsp.subscriberId} email=${alsp.subscriber.referenceEmail}`);
                const subscriber = Mailer.Subscriber.loadFromModel(alsp.subscriber);
                return pApi.deleteSubscriber(pListId, subscriber.toISubscriber(alsp));
              })
              .then(() => {
                logger.log(`assoLSPtoDelete: setStatusActive`);
                return alsp.setStatusActive();
              })
              .then(() => {
                // notifying progress.
                if (i % 10 === 0) {
                  const progress = 0.5 * (i + 1) / assoLSPtoDelete.length;
                  logger.log(`assoLSPtoDelete: updatePApiStatus ${progress}`);
                  return assoListProvider.updatePApiStatus({sync: { progress: progress }});
                }
              });
          });
        }, Q())
        .then(() => assoListProvider);
      })
      .then(assoListProvider => {
        const pListId = assoListProvider.pApiId;

        logger.log(`pListId ${pListId} processing assoLSPtoCreate`);

        // second, activating new ones.
        return assoLSPtoCreate.reduce((p, alsp, i) => {
          return p.then(() => {
            logger.log(`assoLSPtoCreate: ensureSyncCanProceed`);
            // first , we check if we can proceed
            return assoListProvider.ensureSyncCanProceed(syncId)
              .then(() => {
                logger.log(`assoLSPtoCreate: setStatusPendingActive`);
                return alsp.setStatusPendingUnsubscribed();
              })
              .then(() => {
                logger.log(`assoLSPtoCreate: createSubscriber subscriberId=${alsp.subscriberId} email=${alsp.subscriber.referenceEmail}`);
                const subscriber = Mailer.Subscriber.loadFromModel(alsp.subscriber);
                return pApi.createSubscriber(pListId, subscriber.toISubscriber(alsp))
                  .then(iSubscriber => {
                    if (!iSubscriber.get('id')) {
                      throw new Error('no provider subscriber id!?');
                    }
                    return alsp.update({pApiId: iSubscriber.get('id')});
                  });
              })
              .then(() => {
                logger.log(`assoLSPtoCreate: setStatusActive`);
                return alsp.setStatusActive();
              })
              .then(() => {
                // notifying progress.
                if (i % 10 === 0) {
                  const progress = 0.5 * (i + 1) / assoLSPtoDelete.length;
                  logger.log(`assoLSPtoCreate: updatePApiStatus ${progress}`);
                  return assoListProvider.updatePApiStatus({sync: { progress: progress }});
                }
              });
          });
        }, Q());
      });
  })
  .then(
    () => {
      logger.log(`SUCCESS !`);
      return this.stopSync(mailerProvider);
    }
  )
  .catch(
    err => {
      /*
       * catch-all worker status error
       */
      console.error(err.stack);
      logger.log(`ERROR: ${err.message} ${JSON.stringify(err)}`);
      assoListProvider.updatePApiStatus({ sync: { error: err.message }})
        .then(() => this.stopSync(mailerProvider));
    }
  );

  /*
   *
   *
   *   W O R K E R       END
   *
   *
   */
};
