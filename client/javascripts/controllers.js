var temp=0;

(function(){
	angular.module("App")
	.controller("mainController", mainController)

	function mainController($http){
		var vm = this;
		vm.menuShow = false;
		vm.editType="json";


    // GET DATA
  	vm.getData = function(id){
  		$http({
  		  method: 'GET',
  		  url: 'http://remissionaire-staging.herokuapp.com/api/v1/nodes/'+id
  		}).then(function successCallback(response) {
  		    vm.data = response.data;
          // RE-STRUCTURE DATA FOR D3
          vm.treeData = build(vm.nodeID, vm.data);
          console.log(vm.data);
          // BUILD D3
          generateD3(vm.treeData);
  		  }, function errorCallback(err) {
  		    console.log(err)
  		  });
  	}

	  // TOGGLE MENU
	  vm.toggleMenu = function(e){
	  	// console.log(obj);
	  	// show menu at mouse click position
	  	var menuBox = document.getElementsByClassName('menu')[0];
	  	menuBox.style.top = e.clientY+"px";
	  	menuBox.style.left = e.clientX+"px";

	  	if(e.target.tagName==="rect"){
	  		vm.menuShow = true;
	  		var obj = e.target.__data__;

	  		console.log(obj)
	  		vm.currentNode = obj;

	  		// btn & postback
	  		if(obj.button && obj.payload_type === "postback"){
	  			vm.nodeType = "button_postback";
	  		}
	  		// btn & not postback
	  		else if(obj.button){
	  			vm.nodeType = "button";
	  		}
	  		// msg === msg
	  		else if(!obj.button && obj.payload_type === "message"){
	  			vm.nodeType="message"
	  		}
	  		// msg != msg
	  		else if(!obj.button && obj.payload_type === "bubble"){
	  			vm.nodeType="bubble";
	  		} 
	  	} 

	  	else{
	  		vm.menuShow = false;
	  	}

	  }

	  // MENU FUNCTION
	  // ===============================================
	  // ADD NODE
	  vm.addNode = function(node_name,data){
	  	add_node(node_name,data);
	  	vm.menuShow = false;
	  	generateD3(vm.treeData);

	  }

	  // DELETE NODE
	  vm.deleteNode = function(node_name,data){
	  	delete_node(node_name, data);
	  	vm.menuShow = false;
	  	generateD3(vm.treeData);
	  }

	  // EDIT JSON

	}


	// D3 FUNCTION
	// =================================================
	// TODO: Move to service
	function build(node_name, data) { 
	  // Remove previous svg if exist
	  removeNode()

	  var node = data[data.map(function(e) {return e._id}).indexOf(node_name)];
	  
	  var tree =    { 
	    "id" : node._id,
	    "text" : node.message_text,
	    "button" : false,
	    "hidden" : node.type === "hidden",
	    "payload_type" : node.payload_type,
	    "children" : []
	  };
	  node.buttons.forEach(function(b,i){
	  	console.log(b.type);
	    tree.children.push({
	      "id" : node._id + "_button" + i,
	      "text" : b.title,
	      "button" : true,
	      "hidden" : b.type === "hidden",
	      "payload_type" : b.type,
	      "children" : [build(b.next_node_id, data)]
	    });
	  });
	  return tree;
	}


	function delete_node(node_name,treeData){
	  removeNode()
	  if('children' in treeData)
	  {
	    treeData.children.forEach(function(t,i){
	    if(t.id === node_name){
	        treeData.children.splice(i,1);
	    }else{
	      t = delete_node(node_name,t);
	    }
	  });
	  }
	  return treeData;
	}

	function add_node(node_name,treeData){
	  removeNode()

	  if('children' in treeData)
	  {
	    treeData.children.forEach(function(t,i){
	    if(t.id === node_name){

	    	var default_msg = { 
					"id" : "temp"+temp,
					"text" : "New message",
					"button" : false,
					"hidden" : false,
					"payload_type" : "message",
					"children" : []
				 };
			temp = temp +1;	
			
	    	if(t.button === true){
	    		t.children=[default_msg];

	    	}else{
	    		var max_n = 0;

	    		if('children' in t)
	    		{
	    			t.children.forEach(function(d){
							max_n = Math.max(max_n, parseInt(d.id.replace( t.id + "_button" ,"")))
						});
	    		}else{
	    			t.children = [];
	    		}

					t.children.push({
						"id" : t.id + "_button" + (max_n +1),
						"text" : "button",
						"button" : true,
						"hidden" : false,
						"payload_type" : "postback",
						"children" : [default_msg]
					});

	    	}	        
	    }else{
	      t = add_node(node_name,t);
	    }
	  });
	  }
	  return treeData;
	}


	function generateD3(treeData){
	  var margin = {top: 40, right: 120, bottom: 20, left: 120},
	      width = 1200 - margin.right - margin.left,
	      height = 1200 - margin.top - margin.bottom;
	  var boxHeight = 50, boxWidth = 400;
	  var i = 0;

	  var tree = d3.layout.tree()
	                      .size([width,height]);

	  var diagonal = d3.svg.diagonal()
	    .projection(function(d) { return [d.x, d.y]; });

	  var svg = d3.select("#d3_graph").append("svg")
	    .attr("width", width + margin.right + margin.left)
	    .attr("height", height + margin.top + margin.bottom)
	    .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  root = treeData;
	    
	  update(root);

	  function update(source) {

	    // Compute the new tree layout.
	    var nodes = tree.nodes(root).reverse(),
	        links = tree.links(nodes);

	    // Normalize for fixed-depth.
	    nodes.forEach(function(d) { d.y = d.depth * 100; });

	    // Declare the nodes…
	    var node = svg.selectAll("g.node")
	      .data(nodes, function(d) { return d.id || (d.id = ++i); });

	    // Enter the nodes.
	    var nodeEnter = node.enter().append("g")
	      .attr("class", "node")
	      .attr("transform", function(d) { 
	        return "translate(" + d.x + "," + d.y + ")"; })
	      
	      // EventListener on CLICK 
	      // .on("click",function(d){
	      // 	var e = d3.event;
	      // 	vm.toggleMenu(e);

	        // if(d.button){
	        //   delete_node(d.id,treeData);
	        // }else{
	        //   delete_node(d.parent.id,treeData)
	        // }
	        // generateD3(treeData);
	        // });

	    //get width for each depth
	    var maxDepth = Math.max.apply(Math,d3.selectAll("g.node").data().map(function(o){return o.depth;}));
	    
	    var LevelBoxWidth = new Array(maxDepth).fill(0);
		
	    LevelBoxWidth.forEach(function(d,i){
	      var Objs = d3.selectAll("g.node").data().filter(function(d1){return d1.depth==(i+1)});
	      var Objs_x =[];
	      Objs.forEach(function(d1){Objs_x.push(d1.x)});
	      Objs_x.sort(function(a, b){return b-a});
	      maxGap=boxWidth;
		      for(j=0;j<(Objs_x.length-1);j++){
		      	maxGap = Math.min(maxGap,(Objs_x[j]-Objs_x[j+1]-5));
		      }
	 	  LevelBoxWidth[i] = maxGap;
	     });

	    nodeEnter.append("rect")
	      .attr("width",function(d){
	        if(d.depth===0){
	          return boxWidth;
	        }else{
	          return LevelBoxWidth[d.depth-1];
	        }
	       })
	      .attr("x",function(d){return -1*d3.select(this).attr("width")/2;})
	      .attr("height", boxHeight)
	      .attr("y", -1*boxHeight/2)
	      .attr("stroke", function(d){
	        if(d.payload_type === "bubble"){
	          return "#A9CCE3";
	        }else if (d.hidden === true){
	          return "#82E0AA";
	        }else{
	          return "#D98880";
	        }
	      })
	      .attr("fill",function(d){
	      	if(d.button===true)
	      	{
	      		return d3.select(this).attr("stroke");
	      	}else{
	      		return "#F2F2F2";
	      	}

	      });


	    nodeEnter.append("text")
	      .attr("dy", ".35em")
	      .attr("text-anchor", "middle")
	      .html(function(d) {  return d.text; })
	      .style("fill-opacity", 1)
	      .call(wrap);

	    // Dynamically adjust the height and width of message box
	    d3.selectAll("rect").attr("height",function(d){return boxHeight + 10* (this.parentNode.lineNumber-1) ;})

	    // Declare the links…
	    var link = svg.selectAll("path.link")
	      .data(links, function(d) { return d.target.id; });

	    // Enter the links.
	    link.enter().insert("path", "g")
	      .attr("class", "link")
	      .attr("d", diagonal);
	    
	    function wrap(text) {
	      text.each(function(t) {
	        var width = d3.select(this.parentNode.childNodes[0]).attr("width")-20;
	        var text = d3.select(this),
	            words = text.text().split(/\s+/).reverse(),
	            word,
	            line = [],
	            lineNumber = 1,
	            lineHeight = 1.0, // ems
	            y = text.attr("y"),
	            dy = parseFloat(text.attr("dy")),
	            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	            this.parentNode.lineNumber = 1;
	        while (word = words.pop()) {
	          line.push(word);
	          tspan.text(line.join(" "));
	          if (tspan.node().getComputedTextLength() > width) {

	            line.pop();
	            tspan.text(line.join(" "));
	            line = [word];
	            tspan = text.append("tspan").attr("x", 0).attr("y", 0).attr("dy", lineNumber * lineHeight + dy + "em").text(word);
	            lineNumber = lineNumber +1;
	          }
	          //d3.select(this.parentNode).attr("lineNumber",lineNumber);
	          this.parentNode.lineNumber = lineNumber;
	        }
	      });
	    } // wrap 
	  } // update
	}

	function removeNode(){
	  var node = document.getElementById('d3_graph');
	  while (node && node.firstChild) {
	      node.removeChild(node.firstChild);
	  }
	}

})()