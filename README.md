# afrostream-admin

This project was generated with the [Angular Full-Stack Generator](https://github.com/DaftMonk/generator-angular-fullstack) version 2.1.1.

## Getting Started

install bower, grunt  

npm run dev  
npm run staging  

## Seeding Database

On dev environment, you need to seed the database at least once

```
export SEED_DB=true && npm run dev
```

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
  pfContentId: 424242
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
  pfContentId: 4242
  caption: [ "http://.../...fr.vtt", "http://.../...en.vtt" ]
}
```

test the catchup api using curl :
```
curl -v -X POST --header "Content-Type: application/json" --header "Authorization: Basic ZGV2OmRldg==" --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://localhost:47611/fake.xml","pfContentId":1316}' http://localhost:9000/api/jobs/catchup-bet
```

test creation catchup job ok & fail :
```
curl -v -X POST --header "Content-Type: application/json"  --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://o/bet/SOUL_TRAIN_AWARDS_2015-0001.xml","pfContentId":"1522","captions":["https://origin.cdn.afrostream.net/catchup/bet/SOUL_TRAIN_AWARDS_2015-0001.vtt"]}' https://afr-back-end-staging.herokuapp.com/api/jobs/catchup-bet
curl -v -X POST --header "Content-Type: application/json"  --data '{"sharedSecret":"62b8557f248035275f6f8219fed7e9703d59509c","xml":"http://o/bet/SOUL_TRAIN_AWARDS_2015-0001.xml","pfContentId":"424242","captions":["https://origin.cdn.afrostream.net/catchup/bet/SOUL_TRAIN_AWARDS_2015-0001.vtt"]}' https://afr-back-end-staging.herokuapp.com/api/jobs/catchup-bet
```
