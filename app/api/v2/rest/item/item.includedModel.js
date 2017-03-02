const sqldb = rootRequire('sqldb');
const Item = sqldb.Item;
const ElementCategory = sqldb.ElementCategory;
const ElementEpisode = sqldb.ElementEpisode;
const ElementFilm = sqldb.ElementFilm;
const ElementLive = sqldb.ElementLive;
const ElementPerson = sqldb.ElementPerson;
const ElementSeason = sqldb.ElementSeason;
const ElementSerie = sqldb.ElementSerie;

module.exports.get = () => [
  {model: ElementCategory, as: 'element', required: false, where: { type: ''}},
  {model: Item, as: 'element', required: false},
  {model: Season, as: 'seasons', required: false},
  {model: Image, as: 'logo', required: false},
  {model: Image, as: 'poster', required: false},
  {model: Image, as: 'thumb', required: false},
  {model: Licensor, as: 'licensor', required: false},
  {model: Actor, as: 'actors', required: false}
];
