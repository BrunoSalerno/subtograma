var LayerUpdate = function(args){
    this.layerName = args.layerName;
    this.map = args.map;
    this.type = args.type;

    this.featuresToAdd = [];
    this.featuresToRemove = [];
};

LayerUpdate.prototype = {
    sourceData: function(features){
        return {"data":{
                    "type" : "FeatureCollection",
                    "features": features
                }}
    },

    _layer: function(){
        var layer = {
                id: this.layerName,
                source: this.layerName,
                interactive: true,
                type: (this.type =='line') ? this.type : 'circle',
                paint:$.extend(true, {}, this.style)
            };

        if (this.type == 'line'){

            $.extend(layer,{"layout": {
                    "line-join": "round",
                    "line-cap": "round"}})
        }
        
        return layer;
    },

    addFeature: function(feature, style, beforeLayer){
        if (beforeLayer) this.beforeLayer = beforeLayer;
        if (style) this.style = style;
        this.featuresToAdd.push(feature);
    },
    removeFeature: function(feature){
        this.featuresToRemove.push(feature);        
    },
    newSource: function(){
        var source = new mapboxgl.GeoJSONSource(this.sourceData(this.featuresToAdd))
        this.map.addSource(this.layerName, source)
        this.map.addLayer(this._layer(), this.beforeLayer);
        
        var self = this;
        // Remove hover layers if this layer is not a hover layer
        if (this.layerName.indexOf('hover') == -1){
            ['line_hover','station_hover'].forEach(function(l){
                if (!self.map.getLayer(l)) return;
                self.map.removeLayer(l);
                self.map.removeSource(l);
            })
        }
    },
    updateSource: function(source){
        var features = source._data.features || [];
        var self = this;
        
        // We remove the features set to be removed
        features = $.grep(features, function(element) {
            return (!self._elementInArray(self.featuresToRemove,element));
        });
        
        // We add the features set to be added
        features = features.concat(this.featuresToAdd);
        
        source.setData(this.sourceData(features).data);
    },
    _elementInArray: function(array, element){
        var isPresent = false;
        
        var self = this;
        array.forEach(function(a){
            if (self._matchCondition(a,element)) {
                isPresent = true;
            }            
        });

        return isPresent;
    },
     
    _matchCondition: function(a,b){
        return (!a.properties.plan &&
        !b.properties.plan && 
        a.properties.id == b.properties.id) || 
        (a.properties.plan &&
        a.properties.plan == b.properties.plan &&
        a.properties.id == b.properties.id) 
    },

    render: function(){
        var source = this.map.getSource(this.layerName);
 
        if (!source){
            if (this.featuresToAdd.length == 0) return;

            this.newSource();
        } else {
            this.updateSource(source);
        }
    }
}

var RenderUpdates = function(args){
    this.map = args.map;    
};

RenderUpdates.prototype = {
    render: function(changes){
      var layerUpdates = {}
      
      var self = this;
      changes.forEach(function(change){
        for (var o in change){
            change[o].forEach(function(l){
                if (window.DEBUG) {
                    console.log(o, 'a', l.type, 'feature',(o == 'add') ? 'to' : 'from', l.layerName);
                };

                if (!layerUpdates[l.layerName]) {
                    layerUpdates[l.layerName] = new LayerUpdate({
                        map: self.map,
                        layerName: l.layerName,
                        type: l.type
                    })
                }

                if (o == 'add'){
                    layerUpdates[l.layerName].addFeature(l.feature, l.style, l.beforeLayer);
                } else {
                    layerUpdates[l.layerName].removeFeature(l.feature);
                }
            });

        }
      });

      for (var layerName in layerUpdates){
        layerUpdates[layerName].render();
      }    
    }
}
