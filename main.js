(function(){

  var App = function(defaults,data,projects_data,map,years,styles,starting_year,lines_to_show,plans_to_show, callback){
    this.interval = null;
    var self = this;

    this.change_line_to_year = function(year_start,year_end,line){
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
          } else {
            self.timeline.down_to_year(y,line);
          }
          y--;
        },speed);
      }
    };

    this.change_to_year = function(year,speed,from_input, callback){
      if (year > years.end) return;
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

    this.create_slider = function(years){
      for (var i = years.start; i < (years.end); i += 10){
        var left = (i-years.start)/(years.end-years.start+5)*100;
        var width = 100 / (years.end-years.start+5) * 10;
        var year = $("<div class='vertical_line' style='left:"+ left +"%;width:"+width+"%'>"+
          (i + 5) +'</div>');

        $('.reference').append(year);
      }

      $('.reference').click(function(e){
        var posX = $(this).offset().left;
        var left = (e.pageX - posX) / $(this).width();
        var year = parseInt(left * (years.end - years.start +5) + years.start);
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
          var year = parseInt(left * (years.end - years.start +5) + years.start);
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
      var left =(y-years.start)/(years.end-years.start+5)*100;
      $('.year-marker').css('left',left+'%');
    };

    this.play = function(){
      self.action_button_is_playing();
      self.change_to_year(years.end,null,null, function(){
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
        
        var y_i_str = '<strong>'+y_i.km_operating+'</strong> km <br />'; 
        y_i_str += '<strong>'+y_i.km_under_construction+'</strong>  km en obra <br />';
        y_i_str += '<strong>'+y_i.stations+'</strong> estaciones';
        
        $('.current-year-container .information').html(y_i_str)
    };

    this.planification = new Planification(projects_data,map,styles);
    this.timeline = new Timeline(data,map,years,styles);
    this.create_slider(years);

    // Current year functionality
    // --------------------------
    $('.current-year').
      attr('min',years.start).
      attr('max',years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < years.start || new_year > years.end){
        $(this).blur();
        $(this).val(years.current);
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
      var bottom;
      
      var do_attribution = 'hide';

      if ($(".panel-container").css('bottom')==$('.slider').height()+'px') {
        if (!$(".content."+tab).is(":visible")){
          $(".content").hide();
          $(".tab").not(".tab."+tab).addClass('not-selected');
          $(".tab."+tab).removeClass('not-selected');
          $(".content."+tab).show();
          return;
        }
        // We enable map attribution
        do_attribution = 'show';
         
        bottom = $('.slider').height() - $(".panel").height() + 'px';
      } else {
        // We disable map attribution  
        do_attribution = 'hide'; 
        $(".leaflet-bottom.leaflet-right").addClass("back");  
        
        bottom = $('.slider').height() + 'px';
      }
      $(".content").hide();
      $(".tab").not(".tab."+tab).addClass('not-selected');
      $(".tab."+tab).removeClass('not-selected');
      $(".content."+tab).show();
      $('.panel-container').animate({bottom:bottom}, function(){
        if (do_attribution == 'show'){
            $(".leaflet-bottom.leaflet-right").removeClass("back");  
        }    
      });
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
    if (lines_to_show) {
      this.timeline.set_lines(lines_to_show);
    }

    if (plans_to_show){
      this.planification.set_plans_lines(plans_to_show)
    }

    var lines = this.timeline.lines();
    var lines_str='<ul class="lines">';
    for (var line in lines){
      var label_font_color = styles.line.opening[line].labelFontColor ? 'color: '+ styles.line.opening[line].labelFontColor+';' : '';  
      var checked_str = (lines[line].show) ? 'checked' : '';
      lines_str += '<li><input type="checkbox" id="checkbox_'+line+'" ' + checked_str + '/>' +
        '<label id="label_'+line+
        '" for="checkbox_'+line+'" style="'+ label_font_color +'background-color: '+styles.line.opening[line].color+'">' +
        line + '</label></li>';
    }

    var plans = this.planification.plans();
    $.each(plans,function(i,plan){
      lines_str += '<li class="plan-label"><div>'+plan.label+'</div>';
      lines_str +='<a href="'+plan.url+'" target="_blank" + title="Link a la ley"><img src="img/link.svg" class="plan-link"></img></a>';
      lines_str +='<ul class="plan-list">'
      for (var line in plan.lines){
        var label_font_color = styles.line.project[plan.name][line].labelFontColor ? 'color: ' + styles.line.project[plan.name][line].labelFontColor+';' : '';
        var checked_str = (plan.lines[line].show) ? 'checked' : '';
        lines_str += '<li><input type="checkbox" id="checkbox_'+plan.name.replace(' ','-')+
          '_'+line+'" ' + checked_str + '/>' +
          '<label id="label_'+plan.name.replace(' ','-')+'_'+line +
          '" for="checkbox_'+plan.name.replace(' ','-')+'_'+line +
          '" style="' + label_font_color + 'background-color: '+styles.line.project[plan.name][line].color+'">' +
          line + '</label></li>';
      }
      lines_str += '</ul></li>';
    });
    
    lines_str += '</ul>';

    $(".content.layers").append(lines_str);

    for (var l in this.timeline.lines()){
      $('#label_'+l).click(function(e){
        if (self.timeline.busy()){
          e.preventDefault();
          return;
        }

        var line= $(this).attr('id').split('_')[1];
        var lines_params = self.timeline.toggle_line(line);
        var year_start = (self.timeline.lines()[line].show) ? years.start : self.timeline.current_year();
        var year_end = (self.timeline.lines()[line].show) ? self.timeline.current_year() : years.start;

        self.change_line_to_year(year_start,year_end,line);
        save_params(null,null,lines_params);
      });
    }

    $.each(this.planification.plans(),function(i,p){
      for (l in p.lines){
        $('#label_'+ p.name.replace(' ','-')+'_'+l).click(function(e){
          var checkbox_info = $(this).attr('id').split('_');
          var plans_params = self.planification.toggle(checkbox_info[1].replace('-',' '),checkbox_info[2]);

          save_params(null,null,null,plans_params);
        });
      }
    });

    // Init to the start year
    // ----------------------
    this.timeline.up_to_year(years.start);
    self.set_current_year_info(years.start);
    self.set_year_maker(years.start);

    if (starting_year) this.change_to_year(starting_year,1);
    if (typeof callback === 'function') callback();
  };

  var load_map = function(defaults,callback){
    $.get('php/map_url.php',function(map_url){
      var options = {
        zoomControl: false,
      };

      var map = L.map('map', options).setView(defaults.coords, defaults.zoom);

      tile_options = {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://mapbox.com/attributions">MapBox</a>',
      }  
      
      L.tileLayer(map_url,tile_options).addTo(map);

      L.control.zoom({position:'topright'}).addTo(map);

      map.whenReady(function(){
        if (typeof callback === 'function') callback(map);
      });

      map.on('moveend',function(){
        save_params(null,map);
      });
    });
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
      coords : [-34.6050499,-58.4122003],
      zoom   : 13,
      init_year : 1911,
      speed : 50
    };

    var years = {start:1910,end:2015, current:null, previous:null};

    $(".spinner-container").show().addClass('spinner');

    var params = getSearchParameters();

    if (params.coords) {
      defaults.coords = [params.coords.lat,params.coords.lon];
      defaults.zoom = params.coords.z;
    }

    load_map(defaults, function(map){
      load_data(function(data,projects_data){
        load_styles(function(styles){
          window.app = new App(defaults,data,projects_data,map,years,styles,params.year,params.lines,params.plans, function(){
              
              $(".spinner-container").fadeOut();
              $(".slider").show();
              $(".current-year-container").fadeIn();
              $(".panel-container").css('bottom',-1000).show(function(){
                  $(this).css('bottom',$(".slider").height()-$(".panel").height()+'px');
              });
              
          });
        });
      });
    });
  });
})();
