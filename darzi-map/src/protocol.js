export class GlassShackGnomeTalk {
    constructor() { this._init = false; }

    _send(msg) { console.log(`GSGT: ${msg}`); }

    init() {
        if (this._init) return;
        this._init = true;
        this._send('init');
    }
}
