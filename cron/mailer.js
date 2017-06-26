process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

const sqldb = rootRequire('sqldb');
const Q = require('q');

const logger = rootRequire('logger').prefix('CRON').prefix('MAILER');

const Mailer = rootRequire('mailer');

logger.log('start');

sqldb.MailerList.findAll({
  where: {
    disabled: false,
    cron: true
  }
}).then(lists => {
  return Q.all(lists.map(list=>Mailer.List.loadFromDB(list)));
}).then(mailerLists => {
  mailerLists.forEach(mailerList =>
    logger.log(mailerList.getName() + ' -> runQuery() ')
  );
  // first: we run the query
  return mailerLists.reduce((p, c) => p.then(() => c.runQuery()), Q());
}).then(mailerLists => {
  mailerLists.forEach(mailerList =>
    logger.log(mailerList.getName() + ' -> getProviders() -> startSync()')
  );
  // second: we sync the providers
  return mailerLists.reduce((p, mailerList) => {
    return p.then(() => {
      // for each mailerList, we search the provider
      return mailerList.getProviders()
        .then(mailerProviders => Q.all(
          mailerProviders.map(mailerProvider => mailerList.startSync(mailerProvider))
        ));
    });
  }, Q());
}).then(() => {
  logger.log('success');
  process.exit();
},
e => {
  logger.error(e.message);
  process.exit();
}
);
