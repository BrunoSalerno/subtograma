var Planification = function(data,map,styles){
  this.data = data;
  this.map = map;
  this.styles = styles;
  this.__plans = {};

  var self = this;

  this.plans = function(){
    var o =[];
    for (var plan in self.__plans){
      var l={};
      for (var k in self.__plans[plan].lines()){

        // Si está el feature, es que está dibujada
        l[k] = {show: (self.__plans[plan].is_drawn(k)) ? true : false}
      }

      var p ={name:plan,
              year: self.__plans[plan].year(),
              label: self.__plans[plan].label(),
              lines:l};
      o.push(p);
    }

    // We return the plans sorted by year
    return o.sort(function(a,b){return a.year-b.year});
  };

  this.set_plans_lines = function(plan_lines){
    if (plan_lines == 0) return;
    $.each(plan_lines,function(i,p){
      var param = p.split('.');
      var line = param[1];
      var plan = param[0].replace('_',' ');
      self.toggle(plan,line);
    })
  };

  this.toggle = function(plan,line){
    if (self.__plans[plan].is_drawn(line)){
      self.__plans[plan].undraw(line);
    } else {
      self.__plans[plan].draw(line);
    }

    var plan_lines = [];

    for (var plan in self.__plans){
        for (var k in self.__plans[plan].lines()){
          if (self.__plans[plan].is_drawn(k)) {
            plan_lines.push(plan.replace(' ','_')+'.'+k)
          }
        }
    }

    return plan_lines;
  };

  this.__load_data = function(data){
    $.each(data.lines.features, function(index,line){
      var plan_name = line.properties.plan;
      var line_name = line.properties.line;

      if (!self.__plans[plan_name]) {
        self.__plans[plan_name] = new Plan(self.map,plan_name,line.properties.year,styles);
      }

      if (!self.__plans[plan_name].lines()[line_name]){
        self.__plans[plan_name].add_line(line_name,line.geometry)
      }
    });

    $.each(data.stations.features, function(index,station){
      plan_name = station.properties.plan;
      line_name = station.properties.line;
      station['feature'] = null;
      self.__plans[plan_name].add_station(line_name,station);
    });
  };

  this.__load_data(data);
};

var Plan = function(map,plan_name,year,styles){
  // Soporta por plan y por línea una sóla polilínea.

  this.__year = year;
  this.__name = plan_name;
  this.__styles = styles;
  this.__lines = {};
  this.map = map;
  var self = this;

  this.lines = function(){
    return self.__lines;
  };

  this.add_line = function(name, geometry){
    self.__lines[name] = {geometry:geometry,feature:null,stations:[]}
  };

  this.add_station = function(line,station){
    self.__lines[line].stations.push(station)
  };

  this.label = function(){
    return self.__name +' ('+self.__year+')';
  };

  this.year = function(){
    return self.__year;
  };

  this.is_drawn = function(line){
    return (self.__lines[line].feature) ? true : false;
  };

  this.__popup_content = function(line,name){
    var content ='<div class="info-window"><div>';
    if (name) content += name + ' - ';
    content += 'Línea '+ line + '</div>';
    content +='<ul>';
    content += '<li>' + self.label();
    content +='</ul></div>';
    return content;
  };

  this.__style = function(type,line){
    var style = self.__styles[type]['project'];
    if (type== 'line') {
      style = $.extend(true,{},style['default'],style[self.__name][line]);
    }else{
      style = $.extend(true,{},style,styles['line']['project'][self.__name][line]);
    }

    return style;
  };

  this.draw_feature = function(geometry,line){
    var feature_var;
    switch(geometry.type){
      case 'MultiLineString':
        var lines = [];
        geometry.coordinates.forEach(function(line){
            var points=[];
            line.forEach(function(point){
                points.push(new L.LatLng(point[1],point[0]));
            });
            lines.push(points);
        });
        feature_var = new L.multiPolyline(lines, self.__style('line',line));
        break;
      case 'LineString':
        var points =[];
        geometry.coordinates.forEach(function(point){
          points.push(new L.LatLng(point[1],point[0]))
        });
        feature_var = new L.Polyline(points, self.__style('line',line));
        break;
      case 'Point':
        var coords = [geometry.coordinates[1],geometry.coordinates[0]];
        feature_var = L.circleMarker(coords, self.__style('point',line));
        break;
    }
    return feature_var;
  };

  this.draw = function(line){
    var f = self.draw_feature(self.__lines[line].geometry,line);
    self.__lines[line].feature= f;
    f.bindPopup(self.__popup_content(line, null));

    f.on('mouseover', function (e){
      this.setStyle({color:'#2E2E2E'});
    });

    f.on('mouseout', function (e){
      this.setStyle(self.__style('line',line));
    });

    f.addTo(self.map);

    $.each(self.__lines[line].stations,function(i,s){
      var f = self.draw_feature(s.geometry,line);
      s.feature = f;

      s.feature.bindPopup(self.__popup_content(line, s.properties.name));

      s.feature.on('mouseover', function (e){
        this.setStyle({color:'#2E2E2E'});
        this.setStyle({weight:3});
      });

      s.feature.on('mouseout', function (e){
        this.setStyle(self.__style('point',line));
      });
      f.addTo(self.map);
    });
  };

  this.undraw = function(line){
    self.map.removeLayer(self.__lines[line].feature);
    self.__lines[line].feature = null;
    $.each(self.__lines[line].stations,function(i,s){
      self.map.removeLayer(s.feature);
      s.feature = null;
    });
  };
};
