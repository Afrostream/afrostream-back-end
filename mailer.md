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
    - ajout ou suppression d'un automate

# Architecture

Afrostream Mailer est un système de gestion de liste de subscribers.
Les listes sont composées de subscribers, auxquels sont associés un email.
Les listes peuvent être mirror chez un ou plusieurs providers
Les listes peuvent être parcourues par 1 ou plusieurs automates

# Database

FIXME

# Api

## Base manipulation

```js
const mailer = require('afrostream-mailer')

// gestion des listes
let list
list = mailer.findListByInternalName("pool internal name")
list = mailer.findListById("...")
list = mailer.createList({ ... })
list.getId()

// gestion des subscribers
let subscriber = mailer.createSubscriber({"email":"foo@bar.com"})
let subscriber1 = mailer.createSubscriber1({"email":"a@a.com"})
let subscriber2 = mailer.createSubscriber2({"email":"b@b.com"})

list.add(subscriber)
pool.add([subscriber1, subscriber2, ... ])
pool.getSubscribers()

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
