const assert = require('better-assert');

const Q = require('q');

const sqldb = rootRequire('sqldb');

const logger = rootRequire('logger').prefix('MAILER').prefix('LIST');

const Mailer = require('./Mailer.js');

const _ = require('lodash');

class MailerList {
  constructor () { }

  // load from the database
  loadById(id) {
    return sqldb.MailerList.find({
      where: { _id: id },
      include: [
        {
          model: sqldb.MailerAssoListsProviders,
          as: 'assoProviders',
          required: false
        }
      ]
    })
    .then(model => {
      // check if already linked to this provider ?
      if (!model) throw new Error('cannot read from db');
      if (!Array.isArray(model.assoProviders)) throw new Error('missing assoProviders');

      this.model = model;
      return this;
    });
  }

  getId() {
    return this.model._id;
  }

  getName() {
    return this.model.get('name');
  }

  getQuery() {
    return this.model.get('query');
  }

  getModel() {
    return this.model;
  }

  update(infos) {
    return this.model.update(infos).then(() => this);
  }

  hasQuery() {
    return Boolean(this.model.get('query'));
  }

  /*
  getAssoProvider(mailerProvider) {
    return this.getAssoProviders().find(asso => asso.providerId === mailerProvider.getId());
  }
  */

  getAssoProviders() {
    return Array.from(this.model.assoProviders) || [];
  }

  runQuery() {
    logger.log('[RUNQUERY] start');

    let numberOfSubscribers;

    return Q()
      .then(() => {
        if (!this.hasQuery()) throw new Error('missing query');
      })
      .then(() => {
        const query = this.getQuery();

        logger.log(`[RUNQUERY] ${query}`);

        // we only accept user with valid email & uuid
        return sqldb.sequelize.query(query, { type: sqldb.sequelize.QueryTypes.SELECT})
          // rows <=> { email: "...", uuid: "..." }
          .then(rows => rows.filter(row => row.email && row.uuid));
      })
      .then(rows => {
        numberOfSubscribers = rows.length;
        logger.log(`[RUNQUERY] numberOfSubscribers = ${numberOfSubscribers}`);
        logger.log(`[RUNQUERY] ${rows.map(o=>o.uuid+':'+o.email).join('|')}`);
        return Mailer.Subscriber.bulkCreateOrUpdate(
          rows.map(row => {
            return { referenceEmail: row.email, referenceUuid: String(row.uuid) };
          })
        );
      })
      .then(mailerSubscribers => {
        // we need to update the list with these subscribers
        return this.updateSubscribers(mailerSubscribers);
      })
      .then(() => {
        logger.log(`[RUNQUERY] updating model.numberOfSubscribers = ${numberOfSubscribers}`);
        return this.update({numberOfSubscribers: numberOfSubscribers});
      });
  }

  getAssoSubscribers(options) {
    options = options || {};

    const where = { listId: this.getId() };
    if (!options.includeDisabled) {
      Object.assign(where, { disabled: false });
    }
    return sqldb.MailerAssoListsSubscribers.findAll({
      where: where,
      include: [
        {
            model: sqldb.MailerSubscriber,
            as: 'subscriber',
            required: true
        }
      ]
    });
  }

  getSubscribers(options) {
    return this.getAssoSubscribers(options).then(assoListsSubscribers => {
      return Mailer.Subscriber.loadFromModels(
        assoListsSubscribers.map(asso => asso.subscriber)
      );
    });
  }

  updateSubscribers(mailerSubscribers) {
    logger.log(`[updateSubscribers] updating ${mailerSubscribers.length} subscribers`);

    return this.getSubscribers()
      .then(currentMailerSubscribers => {
        logger.log(`[updateSubscribers] current ${currentMailerSubscribers.length} subscribers`);

        const toAdd = Mailer.Subscriber.diffList(mailerSubscribers, currentMailerSubscribers);
        const toDisable = Mailer.Subscriber.diffList(currentMailerSubscribers, mailerSubscribers);

        logger.log(`[updateSubscribers] toAdd ${toAdd.length} subscribers`);
        logger.log(`[updateSubscribers] toDisable ${toDisable.length} subscribers`);

        return Q.all([
          this.addSubscribers(toAdd),
          this.disableSubscribers(toDisable)
        ]);
      });
  }

