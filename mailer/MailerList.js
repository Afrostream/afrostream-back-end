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
      console.log(model);
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

  getModel() {
    return this.model;
  }

  update(infos) {
    return this.model.update(infos).then(() => this);
  }

  setQuery (query) {
    return this.model.update({query: query});
  }

  hasQuery() {
    return Q(Boolean(this.model.query));
  }

  getQuery() {
    return Q(this.model.query);
  }

  getAssoProviders() {
    return Array.from(this.model.assoProviders) || [];
  }

  runQuery() {
    this.hasQuery()
      .then(hasQuery => {
        if (!hasQuery) throw new Error('missing query');
        return this.getQuery();
      })
      .then(query => {
        // restricting to "SELECT" kind of query injection...
        return sqldb.sequelize.query(query, { type: sqldb.sequelize.QueryTypes.SELECT});
      });
  }

  addProvider(mailerProvider) {
    assert(mailerProvider instanceof Mailer.Provider);
    assert(mailerProvider.model instanceof sqldb.MailerProvider);

    return Q()
      .then(() => {
        const assoProviders = this.getAssoProviders();
        const pApi = mailerProvider.getAPIInterface();

        if (assoProviders.find(asso => asso.providerId === mailerProvider.getId())) {
          throw new Error('already linked');
        }
        // seems not => linking
        return pApi.createList(this);
      })
      .then(iList => {
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
    assert(mailerProvider.model instanceof sqldb.MailerProvider);

    let asso;

    return Q()
      .then(() => {
        // searching associated provider <-> mailerList
        const assoProviders = this.getAssoProviders();
        const pApi = mailerProvider.getAPIInterface();

        asso = assoProviders.find(asso => asso.providerId === this.mailerProvider.getId());
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

module.exports = MailerList;
