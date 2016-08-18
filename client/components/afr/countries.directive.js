angular.module('afrostreamAdminApp')
.directive('countries', function() {
  var link =      function link(scope, element, attrs) {
    // default values
    scope.props = scope.props || {};
    scope.props.countries = scope.props.countries || [];
    // FIXME: this list should be loaded from the api.
    // main code
    scope.countries = [
      'BE', 'CH', 'CI', 'FR', 'GF', 'GP', 'LU', 'MF', 'MQ', 'PF', 'RE', 'SN'
    ];
    scope.toggle = function (country) {
      var p = scope.props.countries.indexOf(country);
      if (p === -1) {
        scope.props.countries.push(country);
      } else {
        scope.props.countries.splice(p, 1);
      }
      scope.props.onChange(scope.props.countries);
    };
  };
  return {
     restrict: 'E',
     scope: { props: '=' },
     templateUrl: 'components/afr/countries.html',
     link: link
   };
});
