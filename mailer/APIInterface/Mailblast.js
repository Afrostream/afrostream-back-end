const assert = require('better-assert');
const Q = require('q');

const ApiInterface = require('./APIInterface');
const IList = ApiInterface.List;
const ISubscriber = ApiInterface.Subscriber;

const request = require('request');

// fixme: this dependency should be injected
const logger = rootRequire('logger').prefix('MAILER').prefix('MAILBLAST');

const requestMailblast = options => {
  assert(options);
  assert(options.uri);

  // fixme: move to config
  const queryOptions = Object.assign({}, {
    headers: {
      'X-USER-TOKEN': 'y5MS3F4vq9X-g7o328vrZHszYxueSA',
      'X-USER-EMAIL': 'tech@afrostream.tv'
    },
    json: true
  }, options);

  logger.log('=> '+JSON.stringify(queryOptions));

  return Q.nfcall(request, queryOptions).then(
    // log + fwd
    d => {
      try {
        if (d && d[0] && d[0].statusCode) {
          logger.log(`<= >${d[0].statusCode}< ${JSON.stringify(d[1])}`);
        } else {
          logger.log(`<= unknown statusCode , ${JSON.stringify(d)}`);
        }
      } catch (e) {
        logger.log(`<= unknown (err=${e.message})`);
      }
      return d;
    },
    err => {
      logger.error(err.message);
      throw err;
    }
  );
};

/*
 * convert provider list to interface list, throw error if error.
 *
 pList
 {
  "id": "[ID]",
  "type": "lists",
  "attributes": {
    "name": "List 1",
    "active_count": 0,
    "created_at": "2017-01-01T00:00:00Z"
  }

 iList
 {
  "id": "...",
  "name": "..."
}
 */

class Mailblast extends ApiInterface {
  // this provider can handle lists.
  canHandleList() { return true; }

  /*
   * @param list  IList
   * @return IList
   */
  createList(list) {
    assert(list instanceof IList);

    logger.log(`creating list ${list.name}`);

    return requestMailblast({
      method: 'POST',
      uri: 'https://api.mailblast.io/v1/lists',
      body: {
        data: {
          attributes: { name: list.name }
        }
      }
    })
      .then(([response, body]) => {
        if (response.statusCode !== 201) {
          throw new Error(`http status should be 201 ${body && body.detail}`);
        }
        if (!body || !body.data) throw new Error('missing response.data');
        if (!Mailblast.isPList) throw new Error('malformated response');
        // everything seems ok in mailblast system.
        const list = Mailblast.PListToIList(body.data);
        logger.log(`iList created from ${JSON.stringify(body)} => ${JSON.stringify(list)}`);
        return list;
      });
  }

  updateList(list) {
    assert(list instanceof IList);

    logger.log(`updating list ${list.name}`);

    return requestMailblast({
      method: 'PATCH',
      uri: 'https://api.mailblast.io/v1/lists',
      body: {
        data: {
          attributes: { name: list.name }
        }
      }
    })
      .then(([response, body]) => {
        if (response.statusCode !== 200) throw new Error('http status should be 200');
        if (!body || !body.data) throw new Error('missing response.data');
        if (!Mailblast.isPList) throw new Error('malformated response');
        // everything seems ok in mailblast system.
        const list = Mailblast.PListToIList(body.data);
        logger.log(`iList created from ${JSON.stringify(body)} => ${JSON.stringify(list)}`);
        return list;
      });
  }

  removeList(id) {
    assert(id && typeof id === 'string');

    return requestMailblast({
      method: 'DELETE',
      uri: `https://api.mailblast.io/v1/lists/${id}`
    })
    .then(([response]) => {
      if (response.statusCode !== 204) throw new Error('http status should be 204');
      return true;
    });
  }

