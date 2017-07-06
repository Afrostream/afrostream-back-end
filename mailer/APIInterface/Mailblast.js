const assert = require('better-assert');
const Q = require('q');

const ApiInterface = require('./APIInterface');
const IList = ApiInterface.List;
const ISubscriber = ApiInterface.Subscriber;

const request = require('request');

// fixme: this dependency should be injected
const logger = rootRequire('logger').prefix('MAILER').prefix('MAILBLAST');

const config = rootRequire('config');

const requestMailblast = options => {
  assert(options);
  assert(options.uri);

  // fixme: move to config
  const queryOptions = Object.assign({}, {
    headers: {
      'X-USER-TOKEN': config.mailblast.token,
      'X-USER-EMAIL': config.mailblast.email
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

  getLists() {
    logger.log(`get all lists`);

    return requestMailblast({uri:'https://api.mailblast.io/v1/lists',qs:{'page[size]':100}})
      .then(([response, body]) => {
        if (response.statusCode !== 200) {
          throw new Error(`http status should be 200 ${body && body.detail}`);
        }
        if (!body || !body.data) throw new Error('missing response.data');
        if (!Array.isArray(body.data)) throw new Error('malformated response, data should be an array');
        if (!body.data.every(pList=>Mailblast.isPList(pList))) throw new Error('malformated response');
        logger.log(`${body.data.length} lists found`);
        return body.data.map(pList=>Mailblast.PListToIList(pList));
      });
  }



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
        if (!Mailblast.isPList(body.data)) throw new Error('malformated response');
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
        if (!Mailblast.isPList(body.data)) throw new Error('malformated response');
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

  // crawl the provider api
  getSubscribers(listId) {
    assert(listId && typeof listId === 'string');

    logger.log(`list ${listId}: get subscribers`);

    const crawlPage = pageNumber =>
      requestMailblast({
        uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers`,
        qs: {
          'page[number]': pageNumber,
          'page[size]': 100
        }
      })
      .then(([response, body]) => {
        if (response.statusCode !== 200) throw new Error(`http status should be 200 - crawl ${pageNumber} ${listId}`);
        if (!body || !body.data) throw new Error(`missing response.data - crawl ${pageNumber} ${listId}`);
        if (!Array.isArray(body.data)) throw new Error(`malformed response - crawl ${pageNumber} ${listId}`);
        return body;
      });

    const crawlRec = pageNumber => {
      logger.log(`list ${listId}: get subscribers - crawling page ${pageNumber}`);
      return crawlPage(pageNumber)
        .then(body => {
          if (!body.data.every(Mailblast.isPSubscriber)) throw new Error(`not pSubscriber - crawl ${pageNumber} ${listId}`);

          const iSubscribers = body.data.map(Mailblast.PSubscriberToISubscriber);

          if (!body.links || !body.links.next) {
            return iSubscribers;
          }
          return crawlRec(pageNumber+1).then(nextISubscribers=>iSubscribers.concat(nextISubscribers));
        });
    };

    return crawlRec(1);
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
      if (!Mailblast.isPSubscriber(body.data)) throw new Error('malformated response');
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
      if (!Mailblast.isPSubscriber(body.data)) throw new Error('malformated response');
      // everything seems ok in mailblast system.
      const subscriber = Mailblast.PSubscriberToISubscriber(body.data);
      logger.log(`list ${listId}: subscriber ${subscriber.get('id')} updated from ${JSON.stringify(body)} => ${JSON.stringify(subscriber)}`);
      return subscriber;
    });
  }

  getSubscriber(listId, subscriber) {
    assert(listId && typeof listId === 'string');
    assert(subscriber instanceof ISubscriber);
    assert(subscriber.get('id'));

    logger.log(`list ${listId}: get subscriber ${subscriber.get('id')} ${subscriber.get('email')}`);

    return requestMailblast({
      uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers/${subscriber.get('id')}`
    })
    .then(([response, body]) => {
      if (response.statusCode !== 200) throw new Error('http status should be 200');
      if (!body || !body.data) throw new Error('missing response.data');
      if (!Mailblast.isPSubscriber(body.data)) throw new Error('malformated response');
      // everything seems ok in mailblast system.
      const subscriber = Mailblast.PSubscriberToISubscriber(body.data);
      return subscriber;
    });
  }

  deleteSubscriber(listId, subscriber) {
    assert(listId && typeof listId === 'string');
    assert(subscriber instanceof ISubscriber);
    assert(subscriber.get('id'));

    logger.log(`list ${listId}: deleting subscriber ${subscriber.get('id')} ${subscriber.get('email')}`);

    return requestMailblast({
      method: 'DELETE',
      uri: `https://api.mailblast.io/v1/lists/${listId}/subscribers/${subscriber.get('id')}`
    })
    .then(([response]) => {
      if (response.statusCode !== 204) throw new Error('http status should be 204');
      return true;
    });
  }

  request(options) {
    return requestMailblast(options);
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
    email: pSubscriber && pSubscriber.attributes.email || null,
    firstName: pSubscriber && pSubscriber.attributes.first_name || null,
    lastName: pSubscriber && pSubscriber.attributes.last_name || null,
    state: pSubscriber && pSubscriber.attributes.state || null
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
