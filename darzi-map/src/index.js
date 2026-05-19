import "core-js/actual";
import maplibregl from "maplibre-gl";
import { Map, NavigationControl, GeolocateControl, GlobeControl, TerrainControl, LngLat, MercatorCoordinate } from "maplibre-gl";
import mlcontour from "maplibre-contour";

import { GlassShackGnomeTalk } from "./protocol";
import { log, test } from "./test";



// dev
const dev = new URLSearchParams(location.search).get("dev");



// log
if (dev) log();



// see https://github.com/sindresorhus/ky/issues/588#issuecomment-2256808504
if (!AbortSignal.prototype.throwIfAborted) AbortSignal.prototype.throwIfAborted = function () { if (this.aborted) throw new Error("Signal aborted"); };



// config
const configTileSize = 256;
const configMaxZoom = 19;
const configMaxZoomMapzen = 15;
const configOrigin = new LngLat(25.4281, 57.5417);



// terrain
const demMapzen = new mlcontour.DemSource({
  url: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
  encoding: "terrarium",
  maxzoom: configMaxZoomMapzen,
  worker: true,
  cacheSize: 1000,
});
demMapzen.setupMaplibre(maplibregl);
const sourceDEM = {
  type: "raster-dem",
  encoding: "terrarium",
  tiles: [demMapzen.sharedDemProtocolUrl],
  tileSize: configTileSize,
  attribution: "&copy; Mapzen",
  maxzoom: configMaxZoomMapzen,
}
const terrainDEM = {
  source: "dem",
  exaggeration: 1,
}



// data
const sourceData = {
  type: "geojson",
  data: {},
}
const layerFill = {
  id: "data-fill",
  type: "fill",
  source: "data",
  paint: {
    "fill-opacity": .5,
    "fill-color": ["get", "fill"],
    "fill-outline-color": ["get", "line"],
  },
}
const layerLine = {
  id: "data-line",
  type: "line",
  source: "data",
  paint: {
    "line-opacity": .75,
    "line-color": ["get", "line"],
    "line-width": 5,
  },
}



// styles
const styleOSM = {
  version: 8,
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: configTileSize,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: configMaxZoom,
    },
    data: sourceData,
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    }, layerFill, layerLine,
  ],
};
const styleMapzen = {
  version: 8,
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    mapzen: {
      type: "raster",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      tileSize: configTileSize,
      attribution: "&copy; Mapzen",
      maxzoom: configMaxZoomMapzen,
    },
    data: sourceData,
  },
  layers: [
    {
      id: "mapzen",
      type: "raster",
      source: "mapzen",
    }, layerFill, layerLine,
  ],
};
const styleContour = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    contours: {
      type: "vector",
      tiles: [demMapzen.contourProtocolUrl({
        overzoom: 1,
        thresholds: {
          11: [7, 35],
          12: [5, 25],
          13: [3, 15],
          14: [2, 10],
          15: [1, 5],
        },
        elevationKey: "elevation",
        levelKey: "level",
        contourLayer: "contours",
      })],
      maxzoom: configMaxZoomMapzen,
    },
    data: sourceData,
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#fff",
        "background-opacity": 1,
      },
    },
    {
      id: "hillshade",
      type: "hillshade",
      source: "dem",
      layout: { visibility: "visible" },
      paint: {
        "hillshade-exaggeration": 1,
        "hillshade-method": "igor",
      },
    },
    {
      id: "contours",
      type: "line",
      source: "contours",
      "source-layer": "contours",
      paint: {
        "line-opacity": 0.5,
        "line-width": ["match", ["get", "level"], 1, 1, 0.5],
      },
    },
    {
      id: "symbols",
      type: "symbol",
      source: "contours",
      "source-layer": "contours",
      filter: [">", ["get", "level"], 0],
      paint: {
        "text-halo-color": "white",
        "text-halo-width": 1,
      },
      layout: {
        "symbol-placement": "line",
        "text-size": 10,
        "text-field": ["number-format", ["get", "elevation"], {}],
        "text-font": ["Noto Sans Bold"],
      },
    }, layerFill, layerLine,
  ],
};



// config
const configStyles = {
  osm: styleOSM,
  mapzen: styleMapzen,
  contour: styleContour,
};
const configDefaultStyle = "osm";



// map
const map = new Map({
  center: configOrigin,
  container: "map",
  hash: true,
  style: configStyles[configDefaultStyle],
  maxZoom: configMaxZoom,
  zoom: configMaxZoomMapzen,
});



// controls
map.addControl(new NavigationControl({
  visualizePitch: true,
  visualizeRoll: true,
  showZoom: true,
  showCompass: true,
}));
map.addControl(new GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
}));
map.addControl(new GlobeControl());
map.addControl(new TerrainControl(terrainDEM));



