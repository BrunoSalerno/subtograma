    // FIXME:
    // Hacer mecanismo de popups unificado en main.js. 

var Feature = function(source_name,feature,style,map,initial_batch){
    var self = this;
    self.source_name = source_name;
    self.style = style;
    self.map = map;
    self.feature = feature;
    
    this.source_name_station_version = function(){
        var parts = self.source_name.split('_');
        parts[0]='station';
        parts[parts.length-1]='buildstart';
        return parts.join('_');    
    }
    
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
            if (self.feature.geometry.type == 'LineString'){
                before = self.source_name_station_version();    
            } else {
                if (self.map.getLayer('station_inner')) before = 'station_inner';
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
                "source": self.source_name
                };
        
        layer["paint"] = self._format_style($.extend(true,{},(style || self.style)));
         
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
            s["circle-color"] = s["color"];
            if (self.source_name =='station_inner') {
                s["circle-color"] = s["fillColor"];
                s["circle-radius"] = s["circle-radius"] - 3;    
            }
        }
        return s;
    } 
    
    this.load(initial_batch);    
}