  // adds => activate or create
  addSubscribers(mailerSubscribers) {
    logger.log(`[addSubscribers] ${mailerSubscribers.length} subscribers`);

    if (mailerSubscribers.length === 0) {
      logger.log(`[addSubscribers] nothing => skip`);
      return Q(this);
    }
    const mailerSubscribersId = mailerSubscribers.map(o => o.getId());

    return sqldb.MailerAssoListsSubscribers.findAll({
      where: { listId: this.getId(), subscriberId : { $in : mailerSubscribersId } }
    }).then(assoMailerSubscribers => {
      const assoMailerSubscribersIds = assoMailerSubscribers.map(o => o.subscriberId);

      const toCreate = mailerSubscribers.filter(mailerSubscriber => {
        return assoMailerSubscribersIds.indexOf(mailerSubscriber.getId()) === -1;
      });
      const toActivate = mailerSubscribers.filter(mailerSubscriber => {
        return assoMailerSubscribersIds.indexOf(mailerSubscriber.getId()) !== -1;
      });

      logger.log(`[addSubscribers] toCreate: ${toCreate.length} subscribers`);
      logger.log(`[addSubscribers] toActivate: ${toActivate.length} subscribers`);

      return Q.all([
        // adding associations
        sqldb.MailerAssoListsSubscribers.bulkCreate(
          toCreate.map(mailerSubscriber => {
            return {
              subscriberId: mailerSubscriber.getId(),
              state: 'ACTIVE',
              disabled: false,
              dateActive: new Date(),
              listId: this.getId()
            };
          })
        ),
        // updating associations
        sqldb.MailerAssoListsSubscribers.update({
          state: 'ACTIVE', // should it be RE-ACTIVE ?
          disabled: false,
          dateActive: new Date()
        }, {
          where: {
            subscriberId : { $in : toActivate.map(o => o.getId()) }
          }
        })
      ]);
    })
    .then(() => this);
  }

  disableSubscribers(mailerSubscribers) {
    logger.log(`[disableSubscribers] ${mailerSubscribers.length} subscribers`);

    if (mailerSubscribers.length === 0) {
      logger.log(`[disableSubscribers] nothing => skip`);
      return Q(this);
    }
    const mailerSubscribersId = mailerSubscribers.map(o => o.getId());

    return sqldb.MailerAssoListsSubscribers.update({
      state: 'UNSUBSCRIBED',
      disabled: true,
      dateUnsubscribed: new Date()
    }, {
      where: {
        subscriberId : { $in : mailerSubscribersId }
      }
    }).then(() => this);
  }

  addProvider(mailerProvider) {
    assert(mailerProvider instanceof Mailer.Provider);
    assert(mailerProvider.model instanceof sqldb.MailerProvider.Instance);

    return Q()
      .then(() => {
        const assoProviders = this.getAssoProviders();
        const pApi = mailerProvider.getAPIInterface();

        if (assoProviders.find(asso => asso.providerId === mailerProvider.getId())) {
          throw new Error('already linked');
        }
        // seems not => linking
        return pApi.createList(this.toIList());
      })
      .then(iList => {
        if (!iList.id) {
          throw new Error('cannot grab provider list id');
        }
        // saving this info to asso
        return sqldb.MailerAssoListsProviders.create({
          listId: this.getId(),
          providerId: mailerProvider.getId(),
          pApiId: iList.id,
          status: { }
        });
      });
  }

  removeProvider(mailerProvider) {
    assert(mailerProvider instanceof Mailer.Provider);
    assert(mailerProvider.model instanceof sqldb.MailerProvider.Instance);

    let asso;

    return Q()
      .then(() => {
        // searching associated provider <-> mailerList
        const assoProviders = this.getAssoProviders();
        const pApi = mailerProvider.getAPIInterface();

        asso = assoProviders.find(asso => asso.providerId === mailerProvider.getId());
        if (!asso) {
          throw new Error('cannot find link between list & provider, already unlinked ?');
        }
        //
        return pApi.removeList(asso.pApiId);
      })
      .then(result => {
        assert(result === true);

        // saving this info to asso
        return asso.destroy();
      });
  }

