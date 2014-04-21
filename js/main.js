// make new map object and add markers
function makeMap(coords) {
  var mapOptions, map, makeStyles, styledMap, myLatlng, marker;
  mapOptions = {
    center: new google.maps.LatLng(35, 0),
    // draggable: false,
    // disableDoubleClickZoom: true,
    // disableDefaultUI: true,
    // scrollwheel: false,
    zoom: 2
  };
  $.getJSON('/js/mapstyle.json', function (data) {
    mapStyles = data;
    styledMap = new google.maps.StyledMapType(mapStyles, {name: "Styled Map"});
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    map.mapTypes.set('map_style', styledMap);
    map.setMapTypeId('map_style');
    
    // add markers to map
    for (i = 0; i < coords.length; i++) {
      myLatlng = new google.maps.LatLng(coords[i][0], coords[i][1]);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: map
      });
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
  var results, loc, coords, lng, lat, c;
  coords = [];  // Here is my empty coordinates array
  result = $('.result');
  result.empty();
  $.each(tweet.statuses, function (i, item) {
    if (item.geo) {
      coords.push(item.geo.coordinates); // The coords push just fine right here
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
        .done(function (data) {
          c = getCoords(data);
          if (c) coords.push(c); // But they will not push to the same coords array here
        });
    } else {
      console.log('nothin');
    }
  });
  makeMap(coords); // Here is where I pass the coordinates in
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
  $('button').click(getTweets);
});