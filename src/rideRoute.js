// replace your mapbox token
const mapbox_token = 'pk.eyJ1IjoidGFpbGFuZzExMTExIiwiYSI6ImNrczA0Y20xODFneDQyb24xMjVvbmpndXQifQ.6LFuup8DavaeXjCunLJPqg'
const ID_NAME = 'route'
const locationCenter = [120.19, 30.26] // Hangzhou
var isFetchingEle = false
var geojson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
            'time': []
        },
        "geometry": {
          "type": "LineString",
          "coordinates": []
        }
      }
    ]
  }  
const lngLats = geojson.features[0].geometry.coordinates
var date = undefined

mapboxgl.accessToken = mapbox_token
// create map object
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: locationCenter,
    zoom: 10
});

// create current location marker
const el = document.createElement('div');
el.className = 'marker'
el.style.backgroundColor = '#339966'
el.style.width = '16px'
el.style.height = '16px'
el.style.backgroundSize = '100%'
el.style.borderRadius = "8px"
const currentMarker = new mapboxgl.Marker(el)

// delete current point
function _removeCurrentPoint() {
    lngLats.pop()
    if (lngLats.length === 0) {
        currentMarker.remove()
        _refreshLnglat([])
    } else {
        const lastLngLat = lngLats[lngLats.length-1]
        currentMarker.setLngLat(lastLngLat)
        _refreshLine()
        _refreshLnglat(lastLngLat)
    }

    _refreshDistance()
}

// remove line layer
function _removeLine() {
    if (lngLats.length > 0) {
        map.removeLayer(ID_NAME)
        map.removeSource(ID_NAME)
    }
}

// add line layer
function _addLine() {
    map.addSource('route', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': lngLats
            }
        }
    });
    map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#ff6666',
            'line-width': 6
        }
    });
}

// refresh line layer
function _refreshLine() {
    _removeLine()
    _addLine()
}

// when map load invoke
map.on('load', () => {
    _addLine()
});

// when map is clicked invoke
map.on('click', function (e) {
    if (isFetchingEle) {
        alert('正在请求海拔数据，请稍等...')
        return
    }

    const lat = e.lngLat.lat
    const lng = e.lngLat.lng
    const lngLat = [lng, lat]

    currentMarker.setLngLat(lngLat)
    if (lngLats.length === 0) {
        currentMarker.addTo(map)    
    }

    lngLats.push(lngLat)
    _fetchElevation(lngLat)
    _refreshLine()
    _refreshLnglat(lngLat)
    _refreshDistance()
})

// click delete point button
$("#delete-point").click(function(){
    if (isFetchingEle) {
        alert('正在请求海拔数据，请稍等...')
        return
    }
    _removeCurrentPoint()
})

// export GPX file
$("#export-gpx").click(function(){
    _addDateToGeoJson()
    const gpxstring = togpx(geojson, {featureCoordTimes: 'time'})
    var file = new File([gpxstring], "route.gpx", {type: "text/plain;charset=utf-8"})
    saveAs(file)
    alert("开始导出gpx文件")
})

// export GeoJson file
$("#export-geo").click(function(){
    _addDateToGeoJson()
    var file = new File([JSON.stringify(geojson)], "route.geojson", {type: "text/plain;charset=utf-8"})
    saveAs(file)
    alert("开始导出geojson文件")
})

// add date to geojson
function _addDateToGeoJson() {
    if (!date) {
        return
    }

    const dates = new Array(lngLats.length).fill(date)
    geojson.features[0].properties.time = dates
}

// calculate distance
function _refreshDistance() {
    if (lngLats.length <= 1) {
        $("#distance").text('')
    } else {
        var line = turf.lineString(lngLats)
        var length = turf.length(line, {units: 'kilometers'})
        $("#distance").text(`${parseFloat(length).toFixed(2)}公里`)
    }

}

// refresh map data block
function _refreshLnglat(lngLat) {
    if (!lngLat || lngLat.length === 0) {
        $("#lng").text('')
        $("#lat").text('')
        $("#ele").text('')
    } else {
        $("#lng").text(lngLat[0])
        $("#lat").text(lngLat[1])
        if (lngLat.length === 3) {
            $("#ele").text(`${lngLat[2]}米`)
        } else {
            $("#ele").text('--')
        }
    }
}

// fetch elevation data by latitude and longitude
function _fetchElevation(lngLat) {
    isFetchingEle = true
    var query = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lngLat[0]},${lngLat[1]}.json?radius=10&access_token=${mapbox_token}`
    $.ajax({method: 'GET', url: query}).done(function(data) {
        var allFeatures = data.features
        var elevations = []
        for (i = 0; i < allFeatures.length; i++) {
            const ele = allFeatures[i].properties.ele
            console.log(`log: all eles: ${ele}`);
            if (ele || ele === 0) {
                elevations.push(ele);   
            }
        }
        console.log(JSON.stringify(elevations));
        if (elevations.length > 0) {
            var highestElevation = Math.max(...elevations)   
            // lnglat = [lng, lat, ele]
            lngLat[2] = highestElevation
        }
        _refreshLnglat(lngLat)
        isFetchingEle = false
    }).fail(function() {
        _refreshLnglat(lngLat)
        isFetchingEle = false
    })
}

$("#select-date").change(function(){
    date = $("#select-date").val()
})