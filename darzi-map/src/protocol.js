export class GlassShackGnomeTalk {
    _chunk_size = 1 << 13;
    _chunk_timeout = 50;
    _queue = [];
    _msg = undefined;
    _chunks = undefined;
    _chunk = undefined;

    constructor() { }

    set_chunk_size(chunk_size) { this._chunk_size = chunk_size; }

    set_chunk_timeout(chunk_timeout) { this._chunk_timeout = chunk_timeout; }

    _send_init() {
        this._msg = this._queue.shift();
        if (!this._msg) return;
        this._chunks = Math.ceil(this._msg.length / this._chunk_size) - 1;
        this._chunk = 0;
        setTimeout(this._send_chunk.bind(this), this._chunk_timeout);
    }

    _send_chunk() {
        window.history.replaceState(null, null, `${window.location.origin}/GSGT/${this._chunk}/${this._chunks}/${this._msg.slice(this._chunk * this._chunk_size, this._chunk * this._chunk_size + this._chunk_size)}`);
        if (this._chunk < this._chunks) {
            this._chunk++;
            setTimeout(this._send_chunk.bind(this), this._chunk_timeout);
        } else if (this._queue) {
            this._send_init();
        } else {
            this._msg = undefined;
            this._chunks = undefined;
            this._chunk = undefined;
        }
    }

    _send(msg) {
        this._queue.push(msg);
        if (!this._msg) this._send_init();
    }

    preInit() { this._send('preInit'); }

    init() { this._send('init'); }

    layer(layer) { this._send(`layer ${layer}`); }

    heightmap(lng_min, lng_max, lat_min, lat_max, x, y, array) { this._send(`heightmap ${lng_min} ${lng_max} ${lat_min} ${lat_max} ${x} ${y} ${array.map(h => Math.round(h * 100)).join()}`); }

    error(error) { this._send(`error ${error}`); return error; }
}
