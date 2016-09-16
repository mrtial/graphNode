(function(){

	angular.module("App")
		.service("$api", api)

		// API FUNCTION
		function api($http){
			var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWlzaGEiLCJpYXQiOjE0Njc3ODc1MjUsImV4cCI6MTQ2Nzg3MzkyNX0.Hljv7vcSWX9G2N11-XJTuZvnZP4PiGZMJJYm2tIGwD0";

			// GET DATA
			this.getData = function(id){
				return $http({
				  method: 'GET',
				  url: `http://remissionaire-staging.herokuapp.com/api/v1/nodes/${id}`
				})
			};

			// POST /api/v1/node/add-new HTTP/1.1
			// id=test1 & payloadtype=message
			this.postData = function(id, data){
				return $http({
				  method: 'POST',
				  url: `http://remissionaire-staging.herokuapp.com/api/v1/node/${id}`,
				  headers: {
				     'Content-Type':'application/x-www-form-urlencoded',
				     'x-access-token': token,
				     'Cache-Control': 'no-cache',
				  },
				  data:{data}
				})
			};

			// DELETE node /api/v1/node/<node_id>
			this.deleteData = function(id){
				return $http({
					method: 'DELETE',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/nodes/${id}`,
					headers: {
					   'Content-Type':'application/x-www-form-urlencoded',
					   'x-access-token': token,
					   'Cache-Control': 'no-cache',
					}
				})
			};

			// PUT /api/v1/node/test1 HTTP/1.1
			this.updateData = function(id, data){
				return $http({
					method: 'PUT',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/nodes/${id}`,
					headers: {
					   'Content-Type':'application/x-www-form-urlencoded',
					   'x-access-token': token,
					   'Cache-Control': 'no-cache',
					},
					dtat:{data}
				})
			};

			// Generate new id
			// POST /api/v1/node/next-id HTTP/1.1
			this.getNextID = function(prefix){
				return $http({
					method: 'POST',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/node/next-id`,
					headers: {
					   'Content-Type':'application/x-www-form-urlencoded',
					   'Postman-Token': '435667e9-55f8-6613-c513-8227cbed063a',
					   'Cache-Control': 'no-cache',
					},
					data:{prefix}
				})
			};


			// Pushed POST /api/v1/repopulate-nodes HTTP/1.1
			this.repopulate = function(){
				return $http({
					method: 'POST',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/repopulate-nodes`,
				})
			}


		}

})()