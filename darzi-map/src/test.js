const _CAPACITY = 100;

class _Buffer {
    constructor(capacity) {
        this._array = new Array(capacity);
        this._tail = 0;
        this._length = 0;
        this._total = 0;
    }

    push(value) {
        if (this._length >= this._array.length) {
            this._array[this._tail] = value;
            this._tail = (this._tail + 1) % this._array.length;
        } else {
            this._array[(this._tail + this._length++) % this._array.length] = value;
        }
        this._total++;
    }

    get(index) { return this._array[(this._tail + index) % this._array.length]; }

    head() { return this._length - 1; }

    tail() { return this._tail; }

    length() { return this._length; }

    total() { return this._total; }

    capacity() { return this._array.length; }
}

const _BUFFER = new _Buffer(_CAPACITY);

class _ElBuffer {
    constructor(capacity, factory, container) {
        this._buffer = new _Buffer(capacity);
        this._factory = factory;
        this._container = container;
    }

    next() {
        const el = this._buffer.length() < this._buffer.capacity() ? this._factory() : this._container.removeChild(this._container.firstChild);
        this._buffer.push(el);
        this._container.appendChild(el);
        this._container.scrollTo(0, this._container.scrollHeight);
        return el;
    }

    peek() { return this._buffer.get(this._buffer.head()); }

    container() { return this._container; }
}

function _new_el() { return document.createElement("div"); }

const _EL_BUFFER = new _ElBuffer(_CAPACITY, _new_el, document.getElementById("log"));

function _build_msg(event) {
    const names = [];
    for (var name in event) names.push(name);
    names.sort();
    var msg = "";
    for (var name of names) {
        var value = event[name];
        if (value) {
            var value_name = value["name"];
            if (value_name) value = value_name;
        }
        if (name != value) msg += `${name}=${value};`;
    }
    return msg;
}

function _get_buf_or_msg(event, msg) {
    const type = event.type;
    if (type == "pointermove" || type == "mousemove") {
        var buf_or_msg = _BUFFER.get(_BUFFER.head());
        if (buf_or_msg instanceof _Buffer) buf_or_msg.push(msg);
        else {
            buf_or_msg = new _Buffer(100);
            buf_or_msg.push(msg);
            _BUFFER.push(buf_or_msg);
        }
        // console.log(`[${_BUFFER.length()}/${_BUFFER.capacity()}] pointermove/mousemove`);
        return buf_or_msg;
    } else {
        _BUFFER.push(msg);
        // console.log(`[${_BUFFER.length()}/${_BUFFER.capacity()}] ${type} ${msg}`);
        return msg;
    }
}

function _listener(event) {
    const msg = _build_msg(event);
    const buf_or_msg = _get_buf_or_msg(event, msg);
    if (buf_or_msg instanceof _Buffer) {
        const el = _EL_BUFFER.peek();
        if (el.innerHTML.startsWith("pointermove/mousemove")) el.innerHTML = `pointermove/mousemove ${buf_or_msg.total()} ${buf_or_msg.get(buf_or_msg.head())}`;
        else _EL_BUFFER.next().innerHTML = `pointermove/mousemove ${buf_or_msg.total()} ${buf_or_msg.get(buf_or_msg.head())}`;
    } else _EL_BUFFER.next().innerHTML = `${event.type} ${msg}`;
}

const _events = [
    "pointerover",
    "pointerenter",
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointercancel",
    "pointerout",
    "pointerleave",
    "click",
    "dblclick",
    "mousedown",
    "mouseup",
    "mouseover",
    "mouseout",
    "mousemove",
    "drag",
    "dragstart",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "drop",
    "mousewheel",
    "scroll",
    "contextmenu",
];

export function test(map, _heightmap) {
    // map.on('load', () => _heightmap([[25.4412, 57.5379], [25.4465, 57.5389]], false));
    // map.on('load', () => _heightmap([[25.4382, 57.5349], [25.4465, 57.5389]], false));
    // map.on('load', () => _heightmap([[25.4280, 57.5410], [25.4290, 57.5420]], false));
    _EL_BUFFER.container().parentElement.style.display = "block";
    for (var event_name of _events) document.addEventListener(event_name, _listener);
}
