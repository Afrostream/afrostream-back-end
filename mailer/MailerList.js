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
      includes: [
        {
          model: sqldb.MailerAssoProvidersLists,
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
}

/*
 * Statics Methods.
 */
MailerList.getDBModel = () => sqldb.MailerList;

MailerList.loadFromDB = dbInstance => {
  assert(dbInstance instanceof sqldb.MailerList.Instance);

  const mailerList = new MailerList();
  return mailerList.loadFromDB(dbInstance._id);
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

module.exports = MailerList;
