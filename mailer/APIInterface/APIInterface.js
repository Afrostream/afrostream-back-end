const assert = require('better-assert');

class APIInterface {
  constructor () { }
  canHandleList() { return false; }

  // disaling lint for interface definition.
  /*eslint-disable*/
  createList(iList) { assert(false); }
  removeList(id) { assert(false); }
  updateList(iList) { assert(false); }
  hasList(id) { assert(false); }
  /*eslint-enable*/
}

class List {
  constructor() {
    this.data = {
      id: null,
      name: null,
      subscribers: []
    };
  }

  load(data) {
    assert(data);
    assert((data.id && typeof data.id === 'string') || data.id === null);
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
    ((data.id && typeof data.id === 'string') || data.id === null) &&
    typeof data.name === 'string' && data.name;
};

List.build = data => {
  if (!List.isIList(data)) {
    throw new Error('data is not an IList ' + JSON.stringify(data));
  }
  const iList = new List();
  iList.load(data);
  return iList;
};

class Subscriber {
  constructor() {
    this.data = {
      id: null,
      firstName: null,
      lastName: null,
      state: null,
      email: null
    };
  }

  load(data) {
    assert(data);
    assert(data.email && typeof data.email === 'string');

    this.data.id = data.id;
    this.data.firstName = data.firstName;
    this.data.lastName = data.lastName;
    this.data.state = data.state;
    this.data.email = data.email;
  }

  set(key, val) {
    this.data[key] = val;
  }

  get(key) {
    return this.data[key];
  }
}

// check if some data can be an provider interface list
Subscriber.isSubscriber = data => {
  return data &&
    data.email &&
    typeof data.email === 'string';
};

Subscriber.build = data => {
  if (!Subscriber.isSubscriber(data)) {
    throw new Error('data is not an ISubscriber ' + JSON.stringify(data));
  }
  const iSubscriber = new Subscriber();
  iSubscriber.load(data);
  return iSubscriber;
};

APIInterface.List = List;
APIInterface.Subscriber = Subscriber;

module.exports = APIInterface;
