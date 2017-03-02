/*
 * pour chaque model, que peux t on populate ?
 * en cascade, que peux t on populate
 */

const assert = require('assert');

const sqldb = rootRequire('sqldb');

const mandatory = new Map();
const optional = new Map();

// mandatory: element => element.item
for (let name in sqldb.elements) {
  const element = sqldb.elements[name];
  mandatory.set(element.model, [{
    model: sqldb.Item,
    as: 'item',
    required: true
  }]);
}

// optional (hand-crafted associations)
optional.set(sqldb.ElementSerie, [
  {
    model: sqldb.ElementSeason,
    as: 'seasons',
    required: false
  }
]);
optional.set(sqldb.ElementSeason, [
  {
    model: sqldb.ElementEpisode,
    as: 'episodes',
    required: false
  }
]);
optional.set(sqldb.ElementEpisode, [
  {
    model: sqldb.Video,
    as: 'video',
    required: false
  }
]);

/*
 * @param populate string "seasons.episodes.video,seasons.episodes"
 * @param Model    SequelizeModel
 * @param includes [{}] array of included objects.
 * @return array of included objects populated.
 */
const buildIncludes = (Model, populate, includes) => {
  assert(typeof populate === 'string');
  assert(Model);
  assert(Array.isArray(includes) || typeof includes === 'undefined');

  console.log('buildIncludes, populate 1 : ', populate);

  includes = includes || [];
  // converting populate string to populate.
  // "seasons.episodes,seasons.episodes.video"
  // => [["seasons"."episodes"],["seasons", "episodes", "videos"]]
  populate = populate.split(',').map(p => p.split('.'));

  console.log('buildIncludes, populate 2 : ', populate);

  // foreach of this entry, add input populate associations
  populate.forEach(path => addIncludeAt(Model, includes, path));



  // add mandatory associations
  addMandatoryIncludes(Model, includes);
  //
  return includes;
};

/*
 * return all allowed associations linked to a model
 */
const allowedAssociations = Model => {
  const mandatoryAssociations = (mandatory.get(Model) || []);
  const optionalAssociations = (optional.get(Model) || []);
  return mandatoryAssociations.concat(optionalAssociations);
};

/*
 * return a specific association linked to a model
 */
const specificAssociation = (Model, as) => {
  return allowedAssociations(Model).find(asso=>asso.as === as);
};

const dupIncludedModel = im => {
  return {
    model: im.model,
    required: im.required,
    as: im.as
  };
};

const addIncludeAt = (Model, includes, path) => {
  assert(Model);
  assert(Array.isArray(includes));
  assert(Array.isArray(path));

  if (!path.length) return;
  // ex: includedModel = { model: ..., as: 'episodes', required: false}
  const as = path.shift();
  let includedModel = includes.find(im => im.as === as);
  if (!includedModel) {
    // Model.include = [ (... not included here yet ...) ]
    includedModel = specificAssociation(Model, as);
    if (!includedModel) {
      return; // stop, dead end with path.
    }
    includedModel = dupIncludedModel(includedModel);
    includes.push(includedModel);
  }
  // model exist => continue
  includedModel.include = includedModel.include || [];
  addIncludeAt(includedModel.model, includedModel.include, path);
};

/*
 * recursive mutator.
 * Adds every "mandatory" included models.
 */
const addMandatoryIncludes = (Model, includes) => {
  // current level has mandatory models ?
  (mandatory.get(Model)||[])
    .forEach(mandatoryModel => {
      if (!includes.find(im=>im.as===mandatoryModel.as)) {
        includes.push(dupIncludedModel(mandatoryModel));
      }
    });
  // recursive call.
  includes.forEach(includedModel => {
    includedModel.include = includedModel.include || [];
    addMandatoryIncludes(includedModel.model, includedModel.include);
  });
};

module.exports.mandatory = mandatory;
module.exports.optional = optional;
module.exports.buildIncludes = buildIncludes;
