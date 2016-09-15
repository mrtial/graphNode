(function(){
	angular.module("App", [])
  .component('app',{
  	bindings:{},
  	controller:'mainController',
  	controllerAs:'vm',
    // TODO: Use views folder & templateUrl
  	template:`
    <div class="tool">
  		<form>
        <label>Starting Node</label>
				<input type="text" ng-model="vm.text"/>
				<button ng-click="vm.getData(vm.text)">Submit</button>
  		</form>
    </div>

			<div id="d3_graph"></div>
  	`
  })
  .controller("mainController", mainController)


  // Controller
  // =================================================
  // TODO: Move to controller folder
  function mainController($http){
  	var vm = this;

    // GET DATA
  	vm.getData = function(id){
  		$http({
  		  method: 'GET',
  		  url: 'http://remissionaire-staging.herokuapp.com/api/v1/nodes/'+id
  		}).then(function successCallback(response) {
  		    vm.data = response.data;
          console.log(vm.data);

          // RE-STRUCTURE DATA FOR D3
          var treeData = build(vm.text, vm.data);

          // BUILD D3
          generateD3(treeData);

  		  }, function errorCallback(err) {
  		    console.log(err)
  		  });
  	}
  }


  // D3 FUNCTION
  // =================================================
  // TODO: Move to service
  function build(node_name, data) { 
    // Remove previous svg if exist
    removeNode()

    var node = data[data.map(function(e) {return e._id}).indexOf(node_name)];
    
    var tree =    { 
      "name" : node._id,
      "lineNumber" : 1,
      "text" : node.message_text,
      "button" : false,
      "hidden" : node.type === "hidden",
      "payload_type" : node.payload_type,
      "children" : []
    };

    node.buttons.forEach(function(b){
      tree.children.push({
        "name" : b.payload + "_button",
        "lineNumber" : 1,
        "text" : b.title,
        "button" : true,
        "hidden" : b.type === "hidden",
        "payload_type" : b.payload_type,
        "children" : [build(b.next_node_id, data)]
      });
    });
    return tree;
  }

  function generateD3(treeData){
    var margin = {top: 40, right: 120, bottom: 20, left: 120},
        width = 1200 - margin.right - margin.left,
        height = 900 - margin.top - margin.bottom;
      
    var i = 0;

    var tree = d3.layout.tree()
                        .size([height, width]);

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
          return "translate(" + d.x + "," + d.y + ")"; });

      nodeEnter.append("rect")
        .attr("width", 280)
        .attr("height", function(d){return(50);})
        .attr("x", -140)
        .attr("y", -25)
        .attr("stroke", function(d){
          if(d.payload_type === "bubble"){
            return "#A9CCE3";
          }else if (d.hidden === true){
            return "#82E0AA";
          }else{
            return "#D98880";
          }
        })
        .attr("fill","#F2F2F2");

      nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .html(function(d) { return d.text; })
        .style("fill-opacity", 1)
        .call(wrap, 260);

      // Declare the links…
      var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

      // Enter the links.
      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", diagonal);
      
      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 1,
              lineHeight = 1.0, // ems
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
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
            d3.select(this.parentNode).attr("lineNumber",lineNumber);
          }
        });
      }
    } 
  }

  function removeNode(){
    var svg = document.getElementById('d3_graph');
    while (svg && svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
  }

})()