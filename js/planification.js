var Planification = function(data,map,style){
  this.data = data;
  this.map = map;
  this.style = style;
  this.__plans = {};

  this.drawnLines = {};

  var self = this;
  
  this.current_km = function(){
    var km = 0;
    
    for (var plan in self.__plans){
        for (var k in self.__plans[plan].lines()){
          if (self.drawnLines[plan + '_' + k]) {
            km += self.__plans[plan].lines()[k].length
          }
        }
    }
    return round(km);
  }

  this.plans = function(){
    var o =[];
    for (var plan in self.__plans){
      var l={};
      for (var k in self.__plans[plan].lines()){

        l[k] = {show: (self.drawnLines[plan + '_' + k]) ? true : false}
      }

      var p ={name:plan,
              year: self.__plans[plan].year(),
              label: self.__plans[plan].label(),
              url: self.__plans[plan].url(),
              lines:l};
      o.push(p);
    }

    // We return the plans sorted by year
    return o.sort(function(a,b){return a.year-b.year});
  };

  this.set_plans_lines = function(plan_lines){
    if (plan_lines == 0) return;
    var changes = []
    $.each(plan_lines,function(i,p){
      var param = p.split('.');
      var line = param[1];
      var plan = param[0].replace('_',' ');

      self.drawnLines[plan + '_' + line] = true;
      changes = changes.concat(self.__plans[plan].draw(line));
    })

    var renderUpdates = new RenderUpdates({map: self.map});
    renderUpdates.render(changes);
  };

  this.toggle = function(plan,line){
    var changes;
    var planLineKey = plan + '_' + line;

    if (self.drawnLines[planLineKey]){
      delete self.drawnLines[planLineKey];
      changes = self.__plans[plan].undraw(line);
    } else {
      self.drawnLines[planLineKey] = true;
      changes = self.__plans[plan].draw(line);
    }

    var renderUpdates = new RenderUpdates({map: self.map});
    renderUpdates.render(changes);

    var plan_lines = [];

    for (var plan in self.__plans){
        for (var k in self.__plans[plan].lines()){
          if (self.drawnLines[plan + '_' + k]) {
            plan_lines.push(plan.replace(' ','_')+'.'+k)
          }
        }
    }

    return plan_lines;
  };

  this.__load_data = function(data){
    $.each(data.lines.features, function(index,line){
      var plan_name = line.properties.plan;
      var line_name = line.properties.line;
      var plan_url = line.properties.url;
      var length = line.properties.length;

      if (!self.__plans[plan_name]) {
        self.__plans[plan_name] = new Plan(self.map,plan_name,line.properties.year,plan_url,self.style);
      }

      if (!self.__plans[plan_name].lines()[line_name]){
        self.__plans[plan_name].add_line(line_name,line,length)
      }
    });

    $.each(data.stations.features, function(index,station){
      plan_name = station.properties.plan;
      line_name = station.properties.line;
      var obj ={section: null,raw_feature:station};
      self.__plans[plan_name].add_station(line_name,obj);
    });
  };

  this.__load_data(data);
};
