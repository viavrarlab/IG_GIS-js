export class GlassShackGnomeTalk {
    constructor() { }

    _send(msg) { console.log(`GSGT: ${msg}`); }

    preInit() { this._send('preInit'); }

    init() { this._send('init'); }

    layer(layer) { this._send(`layer ${layer}`); }

    heightmap(lng_min, lng_max, lat_min, lat_max, x, y, array) { this._send(`heightmap ${lng_min} ${lng_max} ${lat_min} ${lat_max} ${x} ${y} ${new Uint8Array(array.buffer).toBase64()}`); }
}
