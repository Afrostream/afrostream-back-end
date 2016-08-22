angular.module('afrostreamAdminApp')
.directive('broadcasters', function() {
  var link =      function link(scope, element, attrs) {
    // default values
    scope.props = scope.props || {};
    scope.props.broadcasters = scope.props.broadcasters || [];
    // FIXME: this list should be loaded from the api
    // main code
    scope.broadcasters = [
      { _id: 'MOBI', name: "Mobile"},
      { _id: 'WEB', name: "Web"},
      { _id: 'BMIA', name: "Bouygues Miami"},
      { _id: 'EBOU', name: "Bouygues Ingrid"},
      { _id: 'EOCI', name: "Orange Côte d'Ivoire"},
      { _id: 'ONEW', name: "Orange Newbox"},
      { _id: 'OMIB', name: "Orange Mib4"}
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
