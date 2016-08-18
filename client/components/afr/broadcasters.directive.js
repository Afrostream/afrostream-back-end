angular.module('afrostreamAdminApp')
.directive('broadcasters', function() {
  var link =      function link(scope, element, attrs) {
    // default values
    scope.props = scope.props || {};
    scope.props.broadcasters = scope.props.broadcasters || [];
    // FIXME: this list should be loaded from the api
    // main code
    scope.broadcasters = [
      "AFROSTREAM_MOBILE", "AFROSTREAM_WEB", "BOUYGUES",
      "EXPORTS_BOUYGUES", "EXPORTS_OSEARCH", "ORANGE",
      "ORANGE_CI", "ROKU"
    ];
    scope.toggle = function (broadcaster) {
      var p = scope.props.broadcasters.indexOf(broadcaster);
      if (p === -1) {
        scope.props.broadcasters.push(broadcaster);
      } else {
        scope.props.broadcasters.splice(p, 1);
      }
      scope.props.onChange(scope.props.broadcasters);
    };
  };
  return {
     restrict: 'E',
     scope: { props: '=' },
     templateUrl: 'components/afr/broadcasters.html',
     link: link
   };
});
