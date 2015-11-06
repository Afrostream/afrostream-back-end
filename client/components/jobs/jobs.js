// @see http://plnkr.co/edit/DemVGr?p=preview

angular.module('afrostreamAdminApp')
  .service('jobs', function($q, $http) {
    var self = this;

    var init = function () {
      if (self.authorization) {
        return $q(function () { return self.authorization; });
      } else {
        return $http.get('/api/config/client').then(function (result) {
          self.conf = result.data.jobs;
          var user = self.conf.basicAuth.user;
          var password = self.conf.basicAuth.password;
          self.authorization = 'Basic ' + btoa(user + ':' + password);
          return self.authorization;
        });
      }
    };

    this.getStats = function () {
      return init()
        .then(function () {
          return $http.get(self.conf.api + '/stats', {
            headers: {Authorization: self.authorization}
          });
        }).then(function (result) {
          // cache
          self.stats = result.data;
          return self.stats;
        });
    };

    this.getJobs = function (state, plage) {
      return init()
        .then(function () {
          return $http.get(self.conf.api + '/jobs/' + state + '/' + plage + '/asc', {
            headers: {Authorization: self.authorization}
          });
        }).then(function (result) {
          return result.data;
        });
    };

    return this;
  });