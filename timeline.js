var Timeline = function(data,map,years,styles){
  var self = this;

  this.__busy = false;

  this.busy = function(){
    return self.__busy;
  }

  this.get_busy = function(){
    self.__busy = true;
  }

  this.release = function(){
    self.__busy = false;
  }

  this.current_year = function(){
    return years.current;
  }

  this.starting_year = function(){
    return years.start;
  }

  this.__init_year = function(){
    return {
      stations: {buildstart:[],opening:[],closure:[]},
      lines: {buildstart:[],opening:[],closure:[]}
    }
  };

  this.__load_data = function(data){
    var t = {};

    for (var category in data){

      if (!data[category]) continue;

      data[category].features.forEach(function(element){
        for (var y in element.properties){
          if (!(y == 'buildstart' || y=='opening' || y=='closure')) continue;

          year = element.properties[y];

          if (year){
            if (!t[year]) t[year] = self.__init_year();
            t[year][category][y].push(element)
          }
        }
      })
    }
    return t;
  };

  this.draw_feature = function(feature,type){
    var feature_var;
    var style;

    switch(feature.geometry.type){
      case 'LineString':
        var points =[];
        feature.geometry.coordinates.forEach(function(point){
          points.push(new L.LatLng(point[1],point[0]))
        });

        type = (type == 'closure')? 'opening' : type; // undrawing case

        if (type == 'opening') {
          style = self.styles.line[type][feature.properties.linea]
        } else {
          style = self.styles.line[type]
        }
        feature_var = new L.Polyline(points, style);
        break;

      case 'Point':
        type = (type == 'closure')? 'opening' : type; // undrawing case

        style = self.styles.point[type];
        var coords = [feature.geometry.coordinates[1],feature.geometry.coordinates[0]];
        feature_var = L.circle(coords,50,style);
        break;
    }
    feature_var.addTo(self.map);
    return feature_var;
  };

  this.__has_building_data = function(id,type,max_year){
    var response = false;
    for (var y = self.years.start ; y <= self.years.end; y++){ //y <= max_year
      if (!self.data[y]) continue;
      $.each(self.data[y][type]['buildstart'],function(i,f){
        if (f.properties.id == id) {
          response = true;
        }
      });
    }
    return response;
  };

  this.draw = function() {
    var current_year_data = self.data[self.years.current];

    if (!current_year_data) return;

    for (var c in current_year_data.lines){
      current_year_data.lines[c].forEach(function(obj){
        var id = obj.properties.id;

        if (c=='opening'){
          if (self.drew_features['line_' + id]) {
            var style = self.styles.line[c][obj.properties.linea]
            self.drew_features['line_' + id].setStyle(style);
          } else {
            self.drew_features['line_' + id] = self.draw_feature(obj,c)
          }
        }

        if (c=='closure'){
          if (!self.drew_features['line_' + id]) {
            console.log('closure: inexistent line_' + id, obj);
          } else {
            self.map.removeLayer(self.drew_features['line_' + id]);
            self.drew_features['line_' + id] = null;
          }
        }

        if (c=='buildstart'){
          self.drew_features['line_' + obj.properties.id] = self.draw_feature(obj,c);
        }
      })
    }

    for (var s in current_year_data.stations){
      current_year_data.stations[s].forEach(function(obj){
        var id = obj.properties.id;

        if (s=='opening'){
          if (self.drew_features['station_' + id]) {
            self.drew_features['station_' + id].setStyle(self.styles.point[s])
          } else {
            self.drew_features['station_' + id] = self.draw_feature(obj,s)
          }
        }

        if (s=='closure'){
          if (!self.drew_features['station_' + id]) {
            console.log('closure: inexistent station_' + id, obj);
          } else {
            self.map.removeLayer(self.drew_features['station_' + id]);
            self.drew_features['station_' + id] = null;
          }
        }

        if (s=='buildstart'){
          self.drew_features['station_' +id] = self.draw_feature(obj,s);
        }
      })
    }

    for (var f in self.drew_features){
      if (f.indexOf('station') != -1){
        if (self.drew_features[f]) self.drew_features[f].bringToFront();
      }
    }
  };

  this.undraw = function() {
    var current_year_data = self.data[self.years.current];

    if (!current_year_data) return;

    for (var c in current_year_data.lines){
      current_year_data.lines[c].forEach(function(obj){
        var id = obj.properties.id;
        if (c=='opening'){
          if (self.__has_building_data(id,'lines',self.years.current)) {
            self.drew_features['line_' + id].setStyle(self.styles.line.buildstart);
          } else {
            if (!self.drew_features['line_' + id]){
              console.log('opening: inexistent line_' + id, obj);
            } else {
              self.map.removeLayer(self.drew_features['line_' + id]);
              self.drew_features['line_' + id] = null;
            }
          }
        }

        if (c=='closure'){
          self.drew_features['line_' + id] = self.draw_feature(obj,c);
        }

        if (c=='buildstart'){
          if (!self.drew_features['line_' + id]){
            console.log('buildstart: inexistent line_' + id, obj);
          } else {
            self.map.removeLayer(self.drew_features['line_' + id]);
            self.drew_features['line_' + id] = null;
          }
        }
      })
    }

    for (var c in current_year_data.stations){
      current_year_data.stations[c].forEach(function(obj){
        var id = obj.properties.id;
        if (c=='opening'){
          if (self.__has_building_data(id,'stations',self.years.current)) {
            self.drew_features['station_' + id].setStyle(self.styles.point.buildstart);
          } else {
            if (!self.drew_features['station_' + id]){
              console.log('opening: inexistent station');
              console.log('station_'+id,obj)
            } else {
              self.map.removeLayer(self.drew_features['station_' + id]);
              self.drew_features['station_' + id] = null;
            }
          }
        }

        if (c=='closure'){
          self.drew_features['station_' + id] = self.draw_feature(obj,c);
        }

        if (c=='buildstart'){
          if (!self.drew_features['station_' + id]){
            console.log('buildstart: inexistent station');
            console.log('station_'+id,obj)
          } else {
            self.map.removeLayer(self.drew_features['station_' + id]);
            self.drew_features['station_' + id] = null;
          }
        }
      })
    }

    for (var f in self.drew_features){
      if (f.indexOf('station') != -1){
        if (self.drew_features[f]) self.drew_features[f].bringToFront();
      }
    }
  };

  this.set_year = function(year){
    self.years.previous = self.years.current;
    self.years.current = year;
  };

  this.up_to_year = function(year){
    if (year == self.years.current) return; // ?
    self.set_year(year);
    self.draw();
  };

  this.down_to_year = function(year){
    if (year == self.years.current) return; // ?
    self.set_year(year);
    self.undraw();
  }

  this.data = this.__load_data(data);
  this.map = map;
  this.years = years;
  this.styles = styles;
  this.drew_features = {};

};