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


## Catchup

PlateformVideo -> backend
```
POST /api/jobs/catchup-bet/
{
  sharedSecret: "...",
  xml: "...",
  mamId: 4242
  caption: [ "http://.../...fr.vtt", "http://.../...en.vtt" ]
}
```
backend -> afrostream-jobs
```
POST /api/job
{
  FIXME
}
```
afrostream-jobs -> backend
```
POST /api/catchup/bet
{
  sharedSecret: "...",
  xml: "...",
  mamId: 4242
  caption: [ "http://.../...fr.vtt", "http://.../...en.vtt" ]
}
```

test the catchup api using curl :
```
curl -v -X POST --header "Content-Type: application/json" --header "Authorization: Basic ZGV2OmRldg==" --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://localhost:47611/fake.xml","mamId":1316}' http://localhost:9000/api/jobs/catchup-bet
```

test creation catchup job ok & fail :
```
curl -v -X POST --header "Content-Type: application/json"  --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://o/bet/SOUL_TRAIN_AWARDS_2015-0001.xml","mamId":"1522","captions":["https://origin.cdn.afrostream.net/catchup/bet/SOUL_TRAIN_AWARDS_2015-0001.vtt"]}' https://afr-back-end-staging.herokuapp.com/api/jobs/catchup-bet
curl -v -X POST --header "Content-Type: application/json"  --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://o/bet/SOUL_TRAIN_AWARDS_2015-0001.xml","mamId":"424242","captions":["https://origin.cdn.afrostream.net/catchup/bet/SOUL_TRAIN_AWARDS_2015-0001.vtt"]}' https://afr-back-end-staging.herokuapp.com/api/jobs/catchup-bet
```