  getProviders() {
    const assoProviders = this.getAssoProviders();

    return Q.all(
      assoProviders.map(asso => Mailer.Provider.loadById(asso.providerId))
    );
  }

  getPAPIs() {
    return this.getProviders()
      .then(providers => {
        return providers.map(
          provider => provider.getAPIInterface()
        );
      });
  }

  callPAPIs(func, ...params) {
    return this.getPAPIs()
      .then(pAPIs => Q.all(
        pAPIs.map(pAPI => pAPI[func](...params))
      ));
  }

  /*
   * to update the name, we need to
   *  - update the providers
   *  - update in the database
   *
   * to update the providers, we need to fetch each pAPI of each associated providers
   *  & call the function update with the new name.
   *
   * if everything is ok => we save in the database
   */
  updateName(name) {
    return Q()
      .then(() => {
        // we create an iList with the new name
        const iList = this.toIList();
        iList.name = name;
        // we update the pAPIs using this iList
        return this.callPAPIs('updateList', iList);
      })
      .then(() => {
        return this.model.update({'name': name});
      })
      .then(() => this);
  }

  updateQuery (query) {
    return Q()
      .then(() => {
        return MailerList.isQueryValid(query);
      })
      .then(() => {
        return this.model.update({query: query});
      });
  }

  destroy() {
    return Q()
      .then(() => {
        // first, we need to remove all associated providers
        const assoProviders = this.getAssoProviders();
        // foreach of this provider
        return Q.all(
          assoProviders.map(asso => {
            // we load the associated provider
            return Mailer.Provider.loadById(asso.providerId)
              .then(provider => {
                // we remove the provider
                return this.removeProvider(provider);
              });
          }));
      });
  }

  // fetch the asso between the list & the provider
  // @return promise resolve:asso, reject:not found/error.
  getAssoProvider(mailerProvider) {
    return sqldb.MailerAssoListsProviders.find({
      where: { listId: this.getId(), providerId: mailerProvider.getId() }
    })
    .then(assoListProvider => {
      if (!assoListProvider) throw new Error('provider not linked');
      return assoListProvider;
    });
  }

  /*
   * SYNC
   */
  startSync(mailerProvider) {
    assert(typeof mailerProvider === 'undefined' || mailerProvider instanceof Mailer.Provider);

    if (!mailerProvider) {
      logger.log(`[startSync] no provider => startSync on all providers`);
      // recursive call to all providers
      return this.getProviders().then(mailerProviders => {
        return Q.all(mailerProviders.filter(p => p)
                .map(mailerProvider => this.startSync(mailerProvider))
        );
      });
    }
    const providerName = mailerProvider.getName();
    logger.log(`[startSync] provider ${providerName}`);
    //
    // we need to compute a DIFF between
    //  List <-> Subscribers               (MailerAssoListsSubscribers)
    //  List <-> [Subscribers,Providers]   (MailerAssoListsSubscribersProviders)
    //
    // reporting the diff can be quite long, so we write in the database our "process number"
    // & test if this process number still exists during the process.
    //
    let syncId = Math.round(Math.random() * 1000000);

    return this.getAssoProvider(mailerProvider)
      .then(assoListProvider => {
        // check if sync process is not already in progress.
        if (assoListProvider.pApiStatus && assoListProvider.pApiStatus.id) {
          throw new Error('sync already started');
        }
        // saving new syncId
        return assoListProvider.updatePApiStatus({ sync: { id: syncId, startedAt: new Date() }});
      })
      .then(assoListProvider => {
        const l = logger;
        // to sync, we need to :
        // - fetch all asso ListSubscriber
        // - compare these asso.state to all asso ListSubsciberProvider state
        //
        setTimeout(() => {
          /*
           *
           *
           *   W O R K E R       B E G I N
           *
           * (we are in the worker id=syncId)
           *
           */
          const logger = l.prefix('startSync').prefix('worker').prefix(syncId);

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
            const assoLSPtoCreate = assoLS.filter(asso =>
              asso.subscriberId &&
              idToAssoLSP[asso.subscriberId].subscriberCanBeCreatedInProviderAPI()
            ).map(asso => idToAssoLSP[asso.subscriberId]);
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
        });
      })
      .then(() => {
        return this.getSyncStatus(mailerProvider);
      });
  }