  createSubscriber(listId, subscriber) {
    assert(listId && typeof listId === 'string');
    assert(subscriber instanceof ISubscriber);

    logger.log(`list ${listId}: creating subscriber ${subscriber.get('email')}`);

    return requestMailblast({
      method: 'POST',
      uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers`,
      body: {
        data: {
          attributes: {
            email: subscriber.get('email'),
            first_name: subscriber.get('firstName') || '',
            last_name: subscriber.get('lastName') || ''
          }
        }
      }
    })
    .then(([response, body]) => {
      if (response.statusCode !== 201) throw new Error('http status should be 201');
      if (!body || !body.data) throw new Error('missing response.data');
      if (!Mailblast.isPSubscriber) throw new Error('malformated response');
      // everything seems ok in mailblast system.
      const subscriber = Mailblast.PSubscriberToISubscriber(body.data);
      logger.log(`list ${listId}: subscriber ${subscriber.get('id')} created from ${JSON.stringify(body)} => ${JSON.stringify(subscriber)}`);
      return subscriber;
    });
  }

  updateSubscriber(listId, subscriber) {
    assert(listId && typeof listId === 'string');
    assert(subscriber instanceof ISubscriber);
    assert(subscriber.get('id'));

    logger.log(`list ${listId}: updating subscriber ${subscriber.get('id')} ${subscriber.get('email')}`);

    return requestMailblast({
      method: 'PATCH',
      uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers/${subscriber.get('id')}`,
      body: {
        data: {
          attributes: {
            email: subscriber.get('email'),
            first_name: subscriber.get('firstName') || '',
            last_name: subscriber.get('lastName') || ''
          }
        }
      }
    })
    .then(([response, body]) => {
      if (response.statusCode !== 200) throw new Error('http status should be 200');
      if (!body || !body.data) throw new Error('missing response.data');
      if (!Mailblast.isPSubscriber) throw new Error('malformated response');
      // everything seems ok in mailblast system.
      const subscriber = Mailblast.PSubscriberToISubscriber(body.data);
      logger.log(`list ${listId}: subscriber ${subscriber.get('id')} updated from ${JSON.stringify(body)} => ${JSON.stringify(subscriber)}`);
      return subscriber;
    });
  }

  deleteSubscriber(listId, subscriberId) {
    assert(listId && typeof listId === 'string');
    assert(subscriberId && typeof subscriberId === 'string');
    assert(subscriber.get('id'));

    logger.log(`list ${listId}: deleting subscriber ${subscriber.get('id')} ${subscriber.get('email')}`);

    return requestMailblast({
      method: 'DELETE',
      uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers/${subscriber.get('id')}`
    })
    .then(([response, body]) => {
      if (response.statusCode !== 204) throw new Error('http status should be 204');
      return true;
    });
  }
}

// convertion functions
Mailblast.PListToIList = pList => {
  assert(pList);

  return IList.build({
    id: pList && pList.id || null,
    name: pList && pList.attributes && pList.attributes.name || null
  });
};

/*
Mailblast.IListToPList = iList => {
  assert(iList);

  return {
    id: iList && iList.get('id') || null,
    attributes: {
      name: iList && iList.get('name') || null
    }
  };
};
*/

Mailblast.isPList = pList => {
  return pList &&
    pList.id &&
    typeof pList.id === 'string' &&
    pList.attributes &&
    pList.attributes.name &&
    typeof pList.attributes.name === 'string';
};

Mailblast.PSubscriberToISubscriber = pSubscriber => {
  assert(pSubscriber);

  return ISubscriber.build({
    id: pSubscriber && pSubscriber.id || null,
    email: pSubscriber && pSubscriber.email || null,
    firstName: pSubscriber && pSubscriber.first_name || null,
    lastName: pSubscriber && pSubscriber.last_name || null,
    state: pSubscriber && pSubscriber.state || null
  });
};

/*
MailBlast.ISubscriberToPSubscriber = iSubscriber => {
  assert(iSubscriber);

  return {
    id: iSubscriber && iSubscriber.get('id') || null,
    attributes: {
      FIXME
    }
  };
};*
*/

Mailblast.isPSubscriber = pSubscriber => {
  return pSubscriber &&
    pSubscriber.id &&
    typeof pSubscriber.id === 'string' &&
    pSubscriber.attributes &&
    pSubscriber.attributes.email &&
    typeof pSubscriber.attributes.email === 'string';
};


module.exports = Mailblast;
