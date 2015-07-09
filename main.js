(function(){

  var App = function(defaults,data,map,years,styles,starting_year){
    var self = this;

    this.change_to_year = function(year){
      if (self.timeline.busy()) return;

      self.timeline.get_busy();

      var interval;
      var y = self.timeline.current_year();

      if (year > self.timeline.current_year()) {
        interval = setInterval(function(){
          if (y > year) {
            save_params(year,null);
            clearInterval(interval);
            self.timeline.release();
          }else{
            self.timeline.up_to_year(y);
            $('.current_year').html(y);
            $('#'+y).css('backgroundColor','red');
            $('#'+(y-1)).css('backgroundColor','');
          }
          y++;
        }, defaults.speed);
      } else if (year < self.timeline.current_year()){
        interval = setInterval(function(){
          if (y < year) {
            save_params(year,null);
            clearInterval(interval);
            self.timeline.release();
          }else{
            self.timeline.down_to_year(y);
            $('.current_year').html(y);
            $('#'+y).css('backgroundColor','red');
            $('#'+(y+1)).css('backgroundColor','');
          }
          y--;
        }, defaults.speed);
      } else {
        self.timeline.release();
      }
    };

    this.create_slider = function(years){

      for (var i = years.start; i < (years.end +1); i++){
        var left = (i-years.start)/(years.end-years.start+1)*100;
        var width = 100 / (years.end-years.start +1) + 0.1;

        var year = $("<div id ='"+i+"'class='vertical_line'style='left:"+ left +"%;width:"+width+"%'></div>")

        year.hover(function(){
          $('.hover_year').show().html(this.id);
        },function(){
          $('.hover_year').hide();
        });

        year.click(function(){
          self.change_to_year(parseInt(this.id));
        });

        $('.reference').append(year);
      }

      $('.first_year').html(years.start);
      $('.last_year').html(years.end);

    };

    this.timeline = new Timeline(data,map,years,styles);
    this.create_slider(years);

    //Init to the start year
    this.timeline.up_to_year(years.start);
    $('.current_year').html(years.start);
    $('#'+years.start).css('backgroundColor','red');

    if (starting_year) this.change_to_year(starting_year,this.timeline);
  };

  var load_map = function(defaults,callback){
    var options = {
      attributionControl: false
    };

    var map = L.map('map', options).setView(defaults.coords, defaults.zoom);

    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.whenReady(function(){
      if (typeof callback === 'function') callback(map);
    });

    map.on('moveend',function(){
      save_params(null,map);
    });
  };

  var load_data = function(callback){
    var data = {stations:null,lines:null};

    $.getJSON('geojson/estaciones.geojson', function(stations){
      data.stations = stations;
      $.getJSON('geojson/subte.geojson', function(lines){
        data.lines = lines;
        if (typeof callback == 'function') callback(data);
      });
    });
  };

  $(document).ready(function(){
    var defaults = {
      coords : [-34.6050499,-58.4122003],
      zoom   : 13,
      init_year : 1911,
      speed : 50
    };

    var years = {start:1910,end:2015, current:null, previous:null};

    var styles = {
      line : {
        buildstart: {
          color: '#A4A4A4',
          weight: 5,
          opacity: 1,
          smoothFactor:0
        },
        opening : {
          'A': {
            color: '#01A9DB',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'B': {
            color: '#DF0101',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'C': {
            color: '#0000FF',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'D': {
            color: '#088A08',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'E': {
            color: '#8A084B',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'H': {
            color: '#F7FE2E',
            weight: 5,
            opacity: 1,
            smoothFactor:0
          },
          'P': {
            color: '#FF8000',
            weight: 2,
            opacity: 1,
            smoothFactor:0
          }
        }
      },
      point : {
        buildstart:{
          weight:2,
          radius:5,
          stroke:true,
          opacity:1,
          fillOpacity:1,
          color:'#6E6E6E',
          fillColor:'#848484'
        },
        opening:{
          weight:2,
          radius:5,
          stroke:true,
          opacity:1,
          fillOpacity:1,
          color:'#1C1C1C',
          fillColor:'#E6E6E6'
        }
      }
    };

    $(".spinner-container").show().addClass('spinner');

    var params = getSearchParameters();

    if (params.coords) {
      defaults.coords = [params.coords.lat,params.coords.lon];
      defaults.zoom = params.coords.z;
    }

    load_map(defaults, function(map){
      load_data(function(data){
        window.app = new App(defaults,data,map,years,styles,params.year)
        $(".spinner-container").hide();
      });
    });
  });
})()
