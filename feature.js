var Feature = function(source_name,geometry,style,map,initial_batch){
    var self = this;
    this.map = map;
    this.g = geometry;
    this.source_name = source_name;
    this.style = style;

    this.load = function(batch){
        if (!self.map.getSource(self.source_name)){
            batch.addSource(self.source_name, {
                                "type": "geojson",
                                "data": {
                                    "type" : "Feature",
                                    "properties":{},
                                    "geometry":self.g
                                    }
                                });
        }

        batch.addLayer(self._layer())    
    }

    this.change_style = function(style,batch){
        var ftted_style = self._format_style(style);
                
        for (var k in ftted_style) {
            batch.setPaintProperty(self.source_name, k, ftted_style[k]);    
        } 
    }

    this.remove = function(batch){
        batch.removeLayer(self.source_name);
    };
    
    this._layer = function(style){
        var layer = {
                "id": self.source_name,
                "source": self.source_name,
                "paint": style || self.style
            };
        
        layer["paint"] = self._format_style(layer["paint"]);
         
        $.extend(layer,{"layout": {
                "line-join": "round",
                "line-cap": "round"},
                "type":"line"})

        return layer;
    }
    
    this._format_style = function(s){
        s["line-color"]=s["color"];
        return s;
    } 
    
    // Load the feature
    this.load(initial_batch);
}

var PointFeature = function(source_name,feature,style,map,initial_batch){
    var self = this;
    self.source_name = source_name;
    self.style = style;
    self.map = map;
    self.feature = feature;
    
    this.source_proto = function(features){
        return {
            "type": "geojson",
                "data": {
                    "type" : "FeatureCollection",
                    "features":features
                }
        }
    }
    
    this.load = function(batch){
        var source = self.map.getSource(self.source_name);
        if (!source){
            batch.addSource(self.source_name, self.source_proto([self.feature]));
            batch.addLayer(self._layer())
        }else{
            //if (self.map.getLayer(self.source_name)) batch.removeLayer(self.source_name);
            if (!self.feature_included(source)) {
                batch.removeSource(self.source_name);
                source = self.source_proto(source._data.features)
                source.data.features.push(self.feature)
                batch.addSource(self.source_name,source);
            }
        }

        //batch.addLayer(self._layer())    
    }
    
    this.feature_included = function(source){
        var included = false;
        
        $.each(source['_data']['features'],function(i,element){
            if (element.properties.id == self.feature.properties.id) included = true;    
        });
        
        return included;    
    }

    this.change_style = function(new_source_name,style,batch){
        /*var ftted_style = self._format_style(style);
                
        for (var k in ftted_style) {
            batch.setPaintProperty(self.source_name, k, ftted_style[k]);    
        }*/
        self.remove(batch);
        self.source_name = new_source_name;
        self.style = style;
        self.load(batch); 
    }

    this.remove = function(batch){
        batch.removeLayer(self.source_name);
        
        var source = self.map.getSource(self.source_name);
        batch.removeSource(self.source_name);
        features = $.grep(source['_data']['features'], function(value) {
              return value.properties.id != self.feature.properties.id;
        });

        if (features.length == 0){
            //return;
        }
        
        batch.addSource(self.source_name,self.source_proto(features));
        batch.addLayer(self._layer());
    };
    
    this._layer = function(style){
        var layer = {
                "id": self.source_name,
                "source": self.source_name,
                "paint": style || self.style
            };
        
        layer["paint"] = self._format_style(layer["paint"]);
         
        $.extend(layer,{"type":"circle"})

        return layer;
    }
    
    this._format_style = function(s){
        return s;
    } 
    
    this.load(initial_batch);    
}
