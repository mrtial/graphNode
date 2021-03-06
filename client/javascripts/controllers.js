(function(){
	angular.module('App')
	.controller('mainController', mainController);

	function mainController($http, $api, $rootScope, $d3){
		var vm = this;
		vm.menuShow = false;
		vm.errorMsg = '';

		// Toolbar Function
		// =================================================
    // GET DATA
  	vm.getData = function(id){
  		vm.errorMsg = '';
  		$api.getData(id)
  		.then(function successCallback(response) {
  			vm.data = response.data;

  		  //Duplicate the multiParent Nodes
  		  vm.data.forEach(function(d){
  		  	var dup = 0;
  		  	vm.data.forEach(function(d1){
  		  		d1.buttons.forEach(function(d2){
  		  			if( (d2.next_node_id === d._id) & !('dup' in d1) ){
  		  				dup++;
  		  				if(dup>1)
  		  				{
  		  					var temp_obj = Object.assign({},d);
	  		  				temp_obj._id=temp_obj._id +"_duplicate"+dup;
	  		  				temp_obj.dup=dup;
	  		  				vm.data.push(temp_obj);
	  		  				d2.next_node_id = temp_obj._id;
  		  				}
  		  			}
  		  		})
  		  	});

  		  });


	      // RE-STRUCTURE DATA FOR D3
	      vm.treeData = $d3.build(vm.nodeID, vm.data);

	      // BUILD D3
	      $d3.generateD3(vm.treeData);
	      cleanDuplicate(vm.data);
		  }, function errorCallback(error) {
		  	vm.errorMsg=error;
		  }); 
  	};

  	vm.getAllNode = function(){
  		vm.errorMsg = '';
  		$api.getAllNode()
  		.then(function success(response){
  			vm.showAllNode = response.data;
  		}, function error(response){
  			vm.errorMsg = response;
  		});
  	};

  	vm.getRootNode = function(){
  		vm.errorMsg = '';
  		$api.getRootNode()
  		.then(function success(response){
  			vm.showAllNode = response.data;
  		}, function error(response){
  			vm.errorMsg = response;
  		});
  	};

  	// Modal Function : Open / Close
  	// =================================================
  	vm.modalOpen = function(e){
  		vm.open = true;
  		if(e.target.innerHTML==="Edit JSON"){vm.editType="json"}
  		else if(e.target.innerHTML==="Edit Button Title"){vm.editType="btn_title"}
  		else if(e.target.innerHTML==="Edit Message Text"){vm.editType="msg_text"}
  		else if(e.target.innerHTML==="Link Message"){vm.editType="link_node"}
  	};

  	vm.modalClose = function(e){
  		if(e && e.target.id==="modal_window" || e.target.innerHTML ==="cancel"){
  			vm.open = false;
  			vm.menuShow = false;
  		} 
  	};

	  // TOGGLE MENU
	  // =================================================
	  vm.toggleMenu = function(e){
	  	// show menu at mouse click position
	  	var menuBox = document.getElementsByClassName('menu')[0];

	  	menuBox.style.top = e.clientY+"px";
	  	menuBox.style.left = e.clientX+"px";
	  	vm.duplicate=false;

	  	if(e.target.tagName==="rect" || e.target.parentElement.previousSibling.tagName ==="rect"){
	  		vm.menuShow = true;
	  		var obj = e.target.__data__ || e.target.parentElement.previousSibling.__data__ ;

	  		// find current node in vm.data
	  		// bind current node json to $rootScope

	  		if (obj.button){
	  			var jsonData = findNode(obj.parent.id, vm.data);
	  			vm.currentID = obj.parent.id;



	  		}else{
	  			var jsonData = findNode(obj.id, vm.data);
	  			vm.currentID = obj.id;
				var re = new RegExp("_duplicate" + jsonData.dup + "$","g");
				vm.currentID = vm.currentID.replace(re,"")

	  		}

	  		var jsonData_copy = Object.assign({},jsonData);
			if("buttons" in jsonData_copy){
				jsonData_copy.buttons.forEach(function(d){
					var next_node = findNode(d.next_node_id, vm.data);
					if (next_node != null){
						if( "dup" in next_node){
							var re = new RegExp("_duplicate" + next_node.dup + "$","g");
							d.next_node_id = d.next_node_id.replace(re,"")
						}
					}
					
				})
			} 

	  		vm.json = prettyPrint(JSON.stringify(jsonData_copy));


	  		vm.currentNode = obj;

	  		
	  		if(obj.Duplicate){
	  			vm.duplicate=true;
	  		} else{
	  			vm.duplicate=false;
	  		};

	  		// btn & postback
	  		if(obj.button && obj.payload_type === "postback"){
	  			vm.nodeType = "button_postback";
	  			if(!obj.children){
	  				vm.noChild = true;
	  			} else {
	  				vm.noChild = false;
	  			}
	  		}
	  		// btn & not postback
	  		else if(obj.button){
	  			vm.nodeType = "button";
	  			if(!obj.children){
	  				vm.noChild = true;
	  			} else {
	  				vm.noChild = false;
	  			}
	  		}
	  		// msg === msg
	  		else if(!obj.button && obj.payload_type === "message"){
	  			vm.nodeType="message"
	  			if(!obj.children){
	  				vm.noChild = true;
	  			} else {
	  				vm.noChild = false;
	  			}
	  		}
	  		// msg != msg
	  		else if(!obj.button && obj.payload_type === "bubble"){
	  			vm.nodeType="bubble";
	  			if(!obj.children){
	  				vm.noChild = true;
	  			} else {
	  				vm.noChild = false;
	  			}
	  		} 
	  	} 

	  	else{
	  		vm.menuShow = false;
	  	}

	  };

	  // MENU FUNCTION
	  // ===============================================
	  // ADD NODE
	  // 1. get id from db
	  // 2. post new node to db
	  // 3. get all updated data from db
	  // 4. render d3
	  // vm.addNode = function(node_name,data){
	  // 	add_node(node_name,data);
	  // 	vm.menuShow = false;
	  // 	$d3.generateD3(vm.treeData);
	  // }
	  vm.addNode = function(){
	  	vm.errorMsg = '';
	  	vm.menuShow = false;
	  	
	  	// Get parent prefix
	  	var parentPrefix='';
	  	

	  	if(vm.currentNode.button){
	  		// add message
	  		if(vm.currentNode.parent.id){
	  			parentPrefix = vm.currentNode.parent.id.replace(/_\d+$/g,'');
	  			console.log(parentPrefix);
	  		}

	  		$api.getNextID(parentPrefix)
	  		.then(function success (response){
	  			$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  		.then(function success(){
		  			var button = vm.data.filter(function(d){return(d._id === vm.currentNode.parent.id )})[0].buttons
		  			var index = vm.currentNode.parent.children.indexOf(vm.currentNode)
		  			button[index].next_node_id = response.data
		  			$api.updateData(vm.currentID, "buttons="+JSON.stringify(button))
		  			.then(function(){
		  				vm.getData(vm.nodeID);
		  			
		  				$d3.generateD3(vm.treeData);
		  				cleanDuplicate(vm.data);
		  			});
		  		},function error(error){vm.errorMsg = error;});
	  		}, function error(error){
	  				vm.errorMsg = error;
	  		});

	  		
	  	}else{
	  		// add button

				parentPrefix = vm.currentNode.id.replace(/_\d+$/g,'');
	  	  console.log(parentPrefix);


	  		$api.getNextID(parentPrefix).then(function success(response){
	  			
				var button = vm.data.filter(function(d){return(d._id === vm.currentID );})[0].buttons;

		  	  	button.push({
					"type": "postback",
					"title": "New button",
					"next_node_id": response.data
	 	  	  	});

		  		$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  		.then(function success(){
		  			$api.updateData(vm.currentID, "buttons="+JSON.stringify(button)).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.generateD3(vm.treeData);
		  			cleanDuplicate(vm.data);
		  			 });
		  		}, function error(error){vm.errorMsg=error});
	  		}, function error(error){vm.errorMsg=error})
	  	  	
	  	}

	  	// clear text input
	  	clearInputText();

	  };

	  vm.addNewNode =function(text){
	  	vm.errorMsg = '';

	  	$api.getNextID(text).then(function success(response){
	  			$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  			.then(function success(){
		  				vm.getData(vm.nodeID);
		  			
		  				$d3.generateD3(vm.treeData);
		  				cleanDuplicate(vm.data);
		  			}, function error(error){vm.errorMsg=error});
		  		}, function error(error){vm.errorMsg=error});
	  };

	  vm.linkNode = function(text){
	  	vm.errorMsg = '';
	  	vm.menuShow = false;
	  	vm.open = false;

	  	if(vm.currentNode.button){

	  		var parent_id = vm.currentNode.parent.id
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	var index = vm.currentNode.parent.children.indexOf(vm.currentNode)
			
			$api.getData(text).then(function success(response){
				parent_button[index].next_node_id = text;

			  	$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button))
			  	.then(function success(){
		  			vm.getData(vm.nodeID);
		  			$d3.generateD3(vm.treeData);
		  			cleanDuplicate(vm.data);
			  		clearInputText();
		  		}, function error(error){vm.errorMsg=error});
			}, function error(error){vm.errorMsg=error; })		  	
	  	}
	  };

	  vm.createNewMsg = function(text){
	  	vm.errorMsg = '';
	  	$api.getNextID(text)
	  	.then(function success(response){
	  		$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
	  		.then(function success(){
	  			clearInputText();
	  		}, function error(error){vm.errorMsg=error});
	  	}, function error(error){vm.errorMsg=error});
	  };

	  // DELETE NODE
	  // 1. delete id from db
	  // 2. get all updated data from db
	  // 3. render d3
	  vm.deleteNode = function(){
	  	vm.errorMsg = '';

	  	vm.menuShow = false;
	  	if(vm.currentNode.button)
	  	{
	  		var parent_id = vm.currentNode.parent.id
		  	var index = vm.currentNode.parent.children.indexOf(vm.currentNode)
	  		var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons
	  		parent_button.splice(index,1);
		  						// .filter(function(d){return(d.next_node_id !== vm.currentNode.children[0].id)}
	  		// vm.json = prettyPrint(JSON.stringify(jsonData_copy));
	  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function success(){
	  			vm.getData(vm.nodeID);
	  			
	  			$d3.generateD3(vm.treeData);
	  			cleanDuplicate(vm.data);
	  		},function error(error){vm.errorMsg=error});

	  	}else if( "parent" in vm.currentNode){
	  		var parent_id = vm.currentNode.parent.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	parent_button.filter(function(d){return(d.next_node_id === vm.currentID)})[0].next_node_id = "";
		  	$api.deleteData(vm.currentID).then(function success(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function success(){
		  			vm.getData(vm.nodeID);
		  			
		  			$d3.generateD3(vm.treeData);
		  			cleanDuplicate(vm.data);
		  		}, function error(error){vm.errorMsg=error;});
		  	}, function error(error){vm.errorMsg=error;});
	  	}else{
	  		
		  	$api.deleteData(vm.currentID).then(function success(){
		  			vm.getData(vm.nodeID);
		  			$d3.removeNode();
		  	},function error(error){vm.errorMsg=error;});

	  	}
	  };


	  vm.deleteAllNode = function(){
	  	vm.errorMsg = '';
	  	vm.menuShow = false;
	  	if(vm.currentNode.button)
	  	{
	  		var parent_id = vm.currentNode.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id );})[0].buttons
		  						.filter(function(d){return(d.next_node_id !== vm.currentNode.children[0].id);});

		  	$api.deleteAllData(vm.currentNode.children[0].id).then(function success(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function success(){
	  				vm.getData(vm.nodeID);
	  				$d3.generateD3(vm.treeData);
	  				cleanDuplicate(vm.data);
	  			},function error(error){vm.errorMsg=error;});
		  	}, function error(error){vm.errorMsg=error;});
	  		

	  	}else if( "parent" in vm.currentNode){
	  		var parent_id = vm.currentNode.parent.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	parent_button.filter(function(d){return(d.next_node_id === vm.currentID)})[0].next_node_id = "";
		  	$api.deleteAllData(vm.currentID).then(function(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.generateD3(vm.treeData);
		  			cleanDuplicate(vm.data);
		  		}, function error(error){vm.errorMsg=error})
		  	},function error(error){vm.errorMsg=error});
	  	}else{
	  		
		  	$api.deleteAllData(vm.currentID).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.removeNode();
		  	}, function error(error){vm.errorMsg=error});

	  	}
	  }
	  // EDIT JSON / EDIT TITLE / EDIT MSG
	  // 1. put data to db
	  // 2. get all updated data from db
	  // 3. render d3
	  vm.updateDB = function(){
	  	vm.errorMsg = '';
	  	vm.menuShow = false;
	  	vm.open = false;
		var currentID = vm.currentNode.button?vm.currentNode.parent.id:vm.currentNode.id;

	  	$api.updateData(currentID, JSONtoString(vm.json)).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  			cleanDuplicate(vm.data);

	  		}, function error(error){vm.errorMsg=error;});
	  };

	  vm.updateText = function(text){
	  	vm.errorMsg = '';

	  	vm.menuShow = false;
	  	vm.open = false;	
	  	if(vm.currentNode.button){
	  		var parent_id = vm.currentNode.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons
	
			parent_button.filter(function(d){return(d.next_node_id === vm.currentNode.children[0].id)})[0].title = text;

	  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  			cleanDuplicate(vm.data);
	  		}, function error(error){vm.errorMsg=error;});
	  	}else{
	  		$api.updateData(vm.currentID, "message_text="+ text).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  			cleanDuplicate(vm.data);
	  		}, function error(error){vm.errorMsg=error;});
	  	}

	  	// clear text input
	  	clearInputText();
	  };

	  function clearInputText(){
	  	var inputText = document.getElementsByClassName("new_text");
	  	for(var i=0;i<inputText.length;i++){
	  		inputText[i].value='';
	  	}
	  }

	} // mainController


	// Helper function
	// =================================================
	function prettyPrint(ugly) {
	    var obj = JSON.parse(ugly);
	    var pretty = JSON.stringify(obj, undefined, 4);
	    return pretty
	}

	function findNode(id, data){
		return data[data.map(function(el) {return el._id}).indexOf(id)];
	}

	function JSONtoString(s){
		var obj = JSON.parse(s);
		var key = Object.keys(obj);
		var apiData = "";
		key.forEach(function(d){
			if(d !== "_id" & d !== "buttons"){
				apiData = apiData + d + "=" + JSON.stringify(obj[d]).replace(/\"/g, "") +"&"
			}else if( d === "buttons"){
				apiData = apiData + d + "=" + JSON.stringify(obj[d]) +"&"
			}
			
		});

		return apiData.slice(0, -1);
	}

	cleanDuplicate = function(data){
		
		data.forEach(function(vmd){
			if("buttons" in vmd){
				vmd.buttons.forEach(function(d){
					var next_node = findNode(d.next_node_id, data);
					if (next_node != null){
						if( "dup" in next_node){
							var re = new RegExp("_duplicate" + next_node.dup + "$","g");
							d.next_node_id = d.next_node_id.replace(re,"")
						}
					}
				
				});
			}
	
		});
	};
})();