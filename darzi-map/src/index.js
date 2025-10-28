import maplibregl from 'maplibre-gl';
import { Map, NavigationControl, GeolocateControl, GlobeControl, TerrainControl, LngLat } from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

import { GlassShackGnomeTalk } from './protocol';



// config
const configTileSize = 256;
const configMaxzoom = 19;
const configMaxzoomMapzen = 15;
const configOrigin = new LngLat(25.4281, 57.5417);



// terrain
const demMapzen = new mlcontour.DemSource({
  url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  encoding: 'terrarium',
  maxzoom: configMaxzoomMapzen,
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
  maxzoom: configMaxzoomMapzen,
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
      maxzoom: configMaxzoom,
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
      maxzoom: configMaxzoomMapzen,
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
      maxzoom: configMaxzoomMapzen,
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
  maxZoom: configMaxzoom,
  zoom: configMaxzoomMapzen,
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
function _terradrawFinish(id, terradraw) {
  const feature = terradraw.getSnapshotFeature(id);
  console.log(feature);
  console.log(map.terrain);
  feature.geometry.coordinates[0].forEach(([lng, lat]) => console.log(lng, lat, map.terrain.getElevationForLngLatZoom(new LngLat(lng, lat), configMaxzoomMapzen)));
  // TODO
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
