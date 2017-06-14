const assert = require('better-assert');

const Q = require('q');

const sqldb = rootRequire('sqldb');

const Mailer = require('./Mailer.js');

class MailerList {
  constructor () { }

  // load from the database
  loadById(id) {
    return sqldb.MailerList.find({
      where: { _id: id },
      include: [
        {
          model: sqldb.MailerAssoProvidersLists,
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

  getAssoProviders() {
    return Array.from(this.model.assoProviders) || [];
  }

  runQuery() {
    return Q()
      .then(() => {
        if (!this.hasQuery()) throw new Error('missing query');
        const query = this.getQuery();
        return sqldb.sequelize.query(query, { type: sqldb.sequelize.QueryTypes.SELECT});
      })
      .then(results => {
        const emails = results.map(row => row.email).filter(email => email);

        // forEach emails, we check if they already exists.
        
      });
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
        return sqldb.MailerAssoProvidersLists.create({
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

  toJSON() {
    return {
      _id: this.getId(),
      name: this.getName(),
      assoProviders: this.getAssoProviders()
    };
  }

  toIList(asso) {
    return Mailer.APIInterface.List.build({
      id: asso && asso.pApiId || null,
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
      console.log(result);
      const ok = result.every(row => typeof row.email !== 'undefined');
      if (!ok) {
        throw new Error('malformated query');
      }
      return true;
    });
};

module.exports = MailerList;
