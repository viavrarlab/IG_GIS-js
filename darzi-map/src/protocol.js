export class GlassShackGnomeTalk {
    constructor() { }

    _send(msg) { console.log(`GSGT: ${msg}`); }

    preInit() { this._send('preInit'); }

    init() { this._send('init'); }

    layer(layer) { this._send(`layer ${layer}`); }
}
