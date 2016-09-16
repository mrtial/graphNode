(function(){
	angular.module("App", [])
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

})()