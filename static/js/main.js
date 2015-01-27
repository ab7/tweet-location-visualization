/*global $, google*/
/*jslint plusplus: true */

// globals
var openedInfoWindow = null;

// hide load function before displaying results
function hideLoad() {
  'use strict';
  $('#circleG').fadeOut();
  $('#map').animate({'opacity': '1'});
}

// display error message
function error(message) {
  'use strict';
  $('#error').text(message);
}

// make info window
function makeInfoWin(marker, text, map) {
  'use strict';
  var infoWin = new google.maps.InfoWindow({
    content: text
  });
  google.maps.event.addListener(marker, 'click', function () {
    if (openedInfoWindow !== null) {
      openedInfoWindow.close();
    }
    infoWin.open(map, marker);
    openedInfoWindow = infoWin;
    google.maps.event.addListener(infoWin, 'closeclick', function () {
      openedInfoWindow = null;
    });
  });
}

// make new map object and add markers
function makeMap(coords) {
  'use strict';
  var i, mapOptions, map, mapStyles, styledMap, myLatlng, marker;
  mapOptions = {
    center: new google.maps.LatLng(35, 0),
    zoom: 1
  };
  $.getJSON('static/js/mapstyle.json', function (data) {
    mapStyles = data;
    styledMap = new google.maps.StyledMapType(mapStyles, {name: 'Styled Map'});
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    map.mapTypes.set('map_style', styledMap);
    map.setMapTypeId('map_style');

    // add markers to map
    for (i = 0; i < coords.length; i++) {
      myLatlng = new google.maps.LatLng(coords[i][0][0], coords[i][0][1]);
      marker = new google.maps.Marker({
        position: myLatlng,
        map: map
      });
      var tweet = coords[i][1][1].toString();
      makeInfoWin(marker, tweet, map);
    }
  })
    .fail(function () {
      hideLoad();
      error('Looks like something went wrong, please try again');
    });
}

// get coordinates from geonames object
function getCoords(geoname) {
  'use strict';
  var lng, lat;
  if (geoname.totalResultsCount) {
    lng = geoname.geonames[0].lng;
    lat = geoname.geonames[0].lat;
    return [lat, lng];
  }
}

// find location of tweets
function findLoc(tweet) {
  'use strict';
  var results, loc, coords, lng, lat, locEnabled, noData, userLoc, result;
  coords = [];
  locEnabled = 0;
  noData = 0;
  userLoc = 0;
  result = $('.result');
  result.empty();
  if (tweet.statuses.length > 0) {
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
          .done(function (data) {
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
              hideLoad();
            }
          })
          .fail(function () {
            hideLoad();
            error('Looks like something went wrong, please try again');
          });
      } else {
        noData++;
      }
    });
  } else {
    hideLoad();
    error('No match found! Try a different keyword');
  }
}

// send hashtag to twitter server and retrieve json
function getTweets() {
  'use strict';
  error(' ');
  var keyword = $('input').val();
  if (keyword) {
    if (keyword.trim() === "") {
      error('Please enter a keyword or hashtag');
      return;
    }
    $('#map').animate({'opacity': '.2'});
    $('#circleG').fadeIn();
    $.ajax({
      url: '/',
      type: 'GET',
      data : {
        fmt: 'json',
        hashtag: encodeURIComponent($('input').val())
      },
      success: findLoc,
      timeout: 5000
    })
      .fail(function () {
        hideLoad();
        error('Looks like something went wrong, please try again');
      });
  } else {
    error('Please enter a keyword or hashtag');
  }
}

// doc ready
$(function () {
  'use strict';
  makeMap(0);
  $(document).keypress(function (e) {
    if (e.which === 13) {
      getTweets();
    }
  });
  $('button').click(getTweets);
});
