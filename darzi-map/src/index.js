import { Map, NavigationControl, GeolocateControl } from 'maplibre-gl';
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
