this.$('.js-loading-bar').modal({
  backdrop: 'static',
  show: false
});

var loading = (function() {
  var $modal = $('.js-loading-bar'),
  $bar = $modal.find('#progress-icon');
  $modal.modal('show');
  //$bar.addClass('animate');
});

var unloading = (function(){
  var $modal = $('.js-loading-bar'),
  $bar = $modal.find('#progress-icon');
  //$bar.removeClass('animate');
  $modal.modal('hide');
});

var app = angular.module("app", []);
var rest_be = "http://twitelizer-env-f9m23teep2.elasticbeanstalk.com"

app.controller("AppCtrl", ["$scope", "$http", "$location", function($scope, $http, $location){

  $scope.classify = function(scrname){

    if (typeof scrname != 'undefined' && scrname.length > 0){

      //remove existing chart first if any
      var element = angular.element("div#pie-area svg");
      if (element) element.remove();

      $scope.input = scrname;
      console.log("classify button is clicked: " , scrname);
      loading();
      $http.get(rest_be + "/classify/" + scrname)
      .success(function(data){
        unloading();
        if (data.status == "error"){
          $scope.error = data.message;
        } else {
          $scope.result = data;
          draw_pie(data.fileurl);
        }
      })
      .error(function(data) {
        $scope.error = data;
      });
    } else {
      $scope.input = "please enter a screen name";
    }
  };

  $scope.analyse = function(scrname){

    if (typeof scrname != 'undefined' && scrname.length > 0) {
      //remove existing chart first if any
      var element = angular.element("div#line-area svg");
      if (element) element.remove();

      $scope.input = scrname;
      console.log("analyse button is clicked: ", scrname);
      loading();
      $http.get(rest_be + "/analyse/" + scrname)
      .success(function(data){
        unloading();
        if (data.status == "error"){
          $scope.error = data.message;
        } else {
          $scope.result = data;
          draw_line(data.fileurl);
        }
      })
      .error(function(data) {
        $scope.error = data;
      });
    } else {
      $scope.input = "please enter a screen name";
    }
  };

  /*$http.get("http://localhost:3000/ratelimit")
    .success(function(data){
      console.log(data);
    });*/
}]);

var draw_pie = function(furl){

  var width = 620,
  height = 360,
  radius = Math.min(width, height) / 2;

  var color = d3.scale.ordinal()
  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var arc = d3.svg.arc()
  .outerRadius(radius - 10)
  .innerRadius(0);

  var pie = d3.layout.pie()
  .sort(null)
  .value(function(d) { return d.tweets; });

  var chart1 = d3.select("#pie-area").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  d3.csv(furl, function(error, data) {
    data.forEach(function(d) {
      d.tweets = +d.tweets;
    });

    var g = chart1.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc");

    g.append("path")
    .attr("d", arc)
    .style("fill", function(d) { return color(d.data.sentiment); });

    g.append("text")
    .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .text(function(d) { return d.data.sentiment + " [" + d.data.tweets + "]"; });

  });
};

var draw_line = function(fileurl){

  var margin = {top: 20, right: 80, bottom: 30, left: 50},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  var parseDate = d3.time.format("%Y%m%d").parse;

  var x = d3.time.scale()
  .range([0, width]);

  var y = d3.scale.linear()
  .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

  var line = d3.svg.line()
  .interpolate("basis")
  .x(function(d) { return x(d.date); })
  .y(function(d) { return y(d.tweets); });

  var chart2 = d3.select("#line-area").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.tsv(fileurl, function(error, data) {
    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

    data.forEach(function(d) {
      d.date = parseDate(d.date);
    });

    var sentiments = color.domain().map(function(name) {
      return {
        name: name,
        values: data.map(function(d) {
          return {date: d.date, tweets: +d[name]};
        })
      };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));

    y.domain([
      d3.min(sentiments, function(c) { return d3.min(c.values, function(v) { return v.tweets; }); }),
      d3.max(sentiments, function(c) { return d3.max(c.values, function(v) { return v.tweets; }); })
      ]);

    chart2.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    chart2.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Number Of Tweets");

    var sentiment = chart2.selectAll(".sentiment")
    .data(sentiments)
    .enter().append("g")
    .attr("class", "sentiment");

    sentiment.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) { return color(d.name); });

    sentiment.append("text")
    .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
    .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.tweets) + ")"; })
    .attr("x", 3)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });
  });


}