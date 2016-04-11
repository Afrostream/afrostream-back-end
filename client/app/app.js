'use strict';

angular.module('afrostreamAdminApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    //UPLOAD
    'angularFileUpload',
    //Slug helper
    'slugifier',
    'ngToast',
    'ngTagsInput',
    'ui.bootstrap-slider',
    'ui.bootstrap.tabs',
    'ui.sortable',
    'mdMarkdownIt',
    'angularUtils.directives.dirPagination'
  ])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('authInterceptor');
    
    // inlining micro backo interceptor.
    // this interceptor will add ?backo=1 to every /api/* requests.
    $httpProvider.interceptors.push(function () {
      return {
        'request': function(config) {
          if (config && config.url && config.url.match(/^\/api\/.*/)) {
            config.params = config.params || {};
            config.params.backo = 1;
          }
          return config;
        }
      };
    });
  })
  .factory('authInterceptor', function ($rootScope, $q, $cookies, $injector) {
    var state;
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        // avoid adding Authorization headers to cross domain requests.
        if (config.url && config.url.substr(0, 4) === 'http') {
          return config;
        }
        if ($cookies.get('token')) {
          config.headers.Authorization = config.headers.Authorization || 'Bearer ' + $cookies.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function (response) {
        if (response.status === 401) {
          (state || (state = $injector.get('$state'))).go('login');
          // remove any stale tokens
          $cookies.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })
  .config(['ngToastProvider', function (ngToastProvider) {
    ngToastProvider.configure({
      animation: 'slide' // or 'fade'
    });
  }])
  .config(['markdownItConverterProvider', function (markdownItConverter) {
    markdownItConverter.config('commonmark', {
      html: true,        // Enable HTML tags in source
      xhtmlOut: true,        // Use '/' to close single tags (<br />).
      // This is only for full CommonMark compatibility.
      breaks: true,        // Convert '\n' in paragraphs into <br>
      langPrefix: 'language-',  // CSS language prefix for fenced blocks. Can be
                                // useful for external highlighters.
      linkify: true        // Autoconvert URL-like text to links
    });
  }])
  .run(function ($rootScope, $state, Auth) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', function (event, next) {
      Auth.isLoggedIn(function (loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $state.go('login');
        }
      });
    });
  });
