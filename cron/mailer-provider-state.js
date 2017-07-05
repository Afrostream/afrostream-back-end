/*
 * this cron crawl all mailblast lists
 * foreach list this cron
 *   crawl pages of subscribers
 *
 * foreach subscriber
 *   get the status,
 *
 *  if subscribers states are : UNSUBSCRIBED
 *   or
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

const assert = require('better-assert');

const sqldb = rootRequire('sqldb');
const Q = require('q');

const logger = rootRequire('logger').prefix('CRON').prefix('MAILBLAST');

logger.log('start');

const Mailer = rootRequire('mailer');

const chain = funcs => funcs.reduce((p, func) => p.then(prev => func(prev)), Q());

Q()
  .then(() => {
    logger.log('loading mailblast provider');
    return Mailer.Provider.loadByName('mailblast');
  })
  .then(provider => {
    logger.log('loading API Interface');
    return provider.getAPIInterface();
  })
  .then(apiInterface => {
    logger.log('loading lists');
    return apiInterface.getLists()
      .then(iLists => {
        assert(Array.isArray(iLists));

        logger.log(`${iLists.length} found`);

        return chain(
          iLists
            .map((iList, i) => prev => {
              logger.log(`${i}/${iList.length}\t apiInterface.getSubscribers(${iList.id})`);
              return apiInterface.getSubscribers(iList.id).then(iSubscribers=>(prev||[]).concat(iSubscribers));
            }
          )
        );
      });
  })
  .then(iSubscribers => {
    const nbISubscribers = iSubscribers.length;
    logger.log(`${nbISubscribers} subscribers found`);
    // foreach subscribers, update the state, doing this by "batch" of 20 subscribers...
    return chain(
      iSubscribers.map((iSubscriber, i) => () => {
        const email = iSubscriber.get('email');
        const state = iSubscriber.get('state');
        return sqldb.User.findOne({where:{email:{$iLike:email}}})
          .then(user => {
            if (!user) {
              logger.warn(`${i}/${nbISubscribers}\t${email}: user not found`);
            } else {
              const lastState = user.get('mailerProviderLastState');
              if (lastState === state) {
                logger.log(`${i}/${nbISubscribers}\t${email}: keeping state ${state}`);
              } else {
                logger.log(`${i}/${nbISubscribers}\t${email}: updating ${user._id} from ${lastState} to ${state}`);
              }
              return user.updateMailerProviderLastState(state);
            }
          });
      })
    );
  })
  .then(() => {
    logger.log('success');
    process.exit();
  },
  e => {
    logger.error(e.message);
    process.exit();
  }
  );
