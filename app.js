var App = function(defaults,data,projects_data,map,styles,params,callback){
    this.interval = null;
    var self = this;
    this.styles = styles;
    this.years = defaults.years;

    var starting_year = params.year;
    var starting_lines = params.lines;
    var starting_plans = params.plans;

    this.change_line_to_year = function(year_start,year_end,line,callback){
      if (self.timeline.busy()) return;
      self.timeline.get_busy();

      if (year_end > year_start) {
        self.timeline.up_to_year(year_start,year_end,[line]);
        self.timeline.release();
      } else {
        self.timeline.down_to_year(year_start,year_end,[line]);
        self.timeline.release();
      }
    };

    this.change_to_year = function(year,speed,from_input,callback){
      if (year > self.years.end) return;
      if (self.timeline.busy()) return;
      
      self.timeline.get_busy();

      var y = self.timeline.current_year();
      var old_year = y;
      
      if (year > self.timeline.current_year()) {
        if (speed == 0){
            self.timeline.up_to_year(self.timeline.current_year(),year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year);
            self.timeline.release(); 
            if (typeof callback == 'function') callback(true);
            return;
        }
        self.interval = setInterval(function(){
          if (y > year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.up_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y); 
            self.set_year_marker(y);
          }
          old_year = y;
          y++;
        }, speed || defaults.speed);
      } else if (year < self.timeline.current_year()){
        if (speed == 0){
            self.timeline.down_to_year(self.timeline.current_year(),year);
            self.timeline.set_year(year);
            self.set_year_marker(year);
            self.set_current_year_info(year); 
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
            return;
        }
        self.interval = setInterval(function(){
          if (y < year) {
            save_params(year);
            clearInterval(self.interval);
            self.timeline.release();
            if (typeof callback == 'function') callback(true);
          }else{
            self.timeline.down_to_year(old_year,y);
            self.timeline.set_year(y);
            if (!from_input) self.set_current_year_info(y);
            self.set_year_marker(y);
          }
          old_year = y;
          y--;
        }, speed || defaults.speed);
      } else {
        self.timeline.release();
        if (typeof callback == 'function') callback(false);
      }
    };

    this.create_slider = function(){
      for (var i = self.years.start; i < (self.years.end); i += 10){
        var left = (i-self.years.start)/(self.years.end-self.years.start+5)*100;
        var width = 100 / (self.years.end-self.years.start+5) * 10;
        var year = $("<div class='vertical_line' style='left:"+ left +"%;width:"+width+"%'>"+
          (i + 5) +'</div>');

        $('.reference').append(year);
      }

      $('.reference').click(function(e){
        var posX = $(this).offset().left;
        var left = (e.pageX - posX) / $(this).width();
        var year = parseInt(left * (self.years.end - self.years.start +5) + self.years.start);
        self.action_button_is_playing();
        self.change_to_year(year,null,false,function(){
          self.action_button_is_paused();
        });
      }).
        mousemove(function(e){
          var posX = $(this).offset().left;
          var diff = (e.pageX - posX);
          if (diff < 0) diff = 0;
          var left = diff / $(this).width();
          var year = parseInt(left * (self.years.end - self.years.start +5) + self.years.start);
          $('.year-hover').html(year).css({left:left*100+'%'}).fadeIn();
        }).
        mouseleave(function(){
          $('.year-hover').fadeOut();
        })
    };

    this.action_button_is_playing = function(){
      $('.action').removeClass('play').addClass('pause');
    };

    this.action_button_is_paused = function(){
      $('.action').removeClass('pause').addClass('play');
    };

    this.set_year_marker = function(y){
      var left =(y-self.years.start)/(self.years.end-self.years.start+5)*100;
      $('.year-marker').css('left',left+'%');
    };

    this.play = function(){
      self.action_button_is_playing();
      self.change_to_year(self.years.end,null,false,function(){
        self.action_button_is_paused();
      });
    };

    this.pause = function(){
      self.action_button_is_paused();
      clearInterval(self.interval);
      self.timeline.release();
      self.set_current_year_info(self.timeline.current_year());
      save_params(self.timeline.current_year());
    };

    this.set_current_year_info = function(year){
        if (year) $('.current-year').val(year);
        var y_i = self.timeline.year_information();
        var current_km = round(y_i.km_operating + self.planification.current_km()); 
        var y_i_str = (current_km > 0)? '<p>' + current_km+' km </p>' : '';
        y_i_str += (y_i.km_under_construction > 0)? '<p>' + y_i.km_under_construction+' km en obra</p>':'';
        y_i_str += (y_i.stations > 0)? '<p>' + y_i.stations+' estaciones </p>' : '';
       
        if (y_i_str == '') y_i_str = '<p>No hay información para este año</p>'  
        $('.current-year-container .information').html(y_i_str)
    };

    this.planification = new Planification(projects_data,map,this.styles);
    this.timeline = new Timeline(data,map,this.years,this.styles);
    this.create_slider();

    // Current year functionality
    // --------------------------
    $('.current-year').
      attr('min',self.years.start).
      attr('max',self.years.end).
        change(function(e){
      var new_year = parseInt($(this).val());
      if (new_year < self.years.start || new_year > self.years.end){
        $(this).blur();
        $(this).val(self.years.current);
      } else {
        $(this).blur();
        self.action_button_is_playing();
        self.change_to_year(new_year,null,true,function(){
          self.set_current_year_info();
          self.action_button_is_paused();
        });
      }
    });

    // Tabs toggle
    // -----------
    $(".tab").click(function(){
      var tab = $(this)[0].classList[1];
         
      var panel = $('.panel-container .panel'); 
      var clicked_tab_content = panel.find(".content."+tab);
      var other_tab_content = panel.find(".content").not(".content."+tab)
        
      if (!panel.is(":visible")){
          $(".leaflet-bottom.leaflet-right").addClass("back");
          if (!clicked_tab_content.is(":visible")){
            other_tab_content.hide();
            clicked_tab_content.show();      
            $(".tab").not(".tab."+tab).addClass('not-selected');
            $(".tab."+tab).removeClass('not-selected');
          }
          panel.slideToggle(500); 
      }else{
          if (clicked_tab_content.is(":visible")){
            panel.slideToggle(500,function(){
                $(".leaflet-bottom.leaflet-right").removeClass("back");
            });    
          } else {
            other_tab_content.hide();
            clicked_tab_content.show();      
            $(".tab").not(".tab."+tab).addClass('not-selected');
            $(".tab."+tab).removeClass('not-selected');
          }  
      }
    });

    // Play/Pause
    // ----------
    $('.action').click(function(){
      if ($(this).hasClass('play')){
        self.play();
      } else {
        self.pause();
      }
    });

    // Layers
    // ------
    load_layers_control(starting_lines,starting_plans,this);
    
    // Hover & Popup
    //--------------
    self.mouse_events = new MouseEvents(map,self.styles,self.planification,self.timeline);
    
    // Init to the start year
    // ----------------------
    self.timeline.up_to_year(this.years.start);
    self.timeline.set_year(this.years.start);
    self.set_current_year_info(this.years.start);
    self.set_year_marker(this.years.start);

    if (starting_year) {
        this.change_to_year(starting_year,0,false,function(){
            if (typeof callback === 'function') callback();
        });
    }else{
        if (typeof callback === 'function') callback();    
    }
};
