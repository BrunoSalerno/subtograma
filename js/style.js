var Style = function(styles){
    this.__styles = styles;    
}

Style.prototype = {
    STATION_INNER_LAYER: 'station_inner',
    
    __styles: null,
    cache: {},
    cacheKey: function(type,operation,line,opts){
        if (opts.source_name == this.STATION_INNER_LAYER)
            return opts.source_name;

        var key = type + '-' + operation;
        if (type != 'station' && operation != 'buildstart')
            key += '-'+ line;

        return key;    
    },
    calculate: function(type,operation,line,opts){
        opts = opts || {};

        var cachedStyleKey = this.cacheKey(type,operation,line,opts);
        var cachedStyle = this.cache[cachedStyleKey];
        if (cachedStyle) return cachedStyle;
    
        var style;
        switch (type){
          case 'line':
            style = (operation == 'opening') ?
              $.extend(true,{},this.__styles.line[operation]["default"],this.__styles.line[operation][line]) :
              $.extend(true,{},this.__styles.line[operation]);
              
            style["line-color"] = style["color"];
            break;
          
          case 'station':
            if (operation == 'opening'){
              style = $.extend(true,{},this.__styles.point[operation])
              var stops = [];
              
              for (var l in this.__styles.line[operation]){
                if (l != 'default')
                stops.push([l, this.lineColor(l)]);
              }
              
              style["circle-color"] = {
                    type: "categorical",
                    property : "line",
                    stops : stops
                  }
            } else {
              style = $.extend(true,{},this.__styles.point[operation]);
              style["circle-color"] = style["color"];
            }
             
            if (opts.source_name == this.STATION_INNER_LAYER) {
                style["circle-color"] = style["fillColor"];
                style["circle-radius"] = style["circle-radius"] - 3;    
            }
            
            delete style["line-width"];
            
            break;
        }
        
        delete style["labelFontColor"];    
        delete style["fillColor"];
        delete style["color"];

        this.cache[cachedStyleKey] = style;

        return style;
    },
    hover: function(type){
        var str_type = (type == 'station')? 'point' : type;
        return this.__styles[str_type]["hover"]; 
    },
    lineColor: function(line){
        return this.__styles.line.opening[line].color; 
    },
    lineLabelFontColor: function(line){
        return this.__styles.line.opening[line].labelFontColor;
    }
    
}
