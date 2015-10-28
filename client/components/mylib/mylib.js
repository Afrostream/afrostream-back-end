// @see http://plnkr.co/edit/DemVGr?p=preview

angular.module('afrostreamAdminApp')
  .directive('directiveIf', ['$compile',
    function($compile) {

      // Error handling.
      var compileGuard = 0;
      // End of error handling.

      return {

        // Set a high priority so we run before other directives.
        priority: 100,
        // Set terminal to true to stop other directives from running.
        terminal: true,

        compile: function() {
          return {
            pre: function(scope, element, attr) {

              // Error handling.
              //
              // Make sure we don't go into an infinite compile loop
              // if something goes wrong.
              compileGuard++;
              if (compileGuard >= 10) {
                console.log('directiveIf: infinite compile loop!');
                return;
              }
              // End of error handling.


              // Get the set of directives to apply.
              var directives = scope.$eval(attr.directiveIf);
              angular.forEach(directives, function(expr, directive) {
                // Evaluate each directive expression and remove
                // the directive attribute if the expression evaluates
                // to `false`.
                var result = scope.$eval(expr);
                if (result === false) {
                  // Set the attribute to `null` to remove the attribute.
                  //
                  // See: https://docs.angularjs.org/api/ng/type/$compile.directive.Attributes#$set
                  attr.$set(directive, null)
                }
              });

              // Remove our own directive before compiling
              // to avoid infinite compile loops.
              attr.$set('directiveIf', null);

              // Recompile the element so the remaining directives
              // can be invoked.
              var result = $compile(element)(scope);


              // Error handling.
              //
              // Reset the compileGuard after compilation
              // (otherwise we can't use this directive multiple times).
              //
              // It should be safe to reset here because we will
              // only reach this code *after* the `$compile()`
              // call above has returned.
              compileGuard = 0;

            }
          };

        }
      };
    }
  ]);