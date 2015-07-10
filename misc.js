function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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
    }else{
      params[tmparr[0]] = tmparr[1];
    }

  }
  return params;
}


function save_params(year,map){
  var current_params = getSearchParameters();

  var url=location.pathname+'?';
  year = (year)? year : current_params.year;
  url += 'year=' + year;

  if (map){
    var center = map.getCenter();
    url += '&coords=' + center.lat + ',' + center.lng + ',' + map.getZoom();
  } else if (current_params.coords) {
    url += '&coords=' + current_params.coords.lat + ',' + current_params.coords.lon + ',' + current_params.coords.z;
  }

  history.pushState(document.title + ' ' + year ,document.title,url);
}