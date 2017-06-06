const sqldb = rootRequire('sqldb');

class MailerProvider {
  constructor () {

  }

  getAPIInterface() {
    
  }
}

MailerProvider.getDbModel = () => sqldb.MailerProvider;


module.exports = MailerProvider;
