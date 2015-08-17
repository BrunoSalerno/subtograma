/*
 Taken from http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
 weltraumpirat answer
 */

function getSearchParameters() {
  var prmstr = decodeURIComponent(window.location.search.substr(1));
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");

    if (tmparr[0] == 'coords'){

      var splitted = tmparr[1].split(",");
      params[tmparr[0]] = { lat:parseFloat(splitted[0]),
        lon:parseFloat(splitted[1]),
        z:parseInt(splitted[2])};

    } else if (tmparr[0] == 'year') {
      params[tmparr[0]] = parseInt(tmparr[1]);
    } else if (tmparr[0] == 'lines'){
      params[tmparr[0]] = tmparr[1].split(',')
    } else if (tmparr[0] == 'plans'){
      params[tmparr[0]] = tmparr[1].split(',')
    }else{
      params[tmparr[0]] = tmparr[1];
    }

  }
  return params;
}


function save_params(year,map,lines,plans){
  var current_params = getSearchParameters();

  var url=location.pathname+'?';
  year = (year)? year : current_params.year;
  if (year) url += 'year=' + year;

  if (map){
    var center = map.getCenter();
    url += '&coords=' + center.lat + ',' + center.lng + ',' + map.getZoom();
  } else if (current_params.coords) {
    url += '&coords=' + current_params.coords.lat + ',' + current_params.coords.lon + ',' + current_params.coords.z;
  }

  if (lines){
    url += '&lines=' + (lines.join(',') || 0)
  } else if (current_params.lines){
    url += '&lines=' + current_params.lines.join(',')
  }

  if (plans){
    url += '&plans=' + (plans.join(',') || 0)
  } else if (current_params.plans){
    url += '&plans=' + current_params.plans.join(',')
  }

  history.pushState(document.title + ' ' + year ,document.title,url);
}

function round(number){
    return Number(number.toFixed(2));    
}
