var Section = function(map, feature, styles, type){
  this.feature = null;
  this.status = null;

  this.geometry = feature.geometry;
  this.map = map;
  this.styles = styles;
  this.properties = feature.properties;
  this.__has_building_data = false;
  this.__been_inaugurated = false;
  this.__type = type;

  var self = this;

  this.has_building_data = function(){
    return self.__has_building_data;
  };
  this.been_inaugurated = function(){
    return self.__been_inaugurated;
  }

  this.type = function(){
    return self.__type;
  };

  this.__style = function(operation){
    var style;
    switch (self.__type){
      case 'line':
        style = (operation == 'opening') ? self.styles.line[operation][self.properties.linea] : self.styles.line[operation];
        break;
      case 'station':
        style = self.styles.point[operation];
        break;
    }
    return style;
  };

  this.bring_to_front = function(){
    if (self.feature) self.feature.bringToFront();
  };

  this.draw = function(operation){
    var feature_var;
    var style = self.__style(operation);

    switch(self.geometry.type){
      case 'LineString':
        var points =[];
        self.geometry.coordinates.forEach(function(point){
          points.push(new L.LatLng(point[1],point[0]))
        });
        feature_var = new L.Polyline(points, style);
        break;
      case 'Point':
        var coords = [self.geometry.coordinates[1],self.geometry.coordinates[0]];
        feature_var = L.circle(coords,50,style);
        break;
    }
    feature_var.addTo(self.map);
    self.feature = feature_var;
  };

  this.buildstart = function(){
    self.__has_building_data = true;
    if (self.feature) {
      self.feature.setStyle(self.__style('buildstart'));
    } else {
     self.draw('buildstart');
    }
    self.status = 'building';
  };

  this.open = function(){
    self.__been_inaugurated = true;
    if (self.feature) {
      self.feature.setStyle(self.__style('opening'));
    } else {
      self.draw('opening')
    }
    self.status = 'opened';
  };

  this.close = function(){
    if (self.feature){
      self.map.removeLayer(self.feature);
      self.feature = null;
    } else {
      //console.log('closure: inexistent ' + self.type());
    }
    self.status = 'closed';
  };
}
