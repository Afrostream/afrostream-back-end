'use strict';

const Q = require('q');

const xml2js = require('xml2js');

const saveXmlToBucket = require('./aws').saveXmlToBucket;

const logger = rootRequire('logger').prefix('CATCHUP');

const flatten = xml => {
  const result = {};
  const rec = xmlNode => {
    Object.keys(xmlNode).forEach(key => {
      const val = xmlNode[key];
      switch (key) {
        case 'ASSET_CODE':
        case 'ASSET_TITLE':
        case 'EPISODE_TITLE_FRA':
        case 'SERIES_TITLE_FRA':
        case 'SEASON_NUMBER':
        case 'SERIES_RESUME':
        case 'EPISODE_NUMBER':
        case 'EPISODE_RESUME':
          if (Array.isArray(val) && val.length > 0) {
            result[key] = val[0];
          } else {
            result[key] = null;
          }
          break;
        case 'TX_SCHED_DATE':
          try {
            if (!Array.isArray(val) || val.length <= 0) {
              throw "missing date info";
            }
            result['TX_SCHED_DATE_PARSED'] = new Date(val[0]);
            if (!result['TX_SCHED_DATE_PARSED'].getTime()) {
              throw "invalid date";
            }
          } catch (e) {
            result['TX_SCHED_DATE_PARSED'] = null;
          }
          break;
        default:
          if (val && typeof val === 'object')
            rec(val);
          break;
      }
    });
  };
  rec(xml);
  return result;
};

/**
 * parse & flatten the xml.
 *
 * @param catchupProviderId  number
 * @param pfContentId        number   pf content id
 * @param xml                string   containing the xml.
 * @returns {*}              object   { flatten xml object }
 */
const parseXml = (catchupProviderId, pfContentId, xml) => {
  logger.log(catchupProviderId+': '+pfContentId+': parsing xml = ', xml);
  return Q.nfcall(xml2js.parseString, xml)
    .then(json => {
      logger.log(catchupProviderId+': '+pfContentId+': json =' + JSON.stringify(json));
      const flattenXml = flatten(json);
      logger.log(catchupProviderId+': '+pfContentId+': flatten = ' + JSON.stringify(flattenXml));
      return flattenXml;
    });
};

const saveAndParseXml = (catchupProviderId, pfContentId, xmlUrl) => saveXmlToBucket(catchupProviderId, pfContentId, xmlUrl)
  .then(xml => parseXml(catchupProviderId, pfContentId, xml));

module.exports.saveAndParseXml = saveAndParseXml;
