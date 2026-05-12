const _CAPACITY = 1000;

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
        el.style.background = null;
        return el;
    }

    peek() {
        this._container.scrollTo(0, this._container.scrollHeight);
        return this._buffer.get(this._buffer.head());
    }

    container() { return this._container; }
}

function _new_el() {
    const el = document.createElement("div");
    el.style = "padding: 5px;"
    return el;
}

const _EL_BUFFER = new _ElBuffer(_CAPACITY, _new_el, document.getElementById("log"));

function _event_build_msg(event) {
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

function _event_get_buf_or_msg(event, msg) {
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

const _MOVE_MSG = "<b>POINTERMOVE / MOUSEMOVE"

function _event_listener(event) {
    // see https://stackoverflow.com/questions/36767196/check-if-mouse-is-inside-div
    if (_EL_BUFFER.container().matches(":hover")) return;
    const msg = _event_build_msg(event);
    const buf_or_msg = _event_get_buf_or_msg(event, msg);
    if (buf_or_msg instanceof _Buffer) {
        const el = _EL_BUFFER.peek();
        if (el.innerHTML.startsWith(_MOVE_MSG)) el.innerHTML = `${_MOVE_MSG} ${buf_or_msg.total()}</b> ${buf_or_msg.get(buf_or_msg.head())}`;
        else _EL_BUFFER.next().innerHTML = `${_MOVE_MSG} ${buf_or_msg.total()}</b> ${buf_or_msg.get(buf_or_msg.head())}`;
    } else _EL_BUFFER.next().innerHTML = `<b>${event.type.toUpperCase()}</b> ${msg}`;
}

const _COLORS = {
    "trace": "#BFB",
    "log": "#BBB",
    "info": "#BBF",
    "warn": "#FFB",
    "error": "#FBB",
}

function _console_listener(type, ...args) {
    const msg = args.map(arg => arg && arg.toString()).join(" ");
    _BUFFER.push(msg);
    const el = _EL_BUFFER.next();
    el.innerHTML = `<b>${type.toUpperCase()}</b> ${msg}`;
    el.style.background = _COLORS[type];
}

const _EVENTS = [
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

export function log() {
    _EL_BUFFER.container().parentElement.style.display = "block";
    // see https://snippets.bentasker.co.uk/posts/javascript/intercept-console-messages-in-javascript.html
    const trace = console.trace;
    console.trace = function () {
        trace.apply(console, arguments);
        _console_listener("trace", ...arguments);
    };
    const log = console.log;
    console.log = function () {
        log.apply(console, arguments);
        _console_listener("log", ...arguments);
    };
    const info = console.info;
    console.info = function () {
        info.apply(console, arguments);
        _console_listener("info", ...arguments);
    };
    const warn = console.warn;
    console.warn = function () {
        warn.apply(console, arguments);
        _console_listener("warn", ...arguments);
    };
    const error = console.error;
    console.error = function () {
        error.apply(console, arguments);
        _console_listener("error", ...arguments);
    };
    for (var event_name of _EVENTS) document.addEventListener(event_name, _event_listener);
}

export function test(map) {
    map.on("load", () => {
        window.gsgt.mouse_event("click", 30, 30, 0);
        window.gsgt.mouse_event("click", 100, 100, 0);
        window.gsgt.mouse_event("click", 200, 200, 0);
    });
}
