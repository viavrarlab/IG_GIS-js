export class GlassShackGnomeTalk {
    _ORIGIN = location.origin + (location.pathname[location.pathname.length - 1] == "/" ? location.pathname.slice(0, location.pathname.length - 1) : location.pathname);
    _QUERY = location.search + location.hash

    _chunk_size = 1 << 13;
    _chunk_timeout = 50;
    _queue = [];
    _msg = undefined;
    _chunks = undefined;
    _chunk = undefined;
    _mouse_queue = [];
    _mouse_args = undefined;
    _mouse_target = undefined;

    constructor() { }

    set_chunk_size(chunk_size) { this._chunk_size = chunk_size; }

    set_chunk_timeout(chunk_timeout) { this._chunk_timeout = chunk_timeout; }

    _mouse_event(type, x, y, button = -1, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false, clickMove = true, clickPreamble = true, movePreamble = true, init = true, target = undefined, relatedTarget = undefined) {
        const el = document.elementFromPoint(x, y);
        if (!el) {
            this.error(`No element at x=${x} and y=${y}!`);
            if (init) this._mouse_event_init();
            return;
        }
        if (type == "click" || type == "dblclick") {
            if (clickMove) {
                this._mouse_event("pointermove", x, y, -1, false, false, false, false, false, false, movePreamble, false);
                this._mouse_event("mousemove", x, y, -1, false, false, false, false, false, false, movePreamble, false);
                return setTimeout(() => { this._mouse_event(type, x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, clickPreamble, movePreamble, init); }, this._chunk_timeout);
            }
            if (clickPreamble) {
                this._mouse_event("pointerdown", x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, false, movePreamble, false);
                this._mouse_event("mousedown", x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, false, movePreamble, false);
                return setTimeout(() => {
                    this._mouse_event("pointerup", x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, false, movePreamble, false);
                    this._mouse_event("mouseup", x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, false, movePreamble, false);
                    this._mouse_event(type, x, y, button, ctrlKey, shiftKey, altKey, metaKey, false, false, movePreamble, init);
                }, this._chunk_timeout);
            }
        }
        if ((type == "pointermove" || type == "mousemove") && el != this._mouse_target) {
            const pointer = type == "pointermove";
            if (movePreamble) {
                if (this._mouse_target) this._mouse_event(pointer ? "pointerout" : "mouseout", x, y, -1, false, false, false, false, false, false, false, false, this._mouse_target, el);
                this._mouse_event(pointer ? "pointerover" : "mouseover", x, y, -1, false, false, false, false, false, false, false, false, el, this._mouse_target);
            }
            if (!pointer) this._mouse_target = el;
        }
        const e = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: { click: 1, dblclick: 2, mousedown: 1, mouseup: 1 }[type] || 0,
            view: window,
            sourceCapabilities: null,
            screenX: x,
            screenY: y,
            clientX: x,
            clientY: y,
            ctrlKey: ctrlKey,
            shiftKey: shiftKey,
            altKey: altKey,
            metaKey: metaKey,
            button: button,
            buttons: { 0: 1, 1: 4, 2: 2 }[button] || 0,
            relatedTarget: relatedTarget,
            region: null,
        });
        e.isPrimary = true;
        (target || el).dispatchEvent(e);
        if (init) this._mouse_event_init();
    }

    _mouse_event_init() {
        this._mouse_args = this._mouse_queue.shift();
        if (this._mouse_args) this._mouse_event(...this._mouse_args);
    }

    mouse_event(type, x, y, button = -1, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false, clickMove = true, clickPreamble = true, movePreamble = true) {
        this._mouse_queue.push(arguments);
        if (!this._mouse_args) this._mouse_event_init();
    }

    _send_init() {
        this._msg = this._queue.shift();
        if (!this._msg) return window.history.replaceState(null, null, this._ORIGIN + this._QUERY);
        this._chunks = Math.ceil(this._msg.length / this._chunk_size) - 1;
        this._chunk = 0;
        setTimeout(this._send_chunk.bind(this), this._chunk_timeout);
    }

    _send_chunk() {
        window.history.replaceState(null, null, `${this._ORIGIN}/GSGT/${this._chunk}/${this._chunks}/${this._msg.slice(this._chunk * this._chunk_size, this._chunk * this._chunk_size + this._chunk_size)}`);
        if (this._chunk < this._chunks) {
            this._chunk++;
            setTimeout(this._send_chunk.bind(this), this._chunk_timeout);
        } else if (this._queue.length) {
            this._send_init();
        } else {
            this._msg = undefined;
            this._chunks = undefined;
            this._chunk = undefined;
            window.history.replaceState(null, null, this._ORIGIN + this._QUERY);
        }
    }

    _send(msg) {
        // console.log(msg);
        this._queue.push(msg);
        if (!this._msg) this._send_init();
    }

    preInit() { this._send("preInit"); }

    init() { this._send("init"); }

    layer(layer) { this._send(`layer ${layer}`); }

    heightmap(lng_min, lng_max, lat_min, lat_max, x, y, array) { this._send(`heightmap ${lng_min} ${lng_max} ${lat_min} ${lat_max} ${x} ${y} ${array.map(h => Math.round(h * 100)).join()}`); }

    error(error) { this._send(`error ${error}`); return error; }
}
