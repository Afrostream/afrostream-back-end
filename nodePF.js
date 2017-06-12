const anr = require('afrostream-node-request');

// fixme: this dependency should be injected
const logger = rootRequire('logger').prefix('NODE-PF');

const { PfContent } = rootRequire('pf');


class NodePF {
  getPfContentById(contentId) {

    return NodePF.request({
      uri: `/api/contents/${contentId}`,
      qs: {
        populate: 'streams,assets.preset.profile,assets.streams'
      }
    });
  }

  getPfContentByPFMd5Hash(md5Hash) {
    // using OLD api to translate md5Hash to contentId
    const content = new PfContent(md5Hash, null);

    return content.getContent()
      .then(content => {
        if (!content || !content.contentId) throw new Error('missing contentId');
        return this.getPfContentById(content.contentId);
      });
  }
}

NodePF.request = (() => {
  const requestNodePF = anr.create({
    name: 'REQUEST-NODE-PF',
    timeout: 5000,
    baseUrl: 'http://p-afsmsch-001.afrostream.tv:4042',
    auth: {
      user: 'afrostream',
      pass: 'r4nd0mt0k3n',
      sendImmediately: true
    }
  });

  return options => {
    var readableQueryString = Object.keys(options.qs || []).map(k => k + '=' + options.qs[k]).join('&');
    var readableUrl = 'http://p-afsmsch-001.afrostream.tv:4042' + options.uri + (readableQueryString?'?' + readableQueryString:'');

    logger.log(readableUrl);

    return requestNodePF(options).then(
      data => {
        return data[1]; // body
      },
      err => {
        throw err; // fwd
      }
    );
  };
})();

module.exports = NodePF;