// coords
const coordsElem = document.getElementById("coords");
const center = map.getCenter().wrap();
coordsElem.innerHTML = `lon: ${center.lng.toFixed(4)} lat: ${center.lat.toFixed(4)}`;
map.on("mousemove", e => {
  const lngLat = e.lngLat.wrap();
  coordsElem.innerHTML = `lon: ${lngLat.lng.toFixed(4)} lat: ${lngLat.lat.toFixed(4)}`;
});



// protocol
var _limit = 250000;
function _area(coords) {
  const lnglats = coords.map(([lng, lat]) => new LngLat(lng, lat));
  const mercs = lnglats.map(lnglat => MercatorCoordinate.fromLngLat(lnglat, map.terrain.getElevationForLngLatZoom(lnglat, configMaxZoomMapzen)));
  const xs = mercs.map(merc => merc.x);
  const ys = mercs.map(merc => merc.y);
  const meters = mercs.map(merc => merc.meterInMercatorCoordinateUnits());
  const x_min = Math.min(...xs);
  const x_max = Math.max(...xs);
  const y_min = Math.min(...ys);
  const y_max = Math.max(...ys);
  const x_delta = x_max - x_min;
  const y_delta = y_max - y_min;
  const meters_avg = meters.reduce((a, b) => a + b) / meters.length;
  const x_meters = x_delta / meters_avg;
  const y_meters = y_delta / meters_avg;
  const lngs = coords.map(([lng, _]) => lng);
  const lats = coords.map(([_, lat]) => lat);
  const lng_min = Math.min(...lngs);
  const lng_max = Math.max(...lngs);
  const lat_min = Math.min(...lats);
  const lat_max = Math.max(...lats);
  const lng_delta = lng_max - lng_min;
  const lat_delta = lat_max - lat_min;
  const lng_meter = lng_delta / x_meters;
  const lat_meter = lat_delta / y_meters;
  const x_index = [...Array(Math.ceil(x_meters)).keys()];
  const y_index = [...Array(Math.ceil(y_meters)).keys()];
  const area = x_index.length * y_index.length;
  return [lng_min, lat_min, lng_meter, lat_meter, x_index, y_index, area];
}
function _heightmap(coords, interactive = true) {
  const [lng_min, lat_min, lng_meter, lat_meter, x_index, y_index, area] = _area(coords);
  if (area > _limit) {
    const error = window.gsgt.error(`Area too big, ${area} m2, must be under ${_limit} m2!`);
    if (interactive) alert(error);
    return error;
  }
  if (interactive && !confirm(`Are you sure you want to load ${area} m2 area?`)) return window.gsgt.error("User cancelled feature.");
  const eles = new Float32Array(area);
  for (const x of x_index) {
    for (const y of y_index) {
      const lng = lng_min + x * lng_meter;
      const lat = lat_min + y * lat_meter;
      const ele = map.terrain.getElevationForLngLatZoom(new LngLat(lng, lat), configMaxZoomMapzen);
      eles[x * y_index.length + y] = ele;
    }
  }
  window.gsgt.heightmap(lng_min, lng_min + (x_index.length - 1) * lng_meter, lat_min, lat_min + (y_index.length - 1) * lat_meter, x_index.length, y_index.length, eles);
}
var _previousLngLat;
function _draw(lngLat) {
  if (!_previousLngLat) return;
  const coords = [
    [_previousLngLat.lng, _previousLngLat.lat],
    [_previousLngLat.lng, lngLat.lat],
    [lngLat.lng, lngLat.lat],
    [lngLat.lng, _previousLngLat.lat],
    [_previousLngLat.lng, _previousLngLat.lat],
  ];
  const red = _area(coords).at(-1) > _limit;
  map.getSource("data").setData({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {
      fill: red ? "#F00" : "#00F",
      line: red ? "#A00" : "#00A",
    },
  });
  return coords;
}
map.on("load", () => {
  map.on("click", e => {
    const lngLat = e.lngLat.wrap();
    if (!_previousLngLat) {
      _previousLngLat = lngLat;
      return;
    };
    _heightmap(_draw(lngLat), false);
    _previousLngLat = undefined;
  });
  map.on("mousemove", e => { _draw(e.lngLat.wrap()); });
});
window.gsgt = new GlassShackGnomeTalk();
window.gsgt.preInit();
window.gsgt.init();



// layers
const layersElem = document.getElementById("layers");
layersElem.addEventListener("change", e => { map.setStyle(configStyles[e.target.value]); });



// exaggeration
const exaggerationElem = document.getElementById("exaggeration");
exaggerationElem.addEventListener("change", e => {
  map.terrain.exaggeration = e.target.valueAsNumber;
  map.redraw();
});



// limit
const limitElem = document.getElementById("limit");
limitElem.addEventListener("change", e => { _limit = e.target.valueAsNumber; });



// test
if (dev) test(map);