  stopSync(mailerProvider) {
    assert(typeof mailerProvider === 'undefined' || mailerProvider instanceof Mailer.Provider);

    if (!mailerProvider) {
      logger.log(`[stopSync] no provider => stopSync on all providers`);
      // recursive call to all providers
      return this.getProviders().then(mailerProviders => {
        return Q.all(mailerProviders.filter(p => p)
                .map(mailerProvider => this.stopSync(mailerProvider))
        );
      });
    }
    const providerName = mailerProvider.getName();
    logger.log(`[stopSync] provider ${providerName}`);

    return this.getAssoProvider(mailerProvider)
      .then(assoListProvider => {
        logger.log(`[stopSync] assoListProvider found, updating PApiStatus to sync.id = null`);
        return assoListProvider.updatePApiStatus({ sync: { id: null } });
      });
  }

  getSyncStatus(mailerProvider) {
    assert(typeof mailerProvider === 'undefined' || mailerProvider instanceof Mailer.Provider);

    if (!mailerProvider) {
      logger.log(`[getSyncStatus] no provider => getSyncStatus on all providers`);
      // recursive call to all providers
      return this.getProviders().then(mailerProviders => {
        return Q.all(mailerProviders.filter(p => p)
                .map(mailerProvider => this.getSyncStatus(mailerProvider))
        );
      });
    }
    const providerName = mailerProvider.getName();
    logger.log(`[getSyncStatus] provider ${providerName}`);

    return this.getAssoProvider(mailerProvider);
  }

  toJSON() {
    return {
      _id: this.getId(),
      name: this.getName(),
      assoProviders: this.getAssoProviders(),
      numberOfSubscribers: this.model && this.model.get('numberOfSubscribers')
    };
  }

  toIList(assoListProvider) {
    return Mailer.APIInterface.List.build({
      id: assoListProvider && assoListProvider.pApiId || null,
      name: this.getName(),
      subscribers: []
    });
  }
}

/*
 * FIXME: REFACTOR: MailerList should facade the database
 *   the code doing the link between the model & database
 *   should be all in the instance, or all static, or elsewhere
 *   but not dispatched/splitted between instance & static methods.
 */

/*
 * Statics Methods.
 */
MailerList.getDBModel = () => sqldb.MailerList;

MailerList.loadFromDB = dbInstance => {
  assert(dbInstance instanceof sqldb.MailerList.Instance);

  const mailerList = new MailerList();
  return mailerList.loadById(dbInstance._id);
};

MailerList.loadById = id => {
  assert(id);

  const mailerList = new MailerList();
  return mailerList.loadById(id);
};

MailerList.create = options => {
  assert(options);

  return Q()
    .then(() => {
      if (!options.name) {
        throw new Error('missing name');
      }
    })
    .then(() => {
      return MailerList.isQueryValid(options.query);
    })
    .then(() => {
      return sqldb.MailerList.create(options);
    })
    .then(MailerList.loadFromDB);
};

MailerList.destroy = id => {
  assert(id);

  return Q()
    .then(() => {
      return MailerList.loadById(id);
    })
    .then(mailerList => {
      return mailerList.destroy();
    });
};

MailerList.findAndCountAll = options => {
  return sqldb.MailerList.findAndCountAll(options)
    .then(result => {
      // we map result.rows
      result.rows.forEach(row => {
        const mailerList = new MailerList();
        mailerList.model = row; // hack, for performance.
                                // here, we should use mailerList.loadById(...)
                                //  & use promise
      });
      return result;
    });
};

// the list query is a "SELECT".
MailerList.isQueryValid = query => {
  if (query === "") {
    return Q(true);
  }
  return sqldb.sequelize.query(query, { type: sqldb.sequelize.QueryTypes.SELECT})
    .then(result => {
      const ok = result.every(row => typeof row.email !== 'undefined' && typeof row.uuid !== 'undefined');
      if (!ok) {
        throw new Error('malformated query');
      }
      return true;
    });
};

module.exports = MailerList;
