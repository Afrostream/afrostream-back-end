const sqldb = rootRequire('sqldb');

// building associations from sqldb.helper associations infos
const elements = sqldb.helper.getModels(/^Element/);

// mandatory associations: element => element.item
const mandatoryAssociations = new Map();
for (let modelName in elements) {
  const element = elements[modelName];
  mandatoryAssociations.set(element, [{
    model: sqldb.Item,
    as: 'item',
    required: true
  }]);
}

// optional associations, auto-generation
const optionalAssociations = sqldb.helper.generateOptionalAssociations();

module.exports.mandatoryAssociations = mandatoryAssociations;
module.exports.optionalAssociations = optionalAssociations;
