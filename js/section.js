var Section = function(map, feature, style, type){
  this.status = null;
  
  this.raw_feature = feature;
  this.properties = feature.properties;
  this.map = map;
  this.__style = style;
  this.__type = type;
  this.__length = feature.properties.length;
  
  var self = this;
  
  const STATION_INNER_LAYER = 'station_inner';
  const STATION_TOP_LAYER = 'line_hover';
  const STATION_BUILDSTART_LAYER = 'station_buildstart';

  this.sourceName = function(){
    var str = self.__type + "_";

    if (!self.status || self.status == 'closure')
        return;
    else if (self.status=='buildstart')
        str += self.status;
    else if (self.status=='opening' && self.__type == 'station')
        str += 'opening';
    else // line cases FIXME: it has to disappear with data-driven styles.
        str += self.properties.line;

    return str;
  }

  this.before_layer = function(){
    var b = STATION_BUILDSTART_LAYER;
    if (self.__type == 'station' || !self.map.getLayer(b)) b = STATION_TOP_LAYER;
    if (!self.map.getLayer(b)) b = STATION_INNER_LAYER;
    return b;
  }

  this.has_building_data = function(){
    return self.properties.buildstart != null;
  };

  this.been_inaugurated = function(){
    return self.properties.opening != null;
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

  this.style = function(operation,opts){
    return self.__style.calculate(self.type(),operation,self.line(),opts);
  };

  this.buildChange = function(args){
    return $.extend(args,{type: self.type()});
  };

  this.update =  function(newStatus){
    var previousSourceName = self.sourceName();
    var previousStatus = $.extend({},{status: self.status}).status;
    self.status = newStatus;

    var changes = {remove:[], add:[]};

    if (newStatus == 'closure' || (previousSourceName && previousSourceName != self.sourceName())){
        changes.remove.push(self.buildChange({
                             layerName: previousSourceName,
                             feature: self.raw_feature
                            }));
    }

    if (newStatus != 'closure'){
        changes.add.push(self.buildChange({
            layerName:self.sourceName(),
            feature: self.raw_feature,
            style: self.style(newStatus),
            beforeLayer: self.before_layer()
        }));

        if (self.type() == 'station' && (!previousStatus || previousStatus == 'closure')) {
            changes.add.push(self.buildChange({
            layerName: STATION_INNER_LAYER,
            feature: self.raw_feature,
            style: self.style(newStatus,{source_name: STATION_INNER_LAYER}),
            beforeLayer:null
           }));
        }
    }

    if (newStatus == 'closure' && self.type() == 'station'){
        changes.remove.push(self.buildChange({
            layerName: STATION_INNER_LAYER,
            feature: self.raw_feature}));
    }

    return changes;
  }

  this.buildstart = function(){
    return self.update('buildstart');
  };

  this.open = function(){
    return self.update('opening');
  };

  this.close = function(){
    return self.update('closure');
  };
}
