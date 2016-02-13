var Section = function(map, feature, styles, type){
  this.status = null;
  
  this.raw_feature = feature;
  this.feature = null;
  this.feature_extra = null;
  this.properties = feature.properties;
  this.map = map;
  this.styles = styles;
  this.__has_building_data = false;
  this.__been_inaugurated = false;
  this.__type = type;
  this.__length = feature.properties.length;
  
  var self = this;
  
  const STATION_INNER_LAYER = 'station_inner';
  const STATION_TOP_LAYER = 'line_hover';
   
  this.source_name = function(t,s){
    var t = t || self.__type;

    var str = t + "_";
    
    if (s){
        str += s;
    } else {
        if (self.status=='buildstart')
           str += self.status;
        else
           str += self.properties.line;
    }

    return str;
  }


  this.before_layer = function(){
    var b = self.source_name('station','buildstart');
    if (self.__type == 'station' || !self.map.getLayer(b)) b = STATION_TOP_LAYER;
    if (!self.map.getLayer(b)) b = STATION_INNER_LAYER;
    return b;
  }

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
    return round((self.__length/1000)); //in km
  };

  this.__style = function(operation,opts){
    var opts = opts || {};
    var style;
    switch (self.__type){
      case 'line':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.line[operation]["default"],self.styles.line[operation][self.properties.line]) :
          $.extend(true,{},self.styles.line[operation]);
          
        style["line-color"] = style["color"];
        break;
      
      case 'station':
        style = (operation == 'opening') ?
          $.extend(true,{},self.styles.point[operation],self.styles.line[operation][self.properties.line]) :
          $.extend(true,{},self.styles.point[operation]);
        
        style["circle-color"] = style["color"];
         
        if (opts.source_name == STATION_INNER_LAYER) {
            style["circle-color"] = style["fillColor"];
            style["circle-radius"] = style["circle-radius"] - 3;    
        }
        
        delete style["line-width"];
        
        break;
    }
    
    delete style["labelFontColor"];    
    delete style["fillColor"];
    delete style["color"];
     
    return style;
  };

  this.draw = function(operation,batch){
    var style = self.__style(operation);
    var f_extra = null;
    var opts = {
        map:self.map,
        source_name:self.source_name(),
        feature:self.raw_feature,
        style:style,
        before_layer: self.before_layer(),
        type:self.__type
    }

    if (self.__type == 'station'){
        var extra_opts = $.extend({},opts,{
            source_name: STATION_INNER_LAYER,
            before_layer: null,
            style: self.__style(operation,{source_name: STATION_INNER_LAYER})
        });
        
        self.feature_extra = new Feature(batch,extra_opts);
    }
    
    return new Feature(batch,opts);
  };
  
  this.__update_feature = function(batch){
    if (self.feature) {
        self.feature.remove(batch);
    }
    self.feature = self.draw(self.status,batch);
  }

  this.buildstart = function(batch){
    self.status = 'buildstart';
    self.__has_building_data = true;
    self.__update_feature(batch);
  };

  this.open = function(batch){
    self.status = 'opening';
    self.__been_inaugurated = true;
    self.__update_feature(batch);
  };

  this.close = function(batch){
    self.status = 'closure';
    if (self.feature){
      self.feature.remove(batch);
      self.feature = null;
      
      if (self.feature_extra){
        self.feature_extra.remove(batch);
        self.feature_extra = null;
      }
    } else {
      //console.log('closure: inexistent ' + self.type());
    }
  };
}
