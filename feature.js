    // FIXME:
    // Hacer mecanismo de popups unificado en main.js. 

var Feature = function(source_name,feature,style,map,initial_batch){
    var self = this;
    self.source_name = source_name;
    self.style = style;
    self.map = map;
    self.feature = feature;
    
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
            batch.addLayer(self._layer());
        }else{
            features = source._data.features
            features.push(self.feature)
            source.setData(self.source_data(features).data);
        }
    }
    
    this.feature_included = function(source){
        var included = false;
        $.each(source['_data']['features'],function(i,element){
            if (element.properties.id == self.feature.properties.id) included = true;    
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
        
        features = $.grep(source['_data']['features'], function(value) {
              return value.properties.id != self.feature.properties.id;
        });

        source.setData(self.source_data(features).data);
    };
    
    this._layer = function(style){
        var layer = {
                "id": self.source_name,
                "source": self.source_name,
                "paint": style || self.style
            };
        
        layer["paint"] = self._format_style(layer["paint"]);
         
        if (self.feature.geometry.type == 'LineString'){
            $.extend(layer,{"layout": {
                "line-join": "round",
                "line-cap": "round"},
                "type":"line"})
        } else {
            $.extend(layer,{"type":"circle"})
        }
        return layer;
    }
    
    this._format_style = function(s){
        if (self.feature.geometry.type == 'LineString'){
            s["line-color"]=s["color"];
        } else {
            s["circle-color"]=s["color"];
        }
        return s;
    } 
    
    this.load(initial_batch);    
}
