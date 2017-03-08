'use strict';

const sqldb = rootRequire('sqldb');
const Config = sqldb.Config;

exports.showConfig = (req, res) => {
  Config.find({
    where: {
      target: 'app'
    },
    max: '_id',
    order: [
      ['_id', 'DESC']
    ]
  })
    .then(() => {
      return entity => {
        if (!entity) {
          return {
            data: {
              backgroundImage: 'https://images.cdn.afrostream.net/production/screen/blackish-home-v5.jpg'
            }
          };
        }
        return entity;
      };
    })
    .then(
      entity => {
        res.json(entity.data);
      },
      res.handleError()
    );
};
