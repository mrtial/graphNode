(function(){
	angular.module("App")
	.controller("mainController", mainController)

	function mainController($http, $api, $rootScope, $d3){
		var vm = this;
		vm.menuShow = false;
		// vm.errorMsg = "this is where error message shows."

		// Toolbar Function
		// =================================================
    // GET DATA
  	vm.getData = function(id){
  		$api.getData(id)
  		.then(function successCallback(response) {
  			vm.data = response.data;
	      // RE-STRUCTURE DATA FOR D3
	      vm.treeData = $d3.build(vm.nodeID, vm.data);
	      console.log(vm.data);
	      // BUILD D3
	      $d3.generateD3(vm.treeData);

		  }, function errorCallback(err) {
		    console.log(err)
		  });
  	}

  	// Modal Function : Open / Close
  	// =================================================
  	vm.modalOpen = function(e){
  		vm.open = true;
  		if(e.target.innerHTML==="Edit JSON"){vm.editType="json"}
  		else if(e.target.innerHTML==="Edit Button Title"){vm.editType="btn_title"}
  		else if(e.target.innerHTML==="Edit Message Text"){vm.editType="msg_text"}
  		else if(e.target.innerHTML==="Link Node"){vm.editType="link_node"}
  	}

  	vm.modalClose = function(e){
  		if(e && e.target.id==="modal_window" || e.target.innerHTML ==="cancel"){
  			vm.open = false;
  			vm.menuShow = false;
  		} 
  	}

	  // TOGGLE MENU
	  // =================================================
	  vm.toggleMenu = function(e){
	  	// console.log(obj);
	  	// show menu at mouse click position
	  	var menuBox = document.getElementsByClassName('menu')[0];
	  	menuBox.style.top = e.clientY+"px";
	  	menuBox.style.left = e.clientX+"px";

	  	if(e.target.tagName==="rect" || e.target.parentElement.previousSibling.tagName ==="rect"){
	  		vm.menuShow = true;
	  		var obj = e.target.__data__ || e.target.parentElement.previousSibling.__data__ ;
	  		console.log(obj)

	  		// find current node in vm.data
	  		// bind current node json to $rootScope
	  		if (obj.button){
	  			var jsonData = findNode(obj.parent.id, vm.data);
	  			vm.currentID = obj.parent.id;

	  		}else{
	  			var jsonData = findNode(obj.id, vm.data);
	  			vm.currentID = obj.id;
	  		}

	  		vm.json = prettyPrint(JSON.stringify(jsonData));



	  		vm.currentNode = obj;

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

	  }

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
	  vm.addNode = function(text){
	  	vm.menuShow = false;
	  	if(vm.currentNode.button){

	  		$api.getNextID(text).then(function(response){
				console.log(response.data)

	  			$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  		.then(function(){
		  			var button = vm.data.filter(function(d){return(d._id === vm.currentNode.parent.id )})[0].buttons
		  			var index = vm.currentNode.parent.children.indexOf(vm.currentNode)
		  			button[index].next_node_id = response.data
		  			$api.updateData(vm.currentID, "buttons="+JSON.stringify(button))
		  			.then(function(){
		  				vm.getData(vm.nodeID);
		  			
		  				$d3.generateD3(vm.treeData);
		  			})
		  		});
	  		});

	  		
	  	}else{

	  		$api.getNextID().then(function(response){
	  			
				var button = vm.data.filter(function(d){return(d._id === vm.currentID )})[0].buttons
				console.log(response.data)
		  	  	button.push({
					"type": "postback",
					"title": "New button",
					"next_node_id": response.data
	 	  	  	})

		  		$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  		.then(function(){
		  			$api.updateData(vm.currentID, "buttons="+JSON.stringify(button)).then(function(){
		  			vm.getData(vm.nodeID);
		  			
		  			$d3.generateD3(vm.treeData);
		  			 })
		  		});

		  		
	  		})
	  	  	
	  	}

	  	// clear text input
	  	clearInputText();

	  }

	  vm.addNewNode =function(text){

	  	$api.getNextID(text).then(function(response){
	  			$api.postData("_id=" + response.data + "&payload_type=message&message_text=New Message")
		  			.then(function(){
		  				vm.getData(vm.nodeID);
		  			
		  				$d3.generateD3(vm.treeData);
		  			});
		  		});
	  }

	  vm.linkNode = function(text){
	  	if(vm.currentNode.button){
	  		var parent_id = vm.currentNode.parent.id
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	var index = vm.currentNode.parent.children.indexOf(vm.currentNode)
		  	parrent_button[index].next_node_id = text;

		  	$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  		})

	  	}
	  }

	  // DELETE NODE
	  // 1. delete id from db
	  // 2. get all updated data from db
	  // 3. render d3
	  vm.deleteNode = function(){

	  	vm.menuShow = false;
	  	if(vm.currentNode.button)
	  	{
	  		var parent_id = vm.currentNode.parent.id
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons
		  						.filter(function(d){return(d.next_node_id !== vm.currentNode.children[0].id)});

	  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
	  			vm.getData(vm.nodeID);
	  			
	  			$d3.generateD3(vm.treeData);
	  		})

	  	}else if( "parent" in vm.currentNode){
	  		var parent_id = vm.currentNode.parent.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	parent_button.filter(function(d){return(d.next_node_id === vm.currentID)})[0].next_node_id = "";
		  	$api.deleteData(vm.currentID).then(function(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
		  			vm.getData(vm.nodeID);
		  			
		  			$d3.generateD3(vm.treeData);
		  		})
		  	});
	  	}else{
	  		
		  	$api.deleteData(vm.currentID).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.removeNode();
		  	});

	  	}
	  }


	  vm.deleteAllNode = function(){
	  	vm.menuShow = false;
	  	if(vm.currentNode.button)
	  	{
	  		debugger	
	  		var parent_id = vm.currentNode.parent.id
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons
		  						.filter(function(d){return(d.next_node_id !== vm.currentNode.children[0].id)});

		  	$api.deleteAllData(vm.currentNode.children[0].id).then(function(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
	  				vm.getData(vm.nodeID);
	  				$d3.generateD3(vm.treeData);
	  			})
		  	})
	  		

	  	}else if( "parent" in vm.currentNode){
	  		var parent_id = vm.currentNode.parent.parent.id;
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons;
		  	parent_button.filter(function(d){return(d.next_node_id === vm.currentID)})[0].next_node_id = "";
		  	$api.deleteAllData(vm.currentID).then(function(){
		  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.generateD3(vm.treeData);
		  		})
		  	});
	  	}else{
	  		
		  	$api.deleteAllData(vm.currentID).then(function(){
		  			vm.getData(vm.nodeID);
		  			$d3.removeNode();
		  	});

	  	}
	  }
	  // EDIT JSON / EDIT TITLE / EDIT MSG
	  // 1. put data to db
	  // 2. get all updated data from db
	  // 3. render d3
	  vm.updateDB = function(){
	  	vm.menuShow = false;
	  	vm.open = false;
		var currentID = vm.currentNode.button?vm.currentNode.parent.id:vm.currentNode.id;
		console.log(JSONtoString(vm.json));

	  	$api.updateData(currentID, JSONtoString(vm.json)).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);

	  		})
	  }

	  vm.updateText = function(text){

	  	vm.menuShow = false;
	  	vm.open = false;	
	  	if(vm.currentNode.button){
	  		var parent_id = vm.currentNode.parent.id
		  	var parent_button = vm.data.filter(function(d){return(d._id === parent_id )})[0].buttons
	
			parent_button.filter(function(d){return(d.next_node_id === vm.currentNode.children[0].id)})[0].title = text;

	  		$api.updateData(parent_id, "buttons="+JSON.stringify(parent_button)).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  		})
	  	}else{
	  		$api.updateData(vm.currentID, "message_text="+ text).then(function(){
	  			vm.getData(vm.nodeID);
	  			$d3.generateD3(vm.treeData);
	  		})
	  	}

	  	// clear text input
	  	clearInputText();
	  }

	  function clearInputText(){
	  	var inputText = document.getElementsByClassName("new_text");
	  	for(var i=0;i<inputText.length;i++){
	  		inputText[i].value="";
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

	// D3 FUNCTION
	// =================================================
	function delete_node(node_name,treeData){
	  
	  if('children' in treeData)
	  {
	    treeData.children.forEach(function(t,i){
	    if(t.id === node_name){
	        treeData.children.splice(i,1);
	    }else{
	      t = $d3.delete_node(node_name,t);
	    }
	  });
	  }
	  return treeData;
	}

	var temp=0;

	function add_node(node_name,treeData){


	  if(treeData.id === node_name){
	  	var default_msg = { 
					"id" : "temp"+temp,
					"text" : "New message",
					"button" : false,
					"hidden" : false,
					"payload_type" : "message",
					"children" : []
				 };
		temp = temp +1;	
		
    	if(treeData.button === true){
    		treeData.children=[default_msg];
    	}else{
    		var max_n = 0;

    		if('children' in treeData)
    		{
    			treeData.children.forEach(function(d){
						max_n = Math.max(max_n, parseInt(d.id.replace( treeData.id + "_button" ,"")))
					});
    		}else{
    			treeData.children = [];
    		}

				treeData.children.push({
					"id" : treeData.id + "_button" + (max_n +1),
					"text" : "button",
					"button" : true,
					"hidden" : false,
					"payload_type" : "postback",
					"children" : [default_msg]
				});

    	}
	  }


	  if('children' in treeData)
	  {
	    treeData.children.forEach(function(t,i){
	      t = addNode_node(node_name,t);
	   	});}
	  return treeData;
	}

})()