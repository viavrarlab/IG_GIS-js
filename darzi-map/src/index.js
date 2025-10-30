import maplibregl from 'maplibre-gl';
import { Map, NavigationControl, GeolocateControl, GlobeControl, TerrainControl, LngLat, MercatorCoordinate } from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

import { GlassShackGnomeTalk } from './protocol';



// config
const configTileSize = 256;
const configMaxZoom = 19;
const configMaxZoomMapzen = 15;
const configOrigin = new LngLat(25.4281, 57.5417);



// terrain
const demMapzen = new mlcontour.DemSource({
  url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  encoding: 'terrarium',
  maxzoom: configMaxZoomMapzen,
  worker: true,
  cacheSize: 1000,
});
demMapzen.setupMaplibre(maplibregl);
const sourceDEM = {
  type: 'raster-dem',
  encoding: 'terrarium',
  tiles: [demMapzen.sharedDemProtocolUrl],
  tileSize: configTileSize,
  attribution: '&copy; Mapzen',
  maxzoom: configMaxZoomMapzen,
}
const terrainDEM = {
  source: 'dem',
  exaggeration: 1,
}



// styles
const styleOSM = {
  version: 8,
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: configTileSize,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: configMaxZoom,
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};
const styleMapzen = {
  version: 8,
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    mapzen: {
      type: 'raster',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      tileSize: configTileSize,
      attribution: '&copy; Mapzen',
      maxzoom: configMaxZoomMapzen,
    },
  },
  layers: [
    {
      id: 'mapzen',
      type: 'raster',
      source: 'mapzen',
    },
  ],
};
const styleContour = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  terrain: terrainDEM,
  sources: {
    dem: sourceDEM,
    contours: {
      type: 'vector',
      tiles: [demMapzen.contourProtocolUrl({
        overzoom: 1,
        thresholds: {
          11: [7, 35],
          12: [5, 25],
          13: [3, 15],
          14: [2, 10],
          15: [1, 5],
        },
        elevationKey: 'elevation',
        levelKey: 'level',
        contourLayer: 'contours',
      })],
      maxzoom: configMaxZoomMapzen,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#fff',
        'background-opacity': 1,
      },
    },
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'dem',
      layout: { visibility: 'visible' },
      paint: {
        'hillshade-exaggeration': 1,
        'hillshade-method': 'igor',
      },
    },
    {
      id: 'contours',
      type: 'line',
      source: 'contours',
      'source-layer': 'contours',
      paint: {
        'line-opacity': 0.5,
        'line-width': ['match', ['get', 'level'], 1, 1, 0.5],
      },
    },
    {
      id: 'symbols',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      filter: ['>', ['get', 'level'], 0],
      paint: {
        'text-halo-color': 'white',
        'text-halo-width': 1,
      },
      layout: {
        'symbol-placement': 'line',
        'text-size': 10,
        'text-field': ['number-format', ['get', 'elevation'], {}],
        'text-font': ['Noto Sans Bold'],
      },
    },
  ],
};



// config
const configStyles = {
  osm: styleOSM,
  mapzen: styleMapzen,
  contour: styleContour,
};
const configDefaultStyle = 'osm';



// map
const map = new Map({
  center: configOrigin,
  container: 'map',
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
const terradrawControl = new MaplibreTerradrawControl({
  modes: ['rectangle', 'select', 'delete-selection', 'delete'],
  open: true,
});
map.addControl(terradrawControl, 'top-left');



// coords
const coordsElem = document.getElementById('coords');
const center = map.getCenter().wrap();
coordsElem.innerHTML = `lon: ${center.lng.toFixed(4)} lat: ${center.lat.toFixed(4)}`;
map.on('mousemove', e => {
  const lngLat = e.lngLat.wrap();
  coordsElem.innerHTML = `lon: ${lngLat.lng.toFixed(4)} lat: ${lngLat.lat.toFixed(4)}`;
});



// protocol
function _heightmap(coords) {
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
  const eles = new Float32Array(x_index.length * y_index.length);
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
function _terradrawFinish(id, terradraw) {
  const feature = terradraw.getSnapshotFeature(id);
  if (feature.properties.mode != 'rectangle') return;
  _heightmap(feature.geometry.coordinates[0]);
}
function _terradrawInit(layer) {
  const terradraw = terradrawControl.getTerraDrawInstance();
  terradraw.on('finish', id => _terradrawFinish(id, terradraw));
  window.gsgt.layer(layer);
}
window.gsgt = new GlassShackGnomeTalk();
window.gsgt.preInit();
_terradrawInit(configDefaultStyle);
window.gsgt.init();



// layers
const layersElem = document.getElementById('layers');
layersElem.addEventListener('change', e => {
  map.removeControl(terradrawControl);
  map.setStyle(configStyles[e.target.value]);
  map.addControl(terradrawControl, 'top-left');
  _terradrawInit(e.target.value);
});



// test
map.on('load', () => _heightmap([[25.441246033, 57.537971414], [25.446557518390684, 57.53890670958709]]));
