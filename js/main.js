var openedInfoWindow = null;
// make info window
function makeInfoWin (marker, text, map) {
  var infoWin = new google.maps.InfoWindow({
    content: text
  });
  google.maps.event.addListener(marker, 'click', function() {
    if (openedInfoWindow != null) openedInfoWindow.close();
    infoWin.open(map, marker);
    openedInfoWindow = infoWin;
    google.maps.event.addListener(infoWin, 'closeclick', function() {
      openedInfoWindow = null;
    });
  });
}

// make new map object and add markers
function makeMap(coords) {
  var mapOptions, map, makeStyles, styledMap, myLatlng, marker;
  mapOptions = {
    center: new google.maps.LatLng(35, 0),
    zoom: 1
  };
  $.getJSON('/js/mapstyle.json', function (data) {
    mapStyles = data;
    styledMap = new google.maps.StyledMapType(mapStyles, {name: 'Styled Map'});
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    map.mapTypes.set('map_style', styledMap);
    map.setMapTypeId('map_style');
    
    // add markers to map
    for (var i = 0; i < coords.length; i++) {
      myLatlng = new google.maps.LatLng(coords[i][0][0], coords[i][0][1]);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: map
      });
      var tweet = coords[i][1][1].toString()
      makeInfoWin(marker, tweet, map);
    }
  });
}

// get coordinates from geonames object
function getCoords(geoname) {
  var lng, lat;
  if (geoname.totalResultsCount) {
    lng = geoname.geonames[0].lng;
    lat = geoname.geonames[0].lat;
    return [lat, lng];
  }
}

// find location of tweets
function findLoc(tweet) {
  var results, loc, coords, lng, lat, locEnabled, noData, userLoc;
  coords = [];
  locEnabled = 0;
  noData = 0;
  userLoc = 0;
  result = $('.result');
  result.empty();
  $.each(tweet.statuses, function (i, item) {
    if (item.geo) {
      coords.push([item.geo.coordinates, [item.geo.coordinates, item.text]]);
      locEnabled++;
    } else if (item.user.location) {
      // call the geonames api for location data
      $.ajax({
        type: 'GET',
        url: 'http://api.geonames.org/searchJSON',
        data: {
          q: encodeURIComponent(item.user.location),
          maxRows: 1,
          fuzzy: 0.2,
          username: 'ab77'
        }
      })
        .done(function(data) {
          var c = getCoords(data);
          if (c) {
            coords.push([c, [item.user.location, item.text]]);
            userLoc++;
          }
          if ((i + 1) === tweet.statuses.length) {
            $('.noData').text(noData);
            $('.noGeo').text(userLoc);
            $('.locEnabled').text(locEnabled);
            makeMap(coords);
          }
        });
    } else {
      noData++;
    }
  });
}

// send hashtag to twitter server and retrieve json
function getTweets(e) {
  $.ajax('/' , {
    type: 'GET',
    data : {
      fmt: 'json',
      hashtag: $('input').val()
    },
    success: findLoc
  });
}

// doc ready
$(function () {
  makeMap(0);
  $('button').click(getTweets);
});