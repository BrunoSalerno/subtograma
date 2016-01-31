var Feature = function(initial_batch,opts){
    var self = this;
    self.source_name = opts.source_name;
    self.style = opts.style;
    self.feature = opts.feature;
    self.map = opts.map;
    self.before_layer = opts.before_layer;
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
            batch.addLayer(self._layer(),self.before_layer);
            
            // Remove hover layers if this layer is not a hover layer
            if (self.source_name.indexOf('hover') == -1 && self.map.getLayer('line_hover')){
                ['line_hover','station_hover'].forEach(function(l){
                    batch.removeLayer(l);        
                    batch.removeSource(l);
                })
            }        
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

    this.remove = function(batch){
        var source = self.map.getSource(self.source_name);
        
        features = $.grep(source['_data']['features'], function(element) {
            return (!self.match_condition(element));
        });

        source.setData(self.source_data(features).data);

        if (features.length == 0){
            if (self.source_name.indexOf('hover') == -1 &&
                self.map.getLayer(self.source_name)){
                batch.removeLayer(self.source_name);
                batch.removeSource(self.source_name);
            }
        }
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
                id: self.source_name,
                source: self.source_name,
                interactive:true,
                type: (self.type =='line') ? self.type : 'circle',
                paint:$.extend(true,{},self.style)
            };

        if (self.type == 'line'){
            $.extend(layer,{"layout": {
                    "line-join": "round",
                    "line-cap": "round"}})
        }

        return layer;
    }
    
    this.load(initial_batch);    
}
