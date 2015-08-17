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
  this.__length = feature.properties.length;
    
  var self = this;

  this.has_building_data = function(){
    return self.__has_building_data;
  };

  this.been_inaugurated = function(){
    return self.__been_inaugurated;
  };

  this.line = function(){
    return self.properties.line
  };

  this.type = function(){
    return self.__type;
  };

  this.length = function(){
    return (self.__length/1000).toFixed(2); //in km
  };

  this.__popup_content = function(){

    var content ='<div class="info-window"><div>';
    if (self.type()=='station') content += self.properties.name + ' - '
    content += 'Línea '+ self.properties.line + '</div>'

    if (self.type()=='line') content += 'Tramo de <strong>'+ self.length()+'</strong> km';+' <br />';
    content +='<ul>'
    if (self.properties.buildstart) content += '<li>Construcción: ' + self.properties.buildstart;
    if (self.properties.opening) content += '<li>Inauguración: ' + self.properties.opening;
    if (self.properties.closure) content += '<li>Clausura: ' + self.properties.closure;
    content +='</ul></div>'
    return content;
  }

  this.__style = function(operation){
    var style;
    switch (self.__type){
      case 'line':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.line[operation]["default"],self.styles.line[operation][self.properties.line]) :
          self.styles.line[operation];
        break;
      case 'station':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.point[operation],self.styles.line[operation][self.properties.line]) :
          self.styles.point[operation];
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
        feature_var = L.circleMarker(coords,style);
        break;
    }

    feature_var.bindPopup(self.__popup_content());

    feature_var.on('mouseover', function (e) {
      this.setStyle({color:'#2E2E2E'});
      if (self.geometry.type=='Point') this.setStyle({weight:3});
    });

    feature_var.on('mouseout', function (e) {
      this.setStyle(self.__style(self.status));
    });

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
    self.status = 'buildstart';
  };

  this.open = function(){
    self.__been_inaugurated = true;
    if (self.feature) {
      self.feature.setStyle(self.__style('opening'));
    } else {
      self.draw('opening')
    }
    self.status = 'opening';
  };

  this.close = function(){
    if (self.feature){
      self.map.removeLayer(self.feature);
      self.feature = null;
    } else {
      //console.log('closure: inexistent ' + self.type());
    }
    self.status = 'closure';
  };
}
