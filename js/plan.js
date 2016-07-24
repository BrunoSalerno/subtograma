var Plan = function(map,plan_name,year,url,style){
  this.__year = year;
  this.__name = plan_name;
  this.__style = style;
  this.__lines = {};
  this.__url = url;
  this.map = map;
  var self = this;
  
  this.url = function(){
    return self.__url;
  };

  this.lines = function(){
    return self.__lines;
  };

  this.add_line = function(name, raw_feature, length){
    self.__lines[name] = {
        raw_feature: raw_feature,
        section:null,
        stations:[],
        length: round(length/1000)}
  };

  this.add_station = function(line,station){
    self.__lines[line].stations.push(station)
  };

  this.label = function(){
    return self.__name +' <small>('+self.__year+')</small>';
  };

  this.year = function(){
    return self.__year;
  };

  this.draw = function(line){
    var changes = [];
    if (!self.__lines[line].section)
        self.__lines[line].section = new Section(self.map,
                                                 self.__lines[line].raw_feature,
                                                 self.__style,
                                                 'line');

    changes.push(self.__lines[line].section.open())

    $.each(self.__lines[line].stations,function(i,s){
      if (!s.section)
        s.section = new Section(self.map,
                                s.raw_feature,
                                self.__style,
                                'station');
      changes.push(s.section.open());
    });

    return changes;
  };

  this.undraw = function(line){
    var changes = [];
    changes.push(self.__lines[line].section.close());
    $.each(self.__lines[line].stations,function(i,s){
      changes.push(s.section.close());
    });

    return changes;
  };
};
