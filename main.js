(function(){
  var MapLoader = function(defaults){
    this.deferred = new $.Deferred();
    var self = this;
    //$.get('php/map_url.php',function(map_url){
      mapboxgl.accessToken = 'pk.eyJ1IjoiYnJ1bm9zYWxlcm5vIiwiYSI6IlJxeWpheTAifQ.yoZDrB8Hrn4TvSzcVUFHBA';
      var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/brunosalerno/cijg9rg5f001k93lyyw319qqu',
        center: defaults.coords,
        zoom: defaults.zoom,
        bearing: defaults.bearing 
      });

      map.addControl(new mapboxgl.Navigation()); 
      map.on('load',function(){
        self.deferred.resolve(map);
      });

      map.on('moveend',function(){
        save_params(null,map);
      });
    //});
  };

  var DataLoader = function(){
    this.deferred = new $.Deferred();
    var self = this;
    var data = {stations:null,lines:null};
    var project_data = {stations:null,lines:null};

    $.when($.getJSON('geojson/estaciones.geojson'),
           $.getJSON('geojson/subte.geojson'),
           $.getJSON('geojson/projects-lines.geojson'),
           $.getJSON('geojson/projects-stations.geojson'))
    .then(function(stations,lines,p_lines,p_stations){
      data.stations = stations[0];
      data.lines = lines[0];
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

  $(document).ready(function(){
    var defaults = {
      coords : [-58.4122003,-34.6050499],
      zoom   : 13,
      bearing : 0,
      init_year : 1911,
      speed : 1,
      years: {start:1910,end:2016, current:null, previous:null}
    };

    $(".spinner-container").show().addClass('spinner');

    var params = getSearchParameters();

    if (params.coords) {
      defaults.coords = [params.coords.lon,params.coords.lat];
      defaults.zoom = params.coords.z;
      defaults.bearing = params.coords.bearing;
    }
    
    var m = new MapLoader(defaults);
    var d = new DataLoader();
    var s = new StyleLoader();

    $.when(m.deferred,d.deferred,s.deferred)
    .then(function(map,ddata,style){
      var app = new App(defaults,
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
})();
