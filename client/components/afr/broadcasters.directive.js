angular.module('afrostreamAdminApp')
.directive('broadcasters', function() {
  var link =      function link(scope, element, attrs) {
    // default values
    scope.props = scope.props || {};
    scope.props.broadcasters = scope.props.broadcasters || [];
    // FIXME: this list should be loaded from the api
    // main code
    scope.broadcasters = [
      { _id: 'MOBI', name: "AFROSTREAM_MOBILE"},
      { _id: 'WEB', name: "AFROSTREAM_WEB"},
      { _id: 'BOUY', name: "BOUYGUES"},
      { _id: 'EB', name: "EXPORTS_BOUYGUES"},
      { _id: 'EOCI', name: "ORANGE_CI"},
      { _id: 'EOS', name: "EXPORTS_OSEARCH"},
      { _id: 'ORAN', name: "ORANGE"},
      { _id: 'ROKU', name: "ROKU"}
    ];
    scope.toggle = function (broadcaster) {
      var p = scope.props.broadcasters.indexOf(broadcaster._id);
      if (p === -1) {
        scope.props.broadcasters.push(broadcaster._id);
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
