const assert = require('better-assert');

const sqldb = rootRequire('sqldb');

const Mailblast = require('./APIInterface/Mailblast.js');

class MailerProvider {
  constructor () {
    this.apiInterface = null;
  }

  getId() {
    return this.model._id;
  }

  getName() {
    return this.model && this.model.get('name');
  }

  loadById(id) {
    return sqldb.MailerProvider.find({
      where: { _id: id }
    })
    .then(model => {
      if (!model) throw new Error('cannot read from db');

      this.model = model;
      return this;
    });
  }

  loadByName(name) {
    return sqldb.MailerProvider.find({
      where: { name: name }
    })
    .then(model => {
      if (!model) throw new Error('cannot read from db');

      this.model = model;
      return this;
    });
  }

  getAPIInterface() {
    if (!this.apiInterface) {
      const interfaceName = this.model.get('interface');

      switch (interfaceName) {
        case 'Mailblast':
          this.apiInterface = new Mailblast();
          break;
        default:
          throw new Error(`unknown apiInterface ${interfaceName}`);
      }
    }
    return this.apiInterface;
  }
}

MailerProvider.getDbModel = () => sqldb.MailerProvider;

MailerProvider.loadById = id => {
  assert(id);

  const mailerProvider = new MailerProvider();
  return mailerProvider.loadById(id);
};

MailerProvider.loadByName = name => {
  assert(name);

  const mailerProvider = new MailerProvider();
  return mailerProvider.loadByName(name);
};

module.exports = MailerProvider;
