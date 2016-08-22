angular.module('afrostreamAdminApp')
.directive('countries', function() {
  var link =      function link(scope, element, attrs) {
    // default values
    scope.props = scope.props || {};
    scope.props.countries = scope.props.countries || [];
    // FIXME: this list should be loaded from the api.
    // main code
    scope.countries = [
      { _id: 'BE', name: 'Belgique' },
      { _id: 'CH', name: 'Suisse' },
      { _id: 'CI', name: 'Côté d\'Ivoire' },
      { _id: 'FR', name: 'France' },
      { _id: 'GF', name: 'Guyane française' },
      { _id: 'GP', name: 'Guadeloupe' },
      { _id: 'LU', name: 'Luxembourg' },
      { _id: 'MF', name: 'Saint Martin' },
      { _id: 'MQ', name: 'Martinique' },
      { _id: 'PF', name: 'Polynésie française' },
      { _id: 'RE', name: 'Réunion' },
      { _id: 'SN', name: 'Sénégal' }
    ];
    scope.toggle = function (country) {
      var p = scope.props.countries.indexOf(country._id);
      if (p === -1) {
        scope.props.countries.push(country._id);
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
