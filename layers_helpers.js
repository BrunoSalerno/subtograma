var load_layers_control = function(starting_lines,starting_plans,app){
    
    if (starting_lines) {
      app.timeline.set_lines(starting_lines);
    }

    if (starting_plans){
      app.planification.set_plans_lines(starting_plans)
    }

    var lines = app.timeline.lines();
    var lines_str='<ul class="lines">';
    for (var line in lines){
      var label_font_color = app.styles.line.opening[line].labelFontColor ? 'color: '+ app.styles.line.opening[line].labelFontColor+';' : '';  
      var checked_str = (lines[line].show) ? 'checked' : '';
      lines_str += '<li><input type="checkbox" id="checkbox_'+line+'" ' + checked_str + '/>' +
        '<label id="label_'+line+
        '" for="checkbox_'+line+'" style="'+ label_font_color +'background-color: '+ app.styles.line.opening[line].color+'">' +
        line + '</label></li>';
    }

    var plans = app.planification.plans();
    $.each(plans,function(i,plan){
      lines_str += '<li class="plan-label"><div>'+plan.label+'</div>';
      lines_str +='<a href="'+plan.url+'" target="_blank" + title="Link a la ley"><img src="img/link.svg" class="plan-link"></img></a>';
      lines_str +='<ul class="plan-list">'
      for (var line in plan.lines){
        var label_font_color = app.styles.line.project[plan.name][line].labelFontColor ? 'color: ' + app.styles.line.project[plan.name][line].labelFontColor+';' : '';
        var checked_str = (plan.lines[line].show) ? 'checked' : '';
        lines_str += '<li><input type="checkbox" id="checkbox_'+plan.name.replace(' ','-')+
          '_'+line+'" ' + checked_str + '/>' +
          '<label id="label_'+plan.name.replace(' ','-')+'_'+line +
          '" for="checkbox_'+plan.name.replace(' ','-')+'_'+line +
          '" style="' + label_font_color + 'background-color: '+ app.styles.line.project[plan.name][line].color+'">' +
          line + '</label></li>';
      }
      lines_str += '</ul></li>';
    });
    
    lines_str += '</ul>';

    $(".content.layers").append(lines_str);

    for (var l in app.timeline.lines()){
      $('#label_'+l).click(function(e){
        if (app.timeline.busy()){
          e.preventDefault();
          return;
        }

        var line= $(this).attr('id').split('_')[1];
        var lines_params = app.timeline.toggle_line(line);
        var year_start = (app.timeline.lines()[line].show) ? app.years.start : app.timeline.current_year();
        var year_end = (app.timeline.lines()[line].show) ? app.timeline.current_year() : app.years.start;

        app.change_line_to_year(year_start,year_end,line,function(){
            app.set_current_year_info();
        });
        
        save_params(null,null,lines_params);
      });
    }

    $.each(app.planification.plans(),function(i,p){
      for (l in p.lines){
        $('#label_'+ p.name.replace(' ','-')+'_'+l).click(function(e){
          var checkbox_info = $(this).attr('id').split('_');
          var plans_params = app.planification.toggle(checkbox_info[1].replace('-',' '),checkbox_info[2]);
          app.set_current_year_info();
          save_params(null,null,null,plans_params);
        });
      }
    });
    
}
