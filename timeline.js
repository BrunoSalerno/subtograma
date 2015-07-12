var Timeline = function(data,map,years,styles){
  var self = this;

  this.__busy = false;
  this.__lines = {};

  this.busy = function(){
    return self.__busy;
  };

  this.lines = function(){
    return self.__lines;
  };

  this.set_lines = function(lines){
    for (var l in self.__lines){
      if ($.inArray(l,lines)==-1) self.__lines[l].show = false;
    }
  };

  this.toggle_line = function(line){
    self.__lines[line].show = !self.__lines[line].show
    var lines_params = [];
    for (var l in self.__lines){
      if (self.__lines[l].show) lines_params.push(l)
    }
    return lines_params;
  };

  this.get_busy = function(){
    self.__busy = true;
  };

  this.release = function(){
    self.__busy = false;
  };

  this.current_year = function(){
    return years.current;
  };

  this.starting_year = function(){
    return years.start;
  };

  this.__init_year = function(){
    return {
      stations: {buildstart:[],opening:[],closure:[]},
      lines: {buildstart:[],opening:[],closure:[]}
    }
  };

  this.stations_to_front = function(){
    for (var f in self.sections){
      if (self.sections[f].type()=='station') self.sections[f].bring_to_front();
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

            if (category == 'lines'){
              if (!self.__lines[element.properties.line]){
                self.__lines[element.properties.line]={show:true}
              }
            }
          }
        }
      })
    }

    return t;
  };

  this.draw = function(year,line) {
    var current_year_data = self.data[year];

    if (!current_year_data) return;

    ['line','station'].forEach(function(type){
      var category = (type == 'line') ? 'lines' : 'stations';
      for (var c in current_year_data[category]){
        current_year_data[category][c].forEach(function(obj){

          if (line && obj.properties.line != line) return;
          if (!line && !self.__lines[obj.properties.line].show) return;

          var id = type + '_' + obj.properties.id;

          if (c=='opening'){
            if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,type);
            self.sections[id].open();
          }

          if (c=='closure'){
            self.sections[id].close();
          }

          if (c=='buildstart'){
            if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,type);
            self.sections[id].buildstart();
          }
        })
      }
    });

    self.stations_to_front();
  };

  this.undraw = function(year,line) {
    var current_year_data = self.data[year + 1];

    if (!current_year_data) return;

    ['line','station'].forEach(function(type){
      var category = (type == 'line') ? 'lines' : 'stations';
      for (var c in current_year_data[category]){
        current_year_data[category][c].forEach(function(obj){

          if (line && obj.properties.line != line) return;
          if (!line && !self.__lines[obj.properties.line].show) return;

          var id = type + '_' + obj.properties.id;
          if (!self.sections[id]) return;

          if (c=='opening'){
            if (self.sections[id].has_building_data()){
              self.sections[id].buildstart();
            } else {
              self.sections[id].close();
            }
          }

          if (c=='closure'){
            if (self.sections[id].been_inaugurated()){
              self.sections[id].open();
            } else {
              self.sections[id].buildstart();
            }
          }

          if (c=='buildstart'){
            self.sections[id].close();
          }
        })
      }
    });

    self.stations_to_front();
  };

  this.set_year = function(year){
    self.years.previous = self.years.current;
    self.years.current = year;
  };

  this.up_to_year = function(year,line){
    if (!line) self.set_year(year);
    self.draw(year,line);
  };

  this.down_to_year = function(year,line){
    if (!line) self.set_year(year);
    self.undraw(year,line);
  };

  this.data = this.__load_data(data);
  this.map = map;
  this.years = years;
  this.styles = styles;
  this.sections = {};

};