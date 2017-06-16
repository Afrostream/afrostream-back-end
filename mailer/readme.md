# description

Afrostream Node Mailer

# GUI

- management de lists
  - create
  - read
  - update
  - delete
  - dans chaque liste:
    - ajout ou suppression manuelle d'users
    - ajout ou suppression d'users par l'injection d'une query SQL retournant une liste d'emails
    - ajout ou suppression de la synchro de liste avec un provider (ex: mailblast / mandrill / ...)
        - visualisation du status chez le provider
        - possibilité de forcer une synchro avec le provider
    - ajout ou suppression d'un automate

# Architecture

Afrostream Mailer est un système de gestion de liste de subscribers.
Les listes sont composées de subscribers, auxquels sont associés un email.
Les listes peuvent être mirror chez un ou plusieurs providers
Les listes peuvent être parcourues par 1 ou plusieurs automates

## Code

```
+-------------------------------------------------+      +--------------+
|                                                 |      |              |
|                                                 |      |              |
|     +-------------------------------------+     |      |   MAILBLAST  |
|     | +------------------+  +-----------+ |     |      |              |
|     | |                  |  |           +-------------->              |
|     | |     Api CODE     |  |           <--------------+              |
|     | |                  |  | Provider  | |     |      +--------------+
|     | +---------^--------+  | Interface | |     |
|     |          ||           |           | |     |      +--------------+
|     | +--------v---------+  |           | |     |      |              |
|     | |    Mailer CODE   +-->           +-------------->              |
|     | |                  <--+           <--------------+   MAILCHIMP  |
|     | +---------^--------+  +-----------+ |     |      |              |
|     +------------------afrostream-backend-+     |      |              |
|                ||                               |      |              |
|                ||                               |      +--------------+
|     +----------v----------+                     |
|     |       DATABASE      |                     |
|     |                     |                     |
|     +---------------------+                     |
|                                                 |
|                                                 |
+-----------------------------------AFROSTREAM----+

```

# Database

FIXME

# Api

## Base manipulation

```js
//
const Mailer = require('afrostream-mailer')

// classes
Mailer.List
Mailer.Provider

// mailer objects
Mailer.List
Mailer.Provider
Mailer.Subscriber

// mailer objects instance
Mailer.List.create({name:"list name"})
  .then(mailerList => { })
Mailer.List.loadByName("list name")
  .then(mailerList => { })
Mailer.Provider.loadByName("mailblast")
  .then(mailerProvider => { })
Mailer.Subscriber.loadByEmail("foo@bar.com")
  .then(mailerSubscriber => { })

// underlying database object
const MailerList = Mailer.List.getDbModel()
MailerList.find({where: { name: "list name" } })
  .then(list => { })
// convert a database list to a mailerList
mailerList = mailer.List.loadFromDB(list)

// subscribers management
mailerList.getSubscribers({includeDisabled:true}).then(arrayOfMailerSubscribers => { })
mailerList.getSubscribersEmails({includeDisabled:true}).then(arrayOfEmails => { })
mailerList.addSubscriber(mailerSubscriber).then(mailerSubscriber => {})
mailerList.addSubscribers([mailerSubscriber1, mailerSubscriber2, mailerSubscriber3])
          .then(arrayOfMailerSubscribers => {})
mailerList.disableSubscriber(mailerSubscriber).then()
mailerList.disableSubscribers([mailerSubscriber1, mailerSubscriber2, mailerSubscriber3]).then()
mailerList.updateSubscribers(arrayOfMailerSubscribers)
mailerList.findSubscriber({"email":"foo@bar.com"}).then(mailerSubscriber => {})

// Add a provider to a list (short execution time)
mailerList.addProvider(mailerProvider).then()
mailerList.removeProvider(mailerProvider).then()

// we can associate a SQL query to a list.
mailerList.setQuery("SELECT email FROM ...")
mailerList.getQuery()
mailerList.hasQuery()
mailerList.runQuery().then(bool => {})

// synch the mailer list with all providers
mailerList.startSync().then(statusList => { })
mailerList.stopSync().then()
mailerList.getSyncStatus().then(statusList => { console.log(status) })

// synch the mailer with a single provider
mailerList.startSync(mailerProvider).then(status => { })
mailerList.stopSync(mailerProvider).then()
mailerList.getSyncStatus(mailerProvider).then(statusList => { console.log(status) })

// underlying database object
const MailerProvider = mailer.Provider.getDbModel()
MailerProvider.find({where: { name: "mailblast" } })
  .then(provider => { })
// convert a database list to a mailerList
mailerProvider = mailer.List.loadFromDb(provider)
//
mailerProvider.getQuota().then(quota => { })
mailerProvider.setQuota().then();
mailerProvider.canSendEmails();
mailerProvider.decreaseQuota();

//
Mailer.Subscriber.create({"email":"foo@bar.com"}).then(mailerSubscriber => {})
Mailer.Subscriber.bulkCreate([{"email":...},{"email":...}]).then(
  arrayOfMailerSubscribers => { }
)

// example
Q.all([
  Mailer.Subscriber.create({"email":"foo@bar.com"}),
  Mailer.Subscriber.create({"email":"a@a.com"}),
  Mailer.Subscriber.create({"email":"b@b.com"})
])
  .then(([sub1, sub2, sub3]) => {
    // return mailerList.add(sub1);
    return mailerList.addSubscriber([sub1, sub2, sub3]);
  })
//

// underlying provider api interface.
// you shouldn't call it directly.
const pApi = mailerProvider.getAPIInterface()

// the pApi has it's own object interface
Mailer.Provider.APIInterface.List
Mailer.Provider.APIInterface.Subscriber

// the interface should be registered to the mailer using provider's name
mailer.registerProviderAPIInterface('mailblast', pApiMailblast);

// you can convert mailer object instance to api interface objects
const providerList = mailerList.toProvider()
const providerSubscriber = mailerSubscriber.toProvider()

// the provider API interface has low level methods
//  you shouldn't call it directy.
pApi.createList(providerList).then(providerList => { })
pApi.getList(pListId);
pApi.getAllLists().then(arrayOfProviderList => { })
pAPI.updateList(providerList).then(providerList => { })
pApi.deleteList(providerList).then()


pApi.createSubscriber(pListId, providerSubscriber).then(providerSubscriber => { })
pApi.updateSubscriber(pListId, providerSubscriber).then(providerSubscriber => { })
pApi.deleteSubscriber(pListId, pSubscriberId).then()

//
subscriber = mailer.getSubscriberByEmail({"email":"foo@bar.com"})
subscriber.update({"referenceUuid": "4242"})

subscriber = mailer.getSubscriberByReferenceUuid("4242")
list.disable(subscriber)
list.remove(subscriber)

# gestion des providers
const providers = mailer.getProviders()
const mailblast = providers.find(p => p.name = 'mailblast')

list.getProviders()
list.mirrorTo(mailblast)
list.unlink(mailblast)

# gestion des automates
const workers = mailer.getWorkers()
const worker = workers.find(w => w.name = 'sendgrid.200-transactions-by-day')

list.addWorker(worker)
list.removeWorker(worker)
```

## Hooks

# API

POST /api/mailer/pools
GET /api/mailer/pools
GET /api/mailer/pools/2

GET /api/mailer/pools/2/addresses
GET /api/mailer/pools/2/addresses?email=...
POST /api/mailer/pools/2/addresses
{ email: ... }
PUT  /api/mailer/pools/2/addresses
DELETE /api/mailer/pools/2/addresses/4242
