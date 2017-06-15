const sqldb = rootRequire('sqldb');

const assert = require('better-assert');

const logger = rootRequire('logger').prefix('MAILER').prefix('SUBSCRIBER');

class MailerSubscriber {
  constructor () {
    this.model = null;
  }

  loadFromModel(model) {
    this.model = model || null;
  }

  getId() {
    return this.model.get('_id');
  }

  getModel() {
    return this.model;
  }

  getReferenceUuid() {
    return this.model && this.model.get('referenceUuid');
  }

  toJSON() {
    return {
      _id: this.getId(),
      state: this.model && this.model.get('state'),
      referenceType: this.model && this.model.get('referenceType'),
      referenceUuid: this.getReferenceUuid(),
      referenceEmail: this.model && this.model.get('referenceEmail'),
    };
  }
}

/*
 * Statics Methods.
 */
MailerSubscriber.getDBModel = () => sqldb.MailerSubscriber;


MailerSubscriber.loadFromModels = models => {
  return models.map(model => {
    const mailerSubscriber = new MailerSubscriber();
    mailerSubscriber.loadFromModel(model);
    return mailerSubscriber;
  });
};

/*
 * FIXME: we should update the emails, currently, we only create
 */
MailerSubscriber.bulkCreateOrUpdate = list => {
  assert(Array.isArray(list));
  assert(list.every(l=> l && typeof l.referenceEmail === 'string' && typeof l.referenceUuid === "string"));

  // filtering, only well formated list are authorized
  list = list.filter(o => o.referenceEmail && o.referenceUuid);

  logger.log('[bulkCreateOrUpdate]: list=' + JSON.stringify(list));

  const referenceUuidList = list.map(o => o.referenceUuid);
  // we are based on the subscriber reference UUID (<=> backend Users.id)
  return sqldb.MailerSubscriber.findAll({where: { referenceUuid: { $in: referenceUuidList } } })
    .then(alreadyExistingSubscribers => {
      // extracting already existing subscribers uuid
      const alreadyExistingSubscribersUuid = alreadyExistingSubscribers.map(s => s.referenceUuid);
      //
      logger.log('[bulkCreateOrUpdate]: already existing=' + JSON.stringify(alreadyExistingSubscribersUuid));
      // excluding from the input "list" already existing subscribers
      const toAdd = list.filter(o => alreadyExistingSubscribersUuid.indexOf(o.referenceUuid) === -1);
      //
      logger.log('[bulkCreateOrUpdate]: bulkCreating = ' + JSON.stringify(toAdd));
      // fixme: compute toUpdate = ...
      return sqldb.MailerSubscriber.bulkCreate(toAdd, { individualHooks: true })
        .then(newSubscribers => {
          const list = alreadyExistingSubscribers.concat(newSubscribers);
          logger.log(`[bulkCreateOrUpdate]: returning list of ${list.length} MailerSubscriber`);
          return MailerSubscriber.loadFromModels(list);
        });
    });
};

// return listA members minus listB members
MailerSubscriber.diffList = (listA, listB) => {
  assert(Array.isArray(listA));
  assert(Array.isArray(listB));

  const listBreferenceUuid = listB.map(s => s.getReferenceUuid());

  return listA.filter(s => (listBreferenceUuid.indexOf(s.getReferenceUuid()) === -1));
};

module.exports = MailerSubscriber;
