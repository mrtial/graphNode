(function(){
	angular.module("App", ['ui.bootstrap'])
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

})()