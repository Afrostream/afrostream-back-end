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
const mailer = require('afrostream-mailer')

// classes
mailer.List
mailer.Provider

// mailer objects
mailer.List
mailer.Provider
mailer.Subscriber

// mailer objects instance
mailer.List.create({name:"list name"})
  .then(mailerList => { })
mailer.List.loadByName("list name")
  .then(mailerList => { })
mailer.Provider.loadByName("mailblast")
  .then(mailerProvider => { })
mailer.Subscriber.loadByEmail("foo@bar.com")
  .then(mailerSubscriber => { })

// underlying database object using static methods
const MailerList = mailer.List.getDbModel()
const MailerProvider = mailer.Provider.getDbModel()

// mailer objects instance using the underlying database objects
MailerList.find({where: { name: "list name" } })
  .then(list => mailer.List.loadFromDb(list))
  .then(mailerList => { })

// subscribers management
mailerList.addSubscriber(mailerSubscriber).then(mailerSubscriber => {})
mailerList.addSubscribers([mailerSubscriber1, mailerSubscriber2, mailerSubscriber3])
          .then(arrayOfMailerSubscribers => {})
mailerList.removeSubscriber(mailerSubscriber).then()
mailerList.findSubscriber({"email":"foo@bar.com"}).then(mailerSubscriber => {})

// Add a provider to a list (short execution time)
mailerList.addProvider(mailerProvider).then()
mailerList.removeProvider(mailerProvider).then()

mailerList.providerGetStatus(mailerProvider).then()
mailerList.providerSync(mailerProvider).then()

mailerList.setSubscribersQuery("SELECT email FROM ...")


//
mailer.Subscriber.create({"email":"foo@bar.com"})

// example
Q.all([
  mailer.Subscriber.create({"email":"foo@bar.com"}),
  mailer.Subscriber.create({"email":"a@a.com"}),
  mailer.Subscriber.create({"email":"b@b.com"})
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
mailer.Provider.APIInterface.List
mailer.Provider.APIInterface.Subscriber

// you can convert mailer object instance to api interface objects
const providerList = mailerList.toProvider()
const providerSubscriber = mailerSubscriber.toProvider()

// the provider API interface has low level methods
//  you shouldn't call it directy.
pApi.createList(providerList).then(providerList => { })
pApi.getAllLists().then(arrayOfProviderList => { })
pAPI.updateList(providerList).then(providerList => { })
pApi.deleteList(providerList).then()



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


# Fichiers
