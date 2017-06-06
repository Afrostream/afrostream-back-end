const assert = require('better-assert');

class APIInterface {
  constructor () { }
  canHandleList() { return false; }

  // disaling lint for interface definition.
  /*eslint-disable*/
  createList(mailerList) { assert(false); }
  removeList(id) { assert(false); }
  updateList(data) { assert(false); }
  hasList(id) { assert(false); }
  /*eslint-enable*/
}

class List {
  constructor() {
    this.id = null;
    this.name = null;
    this.subscribers = [];
  }

  load(data) {
    assert(data);
    assert(data.id && typeof data.id === 'string');
    assert(data.name && typeof data.name === 'string');

    this.id = data.id;
    this.name = data.name;
    if (Array.isArray(data.subscribers)) {
      this.subscribers = [];
    }
  }

  set(key, val) {
    this.data[key] = val;
  }

  get(key) {
    return this.data[key];
  }
}

// check if some data can be an provider interface list
List.isIList = data => {
  return data &&
    data.id &&
    typeof data.id === 'string' &&
    data.attributes &&
    typeof data.attributes.name === 'string' &&
    data.attributes.name;
};

List.build = data => {
  if (List.isIList(data)) {
    throw new Error('data is not an IList ' + JSON.stringify(data));
  }
  return new List(data);
};

class Subscriber {

}

APIInterface.List = List;
APIInterface.Subscriber = Subscriber;

module.exports = APIInterface;
