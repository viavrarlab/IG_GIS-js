import { Map } from 'maplibre-gl';

async function main() {
  const map = new Map({
    center: [0, 0],
    container: 'map',
    hash: true,
    style: 'https://demotiles.maplibre.org/style.json',
    zoom: 7,
  });
};

main();
