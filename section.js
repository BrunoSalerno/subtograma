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
  
  this.source_name = function(t,s){
    var t = t || self.__type;
    var s = s || self.status;
      
    var str = t + "_";

    if (self.status=='buildstart')
       str += s;
    else
       str += self.properties.line;

    return str;
  }


  this.line_before_layer = function(){
    return self.source_name('station','buildstart');
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

  // FiXME: Move this logic to main.js::LoadMap
  /*
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
  }*/

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

  this.draw = function(operation,batch){
    var style = self.__style(operation);
  
    var opts = {
        map:self.map,
        source_name:self.source_name(),
        feature:self.raw_feature,
        style:style,
        station_inner_layer: STATION_INNER_LAYER,
        line_before_layer: self.line_before_layer(),
        type:self.__type
    }

    if (self.__type == 'station'){
        var extra_opts = $.extend({},opts)
        extra_opts.source_name = STATION_INNER_LAYER; 
        self.feature_extra = new Feature(batch,extra_opts);
    }
    
    self.feature = new Feature(batch,opts);
    /*
    feature_var.bindPopup(self.__popup_content());

    feature_var.on('mouseover', function (e) {
      this.setStyle({color:'#2E2E2E'});
      if (self.geometry.type=='Point') this.setStyle({weight:3});
    });

    feature_var.on('mouseout', function (e) {
      this.setStyle(self.__style(self.status));
    });*/

  };
  
  this.buildstart = function(batch){
    self.status = 'buildstart';
    self.__has_building_data = true;
    if (self.feature) {
        self.feature.change_style(self.source_name(),self.__style('buildstart'),batch);
    } else {
        self.draw(self.status, batch);    
    }
  };

  this.open = function(batch){
    self.status = 'opening';
    self.__been_inaugurated = true;
    if (self.feature) {
       self.feature.change_style(self.source_name(),self.__style('opening'),batch);          
    } else {
        self.draw(self.status, batch);    
    }
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
