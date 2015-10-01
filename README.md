# afrostream-admin

This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 2.1.1.

## Getting Started

### Prerequisites

- [Git](https://git-scm.com/)
- [Node.js and NPM](nodejs.org) >= v0.10.0
- [Bower](bower.io) (`npm install --global bower`)
- [Grunt](http://gruntjs.com/) (`npm install --global grunt-cli`)
- [Babel](https://babeljs.io) (`npm install --global babel`)
- [MongoDB](https://www.mongodb.org/) - Keep a running daemon with `mongod`
- [SQLite](https://www.sqlite.org/quickstart.html)

### Developing

1. Run `npm install` to install server dependencies.

2. Run `bower install` to install front-end dependencies.

3. Run `mongod` in a separate shell to keep an instance of the MongoDB Daemon running

4. Run `grunt serve` to start the development server. It should automatically open the client in your browser when ready.

## Build & development

Run `grunt build` for building and `grunt serve` for preview.

## Seeding Database

On dev environment, you need to seed the database at least once

```
export SEED_DB=true && grunt serve
```

## Testing

Running `npm test` will run the unit tests with karma.

## Siouxeries

build tools are included as npm dependencies (not devDependecies) in order to be able to build on heroku using npm postinstall
(Heroku default behavior is to npm install --production)
If you change heroku by doing : heroku config:set NPM_CONFIG_PRODUCTION=false
you will end in : 
 !     Timed out compiling Node.js app (15 minutes)
 !     See https://devcenter.heroku.com/articles/slug-compiler#time-limit
on the npm install.
