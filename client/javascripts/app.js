(function(){
	angular.module("App", ['ui.bootstrap','ui.bootstrap.tpls'])
  .component('app',{
  	bindings:{},
  	controller:'mainController',
  	controllerAs:'vm',
  	templateUrl:'./views/app.html',
  })
  .directive('toolbar',function(){
    return {
      templateUrl:'./views/toolbar.html'
    }
  })
  .directive('menu',function(){
    return {
      templateUrl:'./views/menu.html'
    }
  })
  .directive('jsoneditor',function(){
    return {
      templateUrl:'./views/jsonEditor.html'
    }
  })
  .component('modalComponent',{
    templateUrl: './views/myModalContent.html',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller: function () {
        var $ctrl = this;

        $ctrl.$onInit = function () {
          $ctrl.items = $ctrl.resolve.items;
          $ctrl.selected = {
            item: $ctrl.items[0]
          };
        };

        $ctrl.ok = function () {
          $ctrl.close({$value: $ctrl.selected.item});
        };

        $ctrl.cancel = function () {
          $ctrl.dismiss({$value: 'cancel'});
        };
      }

  })

})()