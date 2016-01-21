var Plan = function(map,plan_name,year,url,styles){
  this.__year = year;
  this.__name = plan_name;
  this.__styles = styles;
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

  this.is_drawn = function(line){
    return (self.__lines[line].section &&
    self.__lines[line].section.feature);
  };

  /*this.__popup_content = function(line,name){
    var content ='<div class="info-window"><div>';
    if (name) content += name + ' - ';
    content += 'Línea '+ line + '</div>';
    content +='<ul>';
    content += '<li>' + self.label();
    if (!name) content += '<li>Longitud: ~<strong>' + round(self.__lines[line].length) + '</strong> km';
    content +='</ul></div>';
    return content;
  };*/
  this.draw = function(line){
    self.map.batch(function(batch){
        if (!self.__lines[line].section)
            self.__lines[line].section = new Section(self.map,
                                                     self.__lines[line].raw_feature,
                                                     self.__styles,
                                                     'line');
        
        self.__lines[line].section.open(batch);
        /*
        f.bindPopup(self.__popup_content(line, null));

        f.on('mouseover', function (e){
          this.setStyle({color:'#2E2E2E'});
        });

        f.on('mouseout', function (e){
          this.setStyle(self.__style('line',line));
        });
        */
        $.each(self.__lines[line].stations,function(i,s){
          if (!s.section)
            s.section = new Section(self.map,
                                    s.raw_feature,
                                    self.__styles,
                                    'station');
          
          s.section.open(batch);
          /*  
          s.feature.bindPopup(self.__popup_content(line, s.properties.name));

          s.feature.on('mouseover', function (e){
            this.setStyle({color:'#2E2E2E'});
            this.setStyle({weight:3});
          });

          s.feature.on('mouseout', function (e){
            this.setStyle(self.__style('point',line));
          });*/
        });
    });
  };

  this.undraw = function(line){
    self.map.batch(function(batch){
        self.__lines[line].section.close(batch);
        $.each(self.__lines[line].stations,function(i,s){
          s.section.close(batch);
        });
    });
  };
};
