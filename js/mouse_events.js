var MouseEvents = function(map,style,planification,timeline){
    this.features = {};
    this.style = style;
    this.map = map;
    this.planification = planification;
    this.timeline = timeline;
   
    var self = this
    
    this.layers = layers();

    var STATION_INNER_LAYER = 'station_inner';
    var STATION_HOVER_LAYER = 'station_hover';

    function layers(){
        l = ['station_opening','station_buildstart','line_buildstart'];
        
        // FIXME: simplify this when
        // - 1) planification uses same layers than regular lines
        // - 2) data-driven styles for lines are implemented
        var lines = self.timeline.lines();
        for (var line in lines){
            ['line'].forEach(function(el){
                l.push(el+'_'+line);
            })
        }
        
        self.planification.plans().forEach(function(plan){
            for (var line in plan.lines){
                ['line','station'].forEach(function(el){
                    var ll = el+'_'+line;
                    if (l.indexOf(ll) == -1) l.push(ll);
                })
            }
        })
        return l;
    }
    
    function feature_info(f){
        str = '';
        if (f.name) {
            str += '<p><b> Estación ' + f.name + ' (línea '+f.line+')</b></p>';
        } else {
            str += '<p><b> ' + ((f.plan)? 'Línea ' : 'Tramo de la línea ') + f.line +'</b></p>'
        }

        // We have to parse null values because Mapbox GL stringifies them.
        for (var key in f) {
            if (f[key] == 'null') f[key] = null;
        }

        if (f.buildstart) str += '<p>La construcción empezó en '+f.buildstart;
        if (f.opening) str += '<p>Se inauguró en '+f.opening;
        if (f.closure) str += '<p>Se cerró en '+f.closure;
        if (f.plan && f.year) str +='<p>'+f.plan + ' (' + f.year + ')</p>'
        if (f.length) str += '<p>Longitud aproximada: '+(parseFloat(f.length)/1000).toFixed(2)+'km';
        if (f.plan && f.url) str += '<p><a target="_blank" href="'+f.url+'">Más información</a></p>'
        return str;
    }
      
    map.on('click',function(e){
        var point = [e.point.x,e.point.y];
        var features = map.queryRenderedFeatures(point, {layers:self.layers});
        var html = '';
        features.forEach(function(f){
            html+= feature_info(f.properties);
        });

        if (html == '') return;
        var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    map.on("mousemove", function(e){
        var point = [e.point.x,e.point.y];
        var features = map.queryRenderedFeatures(point, {layers:self.layers});
        var ids = [];

        // Cursor pointer
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';

        hoverActions = [];

        features.forEach(function(f){
            var type = f.layer.type == 'circle'? 'station' : 'line';
            var id = type +'_' + f.properties.id + '_' + f.properties.line + '_' + f.properties.plan;

            ids.push(id);

            if (!self.features[id]){
               var style = self.style.hover(type);
               var beforeLayer = (type == 'station')? STATION_INNER_LAYER : STATION_HOVER_LAYER;

               var hoverFeature = {layerName: type + '_hover',
                                   type: type,
                                   feature: f,
                                   style: style,
                                   beforeLayer: beforeLayer};

                self.features[id] = hoverFeature;
                hoverActions.push({add: [hoverFeature]});
            }
        });

        for (var i in self.features){
            if (ids.indexOf(i) == -1){
                hoverActions.push({remove: [self.features[i]]});
                delete self.features[i];
            }
        };

        var renderUpdates = new RenderUpdates({map: self.map});
        renderUpdates.render(hoverActions);
    });
}
