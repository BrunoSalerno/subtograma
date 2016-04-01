(function(){
  var MapLoader = function(config){
    this.deferred = new $.Deferred();
    var self = this;
      mapboxgl.accessToken = config.mapboxgl.access_token;
      var map = new mapboxgl.Map({
        container: 'map',
        style: config.mapboxgl.style,
        center: config.defaults.coords,
        zoom: config.defaults.zoom,
        bearing: config.defaults.bearing
      });

      map.addControl(new mapboxgl.Navigation()); 
      map.on('load',function(){
        self.deferred.resolve(map);
      });

      map.on('moveend',function(){
        save_params(null,map);
      });
  };

  var DataLoader = function(){
    this.deferred = new $.Deferred();
    var self = this;
    var data = {station:null,line:null};
    var project_data = {stations:null,lines:null};

    $.when($.getJSON('geojson/estaciones.geojson'),
           $.getJSON('geojson/subte.geojson'),
           $.getJSON('geojson/projects-lines.geojson'),
           $.getJSON('geojson/projects-stations.geojson'))
    .then(function(stations,lines,p_lines,p_stations){
      data.station = stations[0];
      data.line = lines[0];
      project_data.lines = p_lines[0];
      project_data.stations = p_stations[0];
      
      self.deferred.resolve([data,project_data])  
    });
  };

  // Styles loader
  var StyleLoader = function(){
    this.deferred = $.Deferred();
    var self = this;
    $.getJSON('styles.json', function(json){
        self.deferred.resolve(json);
    });
  };

  // Config loader
  var ConfigLoader = function(){
    this.deferred = $.Deferred();
    var self = this;
    $.getJSON('config.json', function(json){
        self.deferred.resolve(json);
    });
  }

  $(document).ready(function(){
    $(".spinner-container").show().addClass('spinner');

    var config_loader = new ConfigLoader();
    $.when(config_loader.deferred).then(function(config){
        var params = getSearchParameters();

        if (params.coords) {
          config.defaults.coords = [params.coords.lon,params.coords.lat];
          config.defaults.zoom = params.coords.z;
          config.defaults.bearing = params.coords.bearing;
        }

        var m = new MapLoader(config);
        var d = new DataLoader();
        var s = new StyleLoader();

        $.when(m.deferred,d.deferred,s.deferred)
        .then(function(map,ddata,style){
          var app = new App(config.defaults,
                            ddata[0],
                            ddata[1],
                            map,
                            style,
                            params, function(){
              $(".spinner-container").fadeOut();
              $(".footer").show();
              $(".current-year-container").fadeIn();
          });
        });
    });
  });
})();
