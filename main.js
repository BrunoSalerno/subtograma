(function(){

  var App = function(defaults,data,map,years,styles,starting_year,lines_to_show){
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

    this.change_to_year = function(year,speed,from_input){
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
            if (!from_input) $('.current-year').val(y);
            $('#'+y).css('backgroundColor','red');
            $('#'+(y-1)).css('backgroundColor','');
          }
          y++;
        }, speed || defaults.speed);
      } else if (year < self.timeline.current_year()){
        interval = setInterval(function(){
          if (y < year) {
            save_params(year,null);
            clearInterval(interval);
            self.timeline.release();
          }else{
            self.timeline.down_to_year(y);
            if (!from_input) $('.current-year').val(y);
            $('#'+y).css('backgroundColor','red');
            $('#'+(y+1)).css('backgroundColor','');
          }
          y--;
        }, speed || defaults.speed);
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
        self.change_to_year(new_year,null,true);
      }
    });

    $(".app-menu").click(function(){
      switch ($(this).hasClass('pressed')){
        case true:
          $(this).removeClass('pressed');
          break;
        case false:
          $(this).addClass('pressed');
          break;
      }
      $('.panel').slideToggle('500','swing');
    });

    // Lines layers
    if (lines_to_show) this.timeline.set_lines(lines_to_show);

    var lines = this.timeline.lines();
    var lines_str='<ul class="lines">';
    for (var line in lines){
      var checked_str = (lines[line].show) ? 'checked' : '';
      lines_str += '<li><input type="checkbox" id="checkbox_'+line+'" ' + checked_str + '/>' +
        '<label id="label_'+line+'" for="checkbox_'+line+'"></label><div class="line-reference" style="background-color: '+styles.line.opening[line].color+'">' +
        '</div><div class="text-reference">Línea ' + line + '</div></li>';
    }

    lines_str += '</ul>';

    $(".panel").append(lines_str);

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

    // Init to the start year
    this.timeline.up_to_year(years.start);
    $('.current-year').html(years.start);
    $('#'+years.start).css('backgroundColor','red');

    if (starting_year) this.change_to_year(starting_year,1);
  };

  var load_map = function(defaults,callback){
    var options = {
      zoomControl: false,
      attributionControl: false
    };

    var map = L.map('map', options).setView(defaults.coords, defaults.zoom);

    L.tileLayer('https://{s}.tiles.mapbox.com/v4/brunosalerno.mmfg5lpk/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnJ1bm9zYWxlcm5vIiwiYSI6IlJxeWpheTAifQ.yoZDrB8Hrn4TvSzcVUFHBA').addTo(map)

    L.control.zoom({position:'topright'}).addTo(map);

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
          weight: 6,
          opacity: 1,
          smoothFactor:0,
          lineJoin: 'round',
          lineCap: 'round'
        },
        opening : {
          'A': {
            color: '#01A9DB',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'B': {
            color: '#DF0101',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'C': {
            color: '#0000FF',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'D': {
            color: '#088A08',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'E': {
            color: '#8A084B',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'H': {
            color: '#F7FE2E',
            weight: 6,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
          },
          'P': {
            color: '#FF8000',
            weight: 2,
            opacity: 1,
            smoothFactor:0,
            lineJoin: 'round',
            lineCap: 'round'
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
        window.app = new App(defaults,data,map,years,styles,params.year,params.lines);
        $(".spinner-container").fadeOut();
        $(".slider").fadeIn();
        $(".current-year").fadeIn();
      });
    });
  });
})();
