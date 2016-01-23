var MouseEvents = function(map,style,planification,timeline){
    this.features = {};
    this.style = style;
    this.map = map;
    this.planification = planification;
    this.timeline = timeline;

    const STATION_INNER_LAYER = 'station_inner_layer';
    const STATION_HOVER_LAYER = 'station_hover';

    var self = this
    
    function hover(id,type,feature,batch){
        var layer = type + '_hover';
        if (!self.features[id]){
            var opts = {
                source_name: layer,
                style: self.style[(type == 'station')? 'point' : type]["hover"],
                feature: feature,
                map: self.map,
                before_layer: type == 'station' ? STATION_INNER_LAYER : STATION_HOVER_LAYER,
                type:type
            }
            self.features[id] = new Feature(batch, opts)
        }
    }
    
    map.on('click',function(e){
        map.featuresAt(e.point, {radius: 5}, function (err, features) {
            var html = '';
            features.forEach(function(f){
                if (f.properties.line) {
                    html+= '<p><b>' + f.layer.id + '</b></p>';
                    for (var prop in f.properties){
                        html+= '<p>' + prop + ': ' + f.properties[prop];
                    }    
                }
            });

            if (html == '') return;
            var popup = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map); 
        });
    });

    map.on("mousemove", function(e){
        map.featuresAt(e.point, {radius: 5}, function (err, features) {
            map.batch(function(batch){
                var ids = [];
                features.forEach(function(f){
                    if (f.properties.line && f.layer.id.indexOf('hover') == -1 ){
                        var type = f.layer.type == 'circle'? 'station' : 'line';
                        var id = type +'_' + f.properties.id + '_' + f.properties.line + '_' + f.properties.plan;
                        ids.push(id);

                        var raw_feature;
                        
                        if (f.properties.plan){
                            if (type == 'line')
                                raw_feature = self.planification.__plans[f.properties.plan]
                                .lines()[f.properties.line].section.raw_feature;
                            if (type == 'station')
                                $.each(self.planification.__plans[f.properties.plan]
                                .lines()[f.properties.line].stations,function(i,s){
                                    if (s.section.raw_feature.properties.id == f.properties.id) {
                                        raw_feature = s.section.raw_feature;
                                        return;
                                    }
                                })
                        } else {
                            raw_feature = self.timeline.sections[type+'_'+f.properties.id].raw_feature;
                        }
                        hover(id,type,raw_feature,batch);
                    }
                });
                
                for (var i in self.features){
                    if (ids.indexOf(i) == -1){
                        self.features[i].remove(batch);
                        delete self.features[i];
                    }
                };
            });
        });
    });
}
