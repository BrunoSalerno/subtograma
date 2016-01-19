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
         
        if (self.g.type == 'LineString'){
            $.extend(layer,{"layout": {
                    "line-join": "round",
                    "line-cap": "round"},
                    "type":"line"})

        }else{
            $.extend(layer,{"type":"circle"})
        }

        return layer;
    }
    
    this._format_style = function(s){
        if (self.g.type == 'LineString') {
            s["line-color"]=s["color"];
        } else {}
        return s;
    } 
    
    // Load the feature
    this.load(initial_batch);
}
