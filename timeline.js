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
      station: {buildstart:[],opening:[],closure:[]},
      line: {buildstart:[],opening:[],closure:[]}
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

            if (category == 'line'){
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

  this.draw = function(year,line){
    var current_year_data = self.data[year];
    var lines;

    if (line) {
      var o ={};
      o[line] = 'temporary obj';
      lines = o;
    } else {
      lines = self.lines();
    }
    
    self.map.batch(function(batch){ 
        for (var l in lines){
          ['station','line'].forEach(function(category){
            if (current_year_data && current_year_data[category]){
              for (var c in current_year_data[category]){
                $.each(current_year_data[category][c],function(i,obj){

                  if (obj.properties.line != l) return;
                  if (!line && !self.__lines[obj.properties.line].show) return;

                  var id = category + '_' + obj.properties.id;

                  if (c=='opening'){
                    if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,category);
                    self.sections[id].open(batch)
                  }

                  if (c=='closure'){
                    self.sections[id].close(batch);
                  }

                  if (c=='buildstart'){
                    if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,category);
                    self.sections[id].buildstart(batch);
                  }

                });
              }
            }
          });
        }
    });
  };


  this.undraw = function(year,line) {
    var current_year_data = self.data[year + 1];
    var lines;

    if (line) {
      var o ={};
      o[line] = 'temporary obj';
      lines = o;
    } else {
      lines = self.lines();
    }

    self.map.batch(function(batch){ 
        for (var l in lines){
          ['station','line'].forEach(function(category){
            if (current_year_data && current_year_data[category]){
              for (var c in current_year_data[category]){
                current_year_data[category][c].forEach(function(obj){

                  if (obj.properties.line != l) return;
                  if (!line && !self.__lines[obj.properties.line].show) return;

                  var id = category + '_' + obj.properties.id;
                  if (!self.sections[id]) return;

                  if (c=='opening'){
                    if (self.sections[id].has_building_data()){
                      self.sections[id].buildstart(batch);
                    } else {
                      self.sections[id].close(batch);
                    }
                  }

                  if (c=='closure'){
                    if (self.sections[id].been_inaugurated()){
                      self.sections[id].open(batch);
                    } else {
                      self.sections[id].buildstart(batch);
                    }
                  }

                  if (c=='buildstart'){
                    self.sections[id].close(batch);
                  }
                });
              }
            }
          });
        }
    });
  };


  this.silent_down_to_year = function(start_year,end_year,lines){
    var features = self.features_in_a_year(start_year,lines); 
    
    features['buildstart'] = features['buildstart'] || [];
    features['opening'] = features['opening'] || [];
    features['closure'] = features['closure'] || [];
    
    var current_year_data;
    
    for (var year = start_year;year > end_year-1;year--){
        current_year_data = self.data[year]
        if (!current_year_data) continue;
        
        ['station','line'].forEach(function(category){
            for (var c in current_year_data[category]){
                current_year_data[category][c].forEach(function(obj){
                    if (lines.indexOf(obj.properties.line) == -1) return;
                    var id = category + '_' + obj.properties.id;
                    
                    if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,category);          
                     
                    if (c == 'opening'){
                        features['opening'] = $.grep(features['opening'],function(element){
                            return (element != id);
                        });
                        if (self.sections[id].has_building_data()){
                            features['buildstart'].push(id);
                        }else{
                            features['closure'].push(id); 
                        }
                    }

                    if (c == 'buildstart'){
                        features['buildstart'] = $.grep(features['buildstart'],function(element){
                            return (element != id);
                        });
                        features['closure'].push(id); 
                    }

                    if (c == 'closure'){
                        features['closure'] = $.grep(features['closure'],function(element){
                            return (element != id);
                        });
                        if (self.sections[id].been_inaugurated()){
                            features['opening'].push(id);    
                        } else {
                            features['buildstart'].push(id);    
                        }
                    }
                });
            };
        });
    }
    
    self.features_to_map(features);
  };
  
  this.silent_up_to_year = function(year,lines){
    var features = self.features_in_a_year(year,lines); 
    self.features_to_map(features);
  };
  
  this.features_in_a_year = function(year_end,lines){
    var features = {};
    var current_year_data;
    
    for (var year = self.years.start; year < (year_end+1);year++){    
        current_year_data = self.data[year];
        if (!current_year_data) continue;

        ['station','line'].forEach(function(category){
            for (var c in current_year_data[category]){
                current_year_data[category][c].forEach(function(obj){
                    if (lines.indexOf(obj.properties.line) == -1) return;
                    
                    var id = category + '_' + obj.properties.id;

                    if (c=='buildstart' || c=='opening') {
                        if (!features[c]) features[c] = [];
                        if (!self.sections[id]) self.sections[id] = new Section(self.map,obj,self.styles,category);          
                        features[c].push(id)       
                        
                        if (c=='opening'){
                            features['buildstart'] = $.grep(features['buildstart'],function(element){
                                return (element != id)
                            });
                        }
                    }

                    if (c == 'closure'){
                        ['buildstart','opening'].forEach(function(cc){   
                            features[cc] = $.grep(features[cc],function(element){
                                return (element != id);
                            });
                        });
                    }
                });
            };
        });
    }
    return features;    
  };
   
  this.features_to_map = function(features){
    self.map.batch(function(batch){
        for(var o in features){
            if (!features[o]) return;
            features[o].forEach(function(id){
                if (o == 'buildstart')
                    self.sections[id].buildstart(batch);
                else if (o == 'opening')
                    self.sections[id].open(batch);
                else
                    self.sections[id].close(batch) 
            });
        };
    });
  } 

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

  this.year_information = function(){
    var information = {
        km_operating: 0,
        km_under_construction:0,
        stations:0
    };

    var y = self.years.current;
    for (var s in self.sections){
      var section = self.sections[s];
      if (section.feature){
          switch (section.type()){
            case 'line':
                if (section.status == 'opening'){
                    information.km_operating += section.length();
                    information.km_operating = round(information.km_operating);
                } else if (section.status == 'buildstart') {
                    information.km_under_construction += section.length();    
                    information.km_under_construction = round(information.km_under_construction);
                }
            break;
            case 'station':
                if (section.status == 'opening'){
                    information.stations += 1;
                }
            break;
          }
      }   
    };      
    
    return information;
  };

  this.data = this.__load_data(data);
  this.map = map;
  this.years = years;
  this.styles = styles;
  this.sections = {};

};
