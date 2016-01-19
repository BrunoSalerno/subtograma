(function(){

  var App = function(defaults,data,projects_data,map,styles,params, callback){
    this.interval = null;
    var self = this;
    this.styles = styles;
    this.years = defaults.years;

    var starting_year = params.year;
    var starting_lines = params.lines;
    var starting_plans = params.plans;

    this.change_line_to_year = function(year_start,year_end,line,callback){
      if (self.timeline.busy()) return;
      var speed=1;
      self.timeline.get_busy();
      var y = year_start;
      var interval;

      if (year_end > year_start) {
        interval = setInterval(function(){
          if (y > year_end) {
            self.timeline.release();
            clearInterval(interval);
            if (typeof callback == 'function') callback();
          } else {
            self.timeline.up_to_year(y,line);
          }
          y++;
        },speed);
      } else {
        interval = setInterval(function(){
          if (y < year_end) {
            self.timeline.release();
            clearInterval(interval);
            if (typeof callback == 'function') callback();
          } else {
            self.timeline.down_to_year(y,line);
          }
          y--;
        },speed);
      }
    };

    this.change_to_year = function(year,speed,from_input, callback){
      if (year > self.years.end) return;
      if (self.timeline.busy()) return;

      self.timeline.get_busy();

      var y = self.timeline.current_year();

      if (year > self.timeline.current_year()) {
        self.interval = setInterval(function(){
          if (y > year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.up_to_year(y);
            if (!from_input) self.set_current_year_info(y); 
            self.set_year_maker(y);
          }
          y++;
        }, speed || defaults.speed);
      } else if (year < self.timeline.current_year()){
        self.interval = setInterval(function(){
          if (y < year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.down_to_year(y);
            if (!from_input) self.set_current_year_info(y);
            self.set_year_maker(y);
          }
          y--;
        }, speed || defaults.speed);
      } else {
        self.timeline.release();
        if (typeof callback == 'function') callback(false);
      }
    };

    this.create_slider = function(){
      for (var i = self.years.start; i < (self.years.end); i += 10){
        var left = (i-self.years.start)/(self.years.end-self.years.start+5)*100;
        var width = 100 / (self.years.end-self.years.start+5) * 10;
        var year = $("<div class='vertical_line' style='left:"+ left +"%;width:"+width+"%'>"+
          (i + 5) +'</div>');

        $('.reference').append(year);
      }

      $('.reference').click(function(e){
        var posX = $(this).offset().left;
        var left = (e.pageX - posX) / $(this).width();
        var year = parseInt(left * (self.years.end - self.years.start +5) + self.years.start);
        self.action_button_is_playing();
        self.change_to_year(year,null,null,function(){
          self.action_button_is_paused();
        });
      }).
        mousemove(function(e){
          var posX = $(this).offset().left;
          var diff = (e.pageX - posX);
          if (diff < 0) diff = 0;
          var left = diff / $(this).width();
          var year = parseInt(left * (self.years.end - self.years.start +5) + self.years.start);
          $('.year-hover').html(year).css({left:left*100+'%'}).fadeIn();
        }).
        mouseleave(function(){
          $('.year-hover').fadeOut();
        })
    };

    this.action_button_is_playing = function(){
      $('.action').removeClass('play').addClass('pause');
    };

    this.action_button_is_paused = function(){
      $('.action').removeClass('pause').addClass('play');
    };

    this.set_year_maker = function (y){
      var left =(y-self.years.start)/(self.years.end-self.years.start+5)*100;
      $('.year-marker').css('left',left+'%');
    };

    this.play = function(){
      self.action_button_is_playing();
      self.change_to_year(self.years.end,null,null, function(){
        self.action_button_is_paused();
      });
    };

    this.pause = function(){
      self.action_button_is_paused();
      clearInterval(self.interval);
      self.timeline.release();
      self.set_current_year_info(self.timeline.current_year());
      save_params(self.timeline.current_year());
    };

    this.set_current_year_info = function(year){
        if (year) $('.current-year').val(year);
        var y_i = self.timeline.year_information();
        var current_km = round(y_i.km_operating + self.planification.current_km()); 
        var y_i_str = (current_km > 0)? current_km+' km <br />' : '';
        y_i_str += (y_i.km_under_construction > 0)? y_i.km_under_construction+' km en obra<br />':'';
        y_i_str += (y_i.stations > 0)? y_i.stations+' estaciones' : '';
       
        if (y_i_str == '') y_i_str = 'No hay información para este año'  
        $('.current-year-container .information').html(y_i_str)
    };

    this.planification = new Planification(projects_data,map,this.styles);
    this.timeline = new Timeline(data,map,this.years,this.styles);
    this.create_slider();

    // Current year functionality
    // --------------------------
    $('.current-year').
      attr('min',self.years.start).
      attr('max',self.years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < self.years.start || new_year > self.years.end){
        $(this).blur();
        $(this).val(self.years.current);
      } else {
        $(this).blur();
        self.action_button_is_playing();
        self.change_to_year(new_year,null,true,function(){
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      }
    });

    // Tabs toggle
    // -----------
    $(".tab").click(function(){
      var tab = $(this)[0].classList[1];
         
      var panel = $('.panel-container .panel'); 
      var clicked_tab_content = panel.find(".content."+tab);
      var other_tab_content = panel.find(".content").not(".content."+tab)
        
      if (!panel.is(":visible")){
          $(".leaflet-bottom.leaflet-right").addClass("back");
          if (!clicked_tab_content.is(":visible")){
            other_tab_content.hide();
            clicked_tab_content.show();      
            $(".tab").not(".tab."+tab).addClass('not-selected');
            $(".tab."+tab).removeClass('not-selected');
          }
          panel.slideToggle(500); 
      }else{
          if (clicked_tab_content.is(":visible")){
            panel.slideToggle(500,function(){
                $(".leaflet-bottom.leaflet-right").removeClass("back");
            });    
          } else {
            other_tab_content.hide();
            clicked_tab_content.show();      
            $(".tab").not(".tab."+tab).addClass('not-selected');
            $(".tab."+tab).removeClass('not-selected');
          }  
      }
    });

    // Play/Pause
    // ----------
    $('.action').click(function(){
      if ($(this).hasClass('play')){
        self.play();
      } else {
        self.pause();
      }
    });

    // Layers
    // ------
    load_layers_control(starting_lines,starting_plans,this);

    // Init to the start year
    // ----------------------
    this.timeline.up_to_year(this.years.start);
    self.set_current_year_info(this.years.start);
    self.set_year_maker(this.years.start);

    if (starting_year) {
        this.change_to_year(starting_year,1,null,function(){
            if (typeof callback === 'function') callback();
        });
    }else{
        if (typeof callback === 'function') callback();    
    }
  };

  var load_map = function(defaults,callback){
    //$.get('php/map_url.php',function(map_url){
      mapboxgl.accessToken = 'pk.eyJ1IjoiYnJ1bm9zYWxlcm5vIiwiYSI6IlJxeWpheTAifQ.yoZDrB8Hrn4TvSzcVUFHBA';
      var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/brunosalerno/cijg9rg5f001k93lyyw319qqu', //stylesheet location
        center: defaults.coords, // starting position
        zoom: defaults.zoom // starting zoom
        });

      //FIXME: Replicar funcionamiento de lo que está comentado 
      // (Por ej., posición del zoom, attribution)
      /*var options = {
        zoomControl: false,
      };*/


      /*tile_options = {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://mapbox.com/attributions">MapBox</a>',
      }  
      

      L.control.zoom({position:'topright'}).addTo(map);
        */
      map.on('load',function(){
        if (typeof callback === 'function') callback(map);
      });

      map.on('moveend',function(){
        save_params(null,map);
      });
    //});
  };

  var load_data = function(callback){
    var data = {stations:null,lines:null};
    var project_data = {stations:null,lines:null};

    $.getJSON('geojson/estaciones.geojson', function(stations){
      data.stations = stations;
      $.getJSON('geojson/subte.geojson', function(lines){
        data.lines = lines;
        $.getJSON('geojson/projects-lines.geojson',function(p_lines){
          project_data.lines = p_lines;
          $.getJSON('geojson/projects-stations.geojson',function(p_stations){
            project_data.stations = p_stations;
            if (typeof callback == 'function') callback(data,project_data);
          });
        })
      });
    });
  };


  // Styles loader
  var load_styles = function(callback){
    $.getJSON('styles.json', function(json){
      if (typeof callback == 'function') callback(json)
    });
  };

  $(document).ready(function(){
    var defaults = {
      coords : [-58.4122003,-34.6050499],
      zoom   : 13,
      init_year : 1911,
      speed : 1,
      years: {start:1910,end:2016, current:null, previous:null}
    };

    $(".spinner-container").show().addClass('spinner');

    var params = getSearchParameters();

    if (params.coords) {
      defaults.coords = [params.coords.lat,params.coords.lon];
      defaults.zoom = params.coords.z;
    }

    load_map(defaults, function(map){
      load_data(function(data,projects_data){
        load_styles(function(styles){
          var app = new App(defaults,data,projects_data,map,styles,params, function(){
              
              $(".spinner-container").fadeOut();
              $(".footer").show();
              $(".current-year-container").fadeIn();
              
          });
        });
      });
    });
  });
})();
