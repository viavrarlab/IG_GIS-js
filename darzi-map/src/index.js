import maplibregl from 'maplibre-gl';
import { Map, NavigationControl, GeolocateControl } from 'maplibre-gl';
import mlcontour from 'maplibre-contour';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';

import { GlassShackGnomeTalk } from './protocol';



// map
const styleOSM = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 19,
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
  sources: {
    mapzen: {
      type: 'raster',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; Mapzen',
      maxzoom: 15,
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
const demMapzen = new mlcontour.DemSource({
  url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  encoding: 'terrarium',
  maxzoom: 15,
  worker: true,
  cacheSize: 1000,
});
demMapzen.setupMaplibre(maplibregl);
const styleContour = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    hillshade: {
      type: 'raster-dem',
      tiles: [demMapzen.sharedDemProtocolUrl],
      tileSize: 256,
      attribution: '&copy; Mapzen',
      maxzoom: 15,
    },
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
      maxzoom: 15,
    },
  },
  layers: [
    {
      id: 'hillshade',
      type: 'hillshade',
      source: 'hillshade',
      layout: { visibility: 'visible' },
      paint: { 'hillshade-exaggeration': 0.25 },
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
const map = new Map({
  center: [25.4281, 57.5417],
  container: 'map',
  hash: true,
  style: styleOSM,
  maxZoom: 19,
  zoom: 15,
});



// layers
const layers = {
  osm: styleOSM,
  mapzen: styleMapzen,
  contour: styleContour,
};
const layersElem = document.getElementById('layers');
layersElem.addEventListener('change', e => map.setStyle(layers[e.target.value]));



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
window.gsgt = new GlassShackGnomeTalk();
const terradraw = terradrawControl.getTerraDrawInstance();
terradraw.on('finish', id => {
  const feature = terradraw.getSnapshotFeature(id);
  console.log(feature);
  // TODO
});
window.gsgt.init();
