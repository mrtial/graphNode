(function(){

	angular.module("App")
		.service("$api", api)
		.service("$d3", d3graph)

		// API FUNCTION 
		// ======================================================
		function api($http){

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
				     'Authorization': '6d0f18b6-9606-0f8a-03bc-e24fb551a46f',
				     'Cache-Control': 'no-cache',
				  },
				  data:data
				})
			};

			// DELETE node /api/v1/node/<node_id>
			this.deleteData = function(id){
				return $http({
					method: 'DELETE',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/node/${id}`,
					headers: {
					   'Content-Type':'application/x-www-form-urlencoded',
					   'Cache-Control': 'no-cache',
					}
				})
			};

			// PUT /api/v1/node/test1 HTTP/1.1
			this.updateData = function(id, data){
				return $http({
					method: 'PUT',
					url: `http://remissionaire-staging.herokuapp.com/api/v1/node/${id}`,
					headers: {
					   'Content-Type':'application/x-www-form-urlencoded',
					   'Authorization': '317545ec-3e7c-1e19-5a0e-faa45e261480',
					   'Cache-Control': 'no-cache',
					},
					data:data
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
					data:prefix
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

		// D3 FUNCTION
		// ======================================================
		function d3graph(){
			// Helper Function
			this.removeNode = function(){
			  var node = document.getElementById('d3_graph');
			  while (node && node.firstChild) {
			      node.removeChild(node.firstChild);
			  }
			}

			this.build = function(node_name, data){
			  var self = this;
			  // Remove previous svg if exist
			  this.removeNode()

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

			    tree.children.push({
			      "id" : node._id + "_button" + i,
			      "text" : b.title,
			      "button" : true,
			      "hidden" : b.type === "hidden",
			      "payload_type" : b.type,
			      "children" : [self.build(b.next_node_id, data)]
			    });
			  });
			  return tree;
			}


			this.generateD3= function(treeData){
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

		}

})()