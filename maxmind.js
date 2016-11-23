'use strict';

var maxmind = require('maxmind');

var lookup = maxmind.openSync(__dirname + '/data/GeoLite2-Country.mmdb');

// fixme: avoid direct dependency
var logger = rootRequire('logger').prefix('MAXMIND');

var getCountryCode = ip => {
  try {
    const iso_code = lookup.get(ip).country.iso_code;
    logger.debug(`LOOKUP : ${ip} => ${iso_code}`);
    return iso_code;
  } catch (e) {
    logger.error('ip='+ip+' -> '+e.message);
    return '';
  }
};

module.exports.getCountryCode = getCountryCode;


/*
> countryLookup.get('82.228.194.109')
{ continent:
   { code: 'EU',
     geoname_id: 6255148,
     names:
      { de: 'Europa',
        en: 'Europe',
        es: 'Europa',
        fr: 'Europe',
        ja: 'ヨーロッパ',
        'pt-BR': 'Europa',
        ru: 'Европа',
        'zh-CN': '欧洲' } },
  country:
   { geoname_id: 3017382,
     iso_code: 'FR',
     names:
      { de: 'Frankreich',
        en: 'France',
        es: 'Francia',
        fr: 'France',
        ja: 'フランス共和国',
        'pt-BR': 'França',
        ru: 'Франция',
        'zh-CN': '法国' } },
  registered_country:
   { geoname_id: 3017382,
     iso_code: 'FR',
     names:
      { de: 'Frankreich',
        en: 'France',
        es: 'Francia',
        fr: 'France',
        ja: 'フランス共和国',
        'pt-BR': 'França',
        ru: 'Франция',
        'zh-CN': '法国' } } }
*/
