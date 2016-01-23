var Feature = function(initial_batch,opts){
    var self = this;
    self.source_name = opts.source_name;
    self.style = opts.style;
    self.feature = opts.feature;
    self.map = opts.map;
    self.station_inner_layer = opts.station_inner_layer;
    self.line_before_layer = opts.line_before_layer;
    self.type = opts.type;
    
    this.source_data = function(features){
        return {"data":{
                    "type" : "FeatureCollection",
                    "features":features
                }}
    }
    
    this.load = function(batch){
        var source = self.map.getSource(self.source_name);
        if (!source){
            source = new mapboxgl.GeoJSONSource(self.source_data([self.feature]))
            batch.addSource(self.source_name, source)
            
            var before = null;
            if (self.type == 'line'){
                before = self.line_before_layer;    
            } else {
                if (self.map.getLayer(self.station_inner_layer)) 
                    before = self.station_inner_layer;
            };
            batch.addLayer(self._layer(),before);
        }else{
            features = source._data.features
            features.push(self.feature)
            source.setData(self.source_data(features).data);
        }
    }
    
    this.feature_included = function(source){
        var included = false;
        $.each(source['_data']['features'],function(i,element){
            if (self.match_condition(element)) included = true;
        });
        return included;    
    }

    this.change_style = function(new_source_name,style,batch){
        self.remove(batch);
        self.source_name = new_source_name;
        self.style = style;
        self.load(batch); 
    }

    this.remove = function(batch){
        var source = self.map.getSource(self.source_name);
        
        features = $.grep(source['_data']['features'], function(element) {
              return (!self.match_condition(element));
        });

        source.setData(self.source_data(features).data);
    };
    
    this.match_condition = function(element){
        return (!self.feature.properties.plan &&
        !element.properties.plan && 
        element.properties.id == self.feature.properties.id) || 
        (self.feature.properties.plan &&
        self.feature.properties.plan == element.properties.plan &&
        self.feature.properties.id == element.properties.id) 
    }

    this._layer = function(){
        var layer = {
                "id": self.source_name,
                "source": self.source_name
                };
        
        layer["paint"] = $.extend(true,{},self.style);
         
        if (self.type == 'line'){
            $.extend(layer,{"layout": {
                "line-join": "round",
                "line-cap": "round"},
                "type":"line"})
        } else {
            $.extend(layer,{"type":"circle"})
        }
        return layer;
    }
    
    this.load(initial_batch);    
}
