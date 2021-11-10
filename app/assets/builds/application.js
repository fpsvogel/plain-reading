(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[Object.keys(fn2)[0]])(fn2 = 0)), res;
  };
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../../node_modules/@rails/actioncable/src/adapters.js
  var adapters_default;
  var init_adapters = __esm({
    "../../node_modules/@rails/actioncable/src/adapters.js"() {
      adapters_default = {
        logger: self.console,
        WebSocket: self.WebSocket
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/logger.js
  var logger_default;
  var init_logger = __esm({
    "../../node_modules/@rails/actioncable/src/logger.js"() {
      init_adapters();
      logger_default = {
        log(...messages) {
          if (this.enabled) {
            messages.push(Date.now());
            adapters_default.logger.log("[ActionCable]", ...messages);
          }
        }
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/connection_monitor.js
  var now, secondsSince, clamp, ConnectionMonitor, connection_monitor_default;
  var init_connection_monitor = __esm({
    "../../node_modules/@rails/actioncable/src/connection_monitor.js"() {
      init_logger();
      now = () => new Date().getTime();
      secondsSince = (time) => (now() - time) / 1e3;
      clamp = (number, min2, max2) => Math.max(min2, Math.min(max2, number));
      ConnectionMonitor = class {
        constructor(connection) {
          this.visibilityDidChange = this.visibilityDidChange.bind(this);
          this.connection = connection;
          this.reconnectAttempts = 0;
        }
        start() {
          if (!this.isRunning()) {
            this.startedAt = now();
            delete this.stoppedAt;
            this.startPolling();
            addEventListener("visibilitychange", this.visibilityDidChange);
            logger_default.log(`ConnectionMonitor started. pollInterval = ${this.getPollInterval()} ms`);
          }
        }
        stop() {
          if (this.isRunning()) {
            this.stoppedAt = now();
            this.stopPolling();
            removeEventListener("visibilitychange", this.visibilityDidChange);
            logger_default.log("ConnectionMonitor stopped");
          }
        }
        isRunning() {
          return this.startedAt && !this.stoppedAt;
        }
        recordPing() {
          this.pingedAt = now();
        }
        recordConnect() {
          this.reconnectAttempts = 0;
          this.recordPing();
          delete this.disconnectedAt;
          logger_default.log("ConnectionMonitor recorded connect");
        }
        recordDisconnect() {
          this.disconnectedAt = now();
          logger_default.log("ConnectionMonitor recorded disconnect");
        }
        startPolling() {
          this.stopPolling();
          this.poll();
        }
        stopPolling() {
          clearTimeout(this.pollTimeout);
        }
        poll() {
          this.pollTimeout = setTimeout(() => {
            this.reconnectIfStale();
            this.poll();
          }, this.getPollInterval());
        }
        getPollInterval() {
          const { min: min2, max: max2, multiplier } = this.constructor.pollInterval;
          const interval = multiplier * Math.log(this.reconnectAttempts + 1);
          return Math.round(clamp(interval, min2, max2) * 1e3);
        }
        reconnectIfStale() {
          if (this.connectionIsStale()) {
            logger_default.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, pollInterval = ${this.getPollInterval()} ms, time disconnected = ${secondsSince(this.disconnectedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
            this.reconnectAttempts++;
            if (this.disconnectedRecently()) {
              logger_default.log("ConnectionMonitor skipping reopening recent disconnect");
            } else {
              logger_default.log("ConnectionMonitor reopening");
              this.connection.reopen();
            }
          }
        }
        connectionIsStale() {
          return secondsSince(this.pingedAt ? this.pingedAt : this.startedAt) > this.constructor.staleThreshold;
        }
        disconnectedRecently() {
          return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
        }
        visibilityDidChange() {
          if (document.visibilityState === "visible") {
            setTimeout(() => {
              if (this.connectionIsStale() || !this.connection.isOpen()) {
                logger_default.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
                this.connection.reopen();
              }
            }, 200);
          }
        }
      };
      ConnectionMonitor.pollInterval = {
        min: 3,
        max: 30,
        multiplier: 5
      };
      ConnectionMonitor.staleThreshold = 6;
      connection_monitor_default = ConnectionMonitor;
    }
  });

  // ../../node_modules/@rails/actioncable/src/internal.js
  var internal_default;
  var init_internal = __esm({
    "../../node_modules/@rails/actioncable/src/internal.js"() {
      internal_default = {
        "message_types": {
          "welcome": "welcome",
          "disconnect": "disconnect",
          "ping": "ping",
          "confirmation": "confirm_subscription",
          "rejection": "reject_subscription"
        },
        "disconnect_reasons": {
          "unauthorized": "unauthorized",
          "invalid_request": "invalid_request",
          "server_restart": "server_restart"
        },
        "default_mount_path": "/cable",
        "protocols": [
          "actioncable-v1-json",
          "actioncable-unsupported"
        ]
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/connection.js
  var message_types, protocols, supportedProtocols, indexOf, Connection, connection_default;
  var init_connection = __esm({
    "../../node_modules/@rails/actioncable/src/connection.js"() {
      init_adapters();
      init_connection_monitor();
      init_internal();
      init_logger();
      ({ message_types, protocols } = internal_default);
      supportedProtocols = protocols.slice(0, protocols.length - 1);
      indexOf = [].indexOf;
      Connection = class {
        constructor(consumer2) {
          this.open = this.open.bind(this);
          this.consumer = consumer2;
          this.subscriptions = this.consumer.subscriptions;
          this.monitor = new connection_monitor_default(this);
          this.disconnected = true;
        }
        send(data) {
          if (this.isOpen()) {
            this.webSocket.send(JSON.stringify(data));
            return true;
          } else {
            return false;
          }
        }
        open() {
          if (this.isActive()) {
            logger_default.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
            return false;
          } else {
            logger_default.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${protocols}`);
            if (this.webSocket) {
              this.uninstallEventHandlers();
            }
            this.webSocket = new adapters_default.WebSocket(this.consumer.url, protocols);
            this.installEventHandlers();
            this.monitor.start();
            return true;
          }
        }
        close({ allowReconnect } = { allowReconnect: true }) {
          if (!allowReconnect) {
            this.monitor.stop();
          }
          if (this.isActive()) {
            return this.webSocket.close();
          }
        }
        reopen() {
          logger_default.log(`Reopening WebSocket, current state is ${this.getState()}`);
          if (this.isActive()) {
            try {
              return this.close();
            } catch (error2) {
              logger_default.log("Failed to reopen WebSocket", error2);
            } finally {
              logger_default.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
              setTimeout(this.open, this.constructor.reopenDelay);
            }
          } else {
            return this.open();
          }
        }
        getProtocol() {
          if (this.webSocket) {
            return this.webSocket.protocol;
          }
        }
        isOpen() {
          return this.isState("open");
        }
        isActive() {
          return this.isState("open", "connecting");
        }
        isProtocolSupported() {
          return indexOf.call(supportedProtocols, this.getProtocol()) >= 0;
        }
        isState(...states) {
          return indexOf.call(states, this.getState()) >= 0;
        }
        getState() {
          if (this.webSocket) {
            for (let state in adapters_default.WebSocket) {
              if (adapters_default.WebSocket[state] === this.webSocket.readyState) {
                return state.toLowerCase();
              }
            }
          }
          return null;
        }
        installEventHandlers() {
          for (let eventName in this.events) {
            const handler = this.events[eventName].bind(this);
            this.webSocket[`on${eventName}`] = handler;
          }
        }
        uninstallEventHandlers() {
          for (let eventName in this.events) {
            this.webSocket[`on${eventName}`] = function() {
            };
          }
        }
      };
      Connection.reopenDelay = 500;
      Connection.prototype.events = {
        message(event) {
          if (!this.isProtocolSupported()) {
            return;
          }
          const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
          switch (type) {
            case message_types.welcome:
              this.monitor.recordConnect();
              return this.subscriptions.reload();
            case message_types.disconnect:
              logger_default.log(`Disconnecting. Reason: ${reason}`);
              return this.close({ allowReconnect: reconnect });
            case message_types.ping:
              return this.monitor.recordPing();
            case message_types.confirmation:
              return this.subscriptions.notify(identifier, "connected");
            case message_types.rejection:
              return this.subscriptions.reject(identifier);
            default:
              return this.subscriptions.notify(identifier, "received", message);
          }
        },
        open() {
          logger_default.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
          this.disconnected = false;
          if (!this.isProtocolSupported()) {
            logger_default.log("Protocol is unsupported. Stopping monitor and disconnecting.");
            return this.close({ allowReconnect: false });
          }
        },
        close(event) {
          logger_default.log("WebSocket onclose event");
          if (this.disconnected) {
            return;
          }
          this.disconnected = true;
          this.monitor.recordDisconnect();
          return this.subscriptions.notifyAll("disconnected", { willAttemptReconnect: this.monitor.isRunning() });
        },
        error() {
          logger_default.log("WebSocket onerror event");
        }
      };
      connection_default = Connection;
    }
  });

  // ../../node_modules/@rails/actioncable/src/subscription.js
  var extend, Subscription;
  var init_subscription = __esm({
    "../../node_modules/@rails/actioncable/src/subscription.js"() {
      extend = function(object, properties) {
        if (properties != null) {
          for (let key in properties) {
            const value = properties[key];
            object[key] = value;
          }
        }
        return object;
      };
      Subscription = class {
        constructor(consumer2, params = {}, mixin) {
          this.consumer = consumer2;
          this.identifier = JSON.stringify(params);
          extend(this, mixin);
        }
        perform(action, data = {}) {
          data.action = action;
          return this.send(data);
        }
        send(data) {
          return this.consumer.send({ command: "message", identifier: this.identifier, data: JSON.stringify(data) });
        }
        unsubscribe() {
          return this.consumer.subscriptions.remove(this);
        }
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/subscriptions.js
  var Subscriptions;
  var init_subscriptions = __esm({
    "../../node_modules/@rails/actioncable/src/subscriptions.js"() {
      init_subscription();
      Subscriptions = class {
        constructor(consumer2) {
          this.consumer = consumer2;
          this.subscriptions = [];
        }
        create(channelName, mixin) {
          const channel = channelName;
          const params = typeof channel === "object" ? channel : { channel };
          const subscription = new Subscription(this.consumer, params, mixin);
          return this.add(subscription);
        }
        add(subscription) {
          this.subscriptions.push(subscription);
          this.consumer.ensureActiveConnection();
          this.notify(subscription, "initialized");
          this.sendCommand(subscription, "subscribe");
          return subscription;
        }
        remove(subscription) {
          this.forget(subscription);
          if (!this.findAll(subscription.identifier).length) {
            this.sendCommand(subscription, "unsubscribe");
          }
          return subscription;
        }
        reject(identifier) {
          return this.findAll(identifier).map((subscription) => {
            this.forget(subscription);
            this.notify(subscription, "rejected");
            return subscription;
          });
        }
        forget(subscription) {
          this.subscriptions = this.subscriptions.filter((s5) => s5 !== subscription);
          return subscription;
        }
        findAll(identifier) {
          return this.subscriptions.filter((s5) => s5.identifier === identifier);
        }
        reload() {
          return this.subscriptions.map((subscription) => this.sendCommand(subscription, "subscribe"));
        }
        notifyAll(callbackName, ...args) {
          return this.subscriptions.map((subscription) => this.notify(subscription, callbackName, ...args));
        }
        notify(subscription, callbackName, ...args) {
          let subscriptions;
          if (typeof subscription === "string") {
            subscriptions = this.findAll(subscription);
          } else {
            subscriptions = [subscription];
          }
          return subscriptions.map((subscription2) => typeof subscription2[callbackName] === "function" ? subscription2[callbackName](...args) : void 0);
        }
        sendCommand(subscription, command) {
          const { identifier } = subscription;
          return this.consumer.send({ command, identifier });
        }
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/consumer.js
  function createWebSocketURL(url) {
    if (typeof url === "function") {
      url = url();
    }
    if (url && !/^wss?:/i.test(url)) {
      const a2 = document.createElement("a");
      a2.href = url;
      a2.href = a2.href;
      a2.protocol = a2.protocol.replace("http", "ws");
      return a2.href;
    } else {
      return url;
    }
  }
  var Consumer;
  var init_consumer = __esm({
    "../../node_modules/@rails/actioncable/src/consumer.js"() {
      init_connection();
      init_subscriptions();
      Consumer = class {
        constructor(url) {
          this._url = url;
          this.subscriptions = new Subscriptions(this);
          this.connection = new connection_default(this);
        }
        get url() {
          return createWebSocketURL(this._url);
        }
        send(data) {
          return this.connection.send(data);
        }
        connect() {
          return this.connection.open();
        }
        disconnect() {
          return this.connection.close({ allowReconnect: false });
        }
        ensureActiveConnection() {
          if (!this.connection.isActive()) {
            return this.connection.open();
          }
        }
      };
    }
  });

  // ../../node_modules/@rails/actioncable/src/index.js
  var src_exports = {};
  __export(src_exports, {
    Connection: () => connection_default,
    ConnectionMonitor: () => connection_monitor_default,
    Consumer: () => Consumer,
    INTERNAL: () => internal_default,
    Subscription: () => Subscription,
    Subscriptions: () => Subscriptions,
    adapters: () => adapters_default,
    createConsumer: () => createConsumer,
    createWebSocketURL: () => createWebSocketURL,
    getConfig: () => getConfig,
    logger: () => logger_default
  });
  function createConsumer(url = getConfig("url") || internal_default.default_mount_path) {
    return new Consumer(url);
  }
  function getConfig(name) {
    const element = document.head.querySelector(`meta[name='action-cable-${name}']`);
    if (element) {
      return element.getAttribute("content");
    }
  }
  var init_src = __esm({
    "../../node_modules/@rails/actioncable/src/index.js"() {
      init_connection();
      init_connection_monitor();
      init_consumer();
      init_internal();
      init_subscription();
      init_subscriptions();
      init_adapters();
      init_logger();
    }
  });

  // ../../node_modules/@hotwired/turbo/dist/turbo.es2017-esm.js
  (function() {
    if (window.Reflect === void 0 || window.customElements === void 0 || window.customElements.polyfillWrapFlushCallback) {
      return;
    }
    const BuiltInHTMLElement = HTMLElement;
    const wrapperForTheName = {
      "HTMLElement": function HTMLElement2() {
        return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
      }
    };
    window.HTMLElement = wrapperForTheName["HTMLElement"];
    HTMLElement.prototype = BuiltInHTMLElement.prototype;
    HTMLElement.prototype.constructor = HTMLElement;
    Object.setPrototypeOf(HTMLElement, BuiltInHTMLElement);
  })();
  var submittersByForm = new WeakMap();
  function findSubmitterFromClickTarget(target) {
    const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
    const candidate = element ? element.closest("input, button") : null;
    return (candidate === null || candidate === void 0 ? void 0 : candidate.type) == "submit" ? candidate : null;
  }
  function clickCaptured(event) {
    const submitter = findSubmitterFromClickTarget(event.target);
    if (submitter && submitter.form) {
      submittersByForm.set(submitter.form, submitter);
    }
  }
  (function() {
    if ("submitter" in Event.prototype)
      return;
    let prototype;
    if ("SubmitEvent" in window && /Apple Computer/.test(navigator.vendor)) {
      prototype = window.SubmitEvent.prototype;
    } else if ("SubmitEvent" in window) {
      return;
    } else {
      prototype = window.Event.prototype;
    }
    addEventListener("click", clickCaptured, true);
    Object.defineProperty(prototype, "submitter", {
      get() {
        if (this.type == "submit" && this.target instanceof HTMLFormElement) {
          return submittersByForm.get(this.target);
        }
      }
    });
  })();
  var FrameLoadingStyle;
  (function(FrameLoadingStyle2) {
    FrameLoadingStyle2["eager"] = "eager";
    FrameLoadingStyle2["lazy"] = "lazy";
  })(FrameLoadingStyle || (FrameLoadingStyle = {}));
  var FrameElement = class extends HTMLElement {
    constructor() {
      super();
      this.loaded = Promise.resolve();
      this.delegate = new FrameElement.delegateConstructor(this);
    }
    static get observedAttributes() {
      return ["disabled", "loading", "src"];
    }
    connectedCallback() {
      this.delegate.connect();
    }
    disconnectedCallback() {
      this.delegate.disconnect();
    }
    reload() {
      const { src } = this;
      this.src = null;
      this.src = src;
    }
    attributeChangedCallback(name) {
      if (name == "loading") {
        this.delegate.loadingStyleChanged();
      } else if (name == "src") {
        this.delegate.sourceURLChanged();
      } else {
        this.delegate.disabledChanged();
      }
    }
    get src() {
      return this.getAttribute("src");
    }
    set src(value) {
      if (value) {
        this.setAttribute("src", value);
      } else {
        this.removeAttribute("src");
      }
    }
    get loading() {
      return frameLoadingStyleFromString(this.getAttribute("loading") || "");
    }
    set loading(value) {
      if (value) {
        this.setAttribute("loading", value);
      } else {
        this.removeAttribute("loading");
      }
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(value) {
      if (value) {
        this.setAttribute("disabled", "");
      } else {
        this.removeAttribute("disabled");
      }
    }
    get autoscroll() {
      return this.hasAttribute("autoscroll");
    }
    set autoscroll(value) {
      if (value) {
        this.setAttribute("autoscroll", "");
      } else {
        this.removeAttribute("autoscroll");
      }
    }
    get complete() {
      return !this.delegate.isLoading;
    }
    get isActive() {
      return this.ownerDocument === document && !this.isPreview;
    }
    get isPreview() {
      var _a, _b;
      return (_b = (_a = this.ownerDocument) === null || _a === void 0 ? void 0 : _a.documentElement) === null || _b === void 0 ? void 0 : _b.hasAttribute("data-turbo-preview");
    }
  };
  function frameLoadingStyleFromString(style2) {
    switch (style2.toLowerCase()) {
      case "lazy":
        return FrameLoadingStyle.lazy;
      default:
        return FrameLoadingStyle.eager;
    }
  }
  function expandURL(locatable) {
    return new URL(locatable.toString(), document.baseURI);
  }
  function getAnchor(url) {
    let anchorMatch;
    if (url.hash) {
      return url.hash.slice(1);
    } else if (anchorMatch = url.href.match(/#(.*)$/)) {
      return anchorMatch[1];
    }
  }
  function getExtension(url) {
    return (getLastPathComponent(url).match(/\.[^.]*$/) || [])[0] || "";
  }
  function isHTML(url) {
    return !!getExtension(url).match(/^(?:|\.(?:htm|html|xhtml))$/);
  }
  function isPrefixedBy(baseURL, url) {
    const prefix = getPrefix(url);
    return baseURL.href === expandURL(prefix).href || baseURL.href.startsWith(prefix);
  }
  function getRequestURL(url) {
    const anchor = getAnchor(url);
    return anchor != null ? url.href.slice(0, -(anchor.length + 1)) : url.href;
  }
  function toCacheKey(url) {
    return getRequestURL(url);
  }
  function urlsAreEqual(left2, right2) {
    return expandURL(left2).href == expandURL(right2).href;
  }
  function getPathComponents(url) {
    return url.pathname.split("/").slice(1);
  }
  function getLastPathComponent(url) {
    return getPathComponents(url).slice(-1)[0];
  }
  function getPrefix(url) {
    return addTrailingSlash(url.origin + url.pathname);
  }
  function addTrailingSlash(value) {
    return value.endsWith("/") ? value : value + "/";
  }
  var FetchResponse = class {
    constructor(response) {
      this.response = response;
    }
    get succeeded() {
      return this.response.ok;
    }
    get failed() {
      return !this.succeeded;
    }
    get clientError() {
      return this.statusCode >= 400 && this.statusCode <= 499;
    }
    get serverError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
    get redirected() {
      return this.response.redirected;
    }
    get location() {
      return expandURL(this.response.url);
    }
    get isHTML() {
      return this.contentType && this.contentType.match(/^(?:text\/([^\s;,]+\b)?html|application\/xhtml\+xml)\b/);
    }
    get statusCode() {
      return this.response.status;
    }
    get contentType() {
      return this.header("Content-Type");
    }
    get responseText() {
      return this.response.clone().text();
    }
    get responseHTML() {
      if (this.isHTML) {
        return this.response.clone().text();
      } else {
        return Promise.resolve(void 0);
      }
    }
    header(name) {
      return this.response.headers.get(name);
    }
  };
  function dispatch(eventName, { target, cancelable, detail } = {}) {
    const event = new CustomEvent(eventName, { cancelable, bubbles: true, detail });
    if (target && target.isConnected) {
      target.dispatchEvent(event);
    } else {
      document.documentElement.dispatchEvent(event);
    }
    return event;
  }
  function nextAnimationFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  function nextEventLoopTick() {
    return new Promise((resolve) => setTimeout(() => resolve(), 0));
  }
  function nextMicrotask() {
    return Promise.resolve();
  }
  function parseHTMLDocument(html = "") {
    return new DOMParser().parseFromString(html, "text/html");
  }
  function unindent(strings, ...values) {
    const lines = interpolate(strings, values).replace(/^\n/, "").split("\n");
    const match = lines[0].match(/^\s+/);
    const indent = match ? match[0].length : 0;
    return lines.map((line) => line.slice(indent)).join("\n");
  }
  function interpolate(strings, values) {
    return strings.reduce((result, string, i4) => {
      const value = values[i4] == void 0 ? "" : values[i4];
      return result + string + value;
    }, "");
  }
  function uuid() {
    return Array.apply(null, { length: 36 }).map((_2, i4) => {
      if (i4 == 8 || i4 == 13 || i4 == 18 || i4 == 23) {
        return "-";
      } else if (i4 == 14) {
        return "4";
      } else if (i4 == 19) {
        return (Math.floor(Math.random() * 4) + 8).toString(16);
      } else {
        return Math.floor(Math.random() * 15).toString(16);
      }
    }).join("");
  }
  var FetchMethod;
  (function(FetchMethod2) {
    FetchMethod2[FetchMethod2["get"] = 0] = "get";
    FetchMethod2[FetchMethod2["post"] = 1] = "post";
    FetchMethod2[FetchMethod2["put"] = 2] = "put";
    FetchMethod2[FetchMethod2["patch"] = 3] = "patch";
    FetchMethod2[FetchMethod2["delete"] = 4] = "delete";
  })(FetchMethod || (FetchMethod = {}));
  function fetchMethodFromString(method) {
    switch (method.toLowerCase()) {
      case "get":
        return FetchMethod.get;
      case "post":
        return FetchMethod.post;
      case "put":
        return FetchMethod.put;
      case "patch":
        return FetchMethod.patch;
      case "delete":
        return FetchMethod.delete;
    }
  }
  var FetchRequest = class {
    constructor(delegate, method, location2, body = new URLSearchParams(), target = null) {
      this.abortController = new AbortController();
      this.resolveRequestPromise = (value) => {
      };
      this.delegate = delegate;
      this.method = method;
      this.headers = this.defaultHeaders;
      if (this.isIdempotent) {
        this.url = mergeFormDataEntries(location2, [...body.entries()]);
      } else {
        this.body = body;
        this.url = location2;
      }
      this.target = target;
    }
    get location() {
      return this.url;
    }
    get params() {
      return this.url.searchParams;
    }
    get entries() {
      return this.body ? Array.from(this.body.entries()) : [];
    }
    cancel() {
      this.abortController.abort();
    }
    async perform() {
      var _a, _b;
      const { fetchOptions } = this;
      (_b = (_a = this.delegate).prepareHeadersForRequest) === null || _b === void 0 ? void 0 : _b.call(_a, this.headers, this);
      await this.allowRequestToBeIntercepted(fetchOptions);
      try {
        this.delegate.requestStarted(this);
        const response = await fetch(this.url.href, fetchOptions);
        return await this.receive(response);
      } catch (error2) {
        if (error2.name !== "AbortError") {
          this.delegate.requestErrored(this, error2);
          throw error2;
        }
      } finally {
        this.delegate.requestFinished(this);
      }
    }
    async receive(response) {
      const fetchResponse = new FetchResponse(response);
      const event = dispatch("turbo:before-fetch-response", { cancelable: true, detail: { fetchResponse }, target: this.target });
      if (event.defaultPrevented) {
        this.delegate.requestPreventedHandlingResponse(this, fetchResponse);
      } else if (fetchResponse.succeeded) {
        this.delegate.requestSucceededWithResponse(this, fetchResponse);
      } else {
        this.delegate.requestFailedWithResponse(this, fetchResponse);
      }
      return fetchResponse;
    }
    get fetchOptions() {
      var _a;
      return {
        method: FetchMethod[this.method].toUpperCase(),
        credentials: "same-origin",
        headers: this.headers,
        redirect: "follow",
        body: this.body,
        signal: this.abortSignal,
        referrer: (_a = this.delegate.referrer) === null || _a === void 0 ? void 0 : _a.href
      };
    }
    get defaultHeaders() {
      return {
        "Accept": "text/html, application/xhtml+xml"
      };
    }
    get isIdempotent() {
      return this.method == FetchMethod.get;
    }
    get abortSignal() {
      return this.abortController.signal;
    }
    async allowRequestToBeIntercepted(fetchOptions) {
      const requestInterception = new Promise((resolve) => this.resolveRequestPromise = resolve);
      const event = dispatch("turbo:before-fetch-request", {
        cancelable: true,
        detail: {
          fetchOptions,
          url: this.url.href,
          resume: this.resolveRequestPromise
        },
        target: this.target
      });
      if (event.defaultPrevented)
        await requestInterception;
    }
  };
  function mergeFormDataEntries(url, entries) {
    const currentSearchParams = new URLSearchParams(url.search);
    for (const [name, value] of entries) {
      if (value instanceof File)
        continue;
      if (currentSearchParams.has(name)) {
        currentSearchParams.delete(name);
        url.searchParams.set(name, value);
      } else {
        url.searchParams.append(name, value);
      }
    }
    return url;
  }
  var AppearanceObserver = class {
    constructor(delegate, element) {
      this.started = false;
      this.intersect = (entries) => {
        const lastEntry = entries.slice(-1)[0];
        if (lastEntry === null || lastEntry === void 0 ? void 0 : lastEntry.isIntersecting) {
          this.delegate.elementAppearedInViewport(this.element);
        }
      };
      this.delegate = delegate;
      this.element = element;
      this.intersectionObserver = new IntersectionObserver(this.intersect);
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.intersectionObserver.observe(this.element);
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.intersectionObserver.unobserve(this.element);
      }
    }
  };
  var StreamMessage = class {
    constructor(html) {
      this.templateElement = document.createElement("template");
      this.templateElement.innerHTML = html;
    }
    static wrap(message) {
      if (typeof message == "string") {
        return new this(message);
      } else {
        return message;
      }
    }
    get fragment() {
      const fragment = document.createDocumentFragment();
      for (const element of this.foreignElements) {
        fragment.appendChild(document.importNode(element, true));
      }
      return fragment;
    }
    get foreignElements() {
      return this.templateChildren.reduce((streamElements, child) => {
        if (child.tagName.toLowerCase() == "turbo-stream") {
          return [...streamElements, child];
        } else {
          return streamElements;
        }
      }, []);
    }
    get templateChildren() {
      return Array.from(this.templateElement.content.children);
    }
  };
  StreamMessage.contentType = "text/vnd.turbo-stream.html";
  var FormSubmissionState;
  (function(FormSubmissionState2) {
    FormSubmissionState2[FormSubmissionState2["initialized"] = 0] = "initialized";
    FormSubmissionState2[FormSubmissionState2["requesting"] = 1] = "requesting";
    FormSubmissionState2[FormSubmissionState2["waiting"] = 2] = "waiting";
    FormSubmissionState2[FormSubmissionState2["receiving"] = 3] = "receiving";
    FormSubmissionState2[FormSubmissionState2["stopping"] = 4] = "stopping";
    FormSubmissionState2[FormSubmissionState2["stopped"] = 5] = "stopped";
  })(FormSubmissionState || (FormSubmissionState = {}));
  var FormEnctype;
  (function(FormEnctype2) {
    FormEnctype2["urlEncoded"] = "application/x-www-form-urlencoded";
    FormEnctype2["multipart"] = "multipart/form-data";
    FormEnctype2["plain"] = "text/plain";
  })(FormEnctype || (FormEnctype = {}));
  function formEnctypeFromString(encoding) {
    switch (encoding.toLowerCase()) {
      case FormEnctype.multipart:
        return FormEnctype.multipart;
      case FormEnctype.plain:
        return FormEnctype.plain;
      default:
        return FormEnctype.urlEncoded;
    }
  }
  var FormSubmission = class {
    constructor(delegate, formElement, submitter, mustRedirect = false) {
      this.state = FormSubmissionState.initialized;
      this.delegate = delegate;
      this.formElement = formElement;
      this.submitter = submitter;
      this.formData = buildFormData(formElement, submitter);
      this.fetchRequest = new FetchRequest(this, this.method, this.location, this.body, this.formElement);
      this.mustRedirect = mustRedirect;
    }
    get method() {
      var _a;
      const method = ((_a = this.submitter) === null || _a === void 0 ? void 0 : _a.getAttribute("formmethod")) || this.formElement.getAttribute("method") || "";
      return fetchMethodFromString(method.toLowerCase()) || FetchMethod.get;
    }
    get action() {
      var _a;
      const formElementAction = typeof this.formElement.action === "string" ? this.formElement.action : null;
      return ((_a = this.submitter) === null || _a === void 0 ? void 0 : _a.getAttribute("formaction")) || this.formElement.getAttribute("action") || formElementAction || "";
    }
    get location() {
      return expandURL(this.action);
    }
    get body() {
      if (this.enctype == FormEnctype.urlEncoded || this.method == FetchMethod.get) {
        return new URLSearchParams(this.stringFormData);
      } else {
        return this.formData;
      }
    }
    get enctype() {
      var _a;
      return formEnctypeFromString(((_a = this.submitter) === null || _a === void 0 ? void 0 : _a.getAttribute("formenctype")) || this.formElement.enctype);
    }
    get isIdempotent() {
      return this.fetchRequest.isIdempotent;
    }
    get stringFormData() {
      return [...this.formData].reduce((entries, [name, value]) => {
        return entries.concat(typeof value == "string" ? [[name, value]] : []);
      }, []);
    }
    async start() {
      const { initialized, requesting } = FormSubmissionState;
      if (this.state == initialized) {
        this.state = requesting;
        return this.fetchRequest.perform();
      }
    }
    stop() {
      const { stopping, stopped } = FormSubmissionState;
      if (this.state != stopping && this.state != stopped) {
        this.state = stopping;
        this.fetchRequest.cancel();
        return true;
      }
    }
    prepareHeadersForRequest(headers, request) {
      if (!request.isIdempotent) {
        const token = getCookieValue(getMetaContent("csrf-param")) || getMetaContent("csrf-token");
        if (token) {
          headers["X-CSRF-Token"] = token;
        }
        headers["Accept"] = [StreamMessage.contentType, headers["Accept"]].join(", ");
      }
    }
    requestStarted(request) {
      this.state = FormSubmissionState.waiting;
      dispatch("turbo:submit-start", { target: this.formElement, detail: { formSubmission: this } });
      this.delegate.formSubmissionStarted(this);
    }
    requestPreventedHandlingResponse(request, response) {
      this.result = { success: response.succeeded, fetchResponse: response };
    }
    requestSucceededWithResponse(request, response) {
      if (response.clientError || response.serverError) {
        this.delegate.formSubmissionFailedWithResponse(this, response);
      } else if (this.requestMustRedirect(request) && responseSucceededWithoutRedirect(response)) {
        const error2 = new Error("Form responses must redirect to another location");
        this.delegate.formSubmissionErrored(this, error2);
      } else {
        this.state = FormSubmissionState.receiving;
        this.result = { success: true, fetchResponse: response };
        this.delegate.formSubmissionSucceededWithResponse(this, response);
      }
    }
    requestFailedWithResponse(request, response) {
      this.result = { success: false, fetchResponse: response };
      this.delegate.formSubmissionFailedWithResponse(this, response);
    }
    requestErrored(request, error2) {
      this.result = { success: false, error: error2 };
      this.delegate.formSubmissionErrored(this, error2);
    }
    requestFinished(request) {
      this.state = FormSubmissionState.stopped;
      dispatch("turbo:submit-end", { target: this.formElement, detail: Object.assign({ formSubmission: this }, this.result) });
      this.delegate.formSubmissionFinished(this);
    }
    requestMustRedirect(request) {
      return !request.isIdempotent && this.mustRedirect;
    }
  };
  function buildFormData(formElement, submitter) {
    const formData = new FormData(formElement);
    const name = submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("name");
    const value = submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("value");
    if (name && value != null && formData.get(name) != value) {
      formData.append(name, value);
    }
    return formData;
  }
  function getCookieValue(cookieName) {
    if (cookieName != null) {
      const cookies = document.cookie ? document.cookie.split("; ") : [];
      const cookie = cookies.find((cookie2) => cookie2.startsWith(cookieName));
      if (cookie) {
        const value = cookie.split("=").slice(1).join("=");
        return value ? decodeURIComponent(value) : void 0;
      }
    }
  }
  function getMetaContent(name) {
    const element = document.querySelector(`meta[name="${name}"]`);
    return element && element.content;
  }
  function responseSucceededWithoutRedirect(response) {
    return response.statusCode == 200 && !response.redirected;
  }
  var Snapshot = class {
    constructor(element) {
      this.element = element;
    }
    get children() {
      return [...this.element.children];
    }
    hasAnchor(anchor) {
      return this.getElementForAnchor(anchor) != null;
    }
    getElementForAnchor(anchor) {
      return anchor ? this.element.querySelector(`[id='${anchor}'], a[name='${anchor}']`) : null;
    }
    get isConnected() {
      return this.element.isConnected;
    }
    get firstAutofocusableElement() {
      return this.element.querySelector("[autofocus]");
    }
    get permanentElements() {
      return [...this.element.querySelectorAll("[id][data-turbo-permanent]")];
    }
    getPermanentElementById(id15) {
      return this.element.querySelector(`#${id15}[data-turbo-permanent]`);
    }
    getPermanentElementMapForSnapshot(snapshot) {
      const permanentElementMap = {};
      for (const currentPermanentElement of this.permanentElements) {
        const { id: id15 } = currentPermanentElement;
        const newPermanentElement = snapshot.getPermanentElementById(id15);
        if (newPermanentElement) {
          permanentElementMap[id15] = [currentPermanentElement, newPermanentElement];
        }
      }
      return permanentElementMap;
    }
  };
  var FormInterceptor = class {
    constructor(delegate, element) {
      this.submitBubbled = (event) => {
        const form = event.target;
        if (form instanceof HTMLFormElement && form.closest("turbo-frame, html") == this.element) {
          const submitter = event.submitter || void 0;
          if (this.delegate.shouldInterceptFormSubmission(form, submitter)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.delegate.formSubmissionIntercepted(form, submitter);
          }
        }
      };
      this.delegate = delegate;
      this.element = element;
    }
    start() {
      this.element.addEventListener("submit", this.submitBubbled);
    }
    stop() {
      this.element.removeEventListener("submit", this.submitBubbled);
    }
  };
  var View = class {
    constructor(delegate, element) {
      this.resolveRenderPromise = (value) => {
      };
      this.resolveInterceptionPromise = (value) => {
      };
      this.delegate = delegate;
      this.element = element;
    }
    scrollToAnchor(anchor) {
      const element = this.snapshot.getElementForAnchor(anchor);
      if (element) {
        this.scrollToElement(element);
        this.focusElement(element);
      } else {
        this.scrollToPosition({ x: 0, y: 0 });
      }
    }
    scrollToAnchorFromLocation(location2) {
      this.scrollToAnchor(getAnchor(location2));
    }
    scrollToElement(element) {
      element.scrollIntoView();
    }
    focusElement(element) {
      if (element instanceof HTMLElement) {
        if (element.hasAttribute("tabindex")) {
          element.focus();
        } else {
          element.setAttribute("tabindex", "-1");
          element.focus();
          element.removeAttribute("tabindex");
        }
      }
    }
    scrollToPosition({ x: x2, y: y2 }) {
      this.scrollRoot.scrollTo(x2, y2);
    }
    scrollToTop() {
      this.scrollToPosition({ x: 0, y: 0 });
    }
    get scrollRoot() {
      return window;
    }
    async render(renderer) {
      const { isPreview, shouldRender, newSnapshot: snapshot } = renderer;
      if (shouldRender) {
        try {
          this.renderPromise = new Promise((resolve) => this.resolveRenderPromise = resolve);
          this.renderer = renderer;
          this.prepareToRenderSnapshot(renderer);
          const renderInterception = new Promise((resolve) => this.resolveInterceptionPromise = resolve);
          const immediateRender = this.delegate.allowsImmediateRender(snapshot, this.resolveInterceptionPromise);
          if (!immediateRender)
            await renderInterception;
          await this.renderSnapshot(renderer);
          this.delegate.viewRenderedSnapshot(snapshot, isPreview);
          this.finishRenderingSnapshot(renderer);
        } finally {
          delete this.renderer;
          this.resolveRenderPromise(void 0);
          delete this.renderPromise;
        }
      } else {
        this.invalidate();
      }
    }
    invalidate() {
      this.delegate.viewInvalidated();
    }
    prepareToRenderSnapshot(renderer) {
      this.markAsPreview(renderer.isPreview);
      renderer.prepareToRender();
    }
    markAsPreview(isPreview) {
      if (isPreview) {
        this.element.setAttribute("data-turbo-preview", "");
      } else {
        this.element.removeAttribute("data-turbo-preview");
      }
    }
    async renderSnapshot(renderer) {
      await renderer.render();
    }
    finishRenderingSnapshot(renderer) {
      renderer.finishRendering();
    }
  };
  var FrameView = class extends View {
    invalidate() {
      this.element.innerHTML = "";
    }
    get snapshot() {
      return new Snapshot(this.element);
    }
  };
  var LinkInterceptor = class {
    constructor(delegate, element) {
      this.clickBubbled = (event) => {
        if (this.respondsToEventTarget(event.target)) {
          this.clickEvent = event;
        } else {
          delete this.clickEvent;
        }
      };
      this.linkClicked = (event) => {
        if (this.clickEvent && this.respondsToEventTarget(event.target) && event.target instanceof Element) {
          if (this.delegate.shouldInterceptLinkClick(event.target, event.detail.url)) {
            this.clickEvent.preventDefault();
            event.preventDefault();
            this.delegate.linkClickIntercepted(event.target, event.detail.url);
          }
        }
        delete this.clickEvent;
      };
      this.willVisit = () => {
        delete this.clickEvent;
      };
      this.delegate = delegate;
      this.element = element;
    }
    start() {
      this.element.addEventListener("click", this.clickBubbled);
      document.addEventListener("turbo:click", this.linkClicked);
      document.addEventListener("turbo:before-visit", this.willVisit);
    }
    stop() {
      this.element.removeEventListener("click", this.clickBubbled);
      document.removeEventListener("turbo:click", this.linkClicked);
      document.removeEventListener("turbo:before-visit", this.willVisit);
    }
    respondsToEventTarget(target) {
      const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
      return element && element.closest("turbo-frame, html") == this.element;
    }
  };
  var Bardo = class {
    constructor(permanentElementMap) {
      this.permanentElementMap = permanentElementMap;
    }
    static preservingPermanentElements(permanentElementMap, callback) {
      const bardo = new this(permanentElementMap);
      bardo.enter();
      callback();
      bardo.leave();
    }
    enter() {
      for (const id15 in this.permanentElementMap) {
        const [, newPermanentElement] = this.permanentElementMap[id15];
        this.replaceNewPermanentElementWithPlaceholder(newPermanentElement);
      }
    }
    leave() {
      for (const id15 in this.permanentElementMap) {
        const [currentPermanentElement] = this.permanentElementMap[id15];
        this.replaceCurrentPermanentElementWithClone(currentPermanentElement);
        this.replacePlaceholderWithPermanentElement(currentPermanentElement);
      }
    }
    replaceNewPermanentElementWithPlaceholder(permanentElement) {
      const placeholder = createPlaceholderForPermanentElement(permanentElement);
      permanentElement.replaceWith(placeholder);
    }
    replaceCurrentPermanentElementWithClone(permanentElement) {
      const clone = permanentElement.cloneNode(true);
      permanentElement.replaceWith(clone);
    }
    replacePlaceholderWithPermanentElement(permanentElement) {
      const placeholder = this.getPlaceholderById(permanentElement.id);
      placeholder === null || placeholder === void 0 ? void 0 : placeholder.replaceWith(permanentElement);
    }
    getPlaceholderById(id15) {
      return this.placeholders.find((element) => element.content == id15);
    }
    get placeholders() {
      return [...document.querySelectorAll("meta[name=turbo-permanent-placeholder][content]")];
    }
  };
  function createPlaceholderForPermanentElement(permanentElement) {
    const element = document.createElement("meta");
    element.setAttribute("name", "turbo-permanent-placeholder");
    element.setAttribute("content", permanentElement.id);
    return element;
  }
  var Renderer = class {
    constructor(currentSnapshot, newSnapshot, isPreview) {
      this.currentSnapshot = currentSnapshot;
      this.newSnapshot = newSnapshot;
      this.isPreview = isPreview;
      this.promise = new Promise((resolve, reject) => this.resolvingFunctions = { resolve, reject });
    }
    get shouldRender() {
      return true;
    }
    prepareToRender() {
      return;
    }
    finishRendering() {
      if (this.resolvingFunctions) {
        this.resolvingFunctions.resolve();
        delete this.resolvingFunctions;
      }
    }
    createScriptElement(element) {
      if (element.getAttribute("data-turbo-eval") == "false") {
        return element;
      } else {
        const createdScriptElement = document.createElement("script");
        if (this.cspNonce) {
          createdScriptElement.nonce = this.cspNonce;
        }
        createdScriptElement.textContent = element.textContent;
        createdScriptElement.async = false;
        copyElementAttributes(createdScriptElement, element);
        return createdScriptElement;
      }
    }
    preservingPermanentElements(callback) {
      Bardo.preservingPermanentElements(this.permanentElementMap, callback);
    }
    focusFirstAutofocusableElement() {
      const element = this.connectedSnapshot.firstAutofocusableElement;
      if (elementIsFocusable(element)) {
        element.focus();
      }
    }
    get connectedSnapshot() {
      return this.newSnapshot.isConnected ? this.newSnapshot : this.currentSnapshot;
    }
    get currentElement() {
      return this.currentSnapshot.element;
    }
    get newElement() {
      return this.newSnapshot.element;
    }
    get permanentElementMap() {
      return this.currentSnapshot.getPermanentElementMapForSnapshot(this.newSnapshot);
    }
    get cspNonce() {
      var _a;
      return (_a = document.head.querySelector('meta[name="csp-nonce"]')) === null || _a === void 0 ? void 0 : _a.getAttribute("content");
    }
  };
  function copyElementAttributes(destinationElement, sourceElement) {
    for (const { name, value } of [...sourceElement.attributes]) {
      destinationElement.setAttribute(name, value);
    }
  }
  function elementIsFocusable(element) {
    return element && typeof element.focus == "function";
  }
  var FrameRenderer = class extends Renderer {
    get shouldRender() {
      return true;
    }
    async render() {
      await nextAnimationFrame();
      this.preservingPermanentElements(() => {
        this.loadFrameElement();
      });
      this.scrollFrameIntoView();
      await nextAnimationFrame();
      this.focusFirstAutofocusableElement();
      await nextAnimationFrame();
      this.activateScriptElements();
    }
    loadFrameElement() {
      var _a;
      const destinationRange = document.createRange();
      destinationRange.selectNodeContents(this.currentElement);
      destinationRange.deleteContents();
      const frameElement = this.newElement;
      const sourceRange = (_a = frameElement.ownerDocument) === null || _a === void 0 ? void 0 : _a.createRange();
      if (sourceRange) {
        sourceRange.selectNodeContents(frameElement);
        this.currentElement.appendChild(sourceRange.extractContents());
      }
    }
    scrollFrameIntoView() {
      if (this.currentElement.autoscroll || this.newElement.autoscroll) {
        const element = this.currentElement.firstElementChild;
        const block = readScrollLogicalPosition(this.currentElement.getAttribute("data-autoscroll-block"), "end");
        if (element) {
          element.scrollIntoView({ block });
          return true;
        }
      }
      return false;
    }
    activateScriptElements() {
      for (const inertScriptElement of this.newScriptElements) {
        const activatedScriptElement = this.createScriptElement(inertScriptElement);
        inertScriptElement.replaceWith(activatedScriptElement);
      }
    }
    get newScriptElements() {
      return this.currentElement.querySelectorAll("script");
    }
  };
  function readScrollLogicalPosition(value, defaultValue) {
    if (value == "end" || value == "start" || value == "center" || value == "nearest") {
      return value;
    } else {
      return defaultValue;
    }
  }
  var ProgressBar = class {
    constructor() {
      this.hiding = false;
      this.value = 0;
      this.visible = false;
      this.trickle = () => {
        this.setValue(this.value + Math.random() / 100);
      };
      this.stylesheetElement = this.createStylesheetElement();
      this.progressElement = this.createProgressElement();
      this.installStylesheetElement();
      this.setValue(0);
    }
    static get defaultCSS() {
      return unindent`
      .turbo-progress-bar {
        position: fixed;
        display: block;
        top: 0;
        left: 0;
        height: 3px;
        background: #0076ff;
        z-index: 9999;
        transition:
          width ${ProgressBar.animationDuration}ms ease-out,
          opacity ${ProgressBar.animationDuration / 2}ms ${ProgressBar.animationDuration / 2}ms ease-in;
        transform: translate3d(0, 0, 0);
      }
    `;
    }
    show() {
      if (!this.visible) {
        this.visible = true;
        this.installProgressElement();
        this.startTrickling();
      }
    }
    hide() {
      if (this.visible && !this.hiding) {
        this.hiding = true;
        this.fadeProgressElement(() => {
          this.uninstallProgressElement();
          this.stopTrickling();
          this.visible = false;
          this.hiding = false;
        });
      }
    }
    setValue(value) {
      this.value = value;
      this.refresh();
    }
    installStylesheetElement() {
      document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
    }
    installProgressElement() {
      this.progressElement.style.width = "0";
      this.progressElement.style.opacity = "1";
      document.documentElement.insertBefore(this.progressElement, document.body);
      this.refresh();
    }
    fadeProgressElement(callback) {
      this.progressElement.style.opacity = "0";
      setTimeout(callback, ProgressBar.animationDuration * 1.5);
    }
    uninstallProgressElement() {
      if (this.progressElement.parentNode) {
        document.documentElement.removeChild(this.progressElement);
      }
    }
    startTrickling() {
      if (!this.trickleInterval) {
        this.trickleInterval = window.setInterval(this.trickle, ProgressBar.animationDuration);
      }
    }
    stopTrickling() {
      window.clearInterval(this.trickleInterval);
      delete this.trickleInterval;
    }
    refresh() {
      requestAnimationFrame(() => {
        this.progressElement.style.width = `${10 + this.value * 90}%`;
      });
    }
    createStylesheetElement() {
      const element = document.createElement("style");
      element.type = "text/css";
      element.textContent = ProgressBar.defaultCSS;
      return element;
    }
    createProgressElement() {
      const element = document.createElement("div");
      element.className = "turbo-progress-bar";
      return element;
    }
  };
  ProgressBar.animationDuration = 300;
  var HeadSnapshot = class extends Snapshot {
    constructor() {
      super(...arguments);
      this.detailsByOuterHTML = this.children.filter((element) => !elementIsNoscript(element)).map((element) => elementWithoutNonce(element)).reduce((result, element) => {
        const { outerHTML } = element;
        const details = outerHTML in result ? result[outerHTML] : {
          type: elementType(element),
          tracked: elementIsTracked(element),
          elements: []
        };
        return Object.assign(Object.assign({}, result), { [outerHTML]: Object.assign(Object.assign({}, details), { elements: [...details.elements, element] }) });
      }, {});
    }
    get trackedElementSignature() {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => this.detailsByOuterHTML[outerHTML].tracked).join("");
    }
    getScriptElementsNotInSnapshot(snapshot) {
      return this.getElementsMatchingTypeNotInSnapshot("script", snapshot);
    }
    getStylesheetElementsNotInSnapshot(snapshot) {
      return this.getElementsMatchingTypeNotInSnapshot("stylesheet", snapshot);
    }
    getElementsMatchingTypeNotInSnapshot(matchedType, snapshot) {
      return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => !(outerHTML in snapshot.detailsByOuterHTML)).map((outerHTML) => this.detailsByOuterHTML[outerHTML]).filter(({ type }) => type == matchedType).map(({ elements: [element] }) => element);
    }
    get provisionalElements() {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
        if (type == null && !tracked) {
          return [...result, ...elements];
        } else if (elements.length > 1) {
          return [...result, ...elements.slice(1)];
        } else {
          return result;
        }
      }, []);
    }
    getMetaValue(name) {
      const element = this.findMetaElementByName(name);
      return element ? element.getAttribute("content") : null;
    }
    findMetaElementByName(name) {
      return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
        const { elements: [element] } = this.detailsByOuterHTML[outerHTML];
        return elementIsMetaElementWithName(element, name) ? element : result;
      }, void 0);
    }
  };
  function elementType(element) {
    if (elementIsScript(element)) {
      return "script";
    } else if (elementIsStylesheet(element)) {
      return "stylesheet";
    }
  }
  function elementIsTracked(element) {
    return element.getAttribute("data-turbo-track") == "reload";
  }
  function elementIsScript(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "script";
  }
  function elementIsNoscript(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "noscript";
  }
  function elementIsStylesheet(element) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "style" || tagName == "link" && element.getAttribute("rel") == "stylesheet";
  }
  function elementIsMetaElementWithName(element, name) {
    const tagName = element.tagName.toLowerCase();
    return tagName == "meta" && element.getAttribute("name") == name;
  }
  function elementWithoutNonce(element) {
    if (element.hasAttribute("nonce")) {
      element.setAttribute("nonce", "");
    }
    return element;
  }
  var PageSnapshot = class extends Snapshot {
    constructor(element, headSnapshot) {
      super(element);
      this.headSnapshot = headSnapshot;
    }
    static fromHTMLString(html = "") {
      return this.fromDocument(parseHTMLDocument(html));
    }
    static fromElement(element) {
      return this.fromDocument(element.ownerDocument);
    }
    static fromDocument({ head, body }) {
      return new this(body, new HeadSnapshot(head));
    }
    clone() {
      return new PageSnapshot(this.element.cloneNode(true), this.headSnapshot);
    }
    get headElement() {
      return this.headSnapshot.element;
    }
    get rootLocation() {
      var _a;
      const root = (_a = this.getSetting("root")) !== null && _a !== void 0 ? _a : "/";
      return expandURL(root);
    }
    get cacheControlValue() {
      return this.getSetting("cache-control");
    }
    get isPreviewable() {
      return this.cacheControlValue != "no-preview";
    }
    get isCacheable() {
      return this.cacheControlValue != "no-cache";
    }
    get isVisitable() {
      return this.getSetting("visit-control") != "reload";
    }
    getSetting(name) {
      return this.headSnapshot.getMetaValue(`turbo-${name}`);
    }
  };
  var TimingMetric;
  (function(TimingMetric2) {
    TimingMetric2["visitStart"] = "visitStart";
    TimingMetric2["requestStart"] = "requestStart";
    TimingMetric2["requestEnd"] = "requestEnd";
    TimingMetric2["visitEnd"] = "visitEnd";
  })(TimingMetric || (TimingMetric = {}));
  var VisitState;
  (function(VisitState2) {
    VisitState2["initialized"] = "initialized";
    VisitState2["started"] = "started";
    VisitState2["canceled"] = "canceled";
    VisitState2["failed"] = "failed";
    VisitState2["completed"] = "completed";
  })(VisitState || (VisitState = {}));
  var defaultOptions = {
    action: "advance",
    historyChanged: false
  };
  var SystemStatusCode;
  (function(SystemStatusCode2) {
    SystemStatusCode2[SystemStatusCode2["networkFailure"] = 0] = "networkFailure";
    SystemStatusCode2[SystemStatusCode2["timeoutFailure"] = -1] = "timeoutFailure";
    SystemStatusCode2[SystemStatusCode2["contentTypeMismatch"] = -2] = "contentTypeMismatch";
  })(SystemStatusCode || (SystemStatusCode = {}));
  var Visit = class {
    constructor(delegate, location2, restorationIdentifier, options = {}) {
      this.identifier = uuid();
      this.timingMetrics = {};
      this.followedRedirect = false;
      this.historyChanged = false;
      this.scrolled = false;
      this.snapshotCached = false;
      this.state = VisitState.initialized;
      this.delegate = delegate;
      this.location = location2;
      this.restorationIdentifier = restorationIdentifier || uuid();
      const { action, historyChanged, referrer, snapshotHTML, response } = Object.assign(Object.assign({}, defaultOptions), options);
      this.action = action;
      this.historyChanged = historyChanged;
      this.referrer = referrer;
      this.snapshotHTML = snapshotHTML;
      this.response = response;
      this.isSamePage = this.delegate.locationWithActionIsSamePage(this.location, this.action);
    }
    get adapter() {
      return this.delegate.adapter;
    }
    get view() {
      return this.delegate.view;
    }
    get history() {
      return this.delegate.history;
    }
    get restorationData() {
      return this.history.getRestorationDataForIdentifier(this.restorationIdentifier);
    }
    get silent() {
      return this.isSamePage;
    }
    start() {
      if (this.state == VisitState.initialized) {
        this.recordTimingMetric(TimingMetric.visitStart);
        this.state = VisitState.started;
        this.adapter.visitStarted(this);
        this.delegate.visitStarted(this);
      }
    }
    cancel() {
      if (this.state == VisitState.started) {
        if (this.request) {
          this.request.cancel();
        }
        this.cancelRender();
        this.state = VisitState.canceled;
      }
    }
    complete() {
      if (this.state == VisitState.started) {
        this.recordTimingMetric(TimingMetric.visitEnd);
        this.state = VisitState.completed;
        this.adapter.visitCompleted(this);
        this.delegate.visitCompleted(this);
        this.followRedirect();
      }
    }
    fail() {
      if (this.state == VisitState.started) {
        this.state = VisitState.failed;
        this.adapter.visitFailed(this);
      }
    }
    changeHistory() {
      var _a;
      if (!this.historyChanged) {
        const actionForHistory = this.location.href === ((_a = this.referrer) === null || _a === void 0 ? void 0 : _a.href) ? "replace" : this.action;
        const method = this.getHistoryMethodForAction(actionForHistory);
        this.history.update(method, this.location, this.restorationIdentifier);
        this.historyChanged = true;
      }
    }
    issueRequest() {
      if (this.hasPreloadedResponse()) {
        this.simulateRequest();
      } else if (this.shouldIssueRequest() && !this.request) {
        this.request = new FetchRequest(this, FetchMethod.get, this.location);
        this.request.perform();
      }
    }
    simulateRequest() {
      if (this.response) {
        this.startRequest();
        this.recordResponse();
        this.finishRequest();
      }
    }
    startRequest() {
      this.recordTimingMetric(TimingMetric.requestStart);
      this.adapter.visitRequestStarted(this);
    }
    recordResponse(response = this.response) {
      this.response = response;
      if (response) {
        const { statusCode } = response;
        if (isSuccessful(statusCode)) {
          this.adapter.visitRequestCompleted(this);
        } else {
          this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
        }
      }
    }
    finishRequest() {
      this.recordTimingMetric(TimingMetric.requestEnd);
      this.adapter.visitRequestFinished(this);
    }
    loadResponse() {
      if (this.response) {
        const { statusCode, responseHTML } = this.response;
        this.render(async () => {
          this.cacheSnapshot();
          if (this.view.renderPromise)
            await this.view.renderPromise;
          if (isSuccessful(statusCode) && responseHTML != null) {
            await this.view.renderPage(PageSnapshot.fromHTMLString(responseHTML));
            this.adapter.visitRendered(this);
            this.complete();
          } else {
            await this.view.renderError(PageSnapshot.fromHTMLString(responseHTML));
            this.adapter.visitRendered(this);
            this.fail();
          }
        });
      }
    }
    getCachedSnapshot() {
      const snapshot = this.view.getCachedSnapshotForLocation(this.location) || this.getPreloadedSnapshot();
      if (snapshot && (!getAnchor(this.location) || snapshot.hasAnchor(getAnchor(this.location)))) {
        if (this.action == "restore" || snapshot.isPreviewable) {
          return snapshot;
        }
      }
    }
    getPreloadedSnapshot() {
      if (this.snapshotHTML) {
        return PageSnapshot.fromHTMLString(this.snapshotHTML);
      }
    }
    hasCachedSnapshot() {
      return this.getCachedSnapshot() != null;
    }
    loadCachedSnapshot() {
      const snapshot = this.getCachedSnapshot();
      if (snapshot) {
        const isPreview = this.shouldIssueRequest();
        this.render(async () => {
          this.cacheSnapshot();
          if (this.isSamePage) {
            this.adapter.visitRendered(this);
          } else {
            if (this.view.renderPromise)
              await this.view.renderPromise;
            await this.view.renderPage(snapshot, isPreview);
            this.adapter.visitRendered(this);
            if (!isPreview) {
              this.complete();
            }
          }
        });
      }
    }
    followRedirect() {
      if (this.redirectedToLocation && !this.followedRedirect) {
        this.adapter.visitProposedToLocation(this.redirectedToLocation, {
          action: "replace",
          response: this.response
        });
        this.followedRedirect = true;
      }
    }
    goToSamePageAnchor() {
      if (this.isSamePage) {
        this.render(async () => {
          this.cacheSnapshot();
          this.adapter.visitRendered(this);
        });
      }
    }
    requestStarted() {
      this.startRequest();
    }
    requestPreventedHandlingResponse(request, response) {
    }
    async requestSucceededWithResponse(request, response) {
      const responseHTML = await response.responseHTML;
      if (responseHTML == void 0) {
        this.recordResponse({ statusCode: SystemStatusCode.contentTypeMismatch });
      } else {
        this.redirectedToLocation = response.redirected ? response.location : void 0;
        this.recordResponse({ statusCode: response.statusCode, responseHTML });
      }
    }
    async requestFailedWithResponse(request, response) {
      const responseHTML = await response.responseHTML;
      if (responseHTML == void 0) {
        this.recordResponse({ statusCode: SystemStatusCode.contentTypeMismatch });
      } else {
        this.recordResponse({ statusCode: response.statusCode, responseHTML });
      }
    }
    requestErrored(request, error2) {
      this.recordResponse({ statusCode: SystemStatusCode.networkFailure });
    }
    requestFinished() {
      this.finishRequest();
    }
    performScroll() {
      if (!this.scrolled) {
        if (this.action == "restore") {
          this.scrollToRestoredPosition() || this.scrollToAnchor() || this.view.scrollToTop();
        } else {
          this.scrollToAnchor() || this.view.scrollToTop();
        }
        if (this.isSamePage) {
          this.delegate.visitScrolledToSamePageLocation(this.view.lastRenderedLocation, this.location);
        }
        this.scrolled = true;
      }
    }
    scrollToRestoredPosition() {
      const { scrollPosition } = this.restorationData;
      if (scrollPosition) {
        this.view.scrollToPosition(scrollPosition);
        return true;
      }
    }
    scrollToAnchor() {
      const anchor = getAnchor(this.location);
      if (anchor != null) {
        this.view.scrollToAnchor(anchor);
        return true;
      }
    }
    recordTimingMetric(metric) {
      this.timingMetrics[metric] = new Date().getTime();
    }
    getTimingMetrics() {
      return Object.assign({}, this.timingMetrics);
    }
    getHistoryMethodForAction(action) {
      switch (action) {
        case "replace":
          return history.replaceState;
        case "advance":
        case "restore":
          return history.pushState;
      }
    }
    hasPreloadedResponse() {
      return typeof this.response == "object";
    }
    shouldIssueRequest() {
      if (this.isSamePage) {
        return false;
      } else if (this.action == "restore") {
        return !this.hasCachedSnapshot();
      } else {
        return true;
      }
    }
    cacheSnapshot() {
      if (!this.snapshotCached) {
        this.view.cacheSnapshot();
        this.snapshotCached = true;
      }
    }
    async render(callback) {
      this.cancelRender();
      await new Promise((resolve) => {
        this.frame = requestAnimationFrame(() => resolve());
      });
      await callback();
      delete this.frame;
      this.performScroll();
    }
    cancelRender() {
      if (this.frame) {
        cancelAnimationFrame(this.frame);
        delete this.frame;
      }
    }
  };
  function isSuccessful(statusCode) {
    return statusCode >= 200 && statusCode < 300;
  }
  var BrowserAdapter = class {
    constructor(session2) {
      this.progressBar = new ProgressBar();
      this.showProgressBar = () => {
        this.progressBar.show();
      };
      this.session = session2;
    }
    visitProposedToLocation(location2, options) {
      this.navigator.startVisit(location2, uuid(), options);
    }
    visitStarted(visit2) {
      visit2.issueRequest();
      visit2.changeHistory();
      visit2.goToSamePageAnchor();
      visit2.loadCachedSnapshot();
    }
    visitRequestStarted(visit2) {
      this.progressBar.setValue(0);
      if (visit2.hasCachedSnapshot() || visit2.action != "restore") {
        this.showVisitProgressBarAfterDelay();
      } else {
        this.showProgressBar();
      }
    }
    visitRequestCompleted(visit2) {
      visit2.loadResponse();
    }
    visitRequestFailedWithStatusCode(visit2, statusCode) {
      switch (statusCode) {
        case SystemStatusCode.networkFailure:
        case SystemStatusCode.timeoutFailure:
        case SystemStatusCode.contentTypeMismatch:
          return this.reload();
        default:
          return visit2.loadResponse();
      }
    }
    visitRequestFinished(visit2) {
      this.progressBar.setValue(1);
      this.hideVisitProgressBar();
    }
    visitCompleted(visit2) {
    }
    pageInvalidated() {
      this.reload();
    }
    visitFailed(visit2) {
    }
    visitRendered(visit2) {
    }
    formSubmissionStarted(formSubmission) {
      this.progressBar.setValue(0);
      this.showFormProgressBarAfterDelay();
    }
    formSubmissionFinished(formSubmission) {
      this.progressBar.setValue(1);
      this.hideFormProgressBar();
    }
    showVisitProgressBarAfterDelay() {
      this.visitProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
    }
    hideVisitProgressBar() {
      this.progressBar.hide();
      if (this.visitProgressBarTimeout != null) {
        window.clearTimeout(this.visitProgressBarTimeout);
        delete this.visitProgressBarTimeout;
      }
    }
    showFormProgressBarAfterDelay() {
      if (this.formProgressBarTimeout == null) {
        this.formProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
      }
    }
    hideFormProgressBar() {
      this.progressBar.hide();
      if (this.formProgressBarTimeout != null) {
        window.clearTimeout(this.formProgressBarTimeout);
        delete this.formProgressBarTimeout;
      }
    }
    reload() {
      window.location.reload();
    }
    get navigator() {
      return this.session.navigator;
    }
  };
  var CacheObserver = class {
    constructor() {
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        addEventListener("turbo:before-cache", this.removeStaleElements, false);
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        removeEventListener("turbo:before-cache", this.removeStaleElements, false);
      }
    }
    removeStaleElements() {
      const staleElements = [...document.querySelectorAll('[data-turbo-cache="false"]')];
      for (const element of staleElements) {
        element.remove();
      }
    }
  };
  var FormSubmitObserver = class {
    constructor(delegate) {
      this.started = false;
      this.submitCaptured = () => {
        removeEventListener("submit", this.submitBubbled, false);
        addEventListener("submit", this.submitBubbled, false);
      };
      this.submitBubbled = (event) => {
        if (!event.defaultPrevented) {
          const form = event.target instanceof HTMLFormElement ? event.target : void 0;
          const submitter = event.submitter || void 0;
          if (form) {
            const method = (submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("formmethod")) || form.method;
            if (method != "dialog" && this.delegate.willSubmitForm(form, submitter)) {
              event.preventDefault();
              this.delegate.formSubmitted(form, submitter);
            }
          }
        }
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("submit", this.submitCaptured, true);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("submit", this.submitCaptured, true);
        this.started = false;
      }
    }
  };
  var FrameRedirector = class {
    constructor(element) {
      this.element = element;
      this.linkInterceptor = new LinkInterceptor(this, element);
      this.formInterceptor = new FormInterceptor(this, element);
    }
    start() {
      this.linkInterceptor.start();
      this.formInterceptor.start();
    }
    stop() {
      this.linkInterceptor.stop();
      this.formInterceptor.stop();
    }
    shouldInterceptLinkClick(element, url) {
      return this.shouldRedirect(element);
    }
    linkClickIntercepted(element, url) {
      const frame = this.findFrameElement(element);
      if (frame) {
        frame.setAttribute("reloadable", "");
        frame.src = url;
      }
    }
    shouldInterceptFormSubmission(element, submitter) {
      return this.shouldRedirect(element, submitter);
    }
    formSubmissionIntercepted(element, submitter) {
      const frame = this.findFrameElement(element, submitter);
      if (frame) {
        frame.removeAttribute("reloadable");
        frame.delegate.formSubmissionIntercepted(element, submitter);
      }
    }
    shouldRedirect(element, submitter) {
      const frame = this.findFrameElement(element, submitter);
      return frame ? frame != element.closest("turbo-frame") : false;
    }
    findFrameElement(element, submitter) {
      const id15 = (submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("data-turbo-frame")) || element.getAttribute("data-turbo-frame");
      if (id15 && id15 != "_top") {
        const frame = this.element.querySelector(`#${id15}:not([disabled])`);
        if (frame instanceof FrameElement) {
          return frame;
        }
      }
    }
  };
  var History = class {
    constructor(delegate) {
      this.restorationIdentifier = uuid();
      this.restorationData = {};
      this.started = false;
      this.pageLoaded = false;
      this.onPopState = (event) => {
        if (this.shouldHandlePopState()) {
          const { turbo } = event.state || {};
          if (turbo) {
            this.location = new URL(window.location.href);
            const { restorationIdentifier } = turbo;
            this.restorationIdentifier = restorationIdentifier;
            this.delegate.historyPoppedToLocationWithRestorationIdentifier(this.location, restorationIdentifier);
          }
        }
      };
      this.onPageLoad = async (event) => {
        await nextMicrotask();
        this.pageLoaded = true;
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("popstate", this.onPopState, false);
        addEventListener("load", this.onPageLoad, false);
        this.started = true;
        this.replace(new URL(window.location.href));
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("popstate", this.onPopState, false);
        removeEventListener("load", this.onPageLoad, false);
        this.started = false;
      }
    }
    push(location2, restorationIdentifier) {
      this.update(history.pushState, location2, restorationIdentifier);
    }
    replace(location2, restorationIdentifier) {
      this.update(history.replaceState, location2, restorationIdentifier);
    }
    update(method, location2, restorationIdentifier = uuid()) {
      const state = { turbo: { restorationIdentifier } };
      method.call(history, state, "", location2.href);
      this.location = location2;
      this.restorationIdentifier = restorationIdentifier;
    }
    getRestorationDataForIdentifier(restorationIdentifier) {
      return this.restorationData[restorationIdentifier] || {};
    }
    updateRestorationData(additionalData) {
      const { restorationIdentifier } = this;
      const restorationData = this.restorationData[restorationIdentifier];
      this.restorationData[restorationIdentifier] = Object.assign(Object.assign({}, restorationData), additionalData);
    }
    assumeControlOfScrollRestoration() {
      var _a;
      if (!this.previousScrollRestoration) {
        this.previousScrollRestoration = (_a = history.scrollRestoration) !== null && _a !== void 0 ? _a : "auto";
        history.scrollRestoration = "manual";
      }
    }
    relinquishControlOfScrollRestoration() {
      if (this.previousScrollRestoration) {
        history.scrollRestoration = this.previousScrollRestoration;
        delete this.previousScrollRestoration;
      }
    }
    shouldHandlePopState() {
      return this.pageIsLoaded();
    }
    pageIsLoaded() {
      return this.pageLoaded || document.readyState == "complete";
    }
  };
  var LinkClickObserver = class {
    constructor(delegate) {
      this.started = false;
      this.clickCaptured = () => {
        removeEventListener("click", this.clickBubbled, false);
        addEventListener("click", this.clickBubbled, false);
      };
      this.clickBubbled = (event) => {
        if (this.clickEventIsSignificant(event)) {
          const target = event.composedPath && event.composedPath()[0] || event.target;
          const link = this.findLinkFromClickTarget(target);
          if (link) {
            const location2 = this.getLocationForLink(link);
            if (this.delegate.willFollowLinkToLocation(link, location2)) {
              event.preventDefault();
              this.delegate.followedLinkToLocation(link, location2);
            }
          }
        }
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("click", this.clickCaptured, true);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("click", this.clickCaptured, true);
        this.started = false;
      }
    }
    clickEventIsSignificant(event) {
      return !(event.target && event.target.isContentEditable || event.defaultPrevented || event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
    }
    findLinkFromClickTarget(target) {
      if (target instanceof Element) {
        return target.closest("a[href]:not([target^=_]):not([download])");
      }
    }
    getLocationForLink(link) {
      return expandURL(link.getAttribute("href") || "");
    }
  };
  function isAction(action) {
    return action == "advance" || action == "replace" || action == "restore";
  }
  var Navigator = class {
    constructor(delegate) {
      this.delegate = delegate;
    }
    proposeVisit(location2, options = {}) {
      if (this.delegate.allowsVisitingLocationWithAction(location2, options.action)) {
        this.delegate.visitProposedToLocation(location2, options);
      }
    }
    startVisit(locatable, restorationIdentifier, options = {}) {
      this.stop();
      this.currentVisit = new Visit(this, expandURL(locatable), restorationIdentifier, Object.assign({ referrer: this.location }, options));
      this.currentVisit.start();
    }
    submitForm(form, submitter) {
      this.stop();
      this.formSubmission = new FormSubmission(this, form, submitter, true);
      if (this.formSubmission.isIdempotent) {
        this.proposeVisit(this.formSubmission.fetchRequest.url, { action: this.getActionForFormSubmission(this.formSubmission) });
      } else {
        this.formSubmission.start();
      }
    }
    stop() {
      if (this.formSubmission) {
        this.formSubmission.stop();
        delete this.formSubmission;
      }
      if (this.currentVisit) {
        this.currentVisit.cancel();
        delete this.currentVisit;
      }
    }
    get adapter() {
      return this.delegate.adapter;
    }
    get view() {
      return this.delegate.view;
    }
    get history() {
      return this.delegate.history;
    }
    formSubmissionStarted(formSubmission) {
      if (typeof this.adapter.formSubmissionStarted === "function") {
        this.adapter.formSubmissionStarted(formSubmission);
      }
    }
    async formSubmissionSucceededWithResponse(formSubmission, fetchResponse) {
      if (formSubmission == this.formSubmission) {
        const responseHTML = await fetchResponse.responseHTML;
        if (responseHTML) {
          if (formSubmission.method != FetchMethod.get) {
            this.view.clearSnapshotCache();
          }
          const { statusCode } = fetchResponse;
          const visitOptions = { response: { statusCode, responseHTML } };
          this.proposeVisit(fetchResponse.location, visitOptions);
        }
      }
    }
    async formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
      const responseHTML = await fetchResponse.responseHTML;
      if (responseHTML) {
        const snapshot = PageSnapshot.fromHTMLString(responseHTML);
        if (fetchResponse.serverError) {
          await this.view.renderError(snapshot);
        } else {
          await this.view.renderPage(snapshot);
        }
        this.view.scrollToTop();
        this.view.clearSnapshotCache();
      }
    }
    formSubmissionErrored(formSubmission, error2) {
      console.error(error2);
    }
    formSubmissionFinished(formSubmission) {
      if (typeof this.adapter.formSubmissionFinished === "function") {
        this.adapter.formSubmissionFinished(formSubmission);
      }
    }
    visitStarted(visit2) {
      this.delegate.visitStarted(visit2);
    }
    visitCompleted(visit2) {
      this.delegate.visitCompleted(visit2);
    }
    locationWithActionIsSamePage(location2, action) {
      const anchor = getAnchor(location2);
      const currentAnchor = getAnchor(this.view.lastRenderedLocation);
      const isRestorationToTop = action === "restore" && typeof anchor === "undefined";
      return action !== "replace" && getRequestURL(location2) === getRequestURL(this.view.lastRenderedLocation) && (isRestorationToTop || anchor != null && anchor !== currentAnchor);
    }
    visitScrolledToSamePageLocation(oldURL, newURL) {
      this.delegate.visitScrolledToSamePageLocation(oldURL, newURL);
    }
    get location() {
      return this.history.location;
    }
    get restorationIdentifier() {
      return this.history.restorationIdentifier;
    }
    getActionForFormSubmission(formSubmission) {
      const { formElement, submitter } = formSubmission;
      const action = (submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("data-turbo-action")) || formElement.getAttribute("data-turbo-action");
      return isAction(action) ? action : "advance";
    }
  };
  var PageStage;
  (function(PageStage2) {
    PageStage2[PageStage2["initial"] = 0] = "initial";
    PageStage2[PageStage2["loading"] = 1] = "loading";
    PageStage2[PageStage2["interactive"] = 2] = "interactive";
    PageStage2[PageStage2["complete"] = 3] = "complete";
  })(PageStage || (PageStage = {}));
  var PageObserver = class {
    constructor(delegate) {
      this.stage = PageStage.initial;
      this.started = false;
      this.interpretReadyState = () => {
        const { readyState } = this;
        if (readyState == "interactive") {
          this.pageIsInteractive();
        } else if (readyState == "complete") {
          this.pageIsComplete();
        }
      };
      this.pageWillUnload = () => {
        this.delegate.pageWillUnload();
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        if (this.stage == PageStage.initial) {
          this.stage = PageStage.loading;
        }
        document.addEventListener("readystatechange", this.interpretReadyState, false);
        addEventListener("pagehide", this.pageWillUnload, false);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        document.removeEventListener("readystatechange", this.interpretReadyState, false);
        removeEventListener("pagehide", this.pageWillUnload, false);
        this.started = false;
      }
    }
    pageIsInteractive() {
      if (this.stage == PageStage.loading) {
        this.stage = PageStage.interactive;
        this.delegate.pageBecameInteractive();
      }
    }
    pageIsComplete() {
      this.pageIsInteractive();
      if (this.stage == PageStage.interactive) {
        this.stage = PageStage.complete;
        this.delegate.pageLoaded();
      }
    }
    get readyState() {
      return document.readyState;
    }
  };
  var ScrollObserver = class {
    constructor(delegate) {
      this.started = false;
      this.onScroll = () => {
        this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        addEventListener("scroll", this.onScroll, false);
        this.onScroll();
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        removeEventListener("scroll", this.onScroll, false);
        this.started = false;
      }
    }
    updatePosition(position) {
      this.delegate.scrollPositionChanged(position);
    }
  };
  var StreamObserver = class {
    constructor(delegate) {
      this.sources = new Set();
      this.started = false;
      this.inspectFetchResponse = (event) => {
        const response = fetchResponseFromEvent(event);
        if (response && fetchResponseIsStream(response)) {
          event.preventDefault();
          this.receiveMessageResponse(response);
        }
      };
      this.receiveMessageEvent = (event) => {
        if (this.started && typeof event.data == "string") {
          this.receiveMessageHTML(event.data);
        }
      };
      this.delegate = delegate;
    }
    start() {
      if (!this.started) {
        this.started = true;
        addEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        removeEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
      }
    }
    connectStreamSource(source) {
      if (!this.streamSourceIsConnected(source)) {
        this.sources.add(source);
        source.addEventListener("message", this.receiveMessageEvent, false);
      }
    }
    disconnectStreamSource(source) {
      if (this.streamSourceIsConnected(source)) {
        this.sources.delete(source);
        source.removeEventListener("message", this.receiveMessageEvent, false);
      }
    }
    streamSourceIsConnected(source) {
      return this.sources.has(source);
    }
    async receiveMessageResponse(response) {
      const html = await response.responseHTML;
      if (html) {
        this.receiveMessageHTML(html);
      }
    }
    receiveMessageHTML(html) {
      this.delegate.receivedMessageFromStream(new StreamMessage(html));
    }
  };
  function fetchResponseFromEvent(event) {
    var _a;
    const fetchResponse = (_a = event.detail) === null || _a === void 0 ? void 0 : _a.fetchResponse;
    if (fetchResponse instanceof FetchResponse) {
      return fetchResponse;
    }
  }
  function fetchResponseIsStream(response) {
    var _a;
    const contentType = (_a = response.contentType) !== null && _a !== void 0 ? _a : "";
    return contentType.startsWith(StreamMessage.contentType);
  }
  var ErrorRenderer = class extends Renderer {
    async render() {
      this.replaceHeadAndBody();
      this.activateScriptElements();
    }
    replaceHeadAndBody() {
      const { documentElement, head, body } = document;
      documentElement.replaceChild(this.newHead, head);
      documentElement.replaceChild(this.newElement, body);
    }
    activateScriptElements() {
      for (const replaceableElement of this.scriptElements) {
        const parentNode = replaceableElement.parentNode;
        if (parentNode) {
          const element = this.createScriptElement(replaceableElement);
          parentNode.replaceChild(element, replaceableElement);
        }
      }
    }
    get newHead() {
      return this.newSnapshot.headSnapshot.element;
    }
    get scriptElements() {
      return [...document.documentElement.querySelectorAll("script")];
    }
  };
  var PageRenderer = class extends Renderer {
    get shouldRender() {
      return this.newSnapshot.isVisitable && this.trackedElementsAreIdentical;
    }
    prepareToRender() {
      this.mergeHead();
    }
    async render() {
      this.replaceBody();
    }
    finishRendering() {
      super.finishRendering();
      if (!this.isPreview) {
        this.focusFirstAutofocusableElement();
      }
    }
    get currentHeadSnapshot() {
      return this.currentSnapshot.headSnapshot;
    }
    get newHeadSnapshot() {
      return this.newSnapshot.headSnapshot;
    }
    get newElement() {
      return this.newSnapshot.element;
    }
    mergeHead() {
      this.copyNewHeadStylesheetElements();
      this.copyNewHeadScriptElements();
      this.removeCurrentHeadProvisionalElements();
      this.copyNewHeadProvisionalElements();
    }
    replaceBody() {
      this.preservingPermanentElements(() => {
        this.activateNewBody();
        this.assignNewBody();
      });
    }
    get trackedElementsAreIdentical() {
      return this.currentHeadSnapshot.trackedElementSignature == this.newHeadSnapshot.trackedElementSignature;
    }
    copyNewHeadStylesheetElements() {
      for (const element of this.newHeadStylesheetElements) {
        document.head.appendChild(element);
      }
    }
    copyNewHeadScriptElements() {
      for (const element of this.newHeadScriptElements) {
        document.head.appendChild(this.createScriptElement(element));
      }
    }
    removeCurrentHeadProvisionalElements() {
      for (const element of this.currentHeadProvisionalElements) {
        document.head.removeChild(element);
      }
    }
    copyNewHeadProvisionalElements() {
      for (const element of this.newHeadProvisionalElements) {
        document.head.appendChild(element);
      }
    }
    activateNewBody() {
      document.adoptNode(this.newElement);
      this.activateNewBodyScriptElements();
    }
    activateNewBodyScriptElements() {
      for (const inertScriptElement of this.newBodyScriptElements) {
        const activatedScriptElement = this.createScriptElement(inertScriptElement);
        inertScriptElement.replaceWith(activatedScriptElement);
      }
    }
    assignNewBody() {
      if (document.body && this.newElement instanceof HTMLBodyElement) {
        document.body.replaceWith(this.newElement);
      } else {
        document.documentElement.appendChild(this.newElement);
      }
    }
    get newHeadStylesheetElements() {
      return this.newHeadSnapshot.getStylesheetElementsNotInSnapshot(this.currentHeadSnapshot);
    }
    get newHeadScriptElements() {
      return this.newHeadSnapshot.getScriptElementsNotInSnapshot(this.currentHeadSnapshot);
    }
    get currentHeadProvisionalElements() {
      return this.currentHeadSnapshot.provisionalElements;
    }
    get newHeadProvisionalElements() {
      return this.newHeadSnapshot.provisionalElements;
    }
    get newBodyScriptElements() {
      return this.newElement.querySelectorAll("script");
    }
  };
  var SnapshotCache = class {
    constructor(size) {
      this.keys = [];
      this.snapshots = {};
      this.size = size;
    }
    has(location2) {
      return toCacheKey(location2) in this.snapshots;
    }
    get(location2) {
      if (this.has(location2)) {
        const snapshot = this.read(location2);
        this.touch(location2);
        return snapshot;
      }
    }
    put(location2, snapshot) {
      this.write(location2, snapshot);
      this.touch(location2);
      return snapshot;
    }
    clear() {
      this.snapshots = {};
    }
    read(location2) {
      return this.snapshots[toCacheKey(location2)];
    }
    write(location2, snapshot) {
      this.snapshots[toCacheKey(location2)] = snapshot;
    }
    touch(location2) {
      const key = toCacheKey(location2);
      const index = this.keys.indexOf(key);
      if (index > -1)
        this.keys.splice(index, 1);
      this.keys.unshift(key);
      this.trim();
    }
    trim() {
      for (const key of this.keys.splice(this.size)) {
        delete this.snapshots[key];
      }
    }
  };
  var PageView = class extends View {
    constructor() {
      super(...arguments);
      this.snapshotCache = new SnapshotCache(10);
      this.lastRenderedLocation = new URL(location.href);
    }
    renderPage(snapshot, isPreview = false) {
      const renderer = new PageRenderer(this.snapshot, snapshot, isPreview);
      return this.render(renderer);
    }
    renderError(snapshot) {
      const renderer = new ErrorRenderer(this.snapshot, snapshot, false);
      return this.render(renderer);
    }
    clearSnapshotCache() {
      this.snapshotCache.clear();
    }
    async cacheSnapshot() {
      if (this.shouldCacheSnapshot) {
        this.delegate.viewWillCacheSnapshot();
        const { snapshot, lastRenderedLocation: location2 } = this;
        await nextEventLoopTick();
        this.snapshotCache.put(location2, snapshot.clone());
      }
    }
    getCachedSnapshotForLocation(location2) {
      return this.snapshotCache.get(location2);
    }
    get snapshot() {
      return PageSnapshot.fromElement(this.element);
    }
    get shouldCacheSnapshot() {
      return this.snapshot.isCacheable;
    }
  };
  var Session = class {
    constructor() {
      this.navigator = new Navigator(this);
      this.history = new History(this);
      this.view = new PageView(this, document.documentElement);
      this.adapter = new BrowserAdapter(this);
      this.pageObserver = new PageObserver(this);
      this.cacheObserver = new CacheObserver();
      this.linkClickObserver = new LinkClickObserver(this);
      this.formSubmitObserver = new FormSubmitObserver(this);
      this.scrollObserver = new ScrollObserver(this);
      this.streamObserver = new StreamObserver(this);
      this.frameRedirector = new FrameRedirector(document.documentElement);
      this.drive = true;
      this.enabled = true;
      this.progressBarDelay = 500;
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.pageObserver.start();
        this.cacheObserver.start();
        this.linkClickObserver.start();
        this.formSubmitObserver.start();
        this.scrollObserver.start();
        this.streamObserver.start();
        this.frameRedirector.start();
        this.history.start();
        this.started = true;
        this.enabled = true;
      }
    }
    disable() {
      this.enabled = false;
    }
    stop() {
      if (this.started) {
        this.pageObserver.stop();
        this.cacheObserver.stop();
        this.linkClickObserver.stop();
        this.formSubmitObserver.stop();
        this.scrollObserver.stop();
        this.streamObserver.stop();
        this.frameRedirector.stop();
        this.history.stop();
        this.started = false;
      }
    }
    registerAdapter(adapter) {
      this.adapter = adapter;
    }
    visit(location2, options = {}) {
      this.navigator.proposeVisit(expandURL(location2), options);
    }
    connectStreamSource(source) {
      this.streamObserver.connectStreamSource(source);
    }
    disconnectStreamSource(source) {
      this.streamObserver.disconnectStreamSource(source);
    }
    renderStreamMessage(message) {
      document.documentElement.appendChild(StreamMessage.wrap(message).fragment);
    }
    clearCache() {
      this.view.clearSnapshotCache();
    }
    setProgressBarDelay(delay) {
      this.progressBarDelay = delay;
    }
    get location() {
      return this.history.location;
    }
    get restorationIdentifier() {
      return this.history.restorationIdentifier;
    }
    historyPoppedToLocationWithRestorationIdentifier(location2, restorationIdentifier) {
      if (this.enabled) {
        this.navigator.startVisit(location2, restorationIdentifier, { action: "restore", historyChanged: true });
      } else {
        this.adapter.pageInvalidated();
      }
    }
    scrollPositionChanged(position) {
      this.history.updateRestorationData({ scrollPosition: position });
    }
    willFollowLinkToLocation(link, location2) {
      return this.elementDriveEnabled(link) && this.locationIsVisitable(location2) && this.applicationAllowsFollowingLinkToLocation(link, location2);
    }
    followedLinkToLocation(link, location2) {
      const action = this.getActionForLink(link);
      this.convertLinkWithMethodClickToFormSubmission(link) || this.visit(location2.href, { action });
    }
    convertLinkWithMethodClickToFormSubmission(link) {
      var _a;
      const linkMethod = link.getAttribute("data-turbo-method");
      if (linkMethod) {
        const form = document.createElement("form");
        form.method = linkMethod;
        form.action = link.getAttribute("href") || "undefined";
        form.hidden = true;
        (_a = link.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(form, link);
        return dispatch("submit", { cancelable: true, target: form });
      } else {
        return false;
      }
    }
    allowsVisitingLocationWithAction(location2, action) {
      return this.locationWithActionIsSamePage(location2, action) || this.applicationAllowsVisitingLocation(location2);
    }
    visitProposedToLocation(location2, options) {
      extendURLWithDeprecatedProperties(location2);
      this.adapter.visitProposedToLocation(location2, options);
    }
    visitStarted(visit2) {
      extendURLWithDeprecatedProperties(visit2.location);
      if (!visit2.silent) {
        this.notifyApplicationAfterVisitingLocation(visit2.location, visit2.action);
      }
    }
    visitCompleted(visit2) {
      this.notifyApplicationAfterPageLoad(visit2.getTimingMetrics());
    }
    locationWithActionIsSamePage(location2, action) {
      return this.navigator.locationWithActionIsSamePage(location2, action);
    }
    visitScrolledToSamePageLocation(oldURL, newURL) {
      this.notifyApplicationAfterVisitingSamePageLocation(oldURL, newURL);
    }
    willSubmitForm(form, submitter) {
      return this.elementDriveEnabled(form) && (!submitter || this.elementDriveEnabled(submitter));
    }
    formSubmitted(form, submitter) {
      this.navigator.submitForm(form, submitter);
    }
    pageBecameInteractive() {
      this.view.lastRenderedLocation = this.location;
      this.notifyApplicationAfterPageLoad();
    }
    pageLoaded() {
      this.history.assumeControlOfScrollRestoration();
    }
    pageWillUnload() {
      this.history.relinquishControlOfScrollRestoration();
    }
    receivedMessageFromStream(message) {
      this.renderStreamMessage(message);
    }
    viewWillCacheSnapshot() {
      var _a;
      if (!((_a = this.navigator.currentVisit) === null || _a === void 0 ? void 0 : _a.silent)) {
        this.notifyApplicationBeforeCachingSnapshot();
      }
    }
    allowsImmediateRender({ element }, resume) {
      const event = this.notifyApplicationBeforeRender(element, resume);
      return !event.defaultPrevented;
    }
    viewRenderedSnapshot(snapshot, isPreview) {
      this.view.lastRenderedLocation = this.history.location;
      this.notifyApplicationAfterRender();
    }
    viewInvalidated() {
      this.adapter.pageInvalidated();
    }
    frameLoaded(frame) {
      this.notifyApplicationAfterFrameLoad(frame);
    }
    frameRendered(fetchResponse, frame) {
      this.notifyApplicationAfterFrameRender(fetchResponse, frame);
    }
    applicationAllowsFollowingLinkToLocation(link, location2) {
      const event = this.notifyApplicationAfterClickingLinkToLocation(link, location2);
      return !event.defaultPrevented;
    }
    applicationAllowsVisitingLocation(location2) {
      const event = this.notifyApplicationBeforeVisitingLocation(location2);
      return !event.defaultPrevented;
    }
    notifyApplicationAfterClickingLinkToLocation(link, location2) {
      return dispatch("turbo:click", { target: link, detail: { url: location2.href }, cancelable: true });
    }
    notifyApplicationBeforeVisitingLocation(location2) {
      return dispatch("turbo:before-visit", { detail: { url: location2.href }, cancelable: true });
    }
    notifyApplicationAfterVisitingLocation(location2, action) {
      return dispatch("turbo:visit", { detail: { url: location2.href, action } });
    }
    notifyApplicationBeforeCachingSnapshot() {
      return dispatch("turbo:before-cache");
    }
    notifyApplicationBeforeRender(newBody, resume) {
      return dispatch("turbo:before-render", { detail: { newBody, resume }, cancelable: true });
    }
    notifyApplicationAfterRender() {
      return dispatch("turbo:render");
    }
    notifyApplicationAfterPageLoad(timing = {}) {
      return dispatch("turbo:load", { detail: { url: this.location.href, timing } });
    }
    notifyApplicationAfterVisitingSamePageLocation(oldURL, newURL) {
      dispatchEvent(new HashChangeEvent("hashchange", { oldURL: oldURL.toString(), newURL: newURL.toString() }));
    }
    notifyApplicationAfterFrameLoad(frame) {
      return dispatch("turbo:frame-load", { target: frame });
    }
    notifyApplicationAfterFrameRender(fetchResponse, frame) {
      return dispatch("turbo:frame-render", { detail: { fetchResponse }, target: frame, cancelable: true });
    }
    elementDriveEnabled(element) {
      const container = element === null || element === void 0 ? void 0 : element.closest("[data-turbo]");
      if (this.drive) {
        if (container) {
          return container.getAttribute("data-turbo") != "false";
        } else {
          return true;
        }
      } else {
        if (container) {
          return container.getAttribute("data-turbo") == "true";
        } else {
          return false;
        }
      }
    }
    getActionForLink(link) {
      const action = link.getAttribute("data-turbo-action");
      return isAction(action) ? action : "advance";
    }
    locationIsVisitable(location2) {
      return isPrefixedBy(location2, this.snapshot.rootLocation) && isHTML(location2);
    }
    get snapshot() {
      return this.view.snapshot;
    }
  };
  function extendURLWithDeprecatedProperties(url) {
    Object.defineProperties(url, deprecatedLocationPropertyDescriptors);
  }
  var deprecatedLocationPropertyDescriptors = {
    absoluteURL: {
      get() {
        return this.toString();
      }
    }
  };
  var session = new Session();
  var { navigator: navigator$1 } = session;
  function start() {
    session.start();
  }
  function registerAdapter(adapter) {
    session.registerAdapter(adapter);
  }
  function visit(location2, options) {
    session.visit(location2, options);
  }
  function connectStreamSource(source) {
    session.connectStreamSource(source);
  }
  function disconnectStreamSource(source) {
    session.disconnectStreamSource(source);
  }
  function renderStreamMessage(message) {
    session.renderStreamMessage(message);
  }
  function clearCache() {
    session.clearCache();
  }
  function setProgressBarDelay(delay) {
    session.setProgressBarDelay(delay);
  }
  var Turbo = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    navigator: navigator$1,
    session,
    PageRenderer,
    PageSnapshot,
    start,
    registerAdapter,
    visit,
    connectStreamSource,
    disconnectStreamSource,
    renderStreamMessage,
    clearCache,
    setProgressBarDelay
  });
  var FrameController = class {
    constructor(element) {
      this.resolveVisitPromise = () => {
      };
      this.connected = false;
      this.hasBeenLoaded = false;
      this.settingSourceURL = false;
      this.element = element;
      this.view = new FrameView(this, this.element);
      this.appearanceObserver = new AppearanceObserver(this, this.element);
      this.linkInterceptor = new LinkInterceptor(this, this.element);
      this.formInterceptor = new FormInterceptor(this, this.element);
    }
    connect() {
      if (!this.connected) {
        this.connected = true;
        this.reloadable = false;
        if (this.loadingStyle == FrameLoadingStyle.lazy) {
          this.appearanceObserver.start();
        }
        this.linkInterceptor.start();
        this.formInterceptor.start();
        this.sourceURLChanged();
      }
    }
    disconnect() {
      if (this.connected) {
        this.connected = false;
        this.appearanceObserver.stop();
        this.linkInterceptor.stop();
        this.formInterceptor.stop();
      }
    }
    disabledChanged() {
      if (this.loadingStyle == FrameLoadingStyle.eager) {
        this.loadSourceURL();
      }
    }
    sourceURLChanged() {
      if (this.loadingStyle == FrameLoadingStyle.eager || this.hasBeenLoaded) {
        this.loadSourceURL();
      }
    }
    loadingStyleChanged() {
      if (this.loadingStyle == FrameLoadingStyle.lazy) {
        this.appearanceObserver.start();
      } else {
        this.appearanceObserver.stop();
        this.loadSourceURL();
      }
    }
    async loadSourceURL() {
      if (!this.settingSourceURL && this.enabled && this.isActive && (this.reloadable || this.sourceURL != this.currentURL)) {
        const previousURL = this.currentURL;
        this.currentURL = this.sourceURL;
        if (this.sourceURL) {
          try {
            this.element.loaded = this.visit(this.sourceURL);
            this.appearanceObserver.stop();
            await this.element.loaded;
            this.hasBeenLoaded = true;
            session.frameLoaded(this.element);
          } catch (error2) {
            this.currentURL = previousURL;
            throw error2;
          }
        }
      }
    }
    async loadResponse(fetchResponse) {
      if (fetchResponse.redirected) {
        this.sourceURL = fetchResponse.response.url;
      }
      try {
        const html = await fetchResponse.responseHTML;
        if (html) {
          const { body } = parseHTMLDocument(html);
          const snapshot = new Snapshot(await this.extractForeignFrameElement(body));
          const renderer = new FrameRenderer(this.view.snapshot, snapshot, false);
          if (this.view.renderPromise)
            await this.view.renderPromise;
          await this.view.render(renderer);
          session.frameRendered(fetchResponse, this.element);
        }
      } catch (error2) {
        console.error(error2);
        this.view.invalidate();
      }
    }
    elementAppearedInViewport(element) {
      this.loadSourceURL();
    }
    shouldInterceptLinkClick(element, url) {
      if (element.hasAttribute("data-turbo-method")) {
        return false;
      } else {
        return this.shouldInterceptNavigation(element);
      }
    }
    linkClickIntercepted(element, url) {
      this.reloadable = true;
      this.navigateFrame(element, url);
    }
    shouldInterceptFormSubmission(element, submitter) {
      return this.shouldInterceptNavigation(element, submitter);
    }
    formSubmissionIntercepted(element, submitter) {
      if (this.formSubmission) {
        this.formSubmission.stop();
      }
      this.reloadable = false;
      this.formSubmission = new FormSubmission(this, element, submitter);
      if (this.formSubmission.fetchRequest.isIdempotent) {
        this.navigateFrame(element, this.formSubmission.fetchRequest.url.href, submitter);
      } else {
        const { fetchRequest } = this.formSubmission;
        this.prepareHeadersForRequest(fetchRequest.headers, fetchRequest);
        this.formSubmission.start();
      }
    }
    prepareHeadersForRequest(headers, request) {
      headers["Turbo-Frame"] = this.id;
    }
    requestStarted(request) {
      this.element.setAttribute("busy", "");
    }
    requestPreventedHandlingResponse(request, response) {
      this.resolveVisitPromise();
    }
    async requestSucceededWithResponse(request, response) {
      await this.loadResponse(response);
      this.resolveVisitPromise();
    }
    requestFailedWithResponse(request, response) {
      console.error(response);
      this.resolveVisitPromise();
    }
    requestErrored(request, error2) {
      console.error(error2);
      this.resolveVisitPromise();
    }
    requestFinished(request) {
      this.element.removeAttribute("busy");
    }
    formSubmissionStarted(formSubmission) {
      const frame = this.findFrameElement(formSubmission.formElement);
      frame.setAttribute("busy", "");
    }
    formSubmissionSucceededWithResponse(formSubmission, response) {
      const frame = this.findFrameElement(formSubmission.formElement, formSubmission.submitter);
      frame.delegate.loadResponse(response);
    }
    formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
      this.element.delegate.loadResponse(fetchResponse);
    }
    formSubmissionErrored(formSubmission, error2) {
      console.error(error2);
    }
    formSubmissionFinished(formSubmission) {
      const frame = this.findFrameElement(formSubmission.formElement);
      frame.removeAttribute("busy");
    }
    allowsImmediateRender(snapshot, resume) {
      return true;
    }
    viewRenderedSnapshot(snapshot, isPreview) {
    }
    viewInvalidated() {
    }
    async visit(url) {
      const request = new FetchRequest(this, FetchMethod.get, expandURL(url), void 0, this.element);
      return new Promise((resolve) => {
        this.resolveVisitPromise = () => {
          this.resolveVisitPromise = () => {
          };
          resolve();
        };
        request.perform();
      });
    }
    navigateFrame(element, url, submitter) {
      const frame = this.findFrameElement(element, submitter);
      frame.setAttribute("reloadable", "");
      frame.src = url;
    }
    findFrameElement(element, submitter) {
      var _a;
      const id15 = (submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("data-turbo-frame")) || element.getAttribute("data-turbo-frame") || this.element.getAttribute("target");
      return (_a = getFrameElementById(id15)) !== null && _a !== void 0 ? _a : this.element;
    }
    async extractForeignFrameElement(container) {
      let element;
      const id15 = CSS.escape(this.id);
      try {
        if (element = activateElement(container.querySelector(`turbo-frame#${id15}`), this.currentURL)) {
          return element;
        }
        if (element = activateElement(container.querySelector(`turbo-frame[src][recurse~=${id15}]`), this.currentURL)) {
          await element.loaded;
          return await this.extractForeignFrameElement(element);
        }
        console.error(`Response has no matching <turbo-frame id="${id15}"> element`);
      } catch (error2) {
        console.error(error2);
      }
      return new FrameElement();
    }
    shouldInterceptNavigation(element, submitter) {
      const id15 = (submitter === null || submitter === void 0 ? void 0 : submitter.getAttribute("data-turbo-frame")) || element.getAttribute("data-turbo-frame") || this.element.getAttribute("target");
      if (!this.enabled || id15 == "_top") {
        return false;
      }
      if (id15) {
        const frameElement = getFrameElementById(id15);
        if (frameElement) {
          return !frameElement.disabled;
        }
      }
      if (!session.elementDriveEnabled(element)) {
        return false;
      }
      if (submitter && !session.elementDriveEnabled(submitter)) {
        return false;
      }
      return true;
    }
    get id() {
      return this.element.id;
    }
    get enabled() {
      return !this.element.disabled;
    }
    get sourceURL() {
      if (this.element.src) {
        return this.element.src;
      }
    }
    get reloadable() {
      const frame = this.findFrameElement(this.element);
      return frame.hasAttribute("reloadable");
    }
    set reloadable(value) {
      const frame = this.findFrameElement(this.element);
      if (value) {
        frame.setAttribute("reloadable", "");
      } else {
        frame.removeAttribute("reloadable");
      }
    }
    set sourceURL(sourceURL) {
      this.settingSourceURL = true;
      this.element.src = sourceURL !== null && sourceURL !== void 0 ? sourceURL : null;
      this.currentURL = this.element.src;
      this.settingSourceURL = false;
    }
    get loadingStyle() {
      return this.element.loading;
    }
    get isLoading() {
      return this.formSubmission !== void 0 || this.resolveVisitPromise() !== void 0;
    }
    get isActive() {
      return this.element.isActive && this.connected;
    }
  };
  function getFrameElementById(id15) {
    if (id15 != null) {
      const element = document.getElementById(id15);
      if (element instanceof FrameElement) {
        return element;
      }
    }
  }
  function activateElement(element, currentURL) {
    if (element) {
      const src = element.getAttribute("src");
      if (src != null && currentURL != null && urlsAreEqual(src, currentURL)) {
        throw new Error(`Matching <turbo-frame id="${element.id}"> element has a source URL which references itself`);
      }
      if (element.ownerDocument !== document) {
        element = document.importNode(element, true);
      }
      if (element instanceof FrameElement) {
        element.connectedCallback();
        return element;
      }
    }
  }
  var StreamActions = {
    after() {
      this.targetElements.forEach((e5) => {
        var _a;
        return (_a = e5.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(this.templateContent, e5.nextSibling);
      });
    },
    append() {
      this.removeDuplicateTargetChildren();
      this.targetElements.forEach((e5) => e5.append(this.templateContent));
    },
    before() {
      this.targetElements.forEach((e5) => {
        var _a;
        return (_a = e5.parentElement) === null || _a === void 0 ? void 0 : _a.insertBefore(this.templateContent, e5);
      });
    },
    prepend() {
      this.removeDuplicateTargetChildren();
      this.targetElements.forEach((e5) => e5.prepend(this.templateContent));
    },
    remove() {
      this.targetElements.forEach((e5) => e5.remove());
    },
    replace() {
      this.targetElements.forEach((e5) => e5.replaceWith(this.templateContent));
    },
    update() {
      this.targetElements.forEach((e5) => {
        e5.innerHTML = "";
        e5.append(this.templateContent);
      });
    }
  };
  var StreamElement = class extends HTMLElement {
    async connectedCallback() {
      try {
        await this.render();
      } catch (error2) {
        console.error(error2);
      } finally {
        this.disconnect();
      }
    }
    async render() {
      var _a;
      return (_a = this.renderPromise) !== null && _a !== void 0 ? _a : this.renderPromise = (async () => {
        if (this.dispatchEvent(this.beforeRenderEvent)) {
          await nextAnimationFrame();
          this.performAction();
        }
      })();
    }
    disconnect() {
      try {
        this.remove();
      } catch (_a) {
      }
    }
    removeDuplicateTargetChildren() {
      this.duplicateChildren.forEach((c2) => c2.remove());
    }
    get duplicateChildren() {
      var _a;
      const existingChildren = this.targetElements.flatMap((e5) => [...e5.children]).filter((c2) => !!c2.id);
      const newChildrenIds = [...(_a = this.templateContent) === null || _a === void 0 ? void 0 : _a.children].filter((c2) => !!c2.id).map((c2) => c2.id);
      return existingChildren.filter((c2) => newChildrenIds.includes(c2.id));
    }
    get performAction() {
      if (this.action) {
        const actionFunction = StreamActions[this.action];
        if (actionFunction) {
          return actionFunction;
        }
        this.raise("unknown action");
      }
      this.raise("action attribute is missing");
    }
    get targetElements() {
      if (this.target) {
        return this.targetElementsById;
      } else if (this.targets) {
        return this.targetElementsByQuery;
      } else {
        this.raise("target or targets attribute is missing");
      }
    }
    get templateContent() {
      return this.templateElement.content.cloneNode(true);
    }
    get templateElement() {
      if (this.firstElementChild instanceof HTMLTemplateElement) {
        return this.firstElementChild;
      }
      this.raise("first child element must be a <template> element");
    }
    get action() {
      return this.getAttribute("action");
    }
    get target() {
      return this.getAttribute("target");
    }
    get targets() {
      return this.getAttribute("targets");
    }
    raise(message) {
      throw new Error(`${this.description}: ${message}`);
    }
    get description() {
      var _a, _b;
      return (_b = ((_a = this.outerHTML.match(/<[^>]+>/)) !== null && _a !== void 0 ? _a : [])[0]) !== null && _b !== void 0 ? _b : "<turbo-stream>";
    }
    get beforeRenderEvent() {
      return new CustomEvent("turbo:before-stream-render", { bubbles: true, cancelable: true });
    }
    get targetElementsById() {
      var _a;
      const element = (_a = this.ownerDocument) === null || _a === void 0 ? void 0 : _a.getElementById(this.target);
      if (element !== null) {
        return [element];
      } else {
        return [];
      }
    }
    get targetElementsByQuery() {
      var _a;
      const elements = (_a = this.ownerDocument) === null || _a === void 0 ? void 0 : _a.querySelectorAll(this.targets);
      if (elements.length !== 0) {
        return Array.prototype.slice.call(elements);
      } else {
        return [];
      }
    }
  };
  FrameElement.delegateConstructor = FrameController;
  customElements.define("turbo-frame", FrameElement);
  customElements.define("turbo-stream", StreamElement);
  (() => {
    let element = document.currentScript;
    if (!element)
      return;
    if (element.hasAttribute("data-turbo-suppress-warning"))
      return;
    while (element = element.parentElement) {
      if (element == document.body) {
        return console.warn(unindent`
        You are loading Turbo from a <script> element inside the <body> element. This is probably not what you meant to do!

        Load your application’s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.

        For more information, see: https://turbo.hotwired.dev/handbook/building#working-with-script-elements

        ——
        Suppress this warning by adding a "data-turbo-suppress-warning" attribute to: %s
      `, element.outerHTML);
      }
    }
  })();
  window.Turbo = Turbo;
  start();

  // ../../node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable.js
  var consumer;
  async function getConsumer() {
    return consumer || setConsumer(createConsumer2().then(setConsumer));
  }
  function setConsumer(newConsumer) {
    return consumer = newConsumer;
  }
  async function createConsumer2() {
    const { createConsumer: createConsumer3 } = await Promise.resolve().then(() => (init_src(), src_exports));
    return createConsumer3();
  }
  async function subscribeTo(channel, mixin) {
    const { subscriptions } = await getConsumer();
    return subscriptions.create(channel, mixin);
  }

  // ../../node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable_stream_source_element.js
  var TurboCableStreamSourceElement = class extends HTMLElement {
    async connectedCallback() {
      connectStreamSource(this);
      this.subscription = await subscribeTo(this.channel, { received: this.dispatchMessageEvent.bind(this) });
    }
    disconnectedCallback() {
      disconnectStreamSource(this);
      if (this.subscription)
        this.subscription.unsubscribe();
    }
    dispatchMessageEvent(data) {
      const event = new MessageEvent("message", { data });
      return this.dispatchEvent(event);
    }
    get channel() {
      const channel = this.getAttribute("channel");
      const signed_stream_name = this.getAttribute("signed-stream-name");
      return { channel, signed_stream_name };
    }
  };
  customElements.define("turbo-cable-stream-source", TurboCableStreamSourceElement);

  // ../../node_modules/@hotwired/stimulus/dist/stimulus.js
  var EventListener = class {
    constructor(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = new Set();
    }
    connect() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }
    disconnect() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }
    bindingConnected(binding) {
      this.unorderedBindings.add(binding);
    }
    bindingDisconnected(binding) {
      this.unorderedBindings.delete(binding);
    }
    handleEvent(event) {
      const extendedEvent = extendEvent(event);
      for (const binding of this.bindings) {
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    }
    get bindings() {
      return Array.from(this.unorderedBindings).sort((left2, right2) => {
        const leftIndex = left2.index, rightIndex = right2.index;
        return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
      });
    }
  };
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      const { stopImmediatePropagation } = event;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation.call(this);
        }
      });
    }
  }
  var Dispatcher = class {
    constructor(application2) {
      this.application = application2;
      this.eventListenerMaps = new Map();
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach((eventListener) => eventListener.connect());
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach((eventListener) => eventListener.disconnect());
      }
    }
    get eventListeners() {
      return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
    }
    bindingConnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    }
    bindingDisconnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
    }
    handleError(error2, message, detail = {}) {
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    fetchEventListenerForBinding(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    }
    fetchEventListener(eventTarget, eventName, eventOptions) {
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      let eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    }
    createEventListener(eventTarget, eventName, eventOptions) {
      const eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    }
    fetchEventListenerMapForEventTarget(eventTarget) {
      let eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    }
    cacheKey(eventName, eventOptions) {
      const parts = [eventName];
      Object.keys(eventOptions).sort().forEach((key) => {
        parts.push(`${eventOptions[key] ? "" : "!"}${key}`);
      });
      return parts.join(":");
    }
  };
  var descriptorPattern = /^((.+?)(@(window|document))?->)?(.+?)(#([^:]+?))(:(.+))?$/;
  function parseActionDescriptorString(descriptorString) {
    const source = descriptorString.trim();
    const matches = source.match(descriptorPattern) || [];
    return {
      eventTarget: parseEventTarget(matches[4]),
      eventName: matches[2],
      eventOptions: matches[9] ? parseEventOptions(matches[9]) : {},
      identifier: matches[5],
      methodName: matches[7]
    };
  }
  function parseEventTarget(eventTargetName) {
    if (eventTargetName == "window") {
      return window;
    } else if (eventTargetName == "document") {
      return document;
    }
  }
  function parseEventOptions(eventOptions) {
    return eventOptions.split(":").reduce((options, token) => Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) }), {});
  }
  function stringifyEventTarget(eventTarget) {
    if (eventTarget == window) {
      return "window";
    } else if (eventTarget == document) {
      return "document";
    }
  }
  function camelize(value) {
    return value.replace(/(?:[_-])([a-z0-9])/g, (_2, char) => char.toUpperCase());
  }
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function dasherize(value) {
    return value.replace(/([A-Z])/g, (_2, char) => `-${char.toLowerCase()}`);
  }
  function tokenize(value) {
    return value.match(/[^\s]+/g) || [];
  }
  var Action = class {
    constructor(element, index, descriptor) {
      this.element = element;
      this.index = index;
      this.eventTarget = descriptor.eventTarget || element;
      this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
      this.eventOptions = descriptor.eventOptions || {};
      this.identifier = descriptor.identifier || error("missing identifier");
      this.methodName = descriptor.methodName || error("missing method name");
    }
    static forToken(token) {
      return new this(token.element, token.index, parseActionDescriptorString(token.content));
    }
    toString() {
      const eventNameSuffix = this.eventTargetName ? `@${this.eventTargetName}` : "";
      return `${this.eventName}${eventNameSuffix}->${this.identifier}#${this.methodName}`;
    }
    get params() {
      if (this.eventTarget instanceof Element) {
        return this.getParamsFromEventTargetAttributes(this.eventTarget);
      } else {
        return {};
      }
    }
    getParamsFromEventTargetAttributes(eventTarget) {
      const params = {};
      const pattern = new RegExp(`^data-${this.identifier}-(.+)-param$`);
      const attributes = Array.from(eventTarget.attributes);
      attributes.forEach(({ name, value }) => {
        const match = name.match(pattern);
        const key = match && match[1];
        if (key) {
          Object.assign(params, { [camelize(key)]: typecast(value) });
        }
      });
      return params;
    }
    get eventTargetName() {
      return stringifyEventTarget(this.eventTarget);
    }
  };
  var defaultEventNames = {
    "a": (e5) => "click",
    "button": (e5) => "click",
    "form": (e5) => "submit",
    "details": (e5) => "toggle",
    "input": (e5) => e5.getAttribute("type") == "submit" ? "click" : "input",
    "select": (e5) => "change",
    "textarea": (e5) => "input"
  };
  function getDefaultEventNameForElement(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName in defaultEventNames) {
      return defaultEventNames[tagName](element);
    }
  }
  function error(message) {
    throw new Error(message);
  }
  function typecast(value) {
    try {
      return JSON.parse(value);
    } catch (o_O) {
      return value;
    }
  }
  var Binding = class {
    constructor(context, action) {
      this.context = context;
      this.action = action;
    }
    get index() {
      return this.action.index;
    }
    get eventTarget() {
      return this.action.eventTarget;
    }
    get eventOptions() {
      return this.action.eventOptions;
    }
    get identifier() {
      return this.context.identifier;
    }
    handleEvent(event) {
      if (this.willBeInvokedByEvent(event)) {
        this.invokeWithEvent(event);
      }
    }
    get eventName() {
      return this.action.eventName;
    }
    get method() {
      const method = this.controller[this.methodName];
      if (typeof method == "function") {
        return method;
      }
      throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`);
    }
    invokeWithEvent(event) {
      const { target, currentTarget } = event;
      try {
        const { params } = this.action;
        const actionEvent = Object.assign(event, { params });
        this.method.call(this.controller, actionEvent);
        this.context.logDebugActivity(this.methodName, { event, target, currentTarget, action: this.methodName });
      } catch (error2) {
        const { identifier, controller, element, index } = this;
        const detail = { identifier, controller, element, index, event };
        this.context.handleError(error2, `invoking action "${this.action}"`, detail);
      }
    }
    willBeInvokedByEvent(event) {
      const eventTarget = event.target;
      if (this.element === eventTarget) {
        return true;
      } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
        return this.scope.containsElement(eventTarget);
      } else {
        return this.scope.containsElement(this.action.element);
      }
    }
    get controller() {
      return this.context.controller;
    }
    get methodName() {
      return this.action.methodName;
    }
    get element() {
      return this.scope.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  var ElementObserver = class {
    constructor(element, delegate) {
      this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = new Set();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.refresh();
      }
    }
    pause(callback) {
      if (this.started) {
        this.mutationObserver.disconnect();
        this.started = false;
      }
      callback();
      if (!this.started) {
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        const matches = new Set(this.matchElementsInTree());
        for (const element of Array.from(this.elements)) {
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (const element of Array.from(matches)) {
          this.addElement(element);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    }
    processAttributeChange(node, attributeName) {
      const element = node;
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    }
    processRemovedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    }
    processAddedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    }
    matchElement(element) {
      return this.delegate.matchElement(element);
    }
    matchElementsInTree(tree = this.element) {
      return this.delegate.matchElementsInTree(tree);
    }
    processTree(tree, processor) {
      for (const element of this.matchElementsInTree(tree)) {
        processor.call(this, element);
      }
    }
    elementFromNode(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    }
    elementIsActive(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    }
    addElement(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    }
    removeElement(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    }
  };
  var AttributeObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeName = attributeName;
      this.delegate = delegate;
      this.elementObserver = new ElementObserver(element, this);
    }
    get element() {
      return this.elementObserver.element;
    }
    get selector() {
      return `[${this.attributeName}]`;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get started() {
      return this.elementObserver.started;
    }
    matchElement(element) {
      return element.hasAttribute(this.attributeName);
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    }
    elementMatched(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    }
    elementUnmatched(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    }
    elementAttributeChanged(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    }
  };
  var StringMapObserver = class {
    constructor(element, delegate) {
      this.element = element;
      this.delegate = delegate;
      this.started = false;
      this.stringMap = new Map();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true, attributeOldValue: true });
        this.refresh();
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        for (const attributeName of this.knownAttributeNames) {
          this.refreshAttribute(attributeName, null);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      const attributeName = mutation.attributeName;
      if (attributeName) {
        this.refreshAttribute(attributeName, mutation.oldValue);
      }
    }
    refreshAttribute(attributeName, oldValue) {
      const key = this.delegate.getStringMapKeyForAttribute(attributeName);
      if (key != null) {
        if (!this.stringMap.has(attributeName)) {
          this.stringMapKeyAdded(key, attributeName);
        }
        const value = this.element.getAttribute(attributeName);
        if (this.stringMap.get(attributeName) != value) {
          this.stringMapValueChanged(value, key, oldValue);
        }
        if (value == null) {
          const oldValue2 = this.stringMap.get(attributeName);
          this.stringMap.delete(attributeName);
          if (oldValue2)
            this.stringMapKeyRemoved(key, attributeName, oldValue2);
        } else {
          this.stringMap.set(attributeName, value);
        }
      }
    }
    stringMapKeyAdded(key, attributeName) {
      if (this.delegate.stringMapKeyAdded) {
        this.delegate.stringMapKeyAdded(key, attributeName);
      }
    }
    stringMapValueChanged(value, key, oldValue) {
      if (this.delegate.stringMapValueChanged) {
        this.delegate.stringMapValueChanged(value, key, oldValue);
      }
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      if (this.delegate.stringMapKeyRemoved) {
        this.delegate.stringMapKeyRemoved(key, attributeName, oldValue);
      }
    }
    get knownAttributeNames() {
      return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
    }
    get currentAttributeNames() {
      return Array.from(this.element.attributes).map((attribute) => attribute.name);
    }
    get recordedAttributeNames() {
      return Array.from(this.stringMap.keys());
    }
  };
  function add(map, key, value) {
    fetch2(map, key).add(value);
  }
  function del(map, key, value) {
    fetch2(map, key).delete(value);
    prune(map, key);
  }
  function fetch2(map, key) {
    let values = map.get(key);
    if (!values) {
      values = new Set();
      map.set(key, values);
    }
    return values;
  }
  function prune(map, key) {
    const values = map.get(key);
    if (values != null && values.size == 0) {
      map.delete(key);
    }
  }
  var Multimap = class {
    constructor() {
      this.valuesByKey = new Map();
    }
    get keys() {
      return Array.from(this.valuesByKey.keys());
    }
    get values() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((values, set) => values.concat(Array.from(set)), []);
    }
    get size() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((size, set) => size + set.size, 0);
    }
    add(key, value) {
      add(this.valuesByKey, key, value);
    }
    delete(key, value) {
      del(this.valuesByKey, key, value);
    }
    has(key, value) {
      const values = this.valuesByKey.get(key);
      return values != null && values.has(value);
    }
    hasKey(key) {
      return this.valuesByKey.has(key);
    }
    hasValue(value) {
      const sets = Array.from(this.valuesByKey.values());
      return sets.some((set) => set.has(value));
    }
    getValuesForKey(key) {
      const values = this.valuesByKey.get(key);
      return values ? Array.from(values) : [];
    }
    getKeysForValue(value) {
      return Array.from(this.valuesByKey).filter(([key, values]) => values.has(value)).map(([key, values]) => key);
    }
  };
  var TokenListObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.delegate = delegate;
      this.tokensByElement = new Multimap();
    }
    get started() {
      return this.attributeObserver.started;
    }
    start() {
      this.attributeObserver.start();
    }
    pause(callback) {
      this.attributeObserver.pause(callback);
    }
    stop() {
      this.attributeObserver.stop();
    }
    refresh() {
      this.attributeObserver.refresh();
    }
    get element() {
      return this.attributeObserver.element;
    }
    get attributeName() {
      return this.attributeObserver.attributeName;
    }
    elementMatchedAttribute(element) {
      this.tokensMatched(this.readTokensForElement(element));
    }
    elementAttributeValueChanged(element) {
      const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    }
    elementUnmatchedAttribute(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }
    tokensMatched(tokens) {
      tokens.forEach((token) => this.tokenMatched(token));
    }
    tokensUnmatched(tokens) {
      tokens.forEach((token) => this.tokenUnmatched(token));
    }
    tokenMatched(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    }
    tokenUnmatched(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    }
    refreshTokensForElement(element) {
      const previousTokens = this.tokensByElement.getValuesForKey(element);
      const currentTokens = this.readTokensForElement(element);
      const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    }
    readTokensForElement(element) {
      const attributeName = this.attributeName;
      const tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    }
  };
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
  }
  function zip(left2, right2) {
    const length = Math.max(left2.length, right2.length);
    return Array.from({ length }, (_2, index) => [left2[index], right2[index]]);
  }
  function tokensAreEqual(left2, right2) {
    return left2 && right2 && left2.index == right2.index && left2.content == right2.content;
  }
  var ValueListObserver = class {
    constructor(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = new WeakMap();
      this.valuesByTokenByElement = new WeakMap();
    }
    get started() {
      return this.tokenListObserver.started;
    }
    start() {
      this.tokenListObserver.start();
    }
    stop() {
      this.tokenListObserver.stop();
    }
    refresh() {
      this.tokenListObserver.refresh();
    }
    get element() {
      return this.tokenListObserver.element;
    }
    get attributeName() {
      return this.tokenListObserver.attributeName;
    }
    tokenMatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    }
    tokenUnmatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    }
    fetchParseResultForToken(token) {
      let parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    }
    fetchValuesByTokenForElement(element) {
      let valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    }
    parseToken(token) {
      try {
        const value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error2) {
        return { error: error2 };
      }
    }
  };
  var BindingObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.bindingsByAction = new Map();
    }
    start() {
      if (!this.valueListObserver) {
        this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
        this.valueListObserver.start();
      }
    }
    stop() {
      if (this.valueListObserver) {
        this.valueListObserver.stop();
        delete this.valueListObserver;
        this.disconnectAllActions();
      }
    }
    get element() {
      return this.context.element;
    }
    get identifier() {
      return this.context.identifier;
    }
    get actionAttribute() {
      return this.schema.actionAttribute;
    }
    get schema() {
      return this.context.schema;
    }
    get bindings() {
      return Array.from(this.bindingsByAction.values());
    }
    connectAction(action) {
      const binding = new Binding(this.context, action);
      this.bindingsByAction.set(action, binding);
      this.delegate.bindingConnected(binding);
    }
    disconnectAction(action) {
      const binding = this.bindingsByAction.get(action);
      if (binding) {
        this.bindingsByAction.delete(action);
        this.delegate.bindingDisconnected(binding);
      }
    }
    disconnectAllActions() {
      this.bindings.forEach((binding) => this.delegate.bindingDisconnected(binding));
      this.bindingsByAction.clear();
    }
    parseValueForToken(token) {
      const action = Action.forToken(token);
      if (action.identifier == this.identifier) {
        return action;
      }
    }
    elementMatchedValue(element, action) {
      this.connectAction(action);
    }
    elementUnmatchedValue(element, action) {
      this.disconnectAction(action);
    }
  };
  var ValueObserver = class {
    constructor(context, receiver) {
      this.context = context;
      this.receiver = receiver;
      this.stringMapObserver = new StringMapObserver(this.element, this);
      this.valueDescriptorMap = this.controller.valueDescriptorMap;
      this.invokeChangedCallbacksForDefaultValues();
    }
    start() {
      this.stringMapObserver.start();
    }
    stop() {
      this.stringMapObserver.stop();
    }
    get element() {
      return this.context.element;
    }
    get controller() {
      return this.context.controller;
    }
    getStringMapKeyForAttribute(attributeName) {
      if (attributeName in this.valueDescriptorMap) {
        return this.valueDescriptorMap[attributeName].name;
      }
    }
    stringMapKeyAdded(key, attributeName) {
      const descriptor = this.valueDescriptorMap[attributeName];
      if (!this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), descriptor.writer(descriptor.defaultValue));
      }
    }
    stringMapValueChanged(value, name, oldValue) {
      const descriptor = this.valueDescriptorNameMap[name];
      if (value === null)
        return;
      if (oldValue === null) {
        oldValue = descriptor.writer(descriptor.defaultValue);
      }
      this.invokeChangedCallback(name, value, oldValue);
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      const descriptor = this.valueDescriptorNameMap[key];
      if (this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), oldValue);
      } else {
        this.invokeChangedCallback(key, descriptor.writer(descriptor.defaultValue), oldValue);
      }
    }
    invokeChangedCallbacksForDefaultValues() {
      for (const { key, name, defaultValue, writer } of this.valueDescriptors) {
        if (defaultValue != void 0 && !this.controller.data.has(key)) {
          this.invokeChangedCallback(name, writer(defaultValue), void 0);
        }
      }
    }
    invokeChangedCallback(name, rawValue, rawOldValue) {
      const changedMethodName = `${name}Changed`;
      const changedMethod = this.receiver[changedMethodName];
      if (typeof changedMethod == "function") {
        const descriptor = this.valueDescriptorNameMap[name];
        const value = descriptor.reader(rawValue);
        let oldValue = rawOldValue;
        if (rawOldValue) {
          oldValue = descriptor.reader(rawOldValue);
        }
        changedMethod.call(this.receiver, value, oldValue);
      }
    }
    get valueDescriptors() {
      const { valueDescriptorMap } = this;
      return Object.keys(valueDescriptorMap).map((key) => valueDescriptorMap[key]);
    }
    get valueDescriptorNameMap() {
      const descriptors = {};
      Object.keys(this.valueDescriptorMap).forEach((key) => {
        const descriptor = this.valueDescriptorMap[key];
        descriptors[descriptor.name] = descriptor;
      });
      return descriptors;
    }
    hasValue(attributeName) {
      const descriptor = this.valueDescriptorNameMap[attributeName];
      const hasMethodName = `has${capitalize(descriptor.name)}`;
      return this.receiver[hasMethodName];
    }
  };
  var TargetObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.targetsByName = new Multimap();
    }
    start() {
      if (!this.tokenListObserver) {
        this.tokenListObserver = new TokenListObserver(this.element, this.attributeName, this);
        this.tokenListObserver.start();
      }
    }
    stop() {
      if (this.tokenListObserver) {
        this.disconnectAllTargets();
        this.tokenListObserver.stop();
        delete this.tokenListObserver;
      }
    }
    tokenMatched({ element, content: name }) {
      if (this.scope.containsElement(element)) {
        this.connectTarget(element, name);
      }
    }
    tokenUnmatched({ element, content: name }) {
      this.disconnectTarget(element, name);
    }
    connectTarget(element, name) {
      var _a;
      if (!this.targetsByName.has(name, element)) {
        this.targetsByName.add(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetConnected(element, name));
      }
    }
    disconnectTarget(element, name) {
      var _a;
      if (this.targetsByName.has(name, element)) {
        this.targetsByName.delete(name, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetDisconnected(element, name));
      }
    }
    disconnectAllTargets() {
      for (const name of this.targetsByName.keys) {
        for (const element of this.targetsByName.getValuesForKey(name)) {
          this.disconnectTarget(element, name);
        }
      }
    }
    get attributeName() {
      return `data-${this.context.identifier}-target`;
    }
    get element() {
      return this.context.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  var Context = class {
    constructor(module, scope) {
      this.logDebugActivity = (functionName, detail = {}) => {
        const { identifier, controller, element } = this;
        detail = Object.assign({ identifier, controller, element }, detail);
        this.application.logDebugActivity(this.identifier, functionName, detail);
      };
      this.module = module;
      this.scope = scope;
      this.controller = new module.controllerConstructor(this);
      this.bindingObserver = new BindingObserver(this, this.dispatcher);
      this.valueObserver = new ValueObserver(this, this.controller);
      this.targetObserver = new TargetObserver(this, this);
      try {
        this.controller.initialize();
        this.logDebugActivity("initialize");
      } catch (error2) {
        this.handleError(error2, "initializing controller");
      }
    }
    connect() {
      this.bindingObserver.start();
      this.valueObserver.start();
      this.targetObserver.start();
      try {
        this.controller.connect();
        this.logDebugActivity("connect");
      } catch (error2) {
        this.handleError(error2, "connecting controller");
      }
    }
    disconnect() {
      try {
        this.controller.disconnect();
        this.logDebugActivity("disconnect");
      } catch (error2) {
        this.handleError(error2, "disconnecting controller");
      }
      this.targetObserver.stop();
      this.valueObserver.stop();
      this.bindingObserver.stop();
    }
    get application() {
      return this.module.application;
    }
    get identifier() {
      return this.module.identifier;
    }
    get schema() {
      return this.application.schema;
    }
    get dispatcher() {
      return this.application.dispatcher;
    }
    get element() {
      return this.scope.element;
    }
    get parentElement() {
      return this.element.parentElement;
    }
    handleError(error2, message, detail = {}) {
      const { identifier, controller, element } = this;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.handleError(error2, `Error ${message}`, detail);
    }
    targetConnected(element, name) {
      this.invokeControllerMethod(`${name}TargetConnected`, element);
    }
    targetDisconnected(element, name) {
      this.invokeControllerMethod(`${name}TargetDisconnected`, element);
    }
    invokeControllerMethod(methodName, ...args) {
      const controller = this.controller;
      if (typeof controller[methodName] == "function") {
        controller[methodName](...args);
      }
    }
  };
  function readInheritableStaticArrayValues(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return Array.from(ancestors.reduce((values, constructor2) => {
      getOwnStaticArrayValues(constructor2, propertyName).forEach((name) => values.add(name));
      return values;
    }, new Set()));
  }
  function readInheritableStaticObjectPairs(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return ancestors.reduce((pairs, constructor2) => {
      pairs.push(...getOwnStaticObjectPairs(constructor2, propertyName));
      return pairs;
    }, []);
  }
  function getAncestorsForConstructor(constructor) {
    const ancestors = [];
    while (constructor) {
      ancestors.push(constructor);
      constructor = Object.getPrototypeOf(constructor);
    }
    return ancestors.reverse();
  }
  function getOwnStaticArrayValues(constructor, propertyName) {
    const definition = constructor[propertyName];
    return Array.isArray(definition) ? definition : [];
  }
  function getOwnStaticObjectPairs(constructor, propertyName) {
    const definition = constructor[propertyName];
    return definition ? Object.keys(definition).map((key) => [key, definition[key]]) : [];
  }
  function bless(constructor) {
    return shadow(constructor, getBlessedProperties(constructor));
  }
  function shadow(constructor, properties) {
    const shadowConstructor = extend2(constructor);
    const shadowProperties = getShadowProperties(constructor.prototype, properties);
    Object.defineProperties(shadowConstructor.prototype, shadowProperties);
    return shadowConstructor;
  }
  function getBlessedProperties(constructor) {
    const blessings = readInheritableStaticArrayValues(constructor, "blessings");
    return blessings.reduce((blessedProperties, blessing) => {
      const properties = blessing(constructor);
      for (const key in properties) {
        const descriptor = blessedProperties[key] || {};
        blessedProperties[key] = Object.assign(descriptor, properties[key]);
      }
      return blessedProperties;
    }, {});
  }
  function getShadowProperties(prototype, properties) {
    return getOwnKeys(properties).reduce((shadowProperties, key) => {
      const descriptor = getShadowedDescriptor(prototype, properties, key);
      if (descriptor) {
        Object.assign(shadowProperties, { [key]: descriptor });
      }
      return shadowProperties;
    }, {});
  }
  function getShadowedDescriptor(prototype, properties, key) {
    const shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
    const shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
    if (!shadowedByValue) {
      const descriptor = Object.getOwnPropertyDescriptor(properties, key).value;
      if (shadowingDescriptor) {
        descriptor.get = shadowingDescriptor.get || descriptor.get;
        descriptor.set = shadowingDescriptor.set || descriptor.set;
      }
      return descriptor;
    }
  }
  var getOwnKeys = (() => {
    if (typeof Object.getOwnPropertySymbols == "function") {
      return (object) => [
        ...Object.getOwnPropertyNames(object),
        ...Object.getOwnPropertySymbols(object)
      ];
    } else {
      return Object.getOwnPropertyNames;
    }
  })();
  var extend2 = (() => {
    function extendWithReflect(constructor) {
      function extended() {
        return Reflect.construct(constructor, arguments, new.target);
      }
      extended.prototype = Object.create(constructor.prototype, {
        constructor: { value: extended }
      });
      Reflect.setPrototypeOf(extended, constructor);
      return extended;
    }
    function testReflectExtension() {
      const a2 = function() {
        this.a.call(this);
      };
      const b2 = extendWithReflect(a2);
      b2.prototype.a = function() {
      };
      return new b2();
    }
    try {
      testReflectExtension();
      return extendWithReflect;
    } catch (error2) {
      return (constructor) => class extended extends constructor {
      };
    }
  })();
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controllerConstructor: bless(definition.controllerConstructor)
    };
  }
  var Module = class {
    constructor(application2, definition) {
      this.application = application2;
      this.definition = blessDefinition(definition);
      this.contextsByScope = new WeakMap();
      this.connectedContexts = new Set();
    }
    get identifier() {
      return this.definition.identifier;
    }
    get controllerConstructor() {
      return this.definition.controllerConstructor;
    }
    get contexts() {
      return Array.from(this.connectedContexts);
    }
    connectContextForScope(scope) {
      const context = this.fetchContextForScope(scope);
      this.connectedContexts.add(context);
      context.connect();
    }
    disconnectContextForScope(scope) {
      const context = this.contextsByScope.get(scope);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    }
    fetchContextForScope(scope) {
      let context = this.contextsByScope.get(scope);
      if (!context) {
        context = new Context(this, scope);
        this.contextsByScope.set(scope, context);
      }
      return context;
    }
  };
  var ClassMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    has(name) {
      return this.data.has(this.getDataKey(name));
    }
    get(name) {
      return this.getAll(name)[0];
    }
    getAll(name) {
      const tokenString = this.data.get(this.getDataKey(name)) || "";
      return tokenize(tokenString);
    }
    getAttributeName(name) {
      return this.data.getAttributeNameForKey(this.getDataKey(name));
    }
    getDataKey(name) {
      return `${name}-class`;
    }
    get data() {
      return this.scope.data;
    }
  };
  var DataMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get(key) {
      const name = this.getAttributeNameForKey(key);
      return this.element.getAttribute(name);
    }
    set(key, value) {
      const name = this.getAttributeNameForKey(key);
      this.element.setAttribute(name, value);
      return this.get(key);
    }
    has(key) {
      const name = this.getAttributeNameForKey(key);
      return this.element.hasAttribute(name);
    }
    delete(key) {
      if (this.has(key)) {
        const name = this.getAttributeNameForKey(key);
        this.element.removeAttribute(name);
        return true;
      } else {
        return false;
      }
    }
    getAttributeNameForKey(key) {
      return `data-${this.identifier}-${dasherize(key)}`;
    }
  };
  var Guide = class {
    constructor(logger) {
      this.warnedKeysByObject = new WeakMap();
      this.logger = logger;
    }
    warn(object, key, message) {
      let warnedKeys = this.warnedKeysByObject.get(object);
      if (!warnedKeys) {
        warnedKeys = new Set();
        this.warnedKeysByObject.set(object, warnedKeys);
      }
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        this.logger.warn(message, object);
      }
    }
  };
  function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`;
  }
  var TargetSet = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(targetName) {
      return this.find(targetName) != null;
    }
    find(...targetNames) {
      return targetNames.reduce((target, targetName) => target || this.findTarget(targetName) || this.findLegacyTarget(targetName), void 0);
    }
    findAll(...targetNames) {
      return targetNames.reduce((targets, targetName) => [
        ...targets,
        ...this.findAllTargets(targetName),
        ...this.findAllLegacyTargets(targetName)
      ], []);
    }
    findTarget(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findElement(selector);
    }
    findAllTargets(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findAllElements(selector);
    }
    getSelectorForTargetName(targetName) {
      const attributeName = this.schema.targetAttributeForScope(this.identifier);
      return attributeValueContainsToken(attributeName, targetName);
    }
    findLegacyTarget(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.deprecate(this.scope.findElement(selector), targetName);
    }
    findAllLegacyTargets(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.scope.findAllElements(selector).map((element) => this.deprecate(element, targetName));
    }
    getLegacySelectorForTargetName(targetName) {
      const targetDescriptor = `${this.identifier}.${targetName}`;
      return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
    }
    deprecate(element, targetName) {
      if (element) {
        const { identifier } = this;
        const attributeName = this.schema.targetAttribute;
        const revisedAttributeName = this.schema.targetAttributeForScope(identifier);
        this.guide.warn(element, `target:${targetName}`, `Please replace ${attributeName}="${identifier}.${targetName}" with ${revisedAttributeName}="${targetName}". The ${attributeName} attribute is deprecated and will be removed in a future version of Stimulus.`);
      }
      return element;
    }
    get guide() {
      return this.scope.guide;
    }
  };
  var Scope = class {
    constructor(schema, element, identifier, logger) {
      this.targets = new TargetSet(this);
      this.classes = new ClassMap(this);
      this.data = new DataMap(this);
      this.containsElement = (element2) => {
        return element2.closest(this.controllerSelector) === this.element;
      };
      this.schema = schema;
      this.element = element;
      this.identifier = identifier;
      this.guide = new Guide(logger);
    }
    findElement(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }
    findAllElements(selector) {
      return [
        ...this.element.matches(selector) ? [this.element] : [],
        ...this.queryElements(selector).filter(this.containsElement)
      ];
    }
    queryElements(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    }
    get controllerSelector() {
      return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
    }
  };
  var ScopeObserver = class {
    constructor(element, schema, delegate) {
      this.element = element;
      this.schema = schema;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
      this.scopesByIdentifierByElement = new WeakMap();
      this.scopeReferenceCounts = new WeakMap();
    }
    start() {
      this.valueListObserver.start();
    }
    stop() {
      this.valueListObserver.stop();
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    parseValueForToken(token) {
      const { element, content: identifier } = token;
      const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      let scope = scopesByIdentifier.get(identifier);
      if (!scope) {
        scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope);
      }
      return scope;
    }
    elementMatchedValue(element, value) {
      const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    }
    elementUnmatchedValue(element, value) {
      const referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    }
    fetchScopesByIdentifierForElement(element) {
      let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    }
  };
  var Router = class {
    constructor(application2) {
      this.application = application2;
      this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = new Map();
    }
    get element() {
      return this.application.element;
    }
    get schema() {
      return this.application.schema;
    }
    get logger() {
      return this.application.logger;
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    get modules() {
      return Array.from(this.modulesByIdentifier.values());
    }
    get contexts() {
      return this.modules.reduce((contexts, module) => contexts.concat(module.contexts), []);
    }
    start() {
      this.scopeObserver.start();
    }
    stop() {
      this.scopeObserver.stop();
    }
    loadDefinition(definition) {
      this.unloadIdentifier(definition.identifier);
      const module = new Module(this.application, definition);
      this.connectModule(module);
    }
    unloadIdentifier(identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        this.disconnectModule(module);
      }
    }
    getContextForElementAndIdentifier(element, identifier) {
      const module = this.modulesByIdentifier.get(identifier);
      if (module) {
        return module.contexts.find((context) => context.element == element);
      }
    }
    handleError(error2, message, detail) {
      this.application.handleError(error2, message, detail);
    }
    createScopeForElementAndIdentifier(element, identifier) {
      return new Scope(this.schema, element, identifier, this.logger);
    }
    scopeConnected(scope) {
      this.scopesByIdentifier.add(scope.identifier, scope);
      const module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.connectContextForScope(scope);
      }
    }
    scopeDisconnected(scope) {
      this.scopesByIdentifier.delete(scope.identifier, scope);
      const module = this.modulesByIdentifier.get(scope.identifier);
      if (module) {
        module.disconnectContextForScope(scope);
      }
    }
    connectModule(module) {
      this.modulesByIdentifier.set(module.identifier, module);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope) => module.connectContextForScope(scope));
    }
    disconnectModule(module) {
      this.modulesByIdentifier.delete(module.identifier);
      const scopes = this.scopesByIdentifier.getValuesForKey(module.identifier);
      scopes.forEach((scope) => module.disconnectContextForScope(scope));
    }
  };
  var defaultSchema = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target",
    targetAttributeForScope: (identifier) => `data-${identifier}-target`
  };
  var Application = class {
    constructor(element = document.documentElement, schema = defaultSchema) {
      this.logger = console;
      this.debug = false;
      this.logDebugActivity = (identifier, functionName, detail = {}) => {
        if (this.debug) {
          this.logFormattedMessage(identifier, functionName, detail);
        }
      };
      this.element = element;
      this.schema = schema;
      this.dispatcher = new Dispatcher(this);
      this.router = new Router(this);
    }
    static start(element, schema) {
      const application2 = new Application(element, schema);
      application2.start();
      return application2;
    }
    async start() {
      await domReady();
      this.logDebugActivity("application", "starting");
      this.dispatcher.start();
      this.router.start();
      this.logDebugActivity("application", "start");
    }
    stop() {
      this.logDebugActivity("application", "stopping");
      this.dispatcher.stop();
      this.router.stop();
      this.logDebugActivity("application", "stop");
    }
    register(identifier, controllerConstructor) {
      if (controllerConstructor.shouldLoad) {
        this.load({ identifier, controllerConstructor });
      }
    }
    load(head, ...rest) {
      const definitions = Array.isArray(head) ? head : [head, ...rest];
      definitions.forEach((definition) => this.router.loadDefinition(definition));
    }
    unload(head, ...rest) {
      const identifiers = Array.isArray(head) ? head : [head, ...rest];
      identifiers.forEach((identifier) => this.router.unloadIdentifier(identifier));
    }
    get controllers() {
      return this.router.contexts.map((context) => context.controller);
    }
    getControllerForElementAndIdentifier(element, identifier) {
      const context = this.router.getContextForElementAndIdentifier(element, identifier);
      return context ? context.controller : null;
    }
    handleError(error2, message, detail) {
      var _a;
      this.logger.error(`%s

%o

%o`, message, error2, detail);
      (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error2);
    }
    logFormattedMessage(identifier, functionName, detail = {}) {
      detail = Object.assign({ application: this }, detail);
      this.logger.groupCollapsed(`${identifier} #${functionName}`);
      this.logger.log("details:", Object.assign({}, detail));
      this.logger.groupEnd();
    }
  };
  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState == "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }
  function ClassPropertiesBlessing(constructor) {
    const classes = readInheritableStaticArrayValues(constructor, "classes");
    return classes.reduce((properties, classDefinition) => {
      return Object.assign(properties, propertiesForClassDefinition(classDefinition));
    }, {});
  }
  function propertiesForClassDefinition(key) {
    return {
      [`${key}Class`]: {
        get() {
          const { classes } = this;
          if (classes.has(key)) {
            return classes.get(key);
          } else {
            const attribute = classes.getAttributeName(key);
            throw new Error(`Missing attribute "${attribute}"`);
          }
        }
      },
      [`${key}Classes`]: {
        get() {
          return this.classes.getAll(key);
        }
      },
      [`has${capitalize(key)}Class`]: {
        get() {
          return this.classes.has(key);
        }
      }
    };
  }
  function TargetPropertiesBlessing(constructor) {
    const targets = readInheritableStaticArrayValues(constructor, "targets");
    return targets.reduce((properties, targetDefinition) => {
      return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
    }, {});
  }
  function propertiesForTargetDefinition(name) {
    return {
      [`${name}Target`]: {
        get() {
          const target = this.targets.find(name);
          if (target) {
            return target;
          } else {
            throw new Error(`Missing target element "${name}" for "${this.identifier}" controller`);
          }
        }
      },
      [`${name}Targets`]: {
        get() {
          return this.targets.findAll(name);
        }
      },
      [`has${capitalize(name)}Target`]: {
        get() {
          return this.targets.has(name);
        }
      }
    };
  }
  function ValuePropertiesBlessing(constructor) {
    const valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
    const propertyDescriptorMap = {
      valueDescriptorMap: {
        get() {
          return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
            const valueDescriptor = parseValueDefinitionPair(valueDefinitionPair);
            const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
            return Object.assign(result, { [attributeName]: valueDescriptor });
          }, {});
        }
      }
    };
    return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
      return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
    }, propertyDescriptorMap);
  }
  function propertiesForValueDefinitionPair(valueDefinitionPair) {
    const definition = parseValueDefinitionPair(valueDefinitionPair);
    const { key, name, reader: read2, writer: write2 } = definition;
    return {
      [name]: {
        get() {
          const value = this.data.get(key);
          if (value !== null) {
            return read2(value);
          } else {
            return definition.defaultValue;
          }
        },
        set(value) {
          if (value === void 0) {
            this.data.delete(key);
          } else {
            this.data.set(key, write2(value));
          }
        }
      },
      [`has${capitalize(name)}`]: {
        get() {
          return this.data.has(key) || definition.hasCustomDefaultValue;
        }
      }
    };
  }
  function parseValueDefinitionPair([token, typeDefinition]) {
    return valueDescriptorForTokenAndTypeDefinition(token, typeDefinition);
  }
  function parseValueTypeConstant(constant) {
    switch (constant) {
      case Array:
        return "array";
      case Boolean:
        return "boolean";
      case Number:
        return "number";
      case Object:
        return "object";
      case String:
        return "string";
    }
  }
  function parseValueTypeDefault(defaultValue) {
    switch (typeof defaultValue) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      case "string":
        return "string";
    }
    if (Array.isArray(defaultValue))
      return "array";
    if (Object.prototype.toString.call(defaultValue) === "[object Object]")
      return "object";
  }
  function parseValueTypeObject(typeObject) {
    const typeFromObject = parseValueTypeConstant(typeObject.type);
    if (typeFromObject) {
      const defaultValueType = parseValueTypeDefault(typeObject.default);
      if (typeFromObject !== defaultValueType) {
        throw new Error(`Type "${typeFromObject}" must match the type of the default value. Given default value: "${typeObject.default}" as "${defaultValueType}"`);
      }
      return typeFromObject;
    }
  }
  function parseValueTypeDefinition(typeDefinition) {
    const typeFromObject = parseValueTypeObject(typeDefinition);
    const typeFromDefaultValue = parseValueTypeDefault(typeDefinition);
    const typeFromConstant = parseValueTypeConstant(typeDefinition);
    const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
    if (type)
      return type;
    throw new Error(`Unknown value type "${typeDefinition}"`);
  }
  function defaultValueForDefinition(typeDefinition) {
    const constant = parseValueTypeConstant(typeDefinition);
    if (constant)
      return defaultValuesByType[constant];
    const defaultValue = typeDefinition.default;
    if (defaultValue !== void 0)
      return defaultValue;
    return typeDefinition;
  }
  function valueDescriptorForTokenAndTypeDefinition(token, typeDefinition) {
    const key = `${dasherize(token)}-value`;
    const type = parseValueTypeDefinition(typeDefinition);
    return {
      type,
      key,
      name: camelize(key),
      get defaultValue() {
        return defaultValueForDefinition(typeDefinition);
      },
      get hasCustomDefaultValue() {
        return parseValueTypeDefault(typeDefinition) !== void 0;
      },
      reader: readers[type],
      writer: writers[type] || writers.default
    };
  }
  var defaultValuesByType = {
    get array() {
      return [];
    },
    boolean: false,
    number: 0,
    get object() {
      return {};
    },
    string: ""
  };
  var readers = {
    array(value) {
      const array = JSON.parse(value);
      if (!Array.isArray(array)) {
        throw new TypeError("Expected array");
      }
      return array;
    },
    boolean(value) {
      return !(value == "0" || value == "false");
    },
    number(value) {
      return Number(value);
    },
    object(value) {
      const object = JSON.parse(value);
      if (object === null || typeof object != "object" || Array.isArray(object)) {
        throw new TypeError("Expected object");
      }
      return object;
    },
    string(value) {
      return value;
    }
  };
  var writers = {
    default: writeString,
    array: writeJSON,
    object: writeJSON
  };
  function writeJSON(value) {
    return JSON.stringify(value);
  }
  function writeString(value) {
    return `${value}`;
  }
  var Controller = class {
    constructor(context) {
      this.context = context;
    }
    static get shouldLoad() {
      return true;
    }
    get application() {
      return this.context.application;
    }
    get scope() {
      return this.context.scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get targets() {
      return this.scope.targets;
    }
    get classes() {
      return this.scope.classes;
    }
    get data() {
      return this.scope.data;
    }
    initialize() {
    }
    connect() {
    }
    disconnect() {
    }
    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
      const type = prefix ? `${prefix}:${eventName}` : eventName;
      const event = new CustomEvent(type, { detail, bubbles, cancelable });
      target.dispatchEvent(event);
      return event;
    }
  };
  Controller.blessings = [ClassPropertiesBlessing, TargetPropertiesBlessing, ValuePropertiesBlessing];
  Controller.targets = [];
  Controller.values = {};

  // controllers/configs_controller.js
  var configs_controller_exports = {};
  __export(configs_controller_exports, {
    default: () => configs_controller_default
  });
  var configs_controller_default = class extends Controller {
    connect() {
      this.goToAnchor();
    }
    goToAnchor() {
      let anchor = window.location.hash.substr(1);
      this.tabGroupTarget.show(anchor);
    }
  };
  __publicField(configs_controller_default, "targets", ["tabGroup"]);

  // controllers/reading_list_controller.js
  var reading_list_controller_exports = {};
  __export(reading_list_controller_exports, {
    default: () => reading_list_controller_default
  });
  var reading_list_controller_default = class extends Controller {
    connect() {
      this.resetOptions();
      this.goToAnchor();
    }
    resetOptions() {
      let firstSort = this.containerTarget.querySelector("rl-sorts input:first-of-type");
      if (firstSort) {
        firstSort.checked = true;
      }
      let filters = this.filtersTarget.querySelectorAll("input");
      for (const filter of filters) {
        filter.checked = true;
      }
      let starRatingFilter = this.filtersTarget.querySelector("#filter-rating-star");
      if (starRatingFilter) {
        starRatingFilter.checked = false;
      }
    }
    goToAnchor() {
      let anchor = window.location.hash.substr(1);
      if (anchor == "planned") {
        this.containerTarget.querySelector("sl-tab-group").show("planned");
      } else {
        let anchorItem = this.tableTarget.querySelector(`.rl-item[item-id='${anchor}']`);
        if (anchorItem != null) {
          anchorItem.show();
          anchorItem.scrollIntoView();
        }
      }
    }
    toggleRatingCheckboxes(event) {
      let newState = event.currentTarget.checked;
      let ratings = this.filtersTarget.querySelectorAll('[id^="filter-rating-"]');
      for (const rating of ratings) {
        rating.checked = newState;
      }
      this.filter();
    }
    toggleGenreCheckboxes(event) {
      let newState = event.currentTarget.checked;
      let genres = this.filtersTarget.querySelectorAll('[id^="filter-genre-"]');
      for (const genre of genres) {
        genre.checked = newState;
      }
      this.filter();
    }
    expandFilters(event) {
      event.target.display = "none";
      event.target.parentElement.textContent = "Filters: ";
      this.filtersTarget.classList.add("expanded");
      this.filtersTarget.classList.remove("collapsed");
    }
    filter() {
      let selectedGenres = Array.from(this.filtersTarget.querySelectorAll('[id^="filter-genre-"]')).map((genre) => {
        if (genre.checked)
          return genre.value;
        else
          return null;
      }).filter((genre) => genre);
      let selectedRatings = Array.from(this.filtersTarget.querySelectorAll('[id^="filter-rating-"]')).map((rating) => {
        if (rating.checked)
          return rating.value;
        else
          return null;
      }).filter((rating) => rating);
      this.tableTarget.querySelectorAll(".rl-item").forEach((item) => {
        let byRating = this.showByRating(item, selectedRatings);
        let byGenre = this.showByGenre(item, selectedGenres);
        if (byRating && byGenre) {
          if (item.parentElement.tagName == "HIDDEN-ITEM-WRAPPER") {
            item.style.display = "block";
            item.parentElement.outerHTML = item.outerHTML;
          }
        } else if (item.parentElement.tagName != "HIDDEN-ITEM-WRAPPER") {
          item.style.display = "none";
          item.outerHTML = "<hidden-item-wrapper>" + item.outerHTML + "</hidden-item-wrapper>";
        }
      });
      this.plannedTableTarget.querySelectorAll(".rl-item").forEach((item) => {
        let byGenre = this.showByGenre(item, selectedGenres);
        if (byGenre) {
          if (item.parentElement.tagName == "HIDDEN-ITEM-WRAPPER") {
            item.style.display = "block";
            item.parentElement.outerHTML = item.outerHTML;
          }
        } else if (item.parentElement.tagName != "HIDDEN-ITEM-WRAPPER") {
          item.style.display = "none";
          item.outerHTML = "<hidden-item-wrapper>" + item.outerHTML + "</hidden-item-wrapper>";
        }
      });
    }
    showByRating(item, selectedRatings) {
      let itemRating = item.querySelector("rl-rating").textContent.trim();
      let starRatingFilter = this.filtersTarget.querySelector("#filter-rating-star");
      if (starRatingFilter) {
        if (!starRatingFilter.checked) {
          return true;
        } else {
          if (itemRating == "\u2B50") {
            return true;
          }
          return false;
        }
      } else {
        return selectedRatings.includes(itemRating);
      }
    }
    showByGenre(item, selectedGenres) {
      let itemGenres = Array.from(item.querySelectorAll("rl-genre")).map((genre) => genre.textContent);
      let intersection = itemGenres.filter((g2) => selectedGenres.includes(g2.trim()));
      if (intersection.length == 0) {
        return false;
      }
      return true;
    }
    sort() {
      let selectedSort = this.containerTarget.querySelector("rl-sorts input:checked").value;
      if (this.multipleValuesAreVisible(selectedSort)) {
        let sorted = Array.from(this.tableTarget.children).sort((itemA, itemB) => {
          let valueA = itemA.querySelector("rl-" + selectedSort).textContent.trim();
          let valueB = itemB.querySelector("rl-" + selectedSort).textContent.trim();
          if (valueA > valueB || valueA == "in progress")
            return 1;
          else if (valueA < valueB)
            return -1;
          else {
            let nameA = itemA.querySelector("rl-name").textContent.trim().toLowerCase();
            let nameB = itemB.querySelector("rl-name").textContent.trim().toLowerCase();
            if (nameA > nameB)
              return -1;
            else if (nameA < nameB)
              return 1;
            else
              return 0;
          }
        }).reverse();
        sorted.forEach((item) => this.tableTarget.appendChild(item));
      }
    }
    multipleValuesAreVisible(valueName) {
      let visibleValues = Array.from(this.tableTarget.querySelectorAll("rl-" + valueName)).filter((el) => !this.isDescendant(el, "HIDDEN-ITEM-WRAPPER")).map((el) => el.textContent.trim());
      function unique(value, index, self2) {
        return self2.indexOf(value) === index;
      }
      return visibleValues.filter(unique).length > 1;
    }
    isDescendant(child, ancestorTagName) {
      let node = child.parentNode;
      while (node != null) {
        if (node.tagName == ancestorTagName) {
          return true;
        }
        node = node.parentNode;
      }
      return false;
    }
  };
  __publicField(reading_list_controller_default, "targets", ["container", "filters", "table", "plannedTable"]);

  // rails:/home/felipe/working/plainreading/app/javascript/controllers/*_controller.js
  var modules = [{ name: "controllers--configs", module: configs_controller_exports, filename: "./controllers/configs_controller.js" }, { name: "controllers--reading-list", module: reading_list_controller_exports, filename: "./controllers/reading_list_controller.js" }];
  var controller_default = modules;

  // stimulus-setup.js
  var application = Application.start();
  application.warnings = true;
  application.debug = false;
  window.Stimulus = application;
  namePrefix = "controllers--";
  controller_default.forEach((controller) => {
    application.register(controller.name.substring(namePrefix.length), controller.module.default);
  });
  document.addEventListener("turbo:before-cache", () => {
    if (document.querySelector("sl-tab-group")) {
      document.hideContentBeforeCache();
    }
  });
  document.hideContentBeforeCache = () => {
    document.querySelector("main.container").style.visibility = "hidden";
    document.querySelector("footer").style.visibility = "hidden";
  };
  document.addEventListener("turbo:load", () => {
    document.adjustForShoelaceComponents();
  });
  document.adjustForShoelaceComponents = () => {
    if (document.querySelector("sl-tab-group")) {
      document.unhideContentOnRestoration();
      document.delayFooterAppearance();
    }
  };
  document.unhideContentOnRestoration = () => {
    if (!document.isPreview()) {
      document.querySelector("main.container").style.visibility = "visible";
      document.querySelector("footer").style.visibility = "visible";
    }
  };
  document.isPreview = () => {
    return document.documentElement.hasAttribute("data-turbo-preview");
  };
  document.delayFooterAppearance = () => {
    document.querySelector("footer").style.visibility = "hidden";
    let aWhile = 10;
    let resetFooter = function() {
      document.querySelector("footer").style.visibility = "visible";
    };
    setTimeout(resetFooter, aWhile);
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GADG7AUG.js
  function getBoundingClientRect(element) {
    var rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      x: rect.left,
      y: rect.top
    };
  }
  function getWindow(node) {
    if (node.toString() !== "[object Window]") {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return {
      scrollLeft,
      scrollTop
    };
  }
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }
  function getHTMLElementScroll(element) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }
  function getDocumentElement(element) {
    return ((isElement(element) ? element.ownerDocument : element.document) || window.document).documentElement;
  }
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
  }
  function getComputedStyle2(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement);
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    var scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    var offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== "body" || isScrollParent(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }
  function getLayoutRect(element) {
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return element.assignedSlot || element.parentNode || (isShadowRoot(element) ? element.host : null) || getDocumentElement(element);
  }
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
    var updatedList = list.concat(target);
    return isBody ? updatedList : updatedList.concat(listScrollParents(getParentNode(target)));
  }
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    var currentNode = getParentNode(element);
    while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
      var css = getComputedStyle2(currentNode);
      if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].includes(css.willChange) || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window2 = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start2 = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
    return acc.concat([placement + "-" + start2, placement + "-" + end]);
  }, []);
  var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
    return acc.concat([placement, placement + "-" + start2, placement + "-" + end]);
  }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];
  function order(modifiers) {
    var map = new Map();
    var visited = new Set();
    var result = [];
    modifiers.forEach(function(modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
      requires.forEach(function(dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function(modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function(acc, phase) {
      return acc.concat(orderedModifiers.filter(function(modifier) {
        return modifier.phase === phase;
      }));
    }, []);
  }
  function debounce(fn2) {
    var pending;
    return function() {
      if (!pending) {
        pending = new Promise(function(resolve) {
          Promise.resolve().then(function() {
            pending = void 0;
            resolve(fn2());
          });
        });
      }
      return pending;
    };
  }
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function(merged2, current) {
      var existing = merged2[current.name];
      merged2[current.name] = existing ? Object.assign({}, existing, current, {
        options: Object.assign({}, existing.options, current.options),
        data: Object.assign({}, existing.data, current.data)
      }) : current;
      return merged2;
    }, {});
    return Object.keys(merged).map(function(key) {
      return merged[key];
    });
  }
  function getViewportRect(element) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x2 = 0;
    var y2 = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        x2 = visualViewport.offsetLeft;
        y2 = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x: x2 + getWindowScrollBarX(element),
      y: y2
    };
  }
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    var x2 = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y2 = -winScroll.scrollTop;
    if (getComputedStyle2(body || html).direction === "rtl") {
      x2 += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x: x2,
      y: y2
    };
  }
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    });
  }
  function getInnerBoundingClientRect(element) {
    var rect = getBoundingClientRect(element);
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent) {
    return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isHTMLElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents2 = listScrollParents(getParentNode(element));
    var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
    var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents2.filter(function(clippingParent) {
      return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
    });
  }
  function getClippingRect(element, boundary, rootBoundary) {
    var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
    var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents2[0];
    var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
      var rect = getClientRectFromMixedType(element, clippingParent);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromMixedType(element, firstClippingParent));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }
  function getVariation(placement) {
    return placement.split("-")[1];
  }
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }
  function computeOffsets(_ref) {
    var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference2.x + reference2.width / 2 - element.width / 2;
    var commonY = reference2.y + reference2.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = {
          x: commonX,
          y: reference2.y - element.height
        };
        break;
      case bottom:
        offsets = {
          x: commonX,
          y: reference2.y + reference2.height
        };
        break;
      case right:
        offsets = {
          x: reference2.x + reference2.width,
          y: commonY
        };
        break;
      case left:
        offsets = {
          x: reference2.x - element.width,
          y: commonY
        };
        break;
      default:
        offsets = {
          x: reference2.x,
          y: reference2.y
        };
    }
    var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start2:
          offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
          break;
        default:
      }
    }
    return offsets;
  }
  function getFreshSideObject() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }
  function expandToHashMap(value, keys) {
    return keys.reduce(function(hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    var altContext = elementContext === popper ? reference : popper;
    var referenceElement = state.elements.reference;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
    var referenceClientRect = getBoundingClientRect(referenceElement);
    var popperOffsets2 = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement
    });
    var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
    var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset2 = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function(key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset2[axis] * multiply;
      });
    }
    return overflowOffsets;
  }
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute"
  };
  function areValidElements() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return !args.some(function(element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions2 = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
    return function createPopper2(reference2, popper2, options) {
      if (options === void 0) {
        options = defaultOptions2;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions2),
        modifiersData: {},
        elements: {
          reference: reference2,
          popper: popper2
        },
        attributes: {},
        styles: {}
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state,
        setOptions: function setOptions(options2) {
          cleanupModifierEffects();
          state.options = Object.assign({}, defaultOptions2, state.options, options2);
          state.scrollParents = {
            reference: isElement(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
            popper: listScrollParents(popper2)
          };
          var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
          state.orderedModifiers = orderedModifiers.filter(function(m2) {
            return m2.enabled;
          });
          if (false) {
            var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function(_ref) {
              var name = _ref.name;
              return name;
            });
            validateModifiers(modifiers);
            if (getBasePlacement(state.options.placement) === auto) {
              var flipModifier = state.orderedModifiers.find(function(_ref2) {
                var name = _ref2.name;
                return name === "flip";
              });
              if (!flipModifier) {
                console.error(['Popper: "auto" placements require the "flip" modifier be', "present and enabled to work."].join(" "));
              }
            }
            var _getComputedStyle = getComputedStyle2(popper2), marginTop = _getComputedStyle.marginTop, marginRight = _getComputedStyle.marginRight, marginBottom = _getComputedStyle.marginBottom, marginLeft = _getComputedStyle.marginLeft;
            if ([marginTop, marginRight, marginBottom, marginLeft].some(function(margin) {
              return parseFloat(margin);
            })) {
              console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', "between the popper and its reference element or boundary.", "To replicate margin, use the `offset` modifier, as well as", "the `padding` option in the `preventOverflow` and `flip`", "modifiers."].join(" "));
            }
          }
          runModifierEffects();
          return instance.update();
        },
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
          if (!areValidElements(reference3, popper3)) {
            if (false) {
              console.error(INVALID_ELEMENT_ERROR);
            }
            return;
          }
          state.rects = {
            reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
            popper: getLayoutRect(popper3)
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function(modifier) {
            return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
          });
          var __debug_loops__ = 0;
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (false) {
              __debug_loops__ += 1;
              if (__debug_loops__ > 100) {
                console.error(INFINITE_LOOP_ERROR);
                break;
              }
            }
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
            if (typeof fn2 === "function") {
              state = fn2({
                state,
                options: _options,
                name,
                instance
              }) || state;
            }
          }
        },
        update: debounce(function() {
          return new Promise(function(resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        }
      };
      if (!areValidElements(reference2, popper2)) {
        if (false) {
          console.error(INVALID_ELEMENT_ERROR);
        }
        return instance;
      }
      instance.setOptions(options).then(function(state2) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state2);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function(_ref3) {
          var name = _ref3.name, _ref3$options = _ref3.options, options2 = _ref3$options === void 0 ? {} : _ref3$options, effect4 = _ref3.effect;
          if (typeof effect4 === "function") {
            var cleanupFn = effect4({
              state,
              name,
              instance,
              options: options2
            });
            var noopFn = function noopFn2() {
            };
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function(fn2) {
          return fn2();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }
  var passive = {
    passive: true
  };
  function effect(_ref) {
    var state = _ref.state, instance = _ref.instance, options = _ref.options;
    var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
    var window2 = getWindow(state.elements.popper);
    var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.addEventListener("resize", instance.update, passive);
    }
    return function() {
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  var eventListeners_default = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {
    },
    effect,
    data: {}
  };
  function popperOffsets(_ref) {
    var state = _ref.state, name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement
    });
  }
  var popperOffsets_default = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {}
  };
  var unsetSides = {
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto"
  };
  function roundOffsetsByDPR(_ref) {
    var x2 = _ref.x, y2 = _ref.y;
    var win = window;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(round(x2 * dpr) / dpr) || 0,
      y: round(round(y2 * dpr) / dpr) || 0
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets;
    var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === "function" ? roundOffsets(offsets) : offsets, _ref3$x = _ref3.x, x2 = _ref3$x === void 0 ? 0 : _ref3$x, _ref3$y = _ref3.y, y2 = _ref3$y === void 0 ? 0 : _ref3$y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper2);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper2)) {
        offsetParent = getDocumentElement(popper2);
        if (getComputedStyle2(offsetParent).position !== "static") {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      if (placement === top) {
        sideY = bottom;
        y2 -= offsetParent[heightProp] - popperRect.height;
        y2 *= gpuAcceleration ? 1 : -1;
      }
      if (placement === left) {
        sideX = right;
        x2 -= offsetParent[widthProp] - popperRect.width;
        x2 *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign({
      position
    }, adaptive && unsetSides);
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) < 2 ? "translate(" + x2 + "px, " + y2 + "px)" : "translate3d(" + x2 + "px, " + y2 + "px, 0)", _Object$assign));
    }
    return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y2 + "px" : "", _Object$assign2[sideX] = hasX ? x2 + "px" : "", _Object$assign2.transform = "", _Object$assign2));
  }
  function computeStyles(_ref4) {
    var state = _ref4.state, options = _ref4.options;
    var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    if (false) {
      var transitionProperty = getComputedStyle2(state.elements.popper).transitionProperty || "";
      if (adaptive && ["transform", "top", "right", "bottom", "left"].some(function(property) {
        return transitionProperty.indexOf(property) >= 0;
      })) {
        console.warn(["Popper: Detected CSS transitions on at least one of the following", 'CSS properties: "transform", "top", "right", "bottom", "left".', "\n\n", 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', "for smooth transitions, or remove these properties from the CSS", "transition declaration on the popper element if only transitioning", "opacity or background-color for example.", "\n\n", "We recommend using the popper element as a wrapper around an inner", "element that can have any CSS property transitioned for animations."].join(" "));
      }
    }
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.popperOffsets,
        position: state.options.strategy,
        adaptive,
        roundOffsets
      })));
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
        offsets: state.modifiersData.arrow,
        position: "absolute",
        adaptive: false,
        roundOffsets
      })));
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement
    });
  }
  var computeStyles_default = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {}
  };
  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function(name) {
      var style2 = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name];
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style2);
      Object.keys(attributes).forEach(function(name2) {
        var value = attributes[name2];
        if (value === false) {
          element.removeAttribute(name2);
        } else {
          element.setAttribute(name2, value === true ? "" : value);
        }
      });
    });
  }
  function effect2(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: "0",
        top: "0",
        margin: "0"
      },
      arrow: {
        position: "absolute"
      },
      reference: {}
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return function() {
      Object.keys(state.elements).forEach(function(name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
        var style2 = styleProperties.reduce(function(style22, property) {
          style22[property] = "";
          return style22;
        }, {});
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style2);
        Object.keys(attributes).forEach(function(attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  }
  var applyStyles_default = {
    name: "applyStyles",
    enabled: true,
    phase: "write",
    fn: applyStyles,
    effect: effect2,
    requires: ["computeStyles"]
  };
  function distanceAndSkiddingToXY(placement, rects, offset2) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
      placement
    })) : offset2, skidding = _ref[0], distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0 ? {
      x: distance,
      y: skidding
    } : {
      x: skidding,
      y: distance
    };
  }
  function offset(_ref2) {
    var state = _ref2.state, options = _ref2.options, name = _ref2.name;
    var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function(acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement], x2 = _data$state$placement.x, y2 = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x2;
      state.modifiersData.popperOffsets.y += y2;
    }
    state.modifiersData[name] = data;
  }
  var offset_default = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset
  };
  var hash = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function(matched) {
      return hash[matched];
    });
  }
  var hash2 = {
    start: "end",
    end: "start"
  };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function(matched) {
      return hash2[matched];
    });
  }
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
      return getVariation(placement2) === variation;
    }) : basePlacements;
    var allowedPlacements = placements2.filter(function(placement2) {
      return allowedAutoPlacements.indexOf(placement2) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements2;
      if (false) {
        console.error(["Popper: The `allowedAutoPlacements` option did not allow any", "placements. Ensure the `placement` option matches the variation", "of the allowed placements.", 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(" "));
      }
    }
    var overflows = allowedPlacements.reduce(function(acc, placement2) {
      acc[placement2] = detectOverflow(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding
      })[getBasePlacement(placement2)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function(a2, b2) {
      return overflows[a2] - overflows[b2];
    });
  }
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
  }
  function flip(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
    var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
      return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
        placement: placement2,
        boundary,
        rootBoundary,
        padding,
        flipVariations,
        allowedAutoPlacements
      }) : placement2);
    }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements2[0];
    for (var i4 = 0; i4 < placements2.length; i4++) {
      var placement = placements2[i4];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start2;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement,
        boundary,
        rootBoundary,
        altBoundary,
        padding
      });
      var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
      }
      if (checks.every(function(check) {
        return check;
      })) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop2(_i2) {
        var fittingPlacement = placements2.find(function(placement2) {
          var checks2 = checksMap.get(placement2);
          if (checks2) {
            return checks2.slice(0, _i2).every(function(check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break")
          break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  var flip_default = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: {
      _skip: false
    }
  };
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }
  function within(min2, value, max2) {
    return max(min2, min(value, max2));
  }
  function preventOverflow(_ref) {
    var state = _ref.state, options = _ref.options, name = _ref.name;
    var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary,
      rootBoundary,
      padding,
      altBoundary
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
      placement: state.placement
    })) : tetherOffset;
    var data = {
      x: 0,
      y: 0
    };
    if (!popperOffsets2) {
      return;
    }
    if (checkMainAxis || checkAltAxis) {
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset2 = popperOffsets2[mainAxis];
      var min2 = popperOffsets2[mainAxis] + overflow[mainSide];
      var max2 = popperOffsets2[mainAxis] - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start2 ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start2 ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
        width: 0,
        height: 0
      };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - tetherOffsetValue : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
      var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + tetherOffsetValue : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
      var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
      var offsetModifierValue = state.modifiersData.offset ? state.modifiersData.offset[state.placement][mainAxis] : 0;
      var tetherMin = popperOffsets2[mainAxis] + minOffset - offsetModifierValue - clientOffset;
      var tetherMax = popperOffsets2[mainAxis] + maxOffset - offsetModifierValue;
      if (checkMainAxis) {
        var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
        popperOffsets2[mainAxis] = preventedOffset;
        data[mainAxis] = preventedOffset - offset2;
      }
      if (checkAltAxis) {
        var _mainSide = mainAxis === "x" ? top : left;
        var _altSide = mainAxis === "x" ? bottom : right;
        var _offset = popperOffsets2[altAxis];
        var _min = _offset + overflow[_mainSide];
        var _max = _offset - overflow[_altSide];
        var _preventedOffset = within(tether ? min(_min, tetherMin) : _min, _offset, tether ? max(_max, tetherMax) : _max);
        popperOffsets2[altAxis] = _preventedOffset;
        data[altAxis] = _preventedOffset - _offset;
      }
    }
    state.modifiersData[name] = data;
  }
  var preventOverflow_default = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"]
  };
  var toPaddingObject = function toPaddingObject2(padding, state) {
    padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
      placement: state.placement
    })) : padding;
    return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state, name = _ref.name, options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets2 = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets2) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
    var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min2 = paddingObject[minProp];
    var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset2 = within(min2, center, max2);
    var axisProp = axis;
    state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
  }
  function effect3(_ref2) {
    var state = _ref2.state, options = _ref2.options;
    var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (false) {
      if (!isHTMLElement(arrowElement)) {
        console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', "To use an SVG arrow, wrap it in an HTMLElement that will be used as", "the arrow."].join(" "));
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      if (false) {
        console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', "element."].join(" "));
      }
      return;
    }
    state.elements.arrow = arrowElement;
  }
  var arrow_default = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect: effect3,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"]
  };
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = {
        x: 0,
        y: 0
      };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function(side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state, name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference"
    });
    var popperAltOverflow = detectOverflow(state, {
      altBoundary: true
    });
    var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
    var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets,
      popperEscapeOffsets,
      isReferenceHidden,
      hasPopperEscaped
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped
    });
  }
  var hide_default = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide
  };
  var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
  var createPopper = /* @__PURE__ */ popperGenerator({
    defaultModifiers
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.IHGPZX35.js
  var __create = Object.create;
  var __defProp2 = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a2, b2) => {
    for (var prop in b2 || (b2 = {}))
      if (__hasOwnProp.call(b2, prop))
        __defNormalProp2(a2, prop, b2[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b2)) {
        if (__propIsEnum.call(b2, prop))
          __defNormalProp2(a2, prop, b2[prop]);
      }
    return a2;
  };
  var __spreadProps = (a2, b2) => __defProps(a2, __getOwnPropDescs(b2));
  var __markAsModule2 = (target) => __defProp2(target, "__esModule", { value: true });
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export2 = (target, all) => {
    for (var name in all)
      __defProp2(target, name, { get: all[name], enumerable: true });
  };
  var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp2(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __reExport(__markAsModule2(__defProp2(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
  };
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
      if (decorator = decorators[i4])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result)
      __defProp2(target, key, result);
    return result;
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.NVGT36PI.js
  function animateTo(el, keyframes, options) {
    return new Promise(async (resolve) => {
      if ((options == null ? void 0 : options.duration) === Infinity) {
        throw new Error("Promise-based animations must be finite.");
      }
      const animation = el.animate(keyframes, __spreadProps(__spreadValues({}, options), {
        duration: prefersReducedMotion() ? 0 : options.duration
      }));
      animation.addEventListener("cancel", resolve, { once: true });
      animation.addEventListener("finish", resolve, { once: true });
    });
  }
  function parseDuration(delay) {
    delay = (delay + "").toLowerCase();
    if (delay.indexOf("ms") > -1) {
      return parseFloat(delay);
    }
    if (delay.indexOf("s") > -1) {
      return parseFloat(delay) * 1e3;
    }
    return parseFloat(delay);
  }
  function prefersReducedMotion() {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    return query == null ? void 0 : query.matches;
  }
  function stopAnimations(el) {
    return Promise.all(el.getAnimations().map((animation) => {
      return new Promise((resolve) => {
        const handleAnimationEvent = requestAnimationFrame(resolve);
        animation.addEventListener("cancel", () => handleAnimationEvent, { once: true });
        animation.addEventListener("finish", () => handleAnimationEvent, { once: true });
        animation.cancel();
      });
    }));
  }
  function shimKeyframesHeightAuto(keyframes, calculatedHeight) {
    return keyframes.map((keyframe) => Object.assign({}, keyframe, {
      height: keyframe.height === "auto" ? `${calculatedHeight}px` : keyframe.height
    }));
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.EVK2ASE6.js
  var defaultAnimationRegistry = new Map();
  var customAnimationRegistry = new WeakMap();
  function ensureAnimation(animation) {
    return animation != null ? animation : { keyframes: [], options: { duration: 0 } };
  }
  function setDefaultAnimation(animationName, animation) {
    defaultAnimationRegistry.set(animationName, ensureAnimation(animation));
  }
  function getAnimation(el, animationName) {
    const customAnimation = customAnimationRegistry.get(el);
    if (customAnimation && customAnimation[animationName]) {
      return customAnimation[animationName];
    }
    const defaultAnimation = defaultAnimationRegistry.get(animationName);
    if (defaultAnimation) {
      return defaultAnimation;
    }
    return {
      keyframes: [],
      options: { duration: 0 }
    };
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2JQPDYNA.js
  var t = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
  var e = (t23) => (...e24) => ({ _$litDirective$: t23, values: e24 });
  var i = class {
    constructor(t23) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t23, e24, i25) {
      this._$Ct = t23, this._$AM = e24, this._$Ci = i25;
    }
    _$AS(t23, e24) {
      return this.update(t23, e24);
    }
    update(t23, e24) {
      return this.render(...e24);
    }
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.X3WLUTHF.js
  var t2 = window.ShadowRoot && (window.ShadyCSS === void 0 || window.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
  var e2 = Symbol();
  var n = new Map();
  var s = class {
    constructor(t33, n52) {
      if (this._$cssResult$ = true, n52 !== e2)
        throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t33;
    }
    get styleSheet() {
      let e42 = n.get(this.cssText);
      return t2 && e42 === void 0 && (n.set(this.cssText, e42 = new CSSStyleSheet()), e42.replaceSync(this.cssText)), e42;
    }
    toString() {
      return this.cssText;
    }
  };
  var o = (t33) => new s(typeof t33 == "string" ? t33 : t33 + "", e2);
  var r = (t33, ...n52) => {
    const o52 = t33.length === 1 ? t33[0] : n52.reduce((e42, n6, s42) => e42 + ((t4) => {
      if (t4._$cssResult$ === true)
        return t4.cssText;
      if (typeof t4 == "number")
        return t4;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(n6) + t33[s42 + 1], t33[0]);
    return new s(o52, e2);
  };
  var i2 = (e42, n52) => {
    t2 ? e42.adoptedStyleSheets = n52.map((t33) => t33 instanceof CSSStyleSheet ? t33 : t33.styleSheet) : n52.forEach((t33) => {
      const n6 = document.createElement("style"), s42 = window.litNonce;
      s42 !== void 0 && n6.setAttribute("nonce", s42), n6.textContent = t33.cssText, e42.appendChild(n6);
    });
  };
  var S = t2 ? (t33) => t33 : (t33) => t33 instanceof CSSStyleSheet ? ((t4) => {
    let e42 = "";
    for (const n52 of t4.cssRules)
      e42 += n52.cssText;
    return o(e42);
  })(t33) : t33;
  var s2;
  var e22;
  var r2 = { toAttribute(t33, i32) {
    switch (i32) {
      case Boolean:
        t33 = t33 ? "" : null;
        break;
      case Object:
      case Array:
        t33 = t33 == null ? t33 : JSON.stringify(t33);
    }
    return t33;
  }, fromAttribute(t33, i32) {
    let s42 = t33;
    switch (i32) {
      case Boolean:
        s42 = t33 !== null;
        break;
      case Number:
        s42 = t33 === null ? null : Number(t33);
        break;
      case Object:
      case Array:
        try {
          s42 = JSON.parse(t33);
        } catch (t4) {
          s42 = null;
        }
    }
    return s42;
  } };
  var h = (t33, i32) => i32 !== t33 && (i32 == i32 || t33 == t33);
  var o2 = { attribute: true, type: String, converter: r2, reflect: false, hasChanged: h };
  var n2 = class extends HTMLElement {
    constructor() {
      super(), this._$Et = new Map(), this.isUpdatePending = false, this.hasUpdated = false, this._$Ei = null, this.o();
    }
    static addInitializer(t33) {
      var i32;
      (i32 = this.l) !== null && i32 !== void 0 || (this.l = []), this.l.push(t33);
    }
    static get observedAttributes() {
      this.finalize();
      const t33 = [];
      return this.elementProperties.forEach((i32, s42) => {
        const e42 = this._$Eh(s42, i32);
        e42 !== void 0 && (this._$Eu.set(e42, s42), t33.push(e42));
      }), t33;
    }
    static createProperty(t33, i32 = o2) {
      if (i32.state && (i32.attribute = false), this.finalize(), this.elementProperties.set(t33, i32), !i32.noAccessor && !this.prototype.hasOwnProperty(t33)) {
        const s42 = typeof t33 == "symbol" ? Symbol() : "__" + t33, e42 = this.getPropertyDescriptor(t33, s42, i32);
        e42 !== void 0 && Object.defineProperty(this.prototype, t33, e42);
      }
    }
    static getPropertyDescriptor(t33, i32, s42) {
      return { get() {
        return this[i32];
      }, set(e42) {
        const r52 = this[t33];
        this[i32] = e42, this.requestUpdate(t33, r52, s42);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t33) {
      return this.elementProperties.get(t33) || o2;
    }
    static finalize() {
      if (this.hasOwnProperty("finalized"))
        return false;
      this.finalized = true;
      const t33 = Object.getPrototypeOf(this);
      if (t33.finalize(), this.elementProperties = new Map(t33.elementProperties), this._$Eu = new Map(), this.hasOwnProperty("properties")) {
        const t4 = this.properties, i32 = [...Object.getOwnPropertyNames(t4), ...Object.getOwnPropertySymbols(t4)];
        for (const s42 of i32)
          this.createProperty(s42, t4[s42]);
      }
      return this.elementStyles = this.finalizeStyles(this.styles), true;
    }
    static finalizeStyles(i32) {
      const s42 = [];
      if (Array.isArray(i32)) {
        const e42 = new Set(i32.flat(1 / 0).reverse());
        for (const i4 of e42)
          s42.unshift(S(i4));
      } else
        i32 !== void 0 && s42.push(S(i32));
      return s42;
    }
    static _$Eh(t33, i32) {
      const s42 = i32.attribute;
      return s42 === false ? void 0 : typeof s42 == "string" ? s42 : typeof t33 == "string" ? t33.toLowerCase() : void 0;
    }
    o() {
      var t33;
      this._$Ev = new Promise((t4) => this.enableUpdating = t4), this._$AL = new Map(), this._$Ep(), this.requestUpdate(), (t33 = this.constructor.l) === null || t33 === void 0 || t33.forEach((t4) => t4(this));
    }
    addController(t33) {
      var i32, s42;
      ((i32 = this._$Em) !== null && i32 !== void 0 ? i32 : this._$Em = []).push(t33), this.renderRoot !== void 0 && this.isConnected && ((s42 = t33.hostConnected) === null || s42 === void 0 || s42.call(t33));
    }
    removeController(t33) {
      var i32;
      (i32 = this._$Em) === null || i32 === void 0 || i32.splice(this._$Em.indexOf(t33) >>> 0, 1);
    }
    _$Ep() {
      this.constructor.elementProperties.forEach((t33, i32) => {
        this.hasOwnProperty(i32) && (this._$Et.set(i32, this[i32]), delete this[i32]);
      });
    }
    createRenderRoot() {
      var t33;
      const s42 = (t33 = this.shadowRoot) !== null && t33 !== void 0 ? t33 : this.attachShadow(this.constructor.shadowRootOptions);
      return i2(s42, this.constructor.elementStyles), s42;
    }
    connectedCallback() {
      var t33;
      this.renderRoot === void 0 && (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), (t33 = this._$Em) === null || t33 === void 0 || t33.forEach((t4) => {
        var i32;
        return (i32 = t4.hostConnected) === null || i32 === void 0 ? void 0 : i32.call(t4);
      });
    }
    enableUpdating(t33) {
    }
    disconnectedCallback() {
      var t33;
      (t33 = this._$Em) === null || t33 === void 0 || t33.forEach((t4) => {
        var i32;
        return (i32 = t4.hostDisconnected) === null || i32 === void 0 ? void 0 : i32.call(t4);
      });
    }
    attributeChangedCallback(t33, i32, s42) {
      this._$AK(t33, s42);
    }
    _$Eg(t33, i32, s42 = o2) {
      var e42, h3;
      const n52 = this.constructor._$Eh(t33, s42);
      if (n52 !== void 0 && s42.reflect === true) {
        const o52 = ((h3 = (e42 = s42.converter) === null || e42 === void 0 ? void 0 : e42.toAttribute) !== null && h3 !== void 0 ? h3 : r2.toAttribute)(i32, s42.type);
        this._$Ei = t33, o52 == null ? this.removeAttribute(n52) : this.setAttribute(n52, o52), this._$Ei = null;
      }
    }
    _$AK(t33, i32) {
      var s42, e42, h3;
      const o52 = this.constructor, n52 = o52._$Eu.get(t33);
      if (n52 !== void 0 && this._$Ei !== n52) {
        const t4 = o52.getPropertyOptions(n52), l32 = t4.converter, a2 = (h3 = (e42 = (s42 = l32) === null || s42 === void 0 ? void 0 : s42.fromAttribute) !== null && e42 !== void 0 ? e42 : typeof l32 == "function" ? l32 : null) !== null && h3 !== void 0 ? h3 : r2.fromAttribute;
        this._$Ei = n52, this[n52] = a2(i32, t4.type), this._$Ei = null;
      }
    }
    requestUpdate(t33, i32, s42) {
      let e42 = true;
      t33 !== void 0 && (((s42 = s42 || this.constructor.getPropertyOptions(t33)).hasChanged || h)(this[t33], i32) ? (this._$AL.has(t33) || this._$AL.set(t33, i32), s42.reflect === true && this._$Ei !== t33 && (this._$ES === void 0 && (this._$ES = new Map()), this._$ES.set(t33, s42))) : e42 = false), !this.isUpdatePending && e42 && (this._$Ev = this._$EC());
    }
    async _$EC() {
      this.isUpdatePending = true;
      try {
        await this._$Ev;
      } catch (t4) {
        Promise.reject(t4);
      }
      const t33 = this.scheduleUpdate();
      return t33 != null && await t33, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      var t33;
      if (!this.isUpdatePending)
        return;
      this.hasUpdated, this._$Et && (this._$Et.forEach((t4, i4) => this[i4] = t4), this._$Et = void 0);
      let i32 = false;
      const s42 = this._$AL;
      try {
        i32 = this.shouldUpdate(s42), i32 ? (this.willUpdate(s42), (t33 = this._$Em) === null || t33 === void 0 || t33.forEach((t4) => {
          var i4;
          return (i4 = t4.hostUpdate) === null || i4 === void 0 ? void 0 : i4.call(t4);
        }), this.update(s42)) : this._$ET();
      } catch (t4) {
        throw i32 = false, this._$ET(), t4;
      }
      i32 && this._$AE(s42);
    }
    willUpdate(t33) {
    }
    _$AE(t33) {
      var i32;
      (i32 = this._$Em) === null || i32 === void 0 || i32.forEach((t4) => {
        var i4;
        return (i4 = t4.hostUpdated) === null || i4 === void 0 ? void 0 : i4.call(t4);
      }), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t33)), this.updated(t33);
    }
    _$ET() {
      this._$AL = new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$Ev;
    }
    shouldUpdate(t33) {
      return true;
    }
    update(t33) {
      this._$ES !== void 0 && (this._$ES.forEach((t4, i32) => this._$Eg(i32, this[i32], t4)), this._$ES = void 0), this._$ET();
    }
    updated(t33) {
    }
    firstUpdated(t33) {
    }
  };
  n2.finalized = true, n2.elementProperties = new Map(), n2.elementStyles = [], n2.shadowRootOptions = { mode: "open" }, (s2 = globalThis.reactiveElementPolyfillSupport) === null || s2 === void 0 || s2.call(globalThis, { ReactiveElement: n2 }), ((e22 = globalThis.reactiveElementVersions) !== null && e22 !== void 0 ? e22 : globalThis.reactiveElementVersions = []).push("1.0.0");
  var t22;
  var i22;
  var s3 = globalThis.trustedTypes;
  var e3 = s3 ? s3.createPolicy("lit-html", { createHTML: (t33) => t33 }) : void 0;
  var o3 = `lit$${(Math.random() + "").slice(9)}$`;
  var n3 = "?" + o3;
  var l = `<${n3}>`;
  var h2 = document;
  var r3 = (t33 = "") => h2.createComment(t33);
  var d = (t33) => t33 === null || typeof t33 != "object" && typeof t33 != "function";
  var u = Array.isArray;
  var v = (t33) => {
    var i32;
    return u(t33) || typeof ((i32 = t33) === null || i32 === void 0 ? void 0 : i32[Symbol.iterator]) == "function";
  };
  var c = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
  var a = /-->/g;
  var f = />/g;
  var _ = />|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g;
  var g = /'/g;
  var m = /"/g;
  var $ = /^(?:script|style|textarea)$/i;
  var p = (t33) => (i32, ...s42) => ({ _$litType$: t33, strings: i32, values: s42 });
  var y = p(1);
  var b = p(2);
  var T = Symbol.for("lit-noChange");
  var x = Symbol.for("lit-nothing");
  var w = new WeakMap();
  var A = (t33, i32, s42) => {
    var e42, o52;
    const n52 = (e42 = s42 == null ? void 0 : s42.renderBefore) !== null && e42 !== void 0 ? e42 : i32;
    let l32 = n52._$litPart$;
    if (l32 === void 0) {
      const t4 = (o52 = s42 == null ? void 0 : s42.renderBefore) !== null && o52 !== void 0 ? o52 : null;
      n52._$litPart$ = l32 = new S2(i32.insertBefore(r3(), t4), t4, void 0, s42 != null ? s42 : {});
    }
    return l32._$AI(t33), l32;
  };
  var C = h2.createTreeWalker(h2, 129, null, false);
  var P = (t33, i32) => {
    const s42 = t33.length - 1, n52 = [];
    let h3, r52 = i32 === 2 ? "<svg>" : "", d2 = c;
    for (let i4 = 0; i4 < s42; i4++) {
      const s5 = t33[i4];
      let e42, u3, v2 = -1, p2 = 0;
      for (; p2 < s5.length && (d2.lastIndex = p2, u3 = d2.exec(s5), u3 !== null); )
        p2 = d2.lastIndex, d2 === c ? u3[1] === "!--" ? d2 = a : u3[1] !== void 0 ? d2 = f : u3[2] !== void 0 ? ($.test(u3[2]) && (h3 = RegExp("</" + u3[2], "g")), d2 = _) : u3[3] !== void 0 && (d2 = _) : d2 === _ ? u3[0] === ">" ? (d2 = h3 != null ? h3 : c, v2 = -1) : u3[1] === void 0 ? v2 = -2 : (v2 = d2.lastIndex - u3[2].length, e42 = u3[1], d2 = u3[3] === void 0 ? _ : u3[3] === '"' ? m : g) : d2 === m || d2 === g ? d2 = _ : d2 === a || d2 === f ? d2 = c : (d2 = _, h3 = void 0);
      const y2 = d2 === _ && t33[i4 + 1].startsWith("/>") ? " " : "";
      r52 += d2 === c ? s5 + l : v2 >= 0 ? (n52.push(e42), s5.slice(0, v2) + "$lit$" + s5.slice(v2) + o3 + y2) : s5 + o3 + (v2 === -2 ? (n52.push(void 0), i4) : y2);
    }
    const u2 = r52 + (t33[s42] || "<?>") + (i32 === 2 ? "</svg>" : "");
    return [e3 !== void 0 ? e3.createHTML(u2) : u2, n52];
  };
  var V = class {
    constructor({ strings: t33, _$litType$: i32 }, e42) {
      let l32;
      this.parts = [];
      let h3 = 0, d2 = 0;
      const u2 = t33.length - 1, v2 = this.parts, [c2, a2] = P(t33, i32);
      if (this.el = V.createElement(c2, e42), C.currentNode = this.el.content, i32 === 2) {
        const t4 = this.el.content, i4 = t4.firstChild;
        i4.remove(), t4.append(...i4.childNodes);
      }
      for (; (l32 = C.nextNode()) !== null && v2.length < u2; ) {
        if (l32.nodeType === 1) {
          if (l32.hasAttributes()) {
            const t4 = [];
            for (const i4 of l32.getAttributeNames())
              if (i4.endsWith("$lit$") || i4.startsWith(o3)) {
                const s42 = a2[d2++];
                if (t4.push(i4), s42 !== void 0) {
                  const t5 = l32.getAttribute(s42.toLowerCase() + "$lit$").split(o3), i5 = /([.?@])?(.*)/.exec(s42);
                  v2.push({ type: 1, index: h3, name: i5[2], strings: t5, ctor: i5[1] === "." ? k : i5[1] === "?" ? H : i5[1] === "@" ? I : M });
                } else
                  v2.push({ type: 6, index: h3 });
              }
            for (const i4 of t4)
              l32.removeAttribute(i4);
          }
          if ($.test(l32.tagName)) {
            const t4 = l32.textContent.split(o3), i4 = t4.length - 1;
            if (i4 > 0) {
              l32.textContent = s3 ? s3.emptyScript : "";
              for (let s42 = 0; s42 < i4; s42++)
                l32.append(t4[s42], r3()), C.nextNode(), v2.push({ type: 2, index: ++h3 });
              l32.append(t4[i4], r3());
            }
          }
        } else if (l32.nodeType === 8)
          if (l32.data === n3)
            v2.push({ type: 2, index: h3 });
          else {
            let t4 = -1;
            for (; (t4 = l32.data.indexOf(o3, t4 + 1)) !== -1; )
              v2.push({ type: 7, index: h3 }), t4 += o3.length - 1;
          }
        h3++;
      }
    }
    static createElement(t33, i32) {
      const s42 = h2.createElement("template");
      return s42.innerHTML = t33, s42;
    }
  };
  function E(t33, i32, s42 = t33, e42) {
    var o52, n52, l32, h3;
    if (i32 === T)
      return i32;
    let r52 = e42 !== void 0 ? (o52 = s42._$Cl) === null || o52 === void 0 ? void 0 : o52[e42] : s42._$Cu;
    const u2 = d(i32) ? void 0 : i32._$litDirective$;
    return (r52 == null ? void 0 : r52.constructor) !== u2 && ((n52 = r52 == null ? void 0 : r52._$AO) === null || n52 === void 0 || n52.call(r52, false), u2 === void 0 ? r52 = void 0 : (r52 = new u2(t33), r52._$AT(t33, s42, e42)), e42 !== void 0 ? ((l32 = (h3 = s42)._$Cl) !== null && l32 !== void 0 ? l32 : h3._$Cl = [])[e42] = r52 : s42._$Cu = r52), r52 !== void 0 && (i32 = E(t33, r52._$AS(t33, i32.values), r52, e42)), i32;
  }
  var N = class {
    constructor(t33, i32) {
      this.v = [], this._$AN = void 0, this._$AD = t33, this._$AM = i32;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    p(t33) {
      var i32;
      const { el: { content: s42 }, parts: e42 } = this._$AD, o52 = ((i32 = t33 == null ? void 0 : t33.creationScope) !== null && i32 !== void 0 ? i32 : h2).importNode(s42, true);
      C.currentNode = o52;
      let n52 = C.nextNode(), l32 = 0, r52 = 0, d2 = e42[0];
      for (; d2 !== void 0; ) {
        if (l32 === d2.index) {
          let i4;
          d2.type === 2 ? i4 = new S2(n52, n52.nextSibling, this, t33) : d2.type === 1 ? i4 = new d2.ctor(n52, d2.name, d2.strings, this, t33) : d2.type === 6 && (i4 = new L(n52, this, t33)), this.v.push(i4), d2 = e42[++r52];
        }
        l32 !== (d2 == null ? void 0 : d2.index) && (n52 = C.nextNode(), l32++);
      }
      return o52;
    }
    m(t33) {
      let i32 = 0;
      for (const s42 of this.v)
        s42 !== void 0 && (s42.strings !== void 0 ? (s42._$AI(t33, s42, i32), i32 += s42.strings.length - 2) : s42._$AI(t33[i32])), i32++;
    }
  };
  var S2 = class {
    constructor(t33, i32, s42, e42) {
      var o52;
      this.type = 2, this._$AH = x, this._$AN = void 0, this._$AA = t33, this._$AB = i32, this._$AM = s42, this.options = e42, this._$Cg = (o52 = e42 == null ? void 0 : e42.isConnected) === null || o52 === void 0 || o52;
    }
    get _$AU() {
      var t33, i32;
      return (i32 = (t33 = this._$AM) === null || t33 === void 0 ? void 0 : t33._$AU) !== null && i32 !== void 0 ? i32 : this._$Cg;
    }
    get parentNode() {
      let t33 = this._$AA.parentNode;
      const i32 = this._$AM;
      return i32 !== void 0 && t33.nodeType === 11 && (t33 = i32.parentNode), t33;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t33, i32 = this) {
      t33 = E(this, t33, i32), d(t33) ? t33 === x || t33 == null || t33 === "" ? (this._$AH !== x && this._$AR(), this._$AH = x) : t33 !== this._$AH && t33 !== T && this.$(t33) : t33._$litType$ !== void 0 ? this.T(t33) : t33.nodeType !== void 0 ? this.S(t33) : v(t33) ? this.M(t33) : this.$(t33);
    }
    A(t33, i32 = this._$AB) {
      return this._$AA.parentNode.insertBefore(t33, i32);
    }
    S(t33) {
      this._$AH !== t33 && (this._$AR(), this._$AH = this.A(t33));
    }
    $(t33) {
      this._$AH !== x && d(this._$AH) ? this._$AA.nextSibling.data = t33 : this.S(h2.createTextNode(t33)), this._$AH = t33;
    }
    T(t33) {
      var i32;
      const { values: s42, _$litType$: e42 } = t33, o52 = typeof e42 == "number" ? this._$AC(t33) : (e42.el === void 0 && (e42.el = V.createElement(e42.h, this.options)), e42);
      if (((i32 = this._$AH) === null || i32 === void 0 ? void 0 : i32._$AD) === o52)
        this._$AH.m(s42);
      else {
        const t4 = new N(o52, this), i4 = t4.p(this.options);
        t4.m(s42), this.S(i4), this._$AH = t4;
      }
    }
    _$AC(t33) {
      let i32 = w.get(t33.strings);
      return i32 === void 0 && w.set(t33.strings, i32 = new V(t33)), i32;
    }
    M(t33) {
      u(this._$AH) || (this._$AH = [], this._$AR());
      const i32 = this._$AH;
      let s42, e42 = 0;
      for (const o52 of t33)
        e42 === i32.length ? i32.push(s42 = new S2(this.A(r3()), this.A(r3()), this, this.options)) : s42 = i32[e42], s42._$AI(o52), e42++;
      e42 < i32.length && (this._$AR(s42 && s42._$AB.nextSibling, e42), i32.length = e42);
    }
    _$AR(t33 = this._$AA.nextSibling, i32) {
      var s42;
      for ((s42 = this._$AP) === null || s42 === void 0 || s42.call(this, false, true, i32); t33 && t33 !== this._$AB; ) {
        const i4 = t33.nextSibling;
        t33.remove(), t33 = i4;
      }
    }
    setConnected(t33) {
      var i32;
      this._$AM === void 0 && (this._$Cg = t33, (i32 = this._$AP) === null || i32 === void 0 || i32.call(this, t33));
    }
  };
  var M = class {
    constructor(t33, i32, s42, e42, o52) {
      this.type = 1, this._$AH = x, this._$AN = void 0, this.element = t33, this.name = i32, this._$AM = e42, this.options = o52, s42.length > 2 || s42[0] !== "" || s42[1] !== "" ? (this._$AH = Array(s42.length - 1).fill(new String()), this.strings = s42) : this._$AH = x;
    }
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t33, i32 = this, s42, e42) {
      const o52 = this.strings;
      let n52 = false;
      if (o52 === void 0)
        t33 = E(this, t33, i32, 0), n52 = !d(t33) || t33 !== this._$AH && t33 !== T, n52 && (this._$AH = t33);
      else {
        const e5 = t33;
        let l32, h3;
        for (t33 = o52[0], l32 = 0; l32 < o52.length - 1; l32++)
          h3 = E(this, e5[s42 + l32], i32, l32), h3 === T && (h3 = this._$AH[l32]), n52 || (n52 = !d(h3) || h3 !== this._$AH[l32]), h3 === x ? t33 = x : t33 !== x && (t33 += (h3 != null ? h3 : "") + o52[l32 + 1]), this._$AH[l32] = h3;
      }
      n52 && !e42 && this.k(t33);
    }
    k(t33) {
      t33 === x ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t33 != null ? t33 : "");
    }
  };
  var k = class extends M {
    constructor() {
      super(...arguments), this.type = 3;
    }
    k(t33) {
      this.element[this.name] = t33 === x ? void 0 : t33;
    }
  };
  var H = class extends M {
    constructor() {
      super(...arguments), this.type = 4;
    }
    k(t33) {
      t33 && t33 !== x ? this.element.setAttribute(this.name, "") : this.element.removeAttribute(this.name);
    }
  };
  var I = class extends M {
    constructor(t33, i32, s42, e42, o52) {
      super(t33, i32, s42, e42, o52), this.type = 5;
    }
    _$AI(t33, i32 = this) {
      var s42;
      if ((t33 = (s42 = E(this, t33, i32, 0)) !== null && s42 !== void 0 ? s42 : x) === T)
        return;
      const e42 = this._$AH, o52 = t33 === x && e42 !== x || t33.capture !== e42.capture || t33.once !== e42.once || t33.passive !== e42.passive, n52 = t33 !== x && (e42 === x || o52);
      o52 && this.element.removeEventListener(this.name, this, e42), n52 && this.element.addEventListener(this.name, this, t33), this._$AH = t33;
    }
    handleEvent(t33) {
      var i32, s42;
      typeof this._$AH == "function" ? this._$AH.call((s42 = (i32 = this.options) === null || i32 === void 0 ? void 0 : i32.host) !== null && s42 !== void 0 ? s42 : this.element, t33) : this._$AH.handleEvent(t33);
    }
  };
  var L = class {
    constructor(t33, i32, s42) {
      this.element = t33, this.type = 6, this._$AN = void 0, this._$AM = i32, this.options = s42;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t33) {
      E(this, t33);
    }
  };
  (t22 = globalThis.litHtmlPolyfillSupport) === null || t22 === void 0 || t22.call(globalThis, V, S2), ((i22 = globalThis.litHtmlVersions) !== null && i22 !== void 0 ? i22 : globalThis.litHtmlVersions = []).push("2.0.0");
  var l2;
  var o4;
  var r4;
  var n4 = class extends n2 {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Dt = void 0;
    }
    createRenderRoot() {
      var t33, e42;
      const i32 = super.createRenderRoot();
      return (t33 = (e42 = this.renderOptions).renderBefore) !== null && t33 !== void 0 || (e42.renderBefore = i32.firstChild), i32;
    }
    update(t33) {
      const i32 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t33), this._$Dt = A(i32, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      var t33;
      super.connectedCallback(), (t33 = this._$Dt) === null || t33 === void 0 || t33.setConnected(true);
    }
    disconnectedCallback() {
      var t33;
      super.disconnectedCallback(), (t33 = this._$Dt) === null || t33 === void 0 || t33.setConnected(false);
    }
    render() {
      return T;
    }
  };
  n4.finalized = true, n4._$litElement$ = true, (l2 = globalThis.litElementHydrateSupport) === null || l2 === void 0 || l2.call(globalThis, { LitElement: n4 }), (o4 = globalThis.litElementPolyfillSupport) === null || o4 === void 0 || o4.call(globalThis, { LitElement: n4 });
  ((r4 = globalThis.litElementVersions) !== null && r4 !== void 0 ? r4 : globalThis.litElementVersions = []).push("3.0.0");

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JTSEMIY7.js
  var o5 = e(class extends i {
    constructor(t23) {
      var i25;
      if (super(t23), t23.type !== t.ATTRIBUTE || t23.name !== "class" || ((i25 = t23.strings) === null || i25 === void 0 ? void 0 : i25.length) > 2)
        throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
    }
    render(t23) {
      return " " + Object.keys(t23).filter((i25) => t23[i25]).join(" ") + " ";
    }
    update(i25, [s5]) {
      var r6, o23;
      if (this.st === void 0) {
        this.st = new Set(), i25.strings !== void 0 && (this.et = new Set(i25.strings.join(" ").split(/\s/).filter((t23) => t23 !== "")));
        for (const t23 in s5)
          s5[t23] && !((r6 = this.et) === null || r6 === void 0 ? void 0 : r6.has(t23)) && this.st.add(t23);
        return this.render(s5);
      }
      const e24 = i25.element.classList;
      this.st.forEach((t23) => {
        t23 in s5 || (e24.remove(t23), this.st.delete(t23));
      });
      for (const t23 in s5) {
        const i32 = !!s5[t23];
        i32 === this.st.has(t23) || ((o23 = this.et) === null || o23 === void 0 ? void 0 : o23.has(t23)) || (i32 ? (e24.add(t23), this.st.add(t23)) : (e24.remove(t23), this.st.delete(t23)));
      }
      return T;
    }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.BD26TKS4.js
  function watch(propName, options) {
    return (protoOrDescriptor, name) => {
      const { update } = protoOrDescriptor;
      options = Object.assign({ waitUntilFirstUpdate: false }, options);
      protoOrDescriptor.update = function(changedProps) {
        if (changedProps.has(propName)) {
          const oldValue = changedProps.get(propName);
          const newValue = this[propName];
          if (oldValue !== newValue) {
            if (!(options == null ? void 0 : options.waitUntilFirstUpdate) || this.hasUpdated) {
              this[name].call(this, oldValue, newValue);
            }
          }
        }
        update.call(this, changedProps);
      };
    };
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.I4TE3TJV.js
  function emit(el, name, options) {
    const event = new CustomEvent(name, Object.assign({
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {}
    }, options));
    el.dispatchEvent(event);
    return event;
  }
  function waitForEvent(el, eventName) {
    return new Promise((resolve) => {
      function done(event) {
        if (event.target === el) {
          el.removeEventListener(eventName, done);
          resolve();
        }
      }
      el.addEventListener(eventName, done);
    });
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.G466JWVF.js
  var utility_styles_default = r`
  .sl-scroll-lock {
    overflow: hidden !important;
  }

  .sl-toast-stack {
    position: fixed;
    top: 0;
    right: 0;
    z-index: var(--sl-z-index-toast);
    width: 28rem;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
  }

  .sl-toast-stack sl-alert {
    --box-shadow: var(--sl-shadow-large);
    margin: var(--sl-spacing-medium);
  }
`;
  var component_styles_default = r`
  :host {
    position: relative;
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }
`;
  var style = document.createElement("style");
  style.textContent = utility_styles_default.toString();
  document.head.append(style);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.L2RLCVJQ.js
  var n5 = (n22) => (e33) => typeof e33 == "function" ? ((n32, e42) => (window.customElements.define(n32, e42), e42))(n22, e33) : ((n32, e42) => {
    const { kind: t23, elements: i32 } = e42;
    return { kind: t23, elements: i32, finisher(e5) {
      window.customElements.define(n32, e5);
    } };
  })(n22, e33);
  var i3 = (i32, e33) => e33.kind === "method" && e33.descriptor && !("value" in e33.descriptor) ? __spreadProps(__spreadValues({}, e33), { finisher(n22) {
    n22.createProperty(e33.key, i32);
  } }) : { kind: "field", key: Symbol(), placement: "own", descriptor: {}, originalKey: e33.key, initializer() {
    typeof e33.initializer == "function" && (this[e33.key] = e33.initializer.call(this));
  }, finisher(n22) {
    n22.createProperty(e33.key, i32);
  } };
  function e4(e33) {
    return (n22, t23) => t23 !== void 0 ? ((i32, e42, n32) => {
      e42.constructor.createProperty(n32, i32);
    })(e33, n22, t23) : i3(e33, n22);
  }
  function t3(t23) {
    return e4(__spreadProps(__spreadValues({}, t23), { state: true }));
  }
  var o6 = ({ finisher: e33, descriptor: t23 }) => (o23, n22) => {
    var r6;
    if (n22 === void 0) {
      const n32 = (r6 = o23.originalKey) !== null && r6 !== void 0 ? r6 : o23.key, i32 = t23 != null ? { kind: "method", placement: "prototype", key: n32, descriptor: t23(o23.key) } : __spreadProps(__spreadValues({}, o23), { key: n32 });
      return e33 != null && (i32.finisher = function(t33) {
        e33(t33, n32);
      }), i32;
    }
    {
      const r22 = o23.constructor;
      t23 !== void 0 && Object.defineProperty(o23, n22, t23(n22)), e33 == null || e33(r22, n22);
    }
  };
  function i23(i32, n22) {
    return o6({ descriptor: (o23) => {
      const t23 = { get() {
        var o32, n32;
        return (n32 = (o32 = this.renderRoot) === null || o32 === void 0 ? void 0 : o32.querySelector(i32)) !== null && n32 !== void 0 ? n32 : null;
      }, enumerable: true, configurable: true };
      if (n22) {
        const n32 = typeof o23 == "symbol" ? Symbol() : "__" + o23;
        t23.get = function() {
          var o32, t33;
          return this[n32] === void 0 && (this[n32] = (t33 = (o32 = this.renderRoot) === null || o32 === void 0 ? void 0 : o32.querySelector(i32)) !== null && t33 !== void 0 ? t33 : null), this[n32];
        };
      }
      return t23;
    } });
  }
  function e23(e33) {
    return o6({ descriptor: (r6) => ({ async get() {
      var r22;
      return await this.updateComplete, (r22 = this.renderRoot) === null || r22 === void 0 ? void 0 : r22.querySelector(e33);
    }, enumerable: true, configurable: true }) });
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CEQRM34I.js
  var tooltip_styles_default = r`
  ${component_styles_default}

  :host {
    --max-width: 20rem;
    --hide-delay: 0ms;
    --show-delay: 150ms;

    display: contents;
  }

  .tooltip-positioner {
    position: absolute;
    z-index: var(--sl-z-index-tooltip);
    pointer-events: none;
  }

  .tooltip {
    max-width: var(--max-width);
    border-radius: var(--sl-tooltip-border-radius);
    background-color: rgb(var(--sl-tooltip-background-color));
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: rgb(var(--sl-tooltip-color));
    padding: var(--sl-tooltip-padding);
  }

  .tooltip:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
  }

  .tooltip-positioner[data-popper-placement^='top'] .tooltip {
    transform-origin: bottom;
  }

  .tooltip-positioner[data-popper-placement^='bottom'] .tooltip {
    transform-origin: top;
  }

  .tooltip-positioner[data-popper-placement^='left'] .tooltip {
    transform-origin: right;
  }

  .tooltip-positioner[data-popper-placement^='right'] .tooltip {
    transform-origin: left;
  }

  /* Arrow + bottom */
  .tooltip-positioner[data-popper-placement^='bottom'] .tooltip:after {
    bottom: 100%;
    left: calc(50% - var(--sl-tooltip-arrow-size));
    border-bottom: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
  }

  .tooltip-positioner[data-popper-placement='bottom-start'] .tooltip:after {
    left: var(--sl-tooltip-arrow-start-end-offset);
  }

  .tooltip-positioner[data-popper-placement='bottom-end'] .tooltip:after {
    right: var(--sl-tooltip-arrow-start-end-offset);
    left: auto;
  }

  /* Arrow + top */
  .tooltip-positioner[data-popper-placement^='top'] .tooltip:after {
    top: 100%;
    left: calc(50% - var(--sl-tooltip-arrow-size));
    border-top: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
  }

  .tooltip-positioner[data-popper-placement='top-start'] .tooltip:after {
    left: var(--sl-tooltip-arrow-start-end-offset);
  }

  .tooltip-positioner[data-popper-placement='top-end'] .tooltip:after {
    right: var(--sl-tooltip-arrow-start-end-offset);
    left: auto;
  }

  /* Arrow + left */
  .tooltip-positioner[data-popper-placement^='left'] .tooltip:after {
    top: calc(50% - var(--sl-tooltip-arrow-size));
    left: 100%;
    border-left: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-top: var(--sl-tooltip-arrow-size) solid transparent;
    border-bottom: var(--sl-tooltip-arrow-size) solid transparent;
  }

  .tooltip-positioner[data-popper-placement='left-start'] .tooltip:after {
    top: var(--sl-tooltip-arrow-start-end-offset);
  }

  .tooltip-positioner[data-popper-placement='left-end'] .tooltip:after {
    top: auto;
    bottom: var(--sl-tooltip-arrow-start-end-offset);
  }

  /* Arrow + right */
  .tooltip-positioner[data-popper-placement^='right'] .tooltip:after {
    top: calc(50% - var(--sl-tooltip-arrow-size));
    right: 100%;
    border-right: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-top: var(--sl-tooltip-arrow-size) solid transparent;
    border-bottom: var(--sl-tooltip-arrow-size) solid transparent;
  }

  .tooltip-positioner[data-popper-placement='right-start'] .tooltip:after {
    top: var(--sl-tooltip-arrow-start-end-offset);
  }

  .tooltip-positioner[data-popper-placement='right-end'] .tooltip:after {
    top: auto;
    bottom: var(--sl-tooltip-arrow-start-end-offset);
  }
`;
  var id = 0;
  var SlTooltip = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `tooltip-${++id}`;
      this.content = "";
      this.placement = "top";
      this.disabled = false;
      this.distance = 10;
      this.open = false;
      this.skidding = 0;
      this.trigger = "hover focus";
      this.hoist = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleBlur = this.handleBlur.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleFocus = this.handleFocus.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.handleMouseOut = this.handleMouseOut.bind(this);
      this.updateComplete.then(() => {
        this.addEventListener("blur", this.handleBlur, true);
        this.addEventListener("focus", this.handleFocus, true);
        this.addEventListener("click", this.handleClick);
        this.addEventListener("keydown", this.handleKeyDown);
        this.addEventListener("mouseover", this.handleMouseOver);
        this.addEventListener("mouseout", this.handleMouseOut);
        this.target = this.getTarget();
        this.syncOptions();
      });
    }
    firstUpdated() {
      this.tooltip.hidden = !this.open;
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.removeEventListener("blur", this.handleBlur, true);
      this.removeEventListener("focus", this.handleFocus, true);
      this.removeEventListener("click", this.handleClick);
      this.removeEventListener("keydown", this.handleKeyDown);
      this.removeEventListener("mouseover", this.handleMouseOver);
      this.removeEventListener("mouseout", this.handleMouseOut);
      if (this.popover) {
        this.popover.destroy();
      }
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    getTarget() {
      const target = [...this.children].find((el) => el.tagName.toLowerCase() !== "style" && el.getAttribute("slot") !== "content");
      if (!target) {
        throw new Error("Invalid tooltip target: no child element was found.");
      }
      return target;
    }
    handleBlur() {
      if (this.hasTrigger("focus")) {
        this.hide();
      }
    }
    handleClick() {
      if (this.hasTrigger("click")) {
        this.open ? this.hide() : this.show();
      }
    }
    handleFocus() {
      if (this.hasTrigger("focus")) {
        this.show();
      }
    }
    handleKeyDown(event) {
      if (this.open && event.key === "Escape") {
        event.stopPropagation();
        this.hide();
      }
    }
    handleMouseOver() {
      if (this.hasTrigger("hover")) {
        const delay = parseDuration(getComputedStyle(this).getPropertyValue("--show-delay"));
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => this.show(), delay);
      }
    }
    handleMouseOut() {
      if (this.hasTrigger("hover")) {
        const delay = parseDuration(getComputedStyle(this).getPropertyValue("--hide-delay"));
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => this.hide(), delay);
      }
    }
    async handleOpenChange() {
      if (this.disabled) {
        return;
      }
      if (this.open) {
        emit(this, "sl-show");
        await stopAnimations(this.tooltip);
        if (this.popover) {
          this.popover.destroy();
        }
        this.popover = createPopper(this.target, this.positioner, {
          placement: this.placement,
          strategy: this.hoist ? "fixed" : "absolute",
          modifiers: [
            {
              name: "flip",
              options: {
                boundary: "viewport"
              }
            },
            {
              name: "offset",
              options: {
                offset: [this.skidding, this.distance]
              }
            }
          ]
        });
        this.tooltip.hidden = false;
        const { keyframes, options } = getAnimation(this, "tooltip.show");
        await animateTo(this.tooltip, keyframes, options);
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        await stopAnimations(this.tooltip);
        const { keyframes, options } = getAnimation(this, "tooltip.hide");
        await animateTo(this.tooltip, keyframes, options);
        this.tooltip.hidden = true;
        if (this.popover) {
          this.popover.destroy();
        }
        emit(this, "sl-after-hide");
      }
    }
    handleOptionsChange() {
      this.syncOptions();
    }
    handleDisabledChange() {
      if (this.disabled && this.open) {
        this.hide();
      }
    }
    handleSlotChange() {
      const oldTarget = this.target;
      const newTarget = this.getTarget();
      if (newTarget !== oldTarget) {
        if (oldTarget) {
          oldTarget.removeAttribute("aria-describedby");
        }
        newTarget.setAttribute("aria-describedby", this.componentId);
      }
    }
    hasTrigger(triggerType) {
      const triggers = this.trigger.split(" ");
      return triggers.includes(triggerType);
    }
    syncOptions() {
      if (this.popover) {
        this.popover.setOptions({
          placement: this.placement,
          strategy: this.hoist ? "fixed" : "absolute",
          modifiers: [
            {
              name: "flip",
              options: {
                boundary: "viewport"
              }
            },
            {
              name: "offset",
              options: {
                offset: [this.skidding, this.distance]
              }
            }
          ]
        });
      }
    }
    render() {
      return y`
      <slot @slotchange=${this.handleSlotChange}></slot>

      <div class="tooltip-positioner">
        <div
          part="base"
          id=${this.componentId}
          class=${o5({
        tooltip: true,
        "tooltip--open": this.open
      })}
          role="tooltip"
          aria-hidden=${this.open ? "false" : "true"}
        >
          <slot name="content">${this.content}</slot>
        </div>
      </div>
    `;
    }
  };
  SlTooltip.styles = tooltip_styles_default;
  __decorateClass([
    i23(".tooltip-positioner")
  ], SlTooltip.prototype, "positioner", 2);
  __decorateClass([
    i23(".tooltip")
  ], SlTooltip.prototype, "tooltip", 2);
  __decorateClass([
    e4()
  ], SlTooltip.prototype, "content", 2);
  __decorateClass([
    e4()
  ], SlTooltip.prototype, "placement", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTooltip.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlTooltip.prototype, "distance", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTooltip.prototype, "open", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlTooltip.prototype, "skidding", 2);
  __decorateClass([
    e4()
  ], SlTooltip.prototype, "trigger", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlTooltip.prototype, "hoist", 2);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlTooltip.prototype, "handleOpenChange", 1);
  __decorateClass([
    watch("placement"),
    watch("distance"),
    watch("skidding"),
    watch("hoist")
  ], SlTooltip.prototype, "handleOptionsChange", 1);
  __decorateClass([
    watch("disabled")
  ], SlTooltip.prototype, "handleDisabledChange", 1);
  SlTooltip = __decorateClass([
    n5("sl-tooltip")
  ], SlTooltip);
  setDefaultAnimation("tooltip.show", {
    keyframes: [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    options: { duration: 150, easing: "ease" }
  });
  setDefaultAnimation("tooltip.hide", {
    keyframes: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.8)" }
    ],
    options: { duration: 150, easing: "ease" }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.R2VDRJDM.js
  var skeleton_styles_default = r`
  ${component_styles_default}

  :host {
    --border-radius: var(--sl-border-radius-pill);
    --color: rgb(var(--sl-color-neutral-200));
    --sheen-color: rgb(var(--sl-color-neutral-300));

    display: block;
    position: relative;
  }

  .skeleton {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 1rem;
  }

  .skeleton__indicator {
    flex: 1 1 auto;
    background: var(--color);
    border-radius: var(--border-radius);
  }

  .skeleton--sheen .skeleton__indicator {
    background: linear-gradient(270deg, var(--sheen-color), var(--color), var(--color), var(--sheen-color));
    background-size: 400% 100%;
    background-size: 400% 100%;
    animation: sheen 8s ease-in-out infinite;
  }

  .skeleton--pulse .skeleton__indicator {
    animation: pulse 2s ease-in-out 0.5s infinite;
  }

  @keyframes sheen {
    0% {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
`;
  var SlSkeleton = class extends n4 {
    constructor() {
      super(...arguments);
      this.effect = "none";
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        skeleton: true,
        "skeleton--pulse": this.effect === "pulse",
        "skeleton--sheen": this.effect === "sheen"
      })}
        aria-busy="true"
        aria-live="polite"
      >
        <div part="indicator" class="skeleton__indicator"></div>
      </div>
    `;
    }
  };
  SlSkeleton.styles = skeleton_styles_default;
  __decorateClass([
    e4()
  ], SlSkeleton.prototype, "effect", 2);
  SlSkeleton = __decorateClass([
    n5("sl-skeleton")
  ], SlSkeleton);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.PDRHYLLG.js
  var r5 = (o8) => o8.strings === void 0;
  var f2 = {};
  var s4 = (o8, i25 = f2) => o8._$AH = i25;
  var l3 = e(class extends i {
    constructor(r22) {
      if (super(r22), r22.type !== t.PROPERTY && r22.type !== t.ATTRIBUTE && r22.type !== t.BOOLEAN_ATTRIBUTE)
        throw Error("The `live` directive is not allowed on child or event bindings");
      if (!r5(r22))
        throw Error("`live` bindings can only contain a single expression");
    }
    render(r22) {
      return r22;
    }
    update(i25, [t23]) {
      if (t23 === T || t23 === x)
        return t23;
      const o8 = i25.element, l22 = i25.name;
      if (i25.type === t.PROPERTY) {
        if (t23 === o8[l22])
          return T;
      } else if (i25.type === t.BOOLEAN_ATTRIBUTE) {
        if (!!t23 === o8.hasAttribute(l22))
          return T;
      } else if (i25.type === t.ATTRIBUTE && o8.getAttribute(l22) === t23 + "")
        return T;
      return s4(i25), t23;
    }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.SJSINRNQ.js
  var l4 = (l22) => l22 != null ? l22 : x;

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.YTV73MAM.js
  var hasFocusVisible = (() => {
    const style2 = document.createElement("style");
    let isSupported;
    try {
      document.head.appendChild(style2);
      style2.sheet.insertRule(":focus-visible { color: inherit }");
      isSupported = true;
    } catch (e5) {
      isSupported = false;
    } finally {
      style2.remove();
    }
    return isSupported;
  })();
  var focusVisibleSelector = o(hasFocusVisible ? ":focus-visible" : ":focus");

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.OGFJOV5J.js
  var switch_styles_default = r`
  ${component_styles_default}

  :host {
    --height: var(--sl-toggle-size);
    --thumb-size: calc(var(--sl-toggle-size) + 4px);
    --width: calc(var(--height) * 2);

    display: inline-block;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-input-font-family);
    font-size: var(--sl-input-font-size-medium);
    font-weight: var(--sl-input-font-weight);
    color: rgb(var(--sl-input-color));
    vertical-align: middle;
    cursor: pointer;
  }

  .switch__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--width);
    height: var(--height);
    background-color: rgb(var(--sl-color-neutral-400));
    border: solid var(--sl-input-border-width) rgb(var(--sl-color-neutral-400));
    border-radius: var(--height);
    transition: var(--sl-transition-fast) border-color, var(--sl-transition-fast) background-color;
  }

  .switch__control .switch__thumb {
    width: var(--thumb-size);
    height: var(--thumb-size);
    background-color: rgb(var(--sl-color-neutral-0));
    border-radius: 50%;
    border: solid var(--sl-input-border-width) rgb(var(--sl-color-neutral-400));
    transform: translateX(calc((var(--width) - var(--height)) / -2));
    transition: var(--sl-transition-fast) transform ease, var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) border-color, var(--sl-transition-fast) box-shadow;
  }

  .switch__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Hover */
  .switch:not(.switch--checked):not(.switch--disabled) .switch__control:hover {
    background-color: rgb(var(--sl-color-neutral-400));
    border-color: rgb(var(--sl-color-neutral-400));
  }

  .switch:not(.switch--checked):not(.switch--disabled) .switch__control:hover .switch__thumb {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-neutral-400));
  }

  /* Focus */
  .switch:not(.switch--checked):not(.switch--disabled) .switch__input${focusVisibleSelector} ~ .switch__control {
    background-color: rgb(var(--sl-color-neutral-400));
    border-color: rgb(var(--sl-color-neutral-400));
  }

  .switch:not(.switch--checked):not(.switch--disabled)
    .switch__input${focusVisibleSelector}
    ~ .switch__control
    .switch__thumb {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-primary-600));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  /* Checked */
  .switch--checked .switch__control {
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
  }

  .switch--checked .switch__control .switch__thumb {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-primary-600));
    transform: translateX(calc((var(--width) - var(--height)) / 2));
  }

  /* Checked + hover */
  .switch.switch--checked:not(.switch--disabled) .switch__control:hover {
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
  }

  .switch.switch--checked:not(.switch--disabled) .switch__control:hover .switch__thumb {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-primary-600));
  }

  /* Checked + focus */
  .switch.switch--checked:not(.switch--disabled) .switch__input${focusVisibleSelector} ~ .switch__control {
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
  }

  .switch.switch--checked:not(.switch--disabled)
    .switch__input${focusVisibleSelector}
    ~ .switch__control
    .switch__thumb {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-primary-600));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  /* Disabled */
  .switch--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .switch__label {
    line-height: var(--height);
    margin-left: 0.5em;
    user-select: none;
  }
`;
  var id2 = 0;
  var SlSwitch = class extends n4 {
    constructor() {
      super(...arguments);
      this.switchId = `switch-${++id2}`;
      this.labelId = `switch-label-${id2}`;
      this.hasFocus = false;
      this.disabled = false;
      this.required = false;
      this.checked = false;
      this.invalid = false;
    }
    firstUpdated() {
      this.invalid = !this.input.checkValidity();
    }
    click() {
      this.input.click();
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleCheckedChange() {
      if (this.input) {
        this.input.checked = this.checked;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleClick() {
      this.checked = !this.checked;
      emit(this, "sl-change");
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.checked = false;
        emit(this, "sl-change");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.checked = true;
        emit(this, "sl-change");
      }
    }
    render() {
      return y`
      <label
        part="base"
        for=${this.switchId}
        class=${o5({
        switch: true,
        "switch--checked": this.checked,
        "switch--disabled": this.disabled,
        "switch--focused": this.hasFocus
      })}
      >
        <input
          id=${this.switchId}
          class="switch__input"
          type="checkbox"
          name=${l4(this.name)}
          value=${l4(this.value)}
          .checked=${l3(this.checked)}
          .disabled=${this.disabled}
          .required=${this.required}
          role="switch"
          aria-checked=${this.checked ? "true" : "false"}
          aria-labelledby=${this.labelId}
          @click=${this.handleClick}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
          @keydown=${this.handleKeyDown}
        />

        <span part="control" class="switch__control">
          <span part="thumb" class="switch__thumb"></span>
        </span>

        <span part="label" id=${this.labelId} class="switch__label">
          <slot></slot>
        </span>
      </label>
    `;
    }
  };
  SlSwitch.styles = switch_styles_default;
  __decorateClass([
    i23('input[type="checkbox"]')
  ], SlSwitch.prototype, "input", 2);
  __decorateClass([
    t3()
  ], SlSwitch.prototype, "hasFocus", 2);
  __decorateClass([
    e4()
  ], SlSwitch.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlSwitch.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSwitch.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSwitch.prototype, "required", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSwitch.prototype, "checked", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSwitch.prototype, "invalid", 2);
  __decorateClass([
    watch("checked")
  ], SlSwitch.prototype, "handleCheckedChange", 1);
  __decorateClass([
    watch("disabled")
  ], SlSwitch.prototype, "handleDisabledChange", 1);
  SlSwitch = __decorateClass([
    n5("sl-switch")
  ], SlSwitch);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.DFSTU6BZ.js
  var tab_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    border-radius: var(--sl-border-radius-medium);
    color: rgb(var(--sl-color-neutral-600));
    padding: var(--sl-spacing-medium) var(--sl-spacing-large);
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
    transition: var(--transition-speed) box-shadow, var(--transition-speed) color;
  }

  .tab:hover:not(.tab--disabled) {
    color: rgb(var(--sl-color-primary-600));
  }

  .tab:focus {
    outline: none;
  }

  .tab${focusVisibleSelector}:not(.tab--disabled) {
    color: rgb(var(--sl-color-primary-600));
    box-shadow: inset var(--sl-focus-ring);
  }

  .tab.tab--active:not(.tab--disabled) {
    color: rgb(var(--sl-color-primary-600));
  }

  .tab.tab--closable {
    padding-right: var(--sl-spacing-small);
  }

  .tab.tab--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab__close-button {
    font-size: var(--sl-font-size-large);
    margin-left: var(--sl-spacing-2x-small);
  }

  .tab__close-button::part(base) {
    padding: var(--sl-spacing-3x-small);
  }
`;
  var id3 = 0;
  var SlTab = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `tab-${++id3}`;
      this.panel = "";
      this.active = false;
      this.closable = false;
      this.disabled = false;
    }
    focus(options) {
      this.tab.focus(options);
    }
    blur() {
      this.tab.blur();
    }
    handleCloseClick() {
      emit(this, "sl-close");
    }
    render() {
      this.id = this.id || this.componentId;
      return y`
      <div
        part="base"
        class=${o5({
        tab: true,
        "tab--active": this.active,
        "tab--closable": this.closable,
        "tab--disabled": this.disabled
      })}
        role="tab"
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-selected=${this.active ? "true" : "false"}
        tabindex=${this.disabled || !this.active ? "-1" : "0"}
      >
        <slot></slot>
        ${this.closable ? y`
              <sl-icon-button
                name="x"
                library="system"
                exportparts="base:close-button"
                class="tab__close-button"
                @click=${this.handleCloseClick}
                tabindex="-1"
                aria-hidden="true"
              ></sl-icon-button>
            ` : ""}
      </div>
    `;
    }
  };
  SlTab.styles = tab_styles_default;
  __decorateClass([
    i23(".tab")
  ], SlTab.prototype, "tab", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlTab.prototype, "panel", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTab.prototype, "active", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlTab.prototype, "closable", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTab.prototype, "disabled", 2);
  SlTab = __decorateClass([
    n5("sl-tab")
  ], SlTab);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XAZN5AQ5.js
  function getOffset(element, parent) {
    return {
      top: Math.round(element.getBoundingClientRect().top - parent.getBoundingClientRect().top),
      left: Math.round(element.getBoundingClientRect().left - parent.getBoundingClientRect().left)
    };
  }
  var locks = new Set();
  function lockBodyScrolling(lockingEl) {
    locks.add(lockingEl);
    document.body.classList.add("sl-scroll-lock");
  }
  function unlockBodyScrolling(lockingEl) {
    locks.delete(lockingEl);
    if (locks.size === 0) {
      document.body.classList.remove("sl-scroll-lock");
    }
  }
  function scrollIntoView(element, container, direction = "vertical", behavior = "smooth") {
    const offset2 = getOffset(element, container);
    const offsetTop = offset2.top + container.scrollTop;
    const offsetLeft = offset2.left + container.scrollLeft;
    const minX = container.scrollLeft;
    const maxX = container.scrollLeft + container.offsetWidth;
    const minY = container.scrollTop;
    const maxY = container.scrollTop + container.offsetHeight;
    if (direction === "horizontal" || direction === "both") {
      if (offsetLeft < minX) {
        container.scrollTo({ left: offsetLeft, behavior });
      } else if (offsetLeft + element.clientWidth > maxX) {
        container.scrollTo({ left: offsetLeft - container.offsetWidth + element.clientWidth, behavior });
      }
    }
    if (direction === "vertical" || direction === "both") {
      if (offsetTop < minY) {
        container.scrollTo({ top: offsetTop, behavior });
      } else if (offsetTop + element.clientHeight > maxY) {
        container.scrollTo({ top: offsetTop - container.offsetHeight + element.clientHeight, behavior });
      }
    }
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CK3QYPJ3.js
  var tab_group_styles_default = r`
  ${component_styles_default}

  :host {
    --track-color: rgb(var(--sl-color-neutral-200));
    --indicator-color: rgb(var(--sl-color-primary-600));

    display: block;
  }

  .tab-group {
    display: flex;
    border: solid 1px transparent;
    border-radius: 0;
  }

  .tab-group .tab-group__tabs {
    display: flex;
    position: relative;
  }

  .tab-group .tab-group__indicator {
    position: absolute;
    left: 0;
    transition: var(--sl-transition-fast) transform ease, var(--sl-transition-fast) width ease;
  }

  .tab-group--has-scroll-controls .tab-group__nav-container {
    position: relative;
    padding: 0 var(--sl-spacing-x-large);
  }

  .tab-group__scroll-button {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--sl-spacing-x-large);
  }

  .tab-group__scroll-button--start {
    left: 0;
  }

  .tab-group__scroll-button--end {
    right: 0;
  }

  /*
   * Top
   */

  .tab-group--top {
    flex-direction: column;
  }

  .tab-group--top .tab-group__nav-container {
    order: 1;
  }

  .tab-group--top .tab-group__nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group--top .tab-group__nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group--top .tab-group__tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-bottom: solid 2px var(--track-color);
  }

  .tab-group--top .tab-group__indicator {
    bottom: -2px;
    border-bottom: solid 2px var(--indicator-color);
  }

  .tab-group--top .tab-group__body {
    order: 2;
  }

  .tab-group--top ::slotted(sl-tab-panel) {
    --padding: var(--sl-spacing-medium) 0;
  }

  /*
   * Bottom
   */

  .tab-group--bottom {
    flex-direction: column;
  }

  .tab-group--bottom .tab-group__nav-container {
    order: 2;
  }

  .tab-group--bottom .tab-group__nav {
    display: flex;
    overflow-x: auto;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .tab-group--bottom .tab-group__nav::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .tab-group--bottom .tab-group__tabs {
    flex: 1 1 auto;
    position: relative;
    flex-direction: row;
    border-top: solid 2px var(--track-color);
  }

  .tab-group--bottom .tab-group__indicator {
    top: calc(-1 * 2px);
    border-top: solid 2px var(--indicator-color);
  }

  .tab-group--bottom .tab-group__body {
    order: 1;
  }

  .tab-group--bottom ::slotted(sl-tab-panel) {
    --padding: var(--sl-spacing-medium) 0;
  }

  /*
   * Start
   */

  .tab-group--start {
    flex-direction: row;
  }

  .tab-group--start .tab-group__nav-container {
    order: 1;
  }

  .tab-group--start .tab-group__tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-right: solid 2px var(--track-color);
  }

  .tab-group--start .tab-group__indicator {
    right: calc(-1 * 2px);
    border-right: solid 2px var(--indicator-color);
  }

  .tab-group--start .tab-group__body {
    flex: 1 1 auto;
    order: 2;
  }

  .tab-group--start ::slotted(sl-tab-panel) {
    --padding: 0 var(--sl-spacing-medium);
  }

  /*
   * End
   */

  .tab-group--end {
    flex-direction: row;
  }

  .tab-group--end .tab-group__nav-container {
    order: 2;
  }

  .tab-group--end .tab-group__tabs {
    flex: 0 0 auto;
    flex-direction: column;
    border-left: solid 2px var(--track-color);
  }

  .tab-group--end .tab-group__indicator {
    left: calc(-1 * 2px);
    border-left: solid 2px var(--indicator-color);
  }

  .tab-group--end .tab-group__body {
    flex: 1 1 auto;
    order: 1;
  }

  .tab-group--end ::slotted(sl-tab-panel) {
    --padding: 0 var(--sl-spacing-medium);
  }
`;
  var SlTabGroup = class extends n4 {
    constructor() {
      super(...arguments);
      this.tabs = [];
      this.panels = [];
      this.hasScrollControls = false;
      this.placement = "top";
      this.activation = "auto";
      this.noScrollControls = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.resizeObserver = new ResizeObserver(() => {
        this.preventIndicatorTransition();
        this.repositionIndicator();
        this.updateScrollControls();
      });
      this.mutationObserver = new MutationObserver((mutations) => {
        if (mutations.some((m2) => !["aria-labelledby", "aria-controls"].includes(m2.attributeName))) {
          setTimeout(() => this.setAriaLabels());
        }
        if (mutations.some((m2) => m2.attributeName === "disabled")) {
          this.syncTabsAndPanels();
        }
      });
      this.updateComplete.then(() => {
        this.syncTabsAndPanels();
        this.mutationObserver.observe(this, { attributes: true, childList: true, subtree: true });
        this.resizeObserver.observe(this.nav);
        const intersectionObserver = new IntersectionObserver((entries, observer) => {
          if (entries[0].intersectionRatio > 0) {
            this.setAriaLabels();
            this.setActiveTab(this.getActiveTab() || this.tabs[0], { emitEvents: false });
            observer.unobserve(entries[0].target);
          }
        });
        intersectionObserver.observe(this.tabGroup);
      });
    }
    disconnectedCallback() {
      this.mutationObserver.disconnect();
      this.resizeObserver.unobserve(this.nav);
    }
    show(panel) {
      const tab = this.tabs.find((el) => el.panel === panel);
      if (tab) {
        this.setActiveTab(tab, { scrollBehavior: "smooth" });
      }
    }
    getAllTabs(includeDisabled = false) {
      const slot = this.shadowRoot.querySelector('slot[name="nav"]');
      return [...slot.assignedElements()].filter((el) => {
        return includeDisabled ? el.tagName.toLowerCase() === "sl-tab" : el.tagName.toLowerCase() === "sl-tab" && !el.disabled;
      });
    }
    getAllPanels() {
      const slot = this.body.querySelector("slot");
      return [...slot.assignedElements()].filter((el) => el.tagName.toLowerCase() === "sl-tab-panel");
    }
    getActiveTab() {
      return this.tabs.find((el) => el.active);
    }
    handleClick(event) {
      const target = event.target;
      const tab = target.closest("sl-tab");
      const tabGroup = tab == null ? void 0 : tab.closest("sl-tab-group");
      if (tabGroup !== this) {
        return;
      }
      if (tab) {
        this.setActiveTab(tab, { scrollBehavior: "smooth" });
      }
    }
    handleKeyDown(event) {
      const target = event.target;
      const tab = target.closest("sl-tab");
      const tabGroup = tab == null ? void 0 : tab.closest("sl-tab-group");
      if (tabGroup !== this) {
        return;
      }
      if (["Enter", " "].includes(event.key)) {
        if (tab) {
          this.setActiveTab(tab, { scrollBehavior: "smooth" });
          event.preventDefault();
        }
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.tagName.toLowerCase() === "sl-tab") {
          let index = this.tabs.indexOf(activeEl);
          if (event.key === "Home") {
            index = 0;
          } else if (event.key === "End") {
            index = this.tabs.length - 1;
          } else if (["top", "bottom"].includes(this.placement) && event.key === "ArrowLeft" || ["start", "end"].includes(this.placement) && event.key === "ArrowUp") {
            index = Math.max(0, index - 1);
          } else if (["top", "bottom"].includes(this.placement) && event.key === "ArrowRight" || ["start", "end"].includes(this.placement) && event.key === "ArrowDown") {
            index = Math.min(this.tabs.length - 1, index + 1);
          }
          this.tabs[index].focus({ preventScroll: true });
          if (this.activation === "auto") {
            this.setActiveTab(this.tabs[index], { scrollBehavior: "smooth" });
          }
          if (["top", "bottom"].includes(this.placement)) {
            scrollIntoView(this.tabs[index], this.nav, "horizontal");
          }
          event.preventDefault();
        }
      }
    }
    handleScrollToStart() {
      this.nav.scroll({
        left: this.nav.scrollLeft - this.nav.clientWidth,
        behavior: "smooth"
      });
    }
    handleScrollToEnd() {
      this.nav.scroll({
        left: this.nav.scrollLeft + this.nav.clientWidth,
        behavior: "smooth"
      });
    }
    updateScrollControls() {
      if (this.nav) {
        if (this.noScrollControls) {
          this.hasScrollControls = false;
        } else {
          this.hasScrollControls = ["top", "bottom"].includes(this.placement) && this.nav.scrollWidth > this.nav.clientWidth;
        }
      }
    }
    setActiveTab(tab, options) {
      options = Object.assign({
        emitEvents: true,
        scrollBehavior: "auto"
      }, options);
      if (tab && tab !== this.activeTab && !tab.disabled) {
        const previousTab = this.activeTab;
        this.activeTab = tab;
        this.tabs.map((el) => el.active = el === this.activeTab);
        this.panels.map((el) => el.active = el.name === this.activeTab.panel);
        this.syncIndicator();
        if (["top", "bottom"].includes(this.placement)) {
          scrollIntoView(this.activeTab, this.nav, "horizontal", options.scrollBehavior);
        }
        if (options.emitEvents) {
          if (previousTab) {
            emit(this, "sl-tab-hide", { detail: { name: previousTab.panel } });
          }
          emit(this, "sl-tab-show", { detail: { name: this.activeTab.panel } });
        }
      }
    }
    setAriaLabels() {
      this.tabs.map((tab) => {
        const panel = this.panels.find((el) => el.name === tab.panel);
        if (panel) {
          tab.setAttribute("aria-controls", panel.getAttribute("id"));
          panel.setAttribute("aria-labelledby", tab.getAttribute("id"));
        }
      });
    }
    syncIndicator() {
      if (this.indicator) {
        const tab = this.getActiveTab();
        if (tab) {
          this.indicator.style.display = "block";
          this.repositionIndicator();
        } else {
          this.indicator.style.display = "none";
          return;
        }
      }
    }
    repositionIndicator() {
      const currentTab = this.getActiveTab();
      if (!currentTab) {
        return;
      }
      const width = currentTab.clientWidth;
      const height = currentTab.clientHeight;
      const offset2 = getOffset(currentTab, this.nav);
      const offsetTop = offset2.top + this.nav.scrollTop;
      const offsetLeft = offset2.left + this.nav.scrollLeft;
      switch (this.placement) {
        case "top":
        case "bottom":
          this.indicator.style.width = `${width}px`;
          this.indicator.style.height = "auto";
          this.indicator.style.transform = `translateX(${offsetLeft}px)`;
          break;
        case "start":
        case "end":
          this.indicator.style.width = "auto";
          this.indicator.style.height = `${height}px`;
          this.indicator.style.transform = `translateY(${offsetTop}px)`;
          break;
      }
    }
    preventIndicatorTransition() {
      const transitionValue = this.indicator.style.transition;
      this.indicator.style.transition = "none";
      requestAnimationFrame(() => {
        this.indicator.style.transition = transitionValue;
      });
    }
    syncTabsAndPanels() {
      this.tabs = this.getAllTabs();
      this.panels = this.getAllPanels();
      this.syncIndicator();
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        "tab-group": true,
        "tab-group--top": this.placement === "top",
        "tab-group--bottom": this.placement === "bottom",
        "tab-group--start": this.placement === "start",
        "tab-group--end": this.placement === "end",
        "tab-group--has-scroll-controls": this.hasScrollControls
      })}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        <div class="tab-group__nav-container" part="nav">
          ${this.hasScrollControls ? y`
                <sl-icon-button
                  class="tab-group__scroll-button tab-group__scroll-button--start"
                  exportparts="base:scroll-button"
                  name="chevron-left"
                  library="system"
                  @click=${this.handleScrollToStart}
                ></sl-icon-button>
              ` : ""}

          <div class="tab-group__nav">
            <div part="tabs" class="tab-group__tabs" role="tablist">
              <div part="active-tab-indicator" class="tab-group__indicator"></div>
              <slot name="nav" @slotchange=${this.syncTabsAndPanels}></slot>
            </div>
          </div>

          ${this.hasScrollControls ? y`
                <sl-icon-button
                  class="tab-group__scroll-button tab-group__scroll-button--end"
                  exportparts="base:scroll-button"
                  name="chevron-right"
                  library="system"
                  @click=${this.handleScrollToEnd}
                ></sl-icon-button>
              ` : ""}
        </div>

        <div part="body" class="tab-group__body">
          <slot @slotchange=${this.syncTabsAndPanels}></slot>
        </div>
      </div>
    `;
    }
  };
  SlTabGroup.styles = tab_group_styles_default;
  __decorateClass([
    i23(".tab-group")
  ], SlTabGroup.prototype, "tabGroup", 2);
  __decorateClass([
    i23(".tab-group__body")
  ], SlTabGroup.prototype, "body", 2);
  __decorateClass([
    i23(".tab-group__nav")
  ], SlTabGroup.prototype, "nav", 2);
  __decorateClass([
    i23(".tab-group__indicator")
  ], SlTabGroup.prototype, "indicator", 2);
  __decorateClass([
    t3()
  ], SlTabGroup.prototype, "hasScrollControls", 2);
  __decorateClass([
    e4()
  ], SlTabGroup.prototype, "placement", 2);
  __decorateClass([
    e4()
  ], SlTabGroup.prototype, "activation", 2);
  __decorateClass([
    e4({ attribute: "no-scroll-controls", type: Boolean })
  ], SlTabGroup.prototype, "noScrollControls", 2);
  __decorateClass([
    watch("noScrollControls")
  ], SlTabGroup.prototype, "updateScrollControls", 1);
  __decorateClass([
    watch("placement")
  ], SlTabGroup.prototype, "syncIndicator", 1);
  SlTabGroup = __decorateClass([
    n5("sl-tab-group")
  ], SlTabGroup);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.7YRP3T4X.js
  var tab_panel_styles_default = r`
  ${component_styles_default}

  :host {
    --padding: 0;

    display: block;
  }

  .tab-panel {
    border: solid 1px transparent;
    padding: var(--padding);
  }
`;
  var id4 = 0;
  var SlTabPanel = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `tab-panel-${++id4}`;
      this.name = "";
      this.active = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.id = this.id || this.componentId;
    }
    render() {
      this.style.display = this.active ? "block" : "none";
      return y`
      <div
        part="base"
        class="tab-panel"
        role="tabpanel"
        aria-selected=${this.active ? "true" : "false"}
        aria-hidden=${this.active ? "false" : "true"}
      >
        <slot></slot>
      </div>
    `;
    }
  };
  SlTabPanel.styles = tab_panel_styles_default;
  __decorateClass([
    e4({ reflect: true })
  ], SlTabPanel.prototype, "name", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTabPanel.prototype, "active", 2);
  SlTabPanel = __decorateClass([
    n5("sl-tab-panel")
  ], SlTabPanel);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CXC6WMS2.js
  var renderFormControl = (props, input) => {
    const hasLabel = props.label ? true : !!props.hasLabelSlot;
    const hasHelpText = props.helpText ? true : !!props.hasHelpTextSlot;
    return y`
    <div
      part="form-control"
      class=${o5({
      "form-control": true,
      "form-control--small": props.size === "small",
      "form-control--medium": props.size === "medium",
      "form-control--large": props.size === "large",
      "form-control--has-label": hasLabel,
      "form-control--has-help-text": hasHelpText
    })}
    >
      <label
        part="label"
        id=${l4(props.labelId)}
        class="form-control__label"
        for=${props.inputId}
        aria-hidden=${hasLabel ? "false" : "true"}
        @click=${(event) => props.onLabelClick ? props.onLabelClick(event) : null}
      >
        <slot name="label">${props.label}</slot>
      </label>

      <div class="form-control__input">${y`${input}`}</div>

      <div
        part="help-text"
        id=${l4(props.helpTextId)}
        class="form-control__help-text"
        aria-hidden=${hasHelpText ? "false" : "true"}
      >
        <slot name="help-text">${props.helpText}</slot>
      </div>
    </div>
  `;
  };
  function getLabelledBy(props) {
    const labelledBy = [
      props.label || props.hasLabelSlot ? props.labelId : "",
      props.helpText || props.hasHelpTextSlot ? props.helpTextId : ""
    ].filter((val) => val);
    return labelledBy.join(" ") || void 0;
  }
  var form_control_styles_default = r`
  .form-control .form-control__label {
    display: none;
  }

  .form-control .form-control__help-text {
    display: none;
  }

  /* Label */
  .form-control--has-label .form-control__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    margin-bottom: var(--sl-spacing-3x-small);
  }

  .form-control--has-label.form-control--small .form-control__label {
    font-size: var(--sl-input-label-font-size-small);
  }

  .form-control--has-label.form-control--medium .form-control__label {
    font-size: var(--sl-input-label-font-size-medium);
  }

  .form-control--has-label.form-control--large .form-control_label {
    font-size: var(--sl-input-label-font-size-large);
  }

  /* Help text */
  .form-control--has-help-text .form-control__help-text {
    display: block;
    color: rgb(var(--sl-input-help-text-color));
  }

  .form-control--has-help-text .form-control__help-text ::slotted(*) {
    margin-top: var(--sl-spacing-3x-small);
  }

  .form-control--has-help-text.form-control--small .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-small);
  }

  .form-control--has-help-text.form-control--medium .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-medium);
  }

  .form-control--has-help-text.form-control--large .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-large);
  }
`;

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.IBDZI3K2.js
  function getTextContent(slot) {
    const nodes = slot ? slot.assignedNodes({ flatten: true }) : [];
    let text = "";
    [...nodes].map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    });
    return text;
  }
  function hasSlot(el, name) {
    if (name) {
      return el.querySelector(`:scope > [slot="${name}"]`) !== null;
    }
    return [...el.childNodes].some((node) => {
      if (node.nodeType === node.TEXT_NODE && node.textContent.trim() !== "") {
        return true;
      }
      if (node.nodeType === node.ELEMENT_NODE) {
        const el2 = node;
        if (!el2.hasAttribute("slot")) {
          return true;
        }
      }
      return false;
    });
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ODFJNWIR.js
  var textarea_styles_default = r`
  ${component_styles_default}
  ${form_control_styles_default}

  :host {
    display: block;
  }

  .textarea {
    display: flex;
    align-items: center;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    transition: var(--sl-transition-fast) color, var(--sl-transition-fast) border, var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
    cursor: text;
  }

  /* Standard textareas */
  .textarea--standard {
    background-color: rgb(var(--sl-input-background-color));
    border: solid var(--sl-input-border-width) rgb(var(--sl-input-border-color));
  }

  .textarea--standard:hover:not(.textarea--disabled) {
    background-color: rgb(var(--sl-input-background-color-hover));
    border-color: rgb(var(--sl-input-border-color-hover));
  }
  .textarea--standard:hover:not(.textarea--disabled) .textarea__control {
    color: rgb(var(--sl-input-color-hover));
  }

  .textarea--standard.textarea--focused:not(.textarea--disabled) {
    background-color: rgb(var(--sl-input-background-color-focus));
    border-color: rgb(var(--sl-input-border-color-focus));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
    color: rgb(var(--sl-input-color-focus));
  }

  .textarea--standard.textarea--focused:not(.textarea--disabled) .textarea__control {
    color: rgb(var(--sl-input-color-focus));
  }

  .textarea--standard.textarea--disabled {
    background-color: rgb(var(--sl-input-background-color-disabled));
    border-color: rgb(var(--sl-input-border-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
  }

  .textarea--standard.textarea--disabled .textarea__control {
    color: rgb(var(--sl-input-color-disabled));
  }

  .textarea--standard.textarea--disabled .textarea__control::placeholder {
    color: rgb(var(--sl-input-placeholder-color-disabled));
  }

  /* Filled textareas */
  .textarea--filled {
    border: none;
    background-color: rgb(var(--sl-input-filled-background-color));
    color: rgb(var(--sl-input-color));
  }

  .textarea--filled:hover:not(.textarea--disabled) {
    background-color: rgb(var(--sl-input-filled-background-color-hover));
  }

  .textarea--filled.textarea--focused:not(.textarea--disabled) {
    background-color: rgb(var(--sl-input-filled-background-color-focus));
    box-shadow: var(--sl-focus-ring);
  }

  .textarea--filled.textarea--disabled {
    background-color: rgb(var(--sl-input-filled-background-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
  }

  .textarea__control {
    flex: 1 1 auto;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: 1.4;
    color: rgb(var(--sl-input-color));
    border: none;
    background: none;
    box-shadow: none;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .textarea__control::-webkit-search-decoration,
  .textarea__control::-webkit-search-cancel-button,
  .textarea__control::-webkit-search-results-button,
  .textarea__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .textarea__control::placeholder {
    color: rgb(var(--sl-input-placeholder-color));
    user-select: none;
  }

  .textarea__control:focus {
    outline: none;
  }

  /*
   * Size modifiers
   */

  .textarea--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
  }

  .textarea--small .textarea__control {
    padding: 0.5em var(--sl-input-spacing-small);
  }

  .textarea--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .textarea--medium .textarea__control {
    padding: 0.5em var(--sl-input-spacing-medium);
  }

  .textarea--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
  }

  .textarea--large .textarea__control {
    padding: 0.5em var(--sl-input-spacing-large);
  }

  /*
   * Resize types
   */

  .textarea--resize-none .textarea__control {
    resize: none;
  }

  .textarea--resize-vertical .textarea__control {
    resize: vertical;
  }

  .textarea--resize-auto .textarea__control {
    height: auto;
    resize: none;
  }
`;
  var id5 = 0;
  var SlTextarea = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `textarea-${++id5}`;
      this.helpTextId = `textarea-help-text-${id5}`;
      this.labelId = `textarea-label-${id5}`;
      this.hasFocus = false;
      this.hasHelpTextSlot = false;
      this.hasLabelSlot = false;
      this.size = "medium";
      this.value = "";
      this.filled = false;
      this.helpText = "";
      this.rows = 4;
      this.resize = "vertical";
      this.disabled = false;
      this.readonly = false;
      this.required = false;
      this.invalid = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleSlotChange = this.handleSlotChange.bind(this);
      this.resizeObserver = new ResizeObserver(() => this.setTextareaHeight());
      this.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
      this.handleSlotChange();
      this.updateComplete.then(() => {
        this.setTextareaHeight();
        this.resizeObserver.observe(this.input);
      });
    }
    firstUpdated() {
      this.invalid = !this.input.checkValidity();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.resizeObserver.unobserve(this.input);
      this.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    select() {
      return this.input.select();
    }
    scrollPosition(position) {
      if (position) {
        if (typeof position.top === "number")
          this.input.scrollTop = position.top;
        if (typeof position.left === "number")
          this.input.scrollLeft = position.left;
        return;
      }
      return {
        top: this.input.scrollTop,
        left: this.input.scrollTop
      };
    }
    setSelectionRange(selectionStart, selectionEnd, selectionDirection = "none") {
      return this.input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    }
    setRangeText(replacement, start3, end2, selectMode = "preserve") {
      this.input.setRangeText(replacement, start3, end2, selectMode);
      if (this.value !== this.input.value) {
        this.value = this.input.value;
        emit(this, "sl-input");
      }
      if (this.value !== this.input.value) {
        this.value = this.input.value;
        this.setTextareaHeight();
        emit(this, "sl-input");
        emit(this, "sl-change");
      }
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleChange() {
      this.value = this.input.value;
      this.setTextareaHeight();
      emit(this, "sl-change");
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleInput() {
      this.value = this.input.value;
      this.setTextareaHeight();
      emit(this, "sl-input");
    }
    handleRowsChange() {
      this.setTextareaHeight();
    }
    handleSlotChange() {
      this.hasHelpTextSlot = hasSlot(this, "help-text");
      this.hasLabelSlot = hasSlot(this, "label");
    }
    handleValueChange() {
      if (this.input) {
        this.invalid = !this.input.checkValidity();
      }
    }
    setTextareaHeight() {
      if (this.input) {
        if (this.resize === "auto") {
          this.input.style.height = "auto";
          this.input.style.height = this.input.scrollHeight + "px";
        } else {
          this.input.style.height = void 0;
        }
      }
    }
    render() {
      var _a;
      return renderFormControl({
        inputId: this.inputId,
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpTextId: this.helpTextId,
        helpText: this.helpText,
        hasHelpTextSlot: this.hasHelpTextSlot,
        size: this.size
      }, y`
        <div
          part="base"
          class=${o5({
        textarea: true,
        "textarea--small": this.size === "small",
        "textarea--medium": this.size === "medium",
        "textarea--large": this.size === "large",
        "textarea--standard": !this.filled,
        "textarea--filled": this.filled,
        "textarea--disabled": this.disabled,
        "textarea--focused": this.hasFocus,
        "textarea--empty": ((_a = this.value) == null ? void 0 : _a.length) === 0,
        "textarea--invalid": this.invalid,
        "textarea--resize-none": this.resize === "none",
        "textarea--resize-vertical": this.resize === "vertical",
        "textarea--resize-auto": this.resize === "auto"
      })}
        >
          <textarea
            part="textarea"
            id=${this.inputId}
            class="textarea__control"
            name=${l4(this.name)}
            .value=${l3(this.value)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            placeholder=${l4(this.placeholder)}
            rows=${l4(this.rows)}
            minlength=${l4(this.minlength)}
            maxlength=${l4(this.maxlength)}
            autocapitalize=${l4(this.autocapitalize)}
            autocorrect=${l4(this.autocorrect)}
            ?autofocus=${this.autofocus}
            spellcheck=${l4(this.spellcheck)}
            inputmode=${l4(this.inputmode)}
            aria-labelledby=${l4(getLabelledBy({
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpText: this.helpText,
        helpTextId: this.helpTextId,
        hasHelpTextSlot: this.hasHelpTextSlot
      }))}
            @change=${this.handleChange}
            @input=${this.handleInput}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          ></textarea>
        </div>
      `);
    }
  };
  SlTextarea.styles = textarea_styles_default;
  __decorateClass([
    i23(".textarea__control")
  ], SlTextarea.prototype, "input", 2);
  __decorateClass([
    t3()
  ], SlTextarea.prototype, "hasFocus", 2);
  __decorateClass([
    t3()
  ], SlTextarea.prototype, "hasHelpTextSlot", 2);
  __decorateClass([
    t3()
  ], SlTextarea.prototype, "hasLabelSlot", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlTextarea.prototype, "size", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTextarea.prototype, "filled", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "label", 2);
  __decorateClass([
    e4({ attribute: "help-text" })
  ], SlTextarea.prototype, "helpText", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "placeholder", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlTextarea.prototype, "rows", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "resize", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTextarea.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTextarea.prototype, "readonly", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlTextarea.prototype, "minlength", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlTextarea.prototype, "maxlength", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "pattern", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTextarea.prototype, "required", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTextarea.prototype, "invalid", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "autocapitalize", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "autocorrect", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "autocomplete", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlTextarea.prototype, "autofocus", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlTextarea.prototype, "spellcheck", 2);
  __decorateClass([
    e4()
  ], SlTextarea.prototype, "inputmode", 2);
  __decorateClass([
    watch("disabled")
  ], SlTextarea.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("rows")
  ], SlTextarea.prototype, "handleRowsChange", 1);
  __decorateClass([
    watch("helpText"),
    watch("label")
  ], SlTextarea.prototype, "handleSlotChange", 1);
  __decorateClass([
    watch("value")
  ], SlTextarea.prototype, "handleValueChange", 1);
  SlTextarea = __decorateClass([
    n5("sl-textarea")
  ], SlTextarea);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.VCOHQHQN.js
  var radio_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .radio {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-input-font-family);
    font-size: var(--sl-input-font-size-medium);
    font-weight: var(--sl-input-font-weight);
    color: rgb(var(--sl-input-color));
    vertical-align: middle;
    cursor: pointer;
  }

  .radio__icon {
    display: inline-flex;
    width: var(--sl-toggle-size);
    height: var(--sl-toggle-size);
  }

  .radio__icon svg {
    width: 100%;
    height: 100%;
  }

  .radio__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--sl-toggle-size);
    height: var(--sl-toggle-size);
    border: solid var(--sl-input-border-width) rgb(var(--sl-input-border-color));
    border-radius: 50%;
    background-color: rgb(var(--sl-input-background-color));
    color: transparent;
    transition: var(--sl-transition-fast) border-color, var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color, var(--sl-transition-fast) box-shadow;
  }

  .radio__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  /* Hover */
  .radio:not(.radio--checked):not(.radio--disabled) .radio__control:hover {
    border-color: rgb(var(--sl-input-border-color-hover));
    background-color: rgb(var(--sl-input-background-color-hover));
  }

  /* Focus */
  .radio:not(.radio--checked):not(.radio--disabled) .radio__input${focusVisibleSelector} ~ .radio__control {
    border-color: rgb(var(--sl-input-border-color-focus));
    background-color: rgb(var(--sl-input-background-color-focus));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  /* Checked */
  .radio--checked .radio__control {
    color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-primary-600));
    background-color: rgb(var(--sl-color-primary-600));
  }

  /* Checked + hover */
  .radio.radio--checked:not(.radio--disabled) .radio__control:hover {
    border-color: rgb(var(--sl-color-primary-500));
    background-color: rgb(var(--sl-color-primary-500));
  }

  /* Checked + focus */
  .radio.radio--checked:not(.radio--disabled) .radio__input${focusVisibleSelector} ~ .radio__control {
    border-color: rgb(var(--sl-color-primary-500));
    background-color: rgb(var(--sl-color-primary-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  /* Disabled */
  .radio--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* When the control isn't checked, hide the circle for Windows High Contrast mode a11y */
  .radio:not(.radio--checked) svg circle {
    opacity: 0;
  }

  .radio__label {
    line-height: var(--sl-toggle-size);
    margin-left: 0.5em;
    user-select: none;
  }
`;
  var id6 = 0;
  var SlRadio = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `radio-${++id6}`;
      this.labelId = `radio-label-${id6}`;
      this.hasFocus = false;
      this.disabled = false;
      this.checked = false;
      this.invalid = false;
    }
    click() {
      this.input.click();
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    getAllRadios() {
      const radioGroup = this.closest("sl-radio-group");
      if (!radioGroup) {
        return [this];
      }
      return [...radioGroup.querySelectorAll("sl-radio")].filter((radio) => radio.name === this.name);
    }
    getSiblingRadios() {
      return this.getAllRadios().filter((radio) => radio !== this);
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleCheckedChange() {
      if (this.checked) {
        this.getSiblingRadios().map((radio) => radio.checked = false);
      }
    }
    handleClick() {
      this.checked = true;
      emit(this, "sl-change");
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleKeyDown(event) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        const radios = this.getAllRadios().filter((radio) => !radio.disabled);
        const incr = ["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1;
        let index = radios.indexOf(this) + incr;
        if (index < 0)
          index = radios.length - 1;
        if (index > radios.length - 1)
          index = 0;
        this.getAllRadios().map((radio) => radio.checked = false);
        radios[index].focus();
        radios[index].checked = true;
        emit(radios[index], "sl-change");
        event.preventDefault();
      }
    }
    render() {
      return y`
      <label
        part="base"
        class=${o5({
        radio: true,
        "radio--checked": this.checked,
        "radio--disabled": this.disabled,
        "radio--focused": this.hasFocus
      })}
        for=${this.inputId}
        @keydown=${this.handleKeyDown}
      >
        <input
          id=${this.inputId}
          class="radio__input"
          type="radio"
          name=${l4(this.name)}
          value=${l4(this.value)}
          .checked=${l3(this.checked)}
          .disabled=${this.disabled}
          aria-checked=${this.checked ? "true" : "false"}
          aria-disabled=${this.disabled ? "true" : "false"}
          aria-labelledby=${this.labelId}
          @click=${this.handleClick}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
        />

        <span part="control" class="radio__control">
          <span part="checked-icon" class="radio__icon">
            <svg viewBox="0 0 16 16">
              <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <g fill="currentColor">
                  <circle cx="8" cy="8" r="3.42857143"></circle>
                </g>
              </g>
            </svg>
          </span>
        </span>

        <span part="label" id=${this.labelId} class="radio__label">
          <slot></slot>
        </span>
      </label>
    `;
    }
  };
  SlRadio.styles = radio_styles_default;
  __decorateClass([
    i23('input[type="radio"]')
  ], SlRadio.prototype, "input", 2);
  __decorateClass([
    t3()
  ], SlRadio.prototype, "hasFocus", 2);
  __decorateClass([
    e4()
  ], SlRadio.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlRadio.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRadio.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRadio.prototype, "checked", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRadio.prototype, "invalid", 2);
  __decorateClass([
    watch("checked", { waitUntilFirstUpdate: true })
  ], SlRadio.prototype, "handleCheckedChange", 1);
  __decorateClass([
    watch("disabled")
  ], SlRadio.prototype, "handleDisabledChange", 1);
  SlRadio = __decorateClass([
    n5("sl-radio")
  ], SlRadio);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.OZBPYNIL.js
  var radio_group_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .radio-group {
    border: solid var(--sl-panel-border-width) rgb(var(--sl-panel-border-color));
    border-radius: var(--sl-border-radius-medium);
    padding: var(--sl-spacing-large);
    padding-top: var(--sl-spacing-x-small);
  }

  .radio-group .radio-group__label {
    font-family: var(--sl-input-font-family);
    font-size: var(--sl-input-font-size-medium);
    font-weight: var(--sl-input-font-weight);
    color: rgb(var(--sl-input-color));
    padding: 0 var(--sl-spacing-2x-small);
  }

  ::slotted(sl-radio:not(:last-of-type)) {
    display: block;
    margin-bottom: var(--sl-spacing-2x-small);
  }

  .radio-group:not(.radio-group--has-fieldset) {
    border: none;
    padding: 0;
    margin: 0;
    min-width: 0;
  }

  .radio-group:not(.radio-group--has-fieldset) .radio-group__label {
    position: absolute;
    width: 0;
    height: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }
`;
  var SlRadioGroup = class extends n4 {
    constructor() {
      super(...arguments);
      this.label = "";
      this.fieldset = false;
    }
    handleFocusIn() {
      requestAnimationFrame(() => {
        const checkedRadio = [...this.defaultSlot.assignedElements({ flatten: true })].find((el) => el.tagName.toLowerCase() === "sl-radio" && el.checked);
        if (checkedRadio) {
          checkedRadio.focus();
        }
      });
    }
    render() {
      return y`
      <fieldset
        part="base"
        class=${o5({
        "radio-group": true,
        "radio-group--has-fieldset": this.fieldset
      })}
        role="radiogroup"
        @focusin=${this.handleFocusIn}
      >
        <legend part="label" class="radio-group__label">
          <slot name="label">${this.label}</slot>
        </legend>
        <slot></slot>
      </fieldset>
    `;
    }
  };
  SlRadioGroup.styles = radio_group_styles_default;
  __decorateClass([
    i23("slot:not([name])")
  ], SlRadioGroup.prototype, "defaultSlot", 2);
  __decorateClass([
    e4()
  ], SlRadioGroup.prototype, "label", 2);
  __decorateClass([
    e4({ type: Boolean, attribute: "fieldset" })
  ], SlRadioGroup.prototype, "fieldset", 2);
  SlRadioGroup = __decorateClass([
    n5("sl-radio-group")
  ], SlRadioGroup);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.QM24T5RN.js
  var range_styles_default = r`
  ${component_styles_default}
  ${form_control_styles_default}

  :host {
    --thumb-size: 20px;
    --tooltip-offset: 10px;
    --track-color-active: rgb(var(--sl-color-neutral-200));
    --track-color-inactive: rgb(var(--sl-color-neutral-200));
    --track-height: 6px;

    display: block;
  }

  .range {
    position: relative;
  }

  .range__control {
    -webkit-appearance: none;
    border-radius: 3px;
    width: 100%;
    height: var(--track-height);
    background: transparent;
    line-height: var(--sl-input-height-medium);
    vertical-align: middle;
  }

  /* Webkit */
  .range__control::-webkit-slider-runnable-track {
    width: 100%;
    height: var(--track-height);
    border-radius: 3px;
    border: none;
  }

  .range__control::-webkit-slider-thumb {
    border: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background-color: rgb(var(--sl-color-primary-600));
    border: solid var(--sl-input-border-width) rgb(var(--sl-color-primary-600));
    -webkit-appearance: none;
    margin-top: calc(var(--thumb-size) / -2 + var(--track-height) / 2);
    transition: var(--sl-transition-fast) border-color, var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color, var(--sl-transition-fast) box-shadow, var(--sl-transition-fast) transform;
    cursor: pointer;
  }

  .range__control:enabled::-webkit-slider-thumb:hover {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
  }

  .range__control:enabled${focusVisibleSelector}::-webkit-slider-thumb {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    box-shadow: var(--sl-focus-ring);
  }

  .range__control:enabled::-webkit-slider-thumb:active {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    cursor: grabbing;
  }

  /* Firefox */
  .range__control::-moz-focus-outer {
    border: 0;
  }

  .range__control::-moz-range-progress {
    background-color: var(--track-color-active);
    border-radius: 3px;
    height: var(--track-height);
  }

  .range__control::-moz-range-track {
    width: 100%;
    height: var(--track-height);
    background-color: var(--track-color-inactive);
    border-radius: 3px;
    border: none;
  }

  .range__control::-moz-range-thumb {
    border: none;
    height: var(--thumb-size);
    width: var(--thumb-size);
    border-radius: 50%;
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
    transition: var(--sl-transition-fast) border-color, var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color, var(--sl-transition-fast) box-shadow, var(--sl-transition-fast) transform;
    cursor: pointer;
  }

  .range__control:enabled::-moz-range-thumb:hover {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
  }

  .range__control:enabled${focusVisibleSelector}::-moz-range-thumb {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    box-shadow: var(--sl-focus-ring);
  }

  .range__control:enabled::-moz-range-thumb:active {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    cursor: grabbing;
  }

  /* States */
  .range__control${focusVisibleSelector} {
    outline: none;
  }

  .range__control:disabled {
    opacity: 0.5;
  }

  .range__control:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .range__control:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  /* Tooltip output */
  .range__tooltip {
    position: absolute;
    z-index: var(--sl-z-index-tooltip);
    left: 1px;
    border-radius: var(--sl-tooltip-border-radius);
    background-color: rgb(var(--sl-tooltip-background-color));
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: rgb(var(--sl-tooltip-color));
    opacity: 0;
    padding: var(--sl-tooltip-padding);
    transition: var(--sl-transition-fast) opacity;
    pointer-events: none;
  }

  .range__tooltip:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    margin-left: calc(-1 * var(--sl-tooltip-arrow-size));
  }

  .range--tooltip-visible .range__tooltip {
    opacity: 1;
  }

  /* Tooltip on top */
  .range--tooltip-top .range__tooltip {
    top: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-top .range__tooltip:after {
    border-top: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    top: 100%;
  }

  /* Tooltip on bottom */
  .range--tooltip-bottom .range__tooltip {
    bottom: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-bottom .range__tooltip:after {
    border-bottom: var(--sl-tooltip-arrow-size) solid rgb(var(--sl-tooltip-background-color));
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    bottom: 100%;
  }
`;
  var id7 = 0;
  var SlRange = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `input-${++id7}`;
      this.helpTextId = `input-help-text-${id7}`;
      this.labelId = `input-label-${id7}`;
      this.hasFocus = false;
      this.hasHelpTextSlot = false;
      this.hasLabelSlot = false;
      this.hasTooltip = false;
      this.name = "";
      this.value = 0;
      this.label = "";
      this.helpText = "";
      this.disabled = false;
      this.invalid = false;
      this.min = 0;
      this.max = 100;
      this.step = 1;
      this.tooltip = "top";
      this.tooltipFormatter = (value) => value.toString();
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleSlotChange = this.handleSlotChange;
      this.resizeObserver = new ResizeObserver(() => this.syncRange());
      this.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
      if (this.value === void 0 || this.value === null)
        this.value = this.min;
      if (this.value < this.min)
        this.value = this.min;
      if (this.value > this.max)
        this.value = this.max;
      this.handleSlotChange();
      this.updateComplete.then(() => {
        this.syncRange();
        this.resizeObserver.observe(this.input);
      });
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.resizeObserver.unobserve(this.input);
      this.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    handleInput() {
      this.value = Number(this.input.value);
      emit(this, "sl-change");
      this.syncRange();
    }
    handleBlur() {
      this.hasFocus = false;
      this.hasTooltip = false;
      emit(this, "sl-blur");
    }
    handleValueChange() {
      this.value = Number(this.value);
      if (this.input) {
        this.invalid = !this.input.checkValidity();
      }
      this.syncRange();
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      this.hasTooltip = true;
      emit(this, "sl-focus");
    }
    handleSlotChange() {
      this.hasHelpTextSlot = hasSlot(this, "help-text");
      this.hasLabelSlot = hasSlot(this, "label");
    }
    handleThumbDragStart() {
      this.hasTooltip = true;
    }
    handleThumbDragEnd() {
      this.hasTooltip = false;
    }
    syncRange() {
      const percent = Math.max(0, (this.value - this.min) / (this.max - this.min));
      this.syncProgress(percent);
      if (this.tooltip !== "none") {
        this.syncTooltip(percent);
      }
    }
    syncProgress(percent) {
      this.input.style.background = `linear-gradient(to right, var(--track-color-active) 0%, var(--track-color-active) ${percent * 100}%, var(--track-color-inactive) ${percent * 100}%, var(--track-color-inactive) 100%)`;
    }
    syncTooltip(percent) {
      if (this.output) {
        const inputWidth = this.input.offsetWidth;
        const tooltipWidth = this.output.offsetWidth;
        const thumbSize = getComputedStyle(this.input).getPropertyValue("--thumb-size");
        const x2 = `calc(${inputWidth * percent}px - calc(calc(${percent} * ${thumbSize}) - calc(${thumbSize} / 2)))`;
        this.output.style.transform = `translateX(${x2})`;
        this.output.style.marginLeft = `-${tooltipWidth / 2}px`;
      }
    }
    render() {
      return renderFormControl({
        inputId: this.inputId,
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpTextId: this.helpTextId,
        helpText: this.helpText,
        hasHelpTextSlot: this.hasHelpTextSlot,
        size: "medium"
      }, y`
        <div
          part="base"
          class=${o5({
        range: true,
        "range--disabled": this.disabled,
        "range--focused": this.hasFocus,
        "range--tooltip-visible": this.hasTooltip,
        "range--tooltip-top": this.tooltip === "top",
        "range--tooltip-bottom": this.tooltip === "bottom"
      })}
          @mousedown=${this.handleThumbDragStart}
          @mouseup=${this.handleThumbDragEnd}
          @touchstart=${this.handleThumbDragStart}
          @touchend=${this.handleThumbDragEnd}
        >
          <input
            part="input"
            type="range"
            class="range__control"
            name=${l4(this.name)}
            ?disabled=${this.disabled}
            min=${l4(this.min)}
            max=${l4(this.max)}
            step=${l4(this.step)}
            .value=${l3(String(this.value))}
            aria-labelledby=${l4(getLabelledBy({
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpText: this.helpText,
        helpTextId: this.helpTextId,
        hasHelpTextSlot: this.hasHelpTextSlot
      }))}
            @input=${this.handleInput}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          />
          ${this.tooltip !== "none" && !this.disabled ? y` <output part="tooltip" class="range__tooltip"> ${this.tooltipFormatter(this.value)} </output> ` : ""}
        </div>
      `);
    }
  };
  SlRange.styles = range_styles_default;
  __decorateClass([
    i23(".range__control")
  ], SlRange.prototype, "input", 2);
  __decorateClass([
    i23(".range__tooltip")
  ], SlRange.prototype, "output", 2);
  __decorateClass([
    t3()
  ], SlRange.prototype, "hasFocus", 2);
  __decorateClass([
    t3()
  ], SlRange.prototype, "hasHelpTextSlot", 2);
  __decorateClass([
    t3()
  ], SlRange.prototype, "hasLabelSlot", 2);
  __decorateClass([
    t3()
  ], SlRange.prototype, "hasTooltip", 2);
  __decorateClass([
    e4()
  ], SlRange.prototype, "name", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRange.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlRange.prototype, "label", 2);
  __decorateClass([
    e4({ attribute: "help-text" })
  ], SlRange.prototype, "helpText", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRange.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRange.prototype, "invalid", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRange.prototype, "min", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRange.prototype, "max", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRange.prototype, "step", 2);
  __decorateClass([
    e4()
  ], SlRange.prototype, "tooltip", 2);
  __decorateClass([
    e4({ attribute: false })
  ], SlRange.prototype, "tooltipFormatter", 2);
  __decorateClass([
    watch("value", { waitUntilFirstUpdate: true })
  ], SlRange.prototype, "handleValueChange", 1);
  __decorateClass([
    watch("disabled")
  ], SlRange.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("label"),
    watch("helpText")
  ], SlRange.prototype, "handleSlotChange", 1);
  SlRange = __decorateClass([
    n5("sl-range")
  ], SlRange);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.T56CG5BM.js
  function clamp2(value, min2, max2) {
    if (value < min2)
      return min2;
    if (value > max2)
      return max2;
    return value;
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.LYXFR7WN.js
  var i24 = e(class extends i {
    constructor(t23) {
      var e24;
      if (super(t23), t23.type !== t.ATTRIBUTE || t23.name !== "style" || ((e24 = t23.strings) === null || e24 === void 0 ? void 0 : e24.length) > 2)
        throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
    }
    render(t23) {
      return Object.keys(t23).reduce((e24, r6) => {
        const s5 = t23[r6];
        return s5 == null ? e24 : e24 + `${r6 = r6.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s5};`;
      }, "");
    }
    update(e24, [r6]) {
      const { style: s5 } = e24.element;
      if (this.ut === void 0) {
        this.ut = new Set();
        for (const t23 in r6)
          this.ut.add(t23);
        return this.render(r6);
      }
      this.ut.forEach((t23) => {
        r6[t23] == null && (this.ut.delete(t23), t23.includes("-") ? s5.removeProperty(t23) : s5[t23] = "");
      });
      for (const t23 in r6) {
        const e33 = r6[t23];
        e33 != null && (this.ut.add(t23), t23.includes("-") ? s5.setProperty(t23, e33) : s5[t23] = e33);
      }
      return T;
    }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.S6TJZ6NJ.js
  var basePath = "";
  function setBasePath(path) {
    basePath = path;
  }
  function getBasePath() {
    return basePath.replace(/\/$/, "");
  }
  var scripts = [...document.getElementsByTagName("script")];
  var configScript = scripts.find((script) => script.hasAttribute("data-shoelace"));
  if (configScript) {
    setBasePath(configScript.getAttribute("data-shoelace"));
  } else {
    const fallbackScript = scripts.find((s5) => /shoelace(\.min)?\.js$/.test(s5.src));
    let path = "";
    if (fallbackScript) {
      path = fallbackScript.getAttribute("src");
    }
    setBasePath(path.split("/").slice(0, -1).join("/"));
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FGIYSBZ6.js
  var library = {
    name: "default",
    resolver: (name) => `${getBasePath()}/assets/icons/${name}.svg`
  };
  var library_default_default = library;

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.HEOUBJ7T.js
  var icons = {
    check: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
    </svg>
  `,
    "chevron-down": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
    "chevron-left": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  `,
    "chevron-right": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
    eye: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
    </svg>
  `,
    "eye-slash": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
    </svg>
  `,
    eyedropper: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
      <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708l-2-2zM2 12.707l7-7L10.293 7l-7 7H2v-1.293z"></path>
    </svg>
  `,
    "grip-vertical": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
  `,
    "person-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  `,
    "play-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
    </svg>
  `,
    "pause-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"></path>
    </svg>
  `,
    "star-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
    </svg>
  `,
    x: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,
    "x-circle-fill": `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"></path>
    </svg>
  `
  };
  var systemLibrary = {
    name: "system",
    resolver: (name) => {
      if (icons[name]) {
        return `data:image/svg+xml,${encodeURIComponent(icons[name])}`;
      } else {
        return "";
      }
    }
  };
  var library_system_default = systemLibrary;

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.S67EMIEU.js
  var registry = [library_default_default, library_system_default];
  var watchedIcons = [];
  function watchIcon(icon) {
    watchedIcons.push(icon);
  }
  function unwatchIcon(icon) {
    watchedIcons = watchedIcons.filter((el) => el !== icon);
  }
  function getIconLibrary(name) {
    return registry.filter((lib) => lib.name === name)[0];
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ARRH633M.js
  var iconFiles = new Map();
  var requestIcon = (url) => {
    if (iconFiles.has(url)) {
      return iconFiles.get(url);
    } else {
      const request = fetch(url).then(async (response) => {
        if (response.ok) {
          const div = document.createElement("div");
          div.innerHTML = await response.text();
          const svg = div.firstElementChild;
          return {
            ok: response.ok,
            status: response.status,
            svg: svg && svg.tagName.toLowerCase() === "svg" ? svg.outerHTML : ""
          };
        } else {
          return {
            ok: response.ok,
            status: response.status,
            svg: null
          };
        }
      });
      iconFiles.set(url, request);
      return request;
    }
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JLHSNTW6.js
  var e32 = class extends i {
    constructor(i25) {
      if (super(i25), this.it = x, i25.type !== t.CHILD)
        throw Error(this.constructor.directiveName + "() can only be used in child bindings");
    }
    render(r22) {
      if (r22 === x || r22 == null)
        return this.vt = void 0, this.it = r22;
      if (r22 === T)
        return r22;
      if (typeof r22 != "string")
        throw Error(this.constructor.directiveName + "() called with a non-string value");
      if (r22 === this.it)
        return this.vt;
      this.it = r22;
      const s5 = [r22];
      return s5.raw = s5, this.vt = { _$litType$: this.constructor.resultType, strings: s5, values: [] };
    }
  };
  e32.directiveName = "unsafeHTML", e32.resultType = 1;
  var o7 = e(e32);
  var t32 = class extends e32 {
  };
  t32.directiveName = "unsafeSVG", t32.resultType = 2;
  var o22 = e(t32);
  var icon_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
    width: 1em;
    height: 1em;
    contain: strict;
    box-sizing: content-box !important;
  }

  .icon,
  svg {
    display: block;
    height: 100%;
    width: 100%;
  }
`;
  var parser = new DOMParser();
  var SlIcon = class extends n4 {
    constructor() {
      super(...arguments);
      this.svg = "";
      this.library = "default";
    }
    connectedCallback() {
      super.connectedCallback();
      watchIcon(this);
    }
    firstUpdated() {
      this.setIcon();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      unwatchIcon(this);
    }
    getLabel() {
      let label = "";
      if (this.label) {
        label = this.label;
      } else if (this.name) {
        label = this.name.replace(/-/g, " ");
      } else if (this.src) {
        label = this.src.replace(/.*\//, "").replace(/-/g, " ").replace(/\.svg/i, "");
      }
      return label;
    }
    getUrl() {
      const library2 = getIconLibrary(this.library);
      if (this.name && library2) {
        return library2.resolver(this.name);
      } else {
        return this.src;
      }
    }
    redraw() {
      this.setIcon();
    }
    async setIcon() {
      const library2 = getIconLibrary(this.library);
      const url = this.getUrl();
      if (url) {
        try {
          const file = await requestIcon(url);
          if (url !== this.getUrl()) {
            return;
          } else if (file.ok) {
            const doc = parser.parseFromString(file.svg, "text/html");
            const svgEl = doc.body.querySelector("svg");
            if (svgEl) {
              if (library2 && library2.mutator) {
                library2.mutator(svgEl);
              }
              this.svg = svgEl.outerHTML;
              emit(this, "sl-load");
            } else {
              this.svg = "";
              emit(this, "sl-error", { detail: { status: file.status } });
            }
          } else {
            this.svg = "";
            emit(this, "sl-error", { detail: { status: file.status } });
          }
        } catch (e42) {
          emit(this, "sl-error", { detail: { status: -1 } });
        }
      } else if (this.svg) {
        this.svg = "";
      }
    }
    handleChange() {
      this.setIcon();
    }
    render() {
      return y` <div part="base" class="icon" role="img" aria-label=${this.getLabel()}>${o22(this.svg)}</div>`;
    }
  };
  SlIcon.styles = icon_styles_default;
  __decorateClass([
    t3()
  ], SlIcon.prototype, "svg", 2);
  __decorateClass([
    e4()
  ], SlIcon.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlIcon.prototype, "src", 2);
  __decorateClass([
    e4()
  ], SlIcon.prototype, "label", 2);
  __decorateClass([
    e4()
  ], SlIcon.prototype, "library", 2);
  __decorateClass([
    watch("name"),
    watch("src"),
    watch("library")
  ], SlIcon.prototype, "setIcon", 1);
  SlIcon = __decorateClass([
    n5("sl-icon")
  ], SlIcon);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.RH5RR2TD.js
  var rating_styles_default = r`
  ${component_styles_default}

  :host {
    --symbol-color: rgb(var(--sl-color-neutral-300));
    --symbol-color-active: rgb(var(--sl-color-amber-500));
    --symbol-size: 1.2rem;
    --symbol-spacing: var(--sl-spacing-3x-small);

    display: inline-flex;
  }

  .rating {
    position: relative;
    display: inline-flex;
    border-radius: var(--sl-border-radius-medium);
    vertical-align: middle;
  }

  .rating:focus {
    outline: none;
  }

  .rating${focusVisibleSelector} {
    box-shadow: var(--sl-focus-ring);
  }

  .rating__symbols {
    display: inline-flex;
    position: relative;
    font-size: var(--symbol-size);
    line-height: 0;
    color: var(--symbol-color);
    white-space: nowrap;
    cursor: pointer;
  }

  .rating__symbols > * {
    padding: var(--symbol-spacing);
  }

  .rating__symbols--indicator {
    position: absolute;
    top: 0;
    left: 0;
    color: var(--symbol-color-active);
    pointer-events: none;
  }

  .rating__symbol {
    transition: var(--sl-transition-fast) transform;
  }

  .rating__symbol--hover {
    transform: scale(1.2);
  }

  .rating--disabled .rating__symbols,
  .rating--readonly .rating__symbols {
    cursor: default;
  }

  .rating--disabled .rating__symbol--hover,
  .rating--readonly .rating__symbol--hover {
    transform: none;
  }

  .rating--disabled {
    opacity: 0.5;
  }

  .rating--disabled .rating__symbols {
    cursor: not-allowed;
  }
`;
  var SlRating = class extends n4 {
    constructor() {
      super(...arguments);
      this.hoverValue = 0;
      this.isHovering = false;
      this.value = 0;
      this.max = 5;
      this.precision = 1;
      this.readonly = false;
      this.disabled = false;
      this.getSymbol = (value) => '<sl-icon name="star-fill" library="system"></sl-icon>';
    }
    focus(options) {
      this.rating.focus(options);
    }
    blur() {
      this.rating.blur();
    }
    getValueFromMousePosition(event) {
      return this.getValueFromXCoordinate(event.clientX);
    }
    getValueFromTouchPosition(event) {
      return this.getValueFromXCoordinate(event.touches[0].clientX);
    }
    getValueFromXCoordinate(coordinate) {
      const containerLeft = this.rating.getBoundingClientRect().left;
      const containerWidth = this.rating.getBoundingClientRect().width;
      return clamp2(this.roundToPrecision((coordinate - containerLeft) / containerWidth * this.max, this.precision), 0, this.max);
    }
    handleClick(event) {
      this.setValue(this.getValueFromMousePosition(event));
    }
    setValue(newValue) {
      if (this.disabled || this.readonly) {
        return;
      }
      this.value = newValue === this.value ? 0 : newValue;
      this.isHovering = false;
    }
    handleKeyDown(event) {
      if (this.disabled || this.readonly) {
        return;
      }
      if (event.key === "ArrowLeft") {
        const decrement = event.shiftKey ? 1 : this.precision;
        this.value = Math.max(0, this.value - decrement);
        event.preventDefault();
      }
      if (event.key === "ArrowRight") {
        const increment = event.shiftKey ? 1 : this.precision;
        this.value = Math.min(this.max, this.value + increment);
        event.preventDefault();
      }
      if (event.key === "Home") {
        this.value = 0;
        event.preventDefault();
      }
      if (event.key === "End") {
        this.value = this.max;
        event.preventDefault();
      }
    }
    handleMouseEnter() {
      this.isHovering = true;
    }
    handleMouseMove(event) {
      this.hoverValue = this.getValueFromMousePosition(event);
    }
    handleMouseLeave() {
      this.isHovering = false;
    }
    handleTouchStart(event) {
      this.hoverValue = this.getValueFromTouchPosition(event);
      event.preventDefault();
    }
    handleTouchMove(event) {
      this.isHovering = true;
      this.hoverValue = this.getValueFromTouchPosition(event);
    }
    handleTouchEnd(event) {
      this.isHovering = false;
      this.setValue(this.hoverValue);
      event.preventDefault();
    }
    handleValueChange() {
      emit(this, "sl-change");
    }
    roundToPrecision(numberToRound, precision = 0.5) {
      const multiplier = 1 / precision;
      return Math.ceil(numberToRound * multiplier) / multiplier;
    }
    render() {
      const counter = Array.from(Array(this.max).keys());
      let displayValue = 0;
      if (this.disabled || this.readonly) {
        displayValue = this.value;
      } else {
        displayValue = this.isHovering ? this.hoverValue : this.value;
      }
      return y`
      <div
        part="base"
        class=${o5({
        rating: true,
        "rating--readonly": this.readonly,
        "rating--disabled": this.disabled
      })}
        aria-disabled=${this.disabled ? "true" : "false"}
        aria-readonly=${this.readonly ? "true" : "false"}
        aria-value=${this.value}
        aria-valuemin=${0}
        aria-valuemax=${this.max}
        tabindex=${this.disabled ? "-1" : "0"}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @mouseenter=${this.handleMouseEnter}
        @touchstart=${this.handleTouchStart}
        @mouseleave=${this.handleMouseLeave}
        @touchend=${this.handleTouchEnd}
        @mousemove=${this.handleMouseMove}
        @touchmove=${this.handleTouchMove}
      >
        <span class="rating__symbols rating__symbols--inactive">
          ${counter.map((index) => {
        return y`
              <span
                class=${o5({
          rating__symbol: true,
          "rating__symbol--hover": this.isHovering && Math.ceil(displayValue) === index + 1
        })}
                role="presentation"
                @mouseenter=${this.handleMouseEnter}
              >
                ${o7(this.getSymbol(index + 1))}
              </span>
            `;
      })}
        </span>

        <span class="rating__symbols rating__symbols--indicator">
          ${counter.map((index) => {
        return y`
              <span
                class=${o5({
          rating__symbol: true,
          "rating__symbol--hover": this.isHovering && Math.ceil(displayValue) === index + 1
        })}
                style=${i24({
          clipPath: displayValue > index + 1 ? "none" : `inset(0 ${100 - (displayValue - index) / 1 * 100}% 0 0)`
        })}
                role="presentation"
              >
                ${o7(this.getSymbol(index + 1))}
              </span>
            `;
      })}
        </span>
      </div>
    `;
    }
  };
  SlRating.styles = rating_styles_default;
  __decorateClass([
    i23(".rating")
  ], SlRating.prototype, "rating", 2);
  __decorateClass([
    t3()
  ], SlRating.prototype, "hoverValue", 2);
  __decorateClass([
    t3()
  ], SlRating.prototype, "isHovering", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRating.prototype, "value", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRating.prototype, "max", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlRating.prototype, "precision", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRating.prototype, "readonly", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlRating.prototype, "disabled", 2);
  __decorateClass([
    e4()
  ], SlRating.prototype, "getSymbol", 2);
  __decorateClass([
    watch("value", { waitUntilFirstUpdate: true })
  ], SlRating.prototype, "handleValueChange", 1);
  SlRating = __decorateClass([
    n5("sl-rating")
  ], SlRating);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.RT3QLC6D.js
  var SlRelativeTime = class extends n4 {
    constructor() {
      super(...arguments);
      this.isoTime = "";
      this.relativeTime = "";
      this.titleTime = "";
      this.format = "long";
      this.numeric = "auto";
      this.sync = false;
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      clearTimeout(this.updateTimeout);
    }
    updateTime() {
      const now2 = new Date();
      const date = new Date(this.date);
      if (isNaN(date.getMilliseconds())) {
        this.relativeTime = "";
        this.isoTime = "";
        return;
      }
      const diff = +date - +now2;
      const availableUnits = [
        { max: 276e4, value: 6e4, unit: "minute" },
        { max: 72e6, value: 36e5, unit: "hour" },
        { max: 5184e5, value: 864e5, unit: "day" },
        { max: 24192e5, value: 6048e5, unit: "week" },
        { max: 28512e6, value: 2592e6, unit: "month" },
        { max: Infinity, value: 31536e6, unit: "year" }
      ];
      const { unit, value } = availableUnits.find((unit2) => Math.abs(diff) < unit2.max);
      this.isoTime = date.toISOString();
      this.titleTime = new Intl.DateTimeFormat(this.locale, {
        month: "long",
        year: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short"
      }).format(date);
      this.relativeTime = new Intl.RelativeTimeFormat(this.locale, {
        numeric: this.numeric,
        style: this.format
      }).format(Math.round(diff / value), unit);
      clearTimeout(this.updateTimeout);
      if (this.sync) {
        const getTimeUntilNextUnit = (unit2) => {
          const units = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5 };
          const value2 = units[unit2];
          return value2 - now2.getTime() % value2;
        };
        let nextInterval;
        if (unit === "minute") {
          nextInterval = getTimeUntilNextUnit("second");
        } else if (unit === "hour") {
          nextInterval = getTimeUntilNextUnit("minute");
        } else if (unit === "day") {
          nextInterval = getTimeUntilNextUnit("hour");
        } else {
          nextInterval = getTimeUntilNextUnit("day");
        }
        this.updateTimeout = setTimeout(() => this.updateTime(), nextInterval);
      }
    }
    render() {
      return y` <time datetime=${this.isoTime} title=${this.titleTime}>${this.relativeTime}</time> `;
    }
  };
  __decorateClass([
    t3()
  ], SlRelativeTime.prototype, "isoTime", 2);
  __decorateClass([
    t3()
  ], SlRelativeTime.prototype, "relativeTime", 2);
  __decorateClass([
    t3()
  ], SlRelativeTime.prototype, "titleTime", 2);
  __decorateClass([
    e4()
  ], SlRelativeTime.prototype, "date", 2);
  __decorateClass([
    e4()
  ], SlRelativeTime.prototype, "locale", 2);
  __decorateClass([
    e4()
  ], SlRelativeTime.prototype, "format", 2);
  __decorateClass([
    e4()
  ], SlRelativeTime.prototype, "numeric", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlRelativeTime.prototype, "sync", 2);
  __decorateClass([
    watch("date"),
    watch("locale"),
    watch("format"),
    watch("numeric"),
    watch("sync")
  ], SlRelativeTime.prototype, "updateTime", 1);
  SlRelativeTime = __decorateClass([
    n5("sl-relative-time")
  ], SlRelativeTime);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.YMX4WALY.js
  var resize_observer_styles_default = r`
  ${component_styles_default}

  :host {
    display: contents;
  }
`;
  var SlResizeObserver = class extends n4 {
    constructor() {
      super(...arguments);
      this.observedElements = [];
      this.disabled = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.resizeObserver = new ResizeObserver((entries) => {
        emit(this, "sl-resize", { detail: { entries } });
      });
      if (!this.disabled) {
        this.startObserver();
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.stopObserver();
    }
    handleSlotChange() {
      if (!this.disabled) {
        this.startObserver();
      }
    }
    startObserver() {
      const slot = this.shadowRoot.querySelector("slot");
      if (slot) {
        const elements = slot.assignedElements({ flatten: true });
        this.observedElements.map((el) => this.resizeObserver.unobserve(el));
        this.observedElements = [];
        elements.map((el) => {
          this.resizeObserver.observe(el);
          this.observedElements.push(el);
        });
      }
    }
    stopObserver() {
      this.resizeObserver.disconnect();
    }
    handleDisabledChange() {
      if (this.disabled) {
        this.stopObserver();
      } else {
        this.startObserver();
      }
    }
    render() {
      return y` <slot @slotchange=${this.handleSlotChange}></slot> `;
    }
  };
  SlResizeObserver.styles = resize_observer_styles_default;
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlResizeObserver.prototype, "disabled", 2);
  __decorateClass([
    watch("disabled", { waitUntilFirstUpdate: true })
  ], SlResizeObserver.prototype, "handleDisabledChange", 1);
  SlResizeObserver = __decorateClass([
    n5("sl-resize-observer")
  ], SlResizeObserver);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ZMQMZPLA.js
  var responsive_media_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .responsive-media {
    position: relative;
  }

  .responsive-media ::slotted(*) {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
  }

  .responsive-media--cover ::slotted(embed),
  .responsive-media--cover ::slotted(iframe),
  .responsive-media--cover ::slotted(img),
  .responsive-media--cover ::slotted(video) {
    object-fit: cover !important;
  }

  .responsive-media--contain ::slotted(embed),
  .responsive-media--contain ::slotted(iframe),
  .responsive-media--contain ::slotted(img),
  .responsive-media--contain ::slotted(video) {
    object-fit: contain !important;
  }
`;
  var SlResponsiveMedia = class extends n4 {
    constructor() {
      super(...arguments);
      this.aspectRatio = "16:9";
      this.fit = "cover";
    }
    render() {
      const split = this.aspectRatio.split(":");
      const x2 = parseFloat(split[0]);
      const y2 = parseFloat(split[1]);
      const paddingBottom = x2 && y2 ? `${y2 / x2 * 100}%` : "0";
      return y`
      <div
        class=${o5({
        "responsive-media": true,
        "responsive-media--cover": this.fit === "cover",
        "responsive-media--contain": this.fit === "contain"
      })}
        style="padding-bottom: ${paddingBottom}"
      >
        <slot></slot>
      </div>
    `;
    }
  };
  SlResponsiveMedia.styles = responsive_media_styles_default;
  __decorateClass([
    e4({ attribute: "aspect-ratio" })
  ], SlResponsiveMedia.prototype, "aspectRatio", 2);
  __decorateClass([
    e4()
  ], SlResponsiveMedia.prototype, "fit", 2);
  SlResponsiveMedia = __decorateClass([
    n5("sl-responsive-media")
  ], SlResponsiveMedia);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3YP5KPYK.js
  var select_styles_default = r`
  ${component_styles_default}
  ${form_control_styles_default}

  :host {
    display: block;
  }

  .select {
    display: block;
  }

  .select__control {
    display: inline-flex;
    align-items: center;
    justify-content: start;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    transition: var(--sl-transition-fast) color, var(--sl-transition-fast) border, var(--sl-transition-fast) box-shadow;
    cursor: pointer;
  }

  .select__menu {
    max-height: 50vh;
    overflow: auto;
  }

  /* Standard selects */
  .select--standard .select__control {
    background-color: rgb(var(--sl-input-background-color));
    border: solid var(--sl-input-border-width) rgb(var(--sl-input-border-color));
    color: rgb(var(--sl-input-color));
  }

  .select--standard:not(.select--disabled) .select__control:hover {
    background-color: rgb(var(--sl-input-background-color-hover));
    border-color: rgb(var(--sl-input-border-color-hover));
    color: rgb(var(--sl-input-color-hover));
  }

  .select--standard.select--focused:not(.select--disabled) .select__control {
    background-color: rgb(var(--sl-input-background-color-focus));
    border-color: rgb(var(--sl-input-border-color-focus));
    box-shadow: var(--sl-focus-ring);
    outline: none;
    color: rgb(var(--sl-input-color-focus));
  }

  .select--standard.select--disabled .select__control {
    background-color: rgb(var(--sl-input-background-color-disabled));
    border-color: rgb(var(--sl-input-border-color-disabled));
    color: rgb(var(--sl-input-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  /* Filled selects */
  .select--filled .select__control {
    border: none;
    background-color: rgb(var(--sl-input-filled-background-color));
    color: rgb(var(--sl-input-color));
  }

  .select--filled:hover:not(.select--disabled) .select__control {
    background-color: rgb(var(--sl-input-filled-background-color-hover));
  }

  .select--filled.select--focused:not(.select--disabled) .select__control {
    background-color: rgb(var(--sl-input-filled-background-color-focus));
    box-shadow: var(--sl-focus-ring);
  }

  .select--filled.select--disabled .select__control {
    background-color: rgb(var(--sl-input-filled-background-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select--disabled .select__tags,
  .select--disabled .select__clear {
    pointer-events: none;
  }

  .select__prefix {
    display: inline-flex;
    align-items: center;
    color: rgb(var(--sl-input-placeholder-color));
  }

  .select__label {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    user-select: none;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;

    /* Hide scrollbar in Firefox */
    scrollbar-width: none;
  }

  /* Hide scrollbar in Chrome/Safari */
  .select__label::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .select__clear {
    flex: 0 0 auto;
    width: 1.25em;
  }

  .select__suffix {
    display: inline-flex;
    align-items: center;
    color: rgb(var(--sl-input-placeholder-color));
  }

  .select__icon {
    flex: 0 0 auto;
    display: inline-flex;
    transition: var(--sl-transition-medium) transform ease;
  }

  .select--open .select__icon {
    transform: rotate(-180deg);
  }

  /* Placeholder */
  .select--placeholder-visible .select__label {
    color: rgb(var(--sl-input-placeholder-color));
  }

  .select--disabled.select--placeholder-visible .select__label {
    color: rgb(var(--sl-input-placeholder-color-disabled));
  }

  /* Tags */
  .select__tags {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: left;
    margin-left: var(--sl-spacing-2x-small);
  }

  /* Hidden input (for form control validation to show) */
  .select__hidden-select {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }

  /*
   * Size modifiers
   */

  /* Small */
  .select--small .select__control {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    min-height: var(--sl-input-height-small);
  }

  .select--small .select__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-small);
  }

  .select--small .select__label {
    margin: 0 var(--sl-input-spacing-small);
  }

  .select--small .select__clear {
    margin-right: var(--sl-input-spacing-small);
  }

  .select--small .select__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-small);
  }

  .select--small .select__icon {
    margin-right: var(--sl-input-spacing-small);
  }

  .select--small .select__tags {
    padding-bottom: 2px;
  }

  .select--small .select__tags sl-tag {
    padding-top: 2px;
  }

  .select--small .select__tags sl-tag:not(:last-of-type) {
    margin-right: var(--sl-spacing-2x-small);
  }

  .select--small.select--has-tags .select__label {
    margin-left: 0;
  }

  /* Medium */
  .select--medium .select__control {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    min-height: var(--sl-input-height-medium);
  }

  .select--medium .select__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-medium);
  }

  .select--medium .select__label {
    margin: 0 var(--sl-input-spacing-medium);
  }

  .select--medium .select__clear {
    margin-right: var(--sl-input-spacing-medium);
  }

  .select--medium .select__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-medium);
  }

  .select--medium .select__icon {
    margin-right: var(--sl-input-spacing-medium);
  }

  .select--medium .select__tags {
    padding-bottom: 3px;
  }

  .select--medium .select__tags sl-tag {
    padding-top: 3px;
  }

  .select--medium .select__tags sl-tag:not(:last-of-type) {
    margin-right: var(--sl-spacing-2x-small);
  }

  .select--medium.select--has-tags .select__label {
    margin-left: 0;
  }

  /* Large */
  .select--large .select__control {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    min-height: var(--sl-input-height-large);
  }

  .select--large .select__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-large);
  }

  .select--large .select__label {
    margin: 0 var(--sl-input-spacing-large);
  }

  .select--large .select__clear {
    margin-right: var(--sl-input-spacing-large);
  }

  .select--large .select__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-large);
  }

  .select--large .select__icon {
    margin-right: var(--sl-input-spacing-large);
  }

  .select--large .select__tags {
    padding-bottom: 4px;
  }
  .select--large .select__tags sl-tag {
    padding-top: 4px;
  }

  .select--large .select__tags sl-tag:not(:last-of-type) {
    margin-right: var(--sl-spacing-2x-small);
  }

  .select--large.select--has-tags .select__label {
    margin-left: 0;
  }

  /*
   * Pill modifier
   */
  .select--pill.select--small .select__control {
    border-radius: var(--sl-input-height-small);
  }

  .select--pill.select--medium .select__control {
    border-radius: var(--sl-input-height-medium);
  }

  .select--pill.select--large .select__control {
    border-radius: var(--sl-input-height-large);
  }
`;
  var id8 = 0;
  var SlSelect = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `select-${++id8}`;
      this.helpTextId = `select-help-text-${id8}`;
      this.labelId = `select-label-${id8}`;
      this.hasFocus = false;
      this.hasHelpTextSlot = false;
      this.hasLabelSlot = false;
      this.isOpen = false;
      this.displayLabel = "";
      this.displayTags = [];
      this.multiple = false;
      this.maxTagsVisible = 3;
      this.disabled = false;
      this.name = "";
      this.placeholder = "";
      this.size = "medium";
      this.hoist = false;
      this.value = "";
      this.filled = false;
      this.pill = false;
      this.required = false;
      this.clearable = false;
      this.invalid = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleSlotChange = this.handleSlotChange.bind(this);
      this.resizeObserver = new ResizeObserver(() => this.resizeMenu());
      this.updateComplete.then(() => {
        this.resizeObserver.observe(this);
        this.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
        this.syncItemsFromValue();
      });
    }
    firstUpdated() {
      this.invalid = !this.input.checkValidity();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.resizeObserver.unobserve(this);
      this.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    getItemLabel(item) {
      const slot = item.shadowRoot.querySelector("slot:not([name])");
      return getTextContent(slot);
    }
    getItems() {
      return [...this.querySelectorAll("sl-menu-item")];
    }
    getValueAsArray() {
      if (this.multiple && this.value === "") {
        return [];
      }
      return Array.isArray(this.value) ? this.value : [this.value];
    }
    handleBlur() {
      if (!this.isOpen) {
        this.hasFocus = false;
        emit(this, "sl-blur");
      }
    }
    handleClearClick(event) {
      event.stopPropagation();
      this.value = this.multiple ? [] : "";
      emit(this, "sl-clear");
      this.syncItemsFromValue();
    }
    handleDisabledChange() {
      if (this.disabled && this.isOpen) {
        this.dropdown.hide();
      }
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      if (!this.hasFocus) {
        this.hasFocus = true;
        emit(this, "sl-focus");
      }
    }
    handleKeyDown(event) {
      const target = event.target;
      const items = this.getItems();
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (target.tagName.toLowerCase() === "sl-tag") {
        return;
      }
      if (event.key === "Tab") {
        if (this.isOpen) {
          this.dropdown.hide();
        }
        return;
      }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        if (!this.isOpen) {
          this.dropdown.show();
        }
        if (event.key === "ArrowDown" && firstItem) {
          this.menu.setCurrentItem(firstItem);
          firstItem.focus();
          return;
        }
        if (event.key === "ArrowUp" && lastItem) {
          this.menu.setCurrentItem(lastItem);
          lastItem.focus();
          return;
        }
      }
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      if (!this.isOpen && event.key.length === 1) {
        event.stopPropagation();
        event.preventDefault();
        this.dropdown.show();
        this.menu.typeToSelect(event.key);
      }
    }
    handleLabelClick() {
      var _a;
      const box = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".select__control");
      box.focus();
    }
    handleMenuSelect(event) {
      var _a;
      const item = event.detail.item;
      if (this.multiple) {
        this.value = ((_a = this.value) == null ? void 0 : _a.includes(item.value)) ? this.value.filter((v2) => v2 !== item.value) : [...this.value, item.value];
      } else {
        this.value = item.value;
      }
      this.syncItemsFromValue();
    }
    handleMenuShow() {
      this.resizeMenu();
      this.isOpen = true;
    }
    handleMenuHide() {
      this.isOpen = false;
      this.control.focus();
    }
    handleMultipleChange() {
      const value = this.getValueAsArray();
      this.value = this.multiple ? value : value[0] || "";
      this.syncItemsFromValue();
    }
    async handleSlotChange() {
      this.hasHelpTextSlot = hasSlot(this, "help-text");
      this.hasLabelSlot = hasSlot(this, "label");
      const items = this.getItems();
      const values = [];
      items.map((item) => {
        if (values.includes(item.value)) {
          console.error(`Duplicate value found in <sl-select> menu item: '${item.value}'`, item);
        }
        values.push(item.value);
      });
      await Promise.all(items.map((item) => item.render)).then(() => this.syncItemsFromValue());
    }
    handleTagInteraction(event) {
      const path = event.composedPath();
      const clearButton = path.find((el) => {
        if (el instanceof HTMLElement) {
          const element = el;
          return element.classList.contains("tag__remove");
        }
        return false;
      });
      if (clearButton) {
        event.stopPropagation();
      }
    }
    async handleValueChange() {
      this.syncItemsFromValue();
      await this.updateComplete;
      this.invalid = !this.input.checkValidity();
      emit(this, "sl-change");
    }
    resizeMenu() {
      var _a;
      const box = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector(".select__control");
      this.menu.style.width = `${box.clientWidth}px`;
      if (this.dropdown) {
        this.dropdown.reposition();
      }
    }
    syncItemsFromValue() {
      const items = this.getItems();
      const value = this.getValueAsArray();
      items.map((item) => item.checked = value.includes(item.value));
      if (this.multiple) {
        const checkedItems = items.filter((item) => value.includes(item.value));
        this.displayLabel = checkedItems[0] ? this.getItemLabel(checkedItems[0]) : "";
        this.displayTags = checkedItems.map((item) => {
          return y`
          <sl-tag
            exportparts="base:tag"
            type="neutral"
            size=${this.size}
            ?pill=${this.pill}
            removable
            @click=${this.handleTagInteraction}
            @keydown=${this.handleTagInteraction}
            @sl-remove=${(event) => {
            event.stopPropagation();
            if (!this.disabled) {
              item.checked = false;
              this.syncValueFromItems();
            }
          }}
          >
            ${this.getItemLabel(item)}
          </sl-tag>
        `;
        });
        if (this.maxTagsVisible > 0 && this.displayTags.length > this.maxTagsVisible) {
          const total = this.displayTags.length;
          this.displayLabel = "";
          this.displayTags = this.displayTags.slice(0, this.maxTagsVisible);
          this.displayTags.push(y`
          <sl-tag exportparts="base:tag" type="neutral" size=${this.size}> +${total - this.maxTagsVisible} </sl-tag>
        `);
        }
      } else {
        const checkedItem = items.filter((item) => item.value === value[0])[0];
        this.displayLabel = checkedItem ? this.getItemLabel(checkedItem) : "";
        this.displayTags = [];
      }
    }
    syncValueFromItems() {
      const items = this.getItems();
      const checkedItems = items.filter((item) => item.checked);
      const checkedValues = checkedItems.map((item) => item.value);
      if (this.multiple) {
        this.value = this.value.filter((val) => checkedValues.includes(val));
      } else {
        this.value = checkedValues.length > 0 ? checkedValues[0] : "";
      }
    }
    render() {
      var _a, _b;
      const hasSelection = this.multiple ? ((_a = this.value) == null ? void 0 : _a.length) > 0 : this.value !== "";
      return renderFormControl({
        inputId: this.inputId,
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpTextId: this.helpTextId,
        helpText: this.helpText,
        hasHelpTextSlot: this.hasHelpTextSlot,
        size: this.size,
        onLabelClick: () => this.handleLabelClick()
      }, y`
        <sl-dropdown
          part="base"
          .hoist=${this.hoist}
          .stayOpenOnSelect=${this.multiple}
          .containingElement=${this}
          ?disabled=${this.disabled}
          class=${o5({
        select: true,
        "select--open": this.isOpen,
        "select--empty": ((_b = this.value) == null ? void 0 : _b.length) === 0,
        "select--focused": this.hasFocus,
        "select--clearable": this.clearable,
        "select--disabled": this.disabled,
        "select--multiple": this.multiple,
        "select--standard": !this.filled,
        "select--filled": this.filled,
        "select--has-tags": this.multiple && this.displayTags.length > 0,
        "select--placeholder-visible": this.displayLabel === "",
        "select--small": this.size === "small",
        "select--medium": this.size === "medium",
        "select--large": this.size === "large",
        "select--pill": this.pill,
        "select--invalid": this.invalid
      })}
          @sl-show=${this.handleMenuShow}
          @sl-hide=${this.handleMenuHide}
        >
          <div
            part="control"
            slot="trigger"
            id=${this.inputId}
            class="select__control"
            role="combobox"
            aria-labelledby=${l4(getLabelledBy({
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpText: this.helpText,
        helpTextId: this.helpTextId,
        hasHelpTextSlot: this.hasHelpTextSlot
      }))}
            aria-haspopup="true"
            aria-expanded=${this.isOpen ? "true" : "false"}
            tabindex=${this.disabled ? "-1" : "0"}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
            @keydown=${this.handleKeyDown}
          >
            <span part="prefix" class="select__prefix">
              <slot name="prefix"></slot>
            </span>

            <div class="select__label">
              ${this.displayTags.length ? y` <span part="tags" class="select__tags"> ${this.displayTags} </span> ` : this.displayLabel || this.placeholder}
            </div>

            ${this.clearable && hasSelection ? y`
                  <sl-icon-button
                    exportparts="base:clear-button"
                    class="select__clear"
                    name="x-circle-fill"
                    library="system"
                    @click=${this.handleClearClick}
                    tabindex="-1"
                  ></sl-icon-button>
                ` : ""}

            <span part="suffix" class="select__suffix">
              <slot name="suffix"></slot>
            </span>

            <span part="icon" class="select__icon" aria-hidden="true">
              <sl-icon name="chevron-down" library="system"></sl-icon>
            </span>

            <!-- The hidden input tricks the browser's built-in validation so it works as expected. We use an input
            instead of a select because, otherwise, iOS will show a list of options during validation. -->
            <input
              class="select__hidden-select"
              aria-hidden="true"
              ?required=${this.required}
              .value=${hasSelection ? "1" : ""}
              tabindex="-1"
            />
          </div>

          <sl-menu part="menu" class="select__menu" @sl-select=${this.handleMenuSelect}>
            <slot @slotchange=${this.handleSlotChange}></slot>
          </sl-menu>
        </sl-dropdown>
      `);
    }
  };
  SlSelect.styles = select_styles_default;
  __decorateClass([
    i23(".select")
  ], SlSelect.prototype, "dropdown", 2);
  __decorateClass([
    i23(".select__control")
  ], SlSelect.prototype, "control", 2);
  __decorateClass([
    i23(".select__hidden-select")
  ], SlSelect.prototype, "input", 2);
  __decorateClass([
    i23(".select__menu")
  ], SlSelect.prototype, "menu", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "hasFocus", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "hasHelpTextSlot", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "hasLabelSlot", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "isOpen", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "displayLabel", 2);
  __decorateClass([
    t3()
  ], SlSelect.prototype, "displayTags", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "multiple", 2);
  __decorateClass([
    e4({ attribute: "max-tags-visible", type: Number })
  ], SlSelect.prototype, "maxTagsVisible", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "disabled", 2);
  __decorateClass([
    e4()
  ], SlSelect.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlSelect.prototype, "placeholder", 2);
  __decorateClass([
    e4()
  ], SlSelect.prototype, "size", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlSelect.prototype, "hoist", 2);
  __decorateClass([
    e4()
  ], SlSelect.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "filled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "pill", 2);
  __decorateClass([
    e4()
  ], SlSelect.prototype, "label", 2);
  __decorateClass([
    e4({ attribute: "help-text" })
  ], SlSelect.prototype, "helpText", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "required", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlSelect.prototype, "clearable", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlSelect.prototype, "invalid", 2);
  __decorateClass([
    watch("disabled")
  ], SlSelect.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("multiple")
  ], SlSelect.prototype, "handleMultipleChange", 1);
  __decorateClass([
    watch("helpText"),
    watch("label")
  ], SlSelect.prototype, "handleSlotChange", 1);
  __decorateClass([
    watch("value", { waitUntilFirstUpdate: true })
  ], SlSelect.prototype, "handleValueChange", 1);
  SlSelect = __decorateClass([
    n5("sl-select")
  ], SlSelect);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.SVWSLRKI.js
  var tag_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .tag {
    display: flex;
    align-items: center;
    border: solid 1px;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    cursor: default;
  }

  .tag__remove::part(base) {
    color: inherit;
    padding: 0;
  }

  /*
   * Type modifiers
   */

  .tag--primary {
    background-color: rgb(var(--sl-color-primary-50));
    border-color: rgb(var(--sl-color-primary-200));
    color: rgb(var(--sl-color-primary-800));
  }

  .tag--success {
    background-color: rgb(var(--sl-color-success-50));
    border-color: rgb(var(--sl-color-success-200));
    color: rgb(var(--sl-color-success-800));
  }

  .tag--neutral {
    background-color: rgb(var(--sl-color-neutral-50));
    border-color: rgb(var(--sl-color-neutral-200));
    color: rgb(var(--sl-color-neutral-800));
  }

  .tag--warning {
    background-color: rgb(var(--sl-color-warning-50));
    border-color: rgb(var(--sl-color-warning-200));
    color: rgb(var(--sl-color-warning-800));
  }

  .tag--danger {
    background-color: rgb(var(--sl-color-danger-50));
    border-color: rgb(var(--sl-color-danger-200));
    color: rgb(var(--sl-color-danger-800));
  }

  /*
   * Size modifiers
   */

  .tag--small {
    font-size: var(--sl-button-font-size-small);
    height: calc(var(--sl-input-height-small) * 0.8);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
    padding: 0 var(--sl-spacing-x-small);
  }

  .tag--small .tag__remove {
    margin-left: var(--sl-spacing-2x-small);
    margin-right: calc(-1 * var(--sl-spacing-3x-small));
  }

  .tag--medium {
    font-size: var(--sl-button-font-size-medium);
    height: calc(var(--sl-input-height-medium) * 0.8);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
    padding: 0 var(--sl-spacing-small);
  }

  .tag__remove {
    margin-left: var(--sl-spacing-2x-small);
    margin-right: calc(-1 * var(--sl-spacing-2x-small));
  }

  .tag--large {
    font-size: var(--sl-button-font-size-large);
    height: calc(var(--sl-input-height-large) * 0.8);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
    padding: 0 var(--sl-spacing-medium);
  }

  .tag__remove {
    margin-left: var(--sl-spacing-2x-small);
    margin-right: calc(-1 * var(--sl-spacing-x-small));
  }

  /*
   * Pill modifier
   */

  .tag--pill {
    border-radius: var(--sl-border-radius-pill);
  }
`;
  var SlTag = class extends n4 {
    constructor() {
      super(...arguments);
      this.type = "neutral";
      this.size = "medium";
      this.pill = false;
      this.removable = false;
    }
    handleRemoveClick() {
      emit(this, "sl-remove");
    }
    render() {
      return y`
      <span
        part="base"
        class=${o5({
        tag: true,
        "tag--primary": this.type === "primary",
        "tag--success": this.type === "success",
        "tag--neutral": this.type === "neutral",
        "tag--warning": this.type === "warning",
        "tag--danger": this.type === "danger",
        "tag--text": this.type === "text",
        "tag--small": this.size === "small",
        "tag--medium": this.size === "medium",
        "tag--large": this.size === "large",
        "tag--pill": this.pill,
        "tag--removable": this.removable
      })}
      >
        <span part="content" class="tag__content">
          <slot></slot>
        </span>

        ${this.removable ? y`
              <sl-icon-button
                exportparts="base:remove-button"
                name="x"
                library="system"
                class="tag__remove"
                @click=${this.handleRemoveClick}
              ></sl-icon-button>
            ` : ""}
      </span>
    `;
    }
  };
  SlTag.styles = tag_styles_default;
  __decorateClass([
    e4({ reflect: true })
  ], SlTag.prototype, "type", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlTag.prototype, "size", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlTag.prototype, "pill", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlTag.prototype, "removable", 2);
  SlTag = __decorateClass([
    n5("sl-tag")
  ], SlTag);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FZBYA2RV.js
  var menu_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .menu {
    padding: var(--sl-spacing-x-small) 0;
  }

  ::slotted(sl-divider) {
    --spacing: var(--sl-spacing-x-small);
  }
`;
  var SlMenu = class extends n4 {
    constructor() {
      super(...arguments);
      this.typeToSelectString = "";
    }
    getAllItems(options = { includeDisabled: true }) {
      return [...this.defaultSlot.assignedElements({ flatten: true })].filter((el) => {
        if (el.getAttribute("role") !== "menuitem") {
          return false;
        }
        if (!(options == null ? void 0 : options.includeDisabled) && el.disabled) {
          return false;
        }
        return true;
      });
    }
    getCurrentItem() {
      return this.getAllItems({ includeDisabled: false }).find((i25) => i25.getAttribute("tabindex") === "0");
    }
    setCurrentItem(item) {
      const items = this.getAllItems({ includeDisabled: false });
      let activeItem = item.disabled ? items[0] : item;
      items.map((i25) => i25.setAttribute("tabindex", i25 === activeItem ? "0" : "-1"));
    }
    typeToSelect(key) {
      const items = this.getAllItems({ includeDisabled: false });
      clearTimeout(this.typeToSelectTimeout);
      this.typeToSelectTimeout = setTimeout(() => this.typeToSelectString = "", 750);
      this.typeToSelectString += key.toLowerCase();
      if (!hasFocusVisible) {
        items.map((item) => item.classList.remove("sl-focus-invisible"));
      }
      for (const item of items) {
        const slot = item.shadowRoot.querySelector("slot:not([name])");
        const label = getTextContent(slot).toLowerCase().trim();
        if (label.substring(0, this.typeToSelectString.length) === this.typeToSelectString) {
          this.setCurrentItem(item);
          item.focus();
          break;
        }
      }
    }
    handleClick(event) {
      const target = event.target;
      const item = target.closest("sl-menu-item");
      if (item && !item.disabled) {
        emit(this, "sl-select", { detail: { item } });
      }
    }
    handleKeyUp() {
      if (!hasFocusVisible) {
        const items = this.getAllItems();
        items.map((item) => item.classList.remove("sl-focus-invisible"));
      }
    }
    handleKeyDown(event) {
      if (event.key === "Enter") {
        const item = this.getCurrentItem();
        event.preventDefault();
        if (item) {
          item.click();
        }
      }
      if (event.key === " ") {
        event.preventDefault();
      }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        const items = this.getAllItems({ includeDisabled: false });
        const activeItem = this.getCurrentItem();
        let index = activeItem ? items.indexOf(activeItem) : 0;
        if (items.length) {
          event.preventDefault();
          if (event.key === "ArrowDown") {
            index++;
          } else if (event.key === "ArrowUp") {
            index--;
          } else if (event.key === "Home") {
            index = 0;
          } else if (event.key === "End") {
            index = items.length - 1;
          }
          if (index < 0)
            index = 0;
          if (index > items.length - 1)
            index = items.length - 1;
          this.setCurrentItem(items[index]);
          items[index].focus();
          return;
        }
      }
      this.typeToSelect(event.key);
    }
    handleMouseDown(event) {
      const target = event.target;
      if (target.getAttribute("role") === "menuitem") {
        this.setCurrentItem(target);
        if (!hasFocusVisible) {
          target.classList.add("sl-focus-invisible");
        }
      }
    }
    handleSlotChange() {
      const items = this.getAllItems({ includeDisabled: false });
      if (items.length) {
        this.setCurrentItem(items[0]);
      }
    }
    render() {
      return y`
      <div
        part="base"
        class="menu"
        role="menu"
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        @keyup=${this.handleKeyUp}
        @mousedown=${this.handleMouseDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
    }
  };
  SlMenu.styles = menu_styles_default;
  __decorateClass([
    i23(".menu")
  ], SlMenu.prototype, "menu", 2);
  __decorateClass([
    i23("slot")
  ], SlMenu.prototype, "defaultSlot", 2);
  SlMenu = __decorateClass([
    n5("sl-menu")
  ], SlMenu);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.X6WUEP6W.js
  var menu_item_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .menu-item {
    position: relative;
    display: flex;
    align-items: stretch;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    text-align: left;
    color: rgb(var(--sl-color-neutral-700));
    padding: var(--sl-spacing-2x-small) var(--sl-spacing-x-large);
    transition: var(--sl-transition-fast) fill;
    user-select: none;
    white-space: nowrap;
    cursor: pointer;
  }

  .menu-item.menu-item--disabled {
    outline: none;
    color: rgb(var(--sl-color-neutral-400));
    cursor: not-allowed;
  }

  .menu-item .menu-item__label {
    flex: 1 1 auto;
  }

  .menu-item .menu-item__prefix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .menu-item .menu-item__prefix ::slotted(*) {
    margin-right: var(--sl-spacing-x-small);
  }

  .menu-item .menu-item__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .menu-item .menu-item__suffix ::slotted(*) {
    margin-left: var(--sl-spacing-x-small);
  }

  :host(:focus) {
    outline: none;
  }

  :host(:hover:not([aria-disabled='true'])) .menu-item,
  :host(${focusVisibleSelector}:not(.sl-focus-invisible):not([aria-disabled='true'])) .menu-item {
    outline: none;
    background-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .menu-item .menu-item__check {
    display: flex;
    position: absolute;
    left: 0.5em;
    top: calc(50% - 0.5em);
    visibility: hidden;
    align-items: center;
    font-size: inherit;
  }

  .menu-item--checked .menu-item__check {
    visibility: visible;
  }
`;
  var SlMenuItem = class extends n4 {
    constructor() {
      super(...arguments);
      this.checked = false;
      this.value = "";
      this.disabled = false;
    }
    firstUpdated() {
      this.setAttribute("role", "menuitem");
    }
    handleCheckedChange() {
      this.setAttribute("aria-checked", String(this.checked));
    }
    handleDisabledChange() {
      this.setAttribute("aria-disabled", String(this.disabled));
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        "menu-item": true,
        "menu-item--checked": this.checked,
        "menu-item--disabled": this.disabled
      })}
      >
        <sl-icon
          part="checked-icon"
          class="menu-item__check"
          name="check"
          library="system"
          aria-hidden="true"
        ></sl-icon>

        <span part="prefix" class="menu-item__prefix">
          <slot name="prefix"></slot>
        </span>

        <span part="label" class="menu-item__label">
          <slot></slot>
        </span>

        <span part="suffix" class="menu-item__suffix">
          <slot name="suffix"></slot>
        </span>
      </div>
    `;
    }
  };
  SlMenuItem.styles = menu_item_styles_default;
  __decorateClass([
    i23(".menu-item")
  ], SlMenuItem.prototype, "menuItem", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlMenuItem.prototype, "checked", 2);
  __decorateClass([
    e4()
  ], SlMenuItem.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlMenuItem.prototype, "disabled", 2);
  __decorateClass([
    watch("checked")
  ], SlMenuItem.prototype, "handleCheckedChange", 1);
  __decorateClass([
    watch("disabled")
  ], SlMenuItem.prototype, "handleDisabledChange", 1);
  SlMenuItem = __decorateClass([
    n5("sl-menu-item")
  ], SlMenuItem);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.MP4EJCD7.js
  var menu_label_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .menu-label {
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    color: rgb(var(--sl-color-neutral-500));
    padding: var(--sl-spacing-2x-small) var(--sl-spacing-x-large);
    user-select: none;
  }
`;
  var SlMenuLabel = class extends n4 {
    render() {
      return y`
      <div part="base" class="menu-label">
        <slot></slot>
      </div>
    `;
    }
  };
  SlMenuLabel.styles = menu_label_styles_default;
  SlMenuLabel = __decorateClass([
    n5("sl-menu-label")
  ], SlMenuLabel);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.GWR76YOE.js
  var mutation_observer_styles_default = r`
  ${component_styles_default}

  :host {
    display: contents;
  }
`;
  var SlMutationObserver = class extends n4 {
    constructor() {
      super(...arguments);
      this.attrOldValue = false;
      this.charData = false;
      this.charDataOldValue = false;
      this.childList = false;
      this.disabled = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleMutation = this.handleMutation.bind(this);
      this.mutationObserver = new MutationObserver(this.handleMutation);
      if (!this.disabled) {
        this.startObserver();
      }
    }
    disconnectedCallback() {
      this.stopObserver();
    }
    handleDisabledChange() {
      if (this.disabled) {
        this.stopObserver();
      } else {
        this.startObserver();
      }
    }
    handleChange() {
      this.stopObserver();
      this.startObserver();
    }
    handleMutation(mutationList) {
      emit(this, "sl-mutation", {
        detail: { mutationList }
      });
    }
    startObserver() {
      const observeAttributes = typeof this.attr === "string" && this.attr.length > 0;
      const attributeFilter = observeAttributes && this.attr !== "*" ? this.attr.split(" ") : void 0;
      try {
        this.mutationObserver.observe(this, {
          subtree: true,
          childList: this.childList,
          attributes: observeAttributes,
          attributeFilter,
          attributeOldValue: this.attrOldValue,
          characterData: this.charData,
          characterDataOldValue: this.charDataOldValue
        });
      } catch (e24) {
      }
    }
    stopObserver() {
      this.mutationObserver.disconnect();
    }
    render() {
      return y` <slot></slot> `;
    }
  };
  SlMutationObserver.styles = mutation_observer_styles_default;
  __decorateClass([
    e4({ reflect: true })
  ], SlMutationObserver.prototype, "attr", 2);
  __decorateClass([
    e4({ attribute: "attr-old-value", type: Boolean, reflect: true })
  ], SlMutationObserver.prototype, "attrOldValue", 2);
  __decorateClass([
    e4({ attribute: "char-data", type: Boolean, reflect: true })
  ], SlMutationObserver.prototype, "charData", 2);
  __decorateClass([
    e4({ attribute: "char-data-old-value", type: Boolean, reflect: true })
  ], SlMutationObserver.prototype, "charDataOldValue", 2);
  __decorateClass([
    e4({ attribute: "child-list", type: Boolean, reflect: true })
  ], SlMutationObserver.prototype, "childList", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlMutationObserver.prototype, "disabled", 2);
  __decorateClass([
    watch("disabled")
  ], SlMutationObserver.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("attr", { waitUntilFirstUpdate: true }),
    watch("attr-old-value", { waitUntilFirstUpdate: true }),
    watch("char-data", { waitUntilFirstUpdate: true }),
    watch("char-data-old-value", { waitUntilFirstUpdate: true }),
    watch("childList", { waitUntilFirstUpdate: true })
  ], SlMutationObserver.prototype, "handleChange", 1);
  SlMutationObserver = __decorateClass([
    n5("sl-mutation-observer")
  ], SlMutationObserver);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.WJG7TPMD.js
  var progress_bar_styles_default = r`
  ${component_styles_default}

  :host {
    --height: 1rem;
    --track-color: rgb(var(--sl-color-neutral-500) / 20%);
    --indicator-color: rgb(var(--sl-color-primary-600));
    --label-color: rgb(var(--sl-color-neutral-0));

    display: block;
  }

  .progress-bar {
    position: relative;
    background-color: var(--track-color);
    height: var(--height);
    border-radius: var(--sl-border-radius-pill);
    box-shadow: inset var(--sl-shadow-small);
    overflow: hidden;
  }

  .progress-bar__indicator {
    height: 100%;
    font-family: var(--sl-font-sans);
    font-size: 12px;
    font-weight: var(--sl-font-weight-normal);
    background-color: var(--indicator-color);
    color: var(--label-color);
    text-align: center;
    line-height: var(--height);
    white-space: nowrap;
    overflow: hidden;
    transition: 400ms width, 400ms background-color;
    user-select: none;
  }

  /* Indeterminate */
  .progress-bar--indeterminate .progress-bar__indicator {
    position: absolute;
    animation: indeterminate 2.5s infinite cubic-bezier(0.37, 0, 0.63, 1);
  }

  @keyframes indeterminate {
    0% {
      left: -50%;
      width: 50%;
    }
    75%,
    100% {
      left: 100%;
      width: 50%;
    }
  }
`;
  var SlProgressBar = class extends n4 {
    constructor() {
      super(...arguments);
      this.value = 0;
      this.indeterminate = false;
      this.label = "Progress";
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        "progress-bar": true,
        "progress-bar--indeterminate": this.indeterminate
      })}
        role="progressbar"
        title=${l4(this.title)}
        aria-label=${l4(this.label)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate ? 0 : this.value}
      >
        <div part="indicator" class="progress-bar__indicator" style=${i24({ width: this.value + "%" })}>
          ${!this.indeterminate ? y`
                <span part="label" class="progress-bar__label">
                  <slot>${this.label}</slot>
                </span>
              ` : ""}
        </div>
      </div>
    `;
    }
  };
  SlProgressBar.styles = progress_bar_styles_default;
  __decorateClass([
    e4({ type: Number, reflect: true })
  ], SlProgressBar.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlProgressBar.prototype, "indeterminate", 2);
  __decorateClass([
    e4()
  ], SlProgressBar.prototype, "label", 2);
  SlProgressBar = __decorateClass([
    n5("sl-progress-bar")
  ], SlProgressBar);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.5OWHYIPT.js
  var progress_ring_styles_default = r`
  ${component_styles_default}

  :host {
    --size: 128px;
    --track-width: 4px;
    --track-color: rgb(var(--sl-color-neutral-500) / 20%);
    --indicator-color: rgb(var(--sl-color-primary-600));

    display: inline-flex;
  }

  .progress-ring {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .progress-ring__image {
    width: var(--size);
    height: var(--size);
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }

  .progress-ring__track,
  .progress-ring__indicator {
    --radius: calc(var(--size) / 2 - var(--track-width) * 2);
    --circumference: calc(var(--radius) * 2 * 3.141592654);

    fill: none;
    stroke-width: var(--track-width);
    r: var(--radius);
    cx: calc(var(--size) / 2);
    cy: calc(var(--size) / 2);
  }

  .progress-ring__track {
    stroke: var(--track-color);
  }

  .progress-ring__indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    transition: 0.35s stroke-dashoffset;
    stroke-dasharray: var(--circumference) var(--circumference);
    stroke-dashoffset: calc(var(--circumference) - var(--percentage) * var(--circumference));
  }

  .progress-ring__label {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    user-select: none;
  }
`;
  var SlProgressRing = class extends n4 {
    constructor() {
      super(...arguments);
      this.value = 0;
      this.label = "Progress";
    }
    updated(changedProps) {
      super.updated(changedProps);
      if (changedProps.has("percentage")) {
        const radius = parseFloat(getComputedStyle(this.indicator).getPropertyValue("r"));
        const circumference = 2 * Math.PI * radius;
        const offset2 = circumference - this.value / 100 * circumference;
        this.indicatorOffset = String(offset2) + "px";
      }
    }
    render() {
      return y`
      <div
        part="base"
        class="progress-ring"
        role="progressbar"
        aria-label=${l4(this.label)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${this.value}"
        style="--percentage: ${this.value / 100}"
      >
        <svg class="progress-ring__image">
          <circle class="progress-ring__track"></circle>
          <circle class="progress-ring__indicator" style="stroke-dashoffset: ${this.indicatorOffset}"></circle>
        </svg>

        <span part="label" class="progress-ring__label">
          <slot></slot>
        </span>
      </div>
    `;
    }
  };
  SlProgressRing.styles = progress_ring_styles_default;
  __decorateClass([
    i23(".progress-ring__indicator")
  ], SlProgressRing.prototype, "indicator", 2);
  __decorateClass([
    t3()
  ], SlProgressRing.prototype, "indicatorOffset", 2);
  __decorateClass([
    e4({ type: Number, reflect: true })
  ], SlProgressRing.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlProgressRing.prototype, "label", 2);
  SlProgressRing = __decorateClass([
    n5("sl-progress-ring")
  ], SlProgressRing);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.XPSJUSOQ.js
  var G = null;
  var H2 = class {
  };
  H2.render = function(w2, B) {
    G(w2, B);
  };
  self.QrCreator = H2;
  (function(w2) {
    function B(t4, c2, a2, e24) {
      var b2 = {}, h3 = w2(a2, c2);
      h3.u(t4);
      h3.J();
      e24 = e24 || 0;
      var r22 = h3.h(), d2 = h3.h() + 2 * e24;
      b2.text = t4;
      b2.level = c2;
      b2.version = a2;
      b2.O = d2;
      b2.a = function(b22, a22) {
        b22 -= e24;
        a22 -= e24;
        return 0 > b22 || b22 >= r22 || 0 > a22 || a22 >= r22 ? false : h3.a(b22, a22);
      };
      return b2;
    }
    function C2(t4, c2, a2, e24, b2, h3, r22, d2, g2, x2) {
      function u2(b22, a22, f3, c22, d22, r32, g22) {
        b22 ? (t4.lineTo(a22 + r32, f3 + g22), t4.arcTo(a22, f3, c22, d22, h3)) : t4.lineTo(a22, f3);
      }
      r22 ? t4.moveTo(c2 + h3, a2) : t4.moveTo(c2, a2);
      u2(d2, e24, a2, e24, b2, -h3, 0);
      u2(g2, e24, b2, c2, b2, 0, -h3);
      u2(x2, c2, b2, c2, a2, h3, 0);
      u2(r22, c2, a2, e24, a2, 0, h3);
    }
    function z(t4, c2, a2, e24, b2, h3, r22, d2, g2, x2) {
      function u2(b22, a22, c22, d22) {
        t4.moveTo(b22 + c22, a22);
        t4.lineTo(b22, a22);
        t4.lineTo(b22, a22 + d22);
        t4.arcTo(b22, a22, b22 + c22, a22, h3);
      }
      r22 && u2(c2, a2, h3, h3);
      d2 && u2(e24, a2, -h3, h3);
      g2 && u2(e24, b2, -h3, -h3);
      x2 && u2(c2, b2, h3, -h3);
    }
    function A2(t4, c2) {
      var a2 = c2.fill;
      if (typeof a2 === "string")
        t4.fillStyle = a2;
      else {
        var e24 = a2.type, b2 = a2.colorStops;
        a2 = a2.position.map((b22) => Math.round(b22 * c2.size));
        if (e24 === "linear-gradient")
          var h3 = t4.createLinearGradient.apply(t4, a2);
        else if (e24 === "radial-gradient")
          h3 = t4.createRadialGradient.apply(t4, a2);
        else
          throw Error("Unsupported fill");
        b2.forEach(([b22, a22]) => {
          h3.addColorStop(b22, a22);
        });
        t4.fillStyle = h3;
      }
    }
    function y2(t4, c2) {
      a: {
        var a2 = c2.text, e24 = c2.v, b2 = c2.N, h3 = c2.K, r22 = c2.P;
        b2 = Math.max(1, b2 || 1);
        for (h3 = Math.min(40, h3 || 40); b2 <= h3; b2 += 1)
          try {
            var d2 = B(a2, e24, b2, r22);
            break a;
          } catch (J) {
          }
        d2 = void 0;
      }
      if (!d2)
        return null;
      a2 = t4.getContext("2d");
      c2.background && (a2.fillStyle = c2.background, a2.fillRect(c2.left, c2.top, c2.size, c2.size));
      e24 = d2.O;
      h3 = c2.size / e24;
      a2.beginPath();
      for (r22 = 0; r22 < e24; r22 += 1)
        for (b2 = 0; b2 < e24; b2 += 1) {
          var g2 = a2, x2 = c2.left + b2 * h3, u2 = c2.top + r22 * h3, p2 = r22, q = b2, f3 = d2.a, k2 = x2 + h3, m2 = u2 + h3, D = p2 - 1, E2 = p2 + 1, n32 = q - 1, l5 = q + 1, y3 = Math.floor(Math.min(0.5, Math.max(0, c2.R)) * h3), v22 = f3(p2, q), I2 = f3(D, n32), w22 = f3(D, q);
          D = f3(D, l5);
          var F = f3(p2, l5);
          l5 = f3(E2, l5);
          q = f3(E2, q);
          E2 = f3(E2, n32);
          p2 = f3(p2, n32);
          x2 = Math.round(x2);
          u2 = Math.round(u2);
          k2 = Math.round(k2);
          m2 = Math.round(m2);
          v22 ? C2(g2, x2, u2, k2, m2, y3, !w22 && !p2, !w22 && !F, !q && !F, !q && !p2) : z(g2, x2, u2, k2, m2, y3, w22 && p2 && I2, w22 && F && D, q && F && l5, q && p2 && E2);
        }
      A2(a2, c2);
      a2.fill();
      return t4;
    }
    var v2 = { minVersion: 1, maxVersion: 40, ecLevel: "L", left: 0, top: 0, size: 200, fill: "#000", background: null, text: "no text", radius: 0.5, quiet: 0 };
    G = function(t4, c2) {
      var a2 = {};
      Object.assign(a2, v2, t4);
      a2.N = a2.minVersion;
      a2.K = a2.maxVersion;
      a2.v = a2.ecLevel;
      a2.left = a2.left;
      a2.top = a2.top;
      a2.size = a2.size;
      a2.fill = a2.fill;
      a2.background = a2.background;
      a2.text = a2.text;
      a2.R = a2.radius;
      a2.P = a2.quiet;
      if (c2 instanceof HTMLCanvasElement) {
        if (c2.width !== a2.size || c2.height !== a2.size)
          c2.width = a2.size, c2.height = a2.size;
        c2.getContext("2d").clearRect(0, 0, c2.width, c2.height);
        y2(c2, a2);
      } else
        t4 = document.createElement("canvas"), t4.width = a2.size, t4.height = a2.size, a2 = y2(t4, a2), c2.appendChild(a2);
    };
  })(function() {
    function w2(c2) {
      var a2 = C2.s(c2);
      return { S: function() {
        return 4;
      }, b: function() {
        return a2.length;
      }, write: function(c22) {
        for (var b2 = 0; b2 < a2.length; b2 += 1)
          c22.put(a2[b2], 8);
      } };
    }
    function B() {
      var c2 = [], a2 = 0, e24 = {
        B: function() {
          return c2;
        },
        c: function(b2) {
          return (c2[Math.floor(b2 / 8)] >>> 7 - b2 % 8 & 1) == 1;
        },
        put: function(b2, h3) {
          for (var a22 = 0; a22 < h3; a22 += 1)
            e24.m((b2 >>> h3 - a22 - 1 & 1) == 1);
        },
        f: function() {
          return a2;
        },
        m: function(b2) {
          var h3 = Math.floor(a2 / 8);
          c2.length <= h3 && c2.push(0);
          b2 && (c2[h3] |= 128 >>> a2 % 8);
          a2 += 1;
        }
      };
      return e24;
    }
    function C2(c2, a2) {
      function e24(b22, h22) {
        for (var a22 = -1; 7 >= a22; a22 += 1)
          if (!(-1 >= b22 + a22 || d2 <= b22 + a22))
            for (var c22 = -1; 7 >= c22; c22 += 1)
              -1 >= h22 + c22 || d2 <= h22 + c22 || (r22[b22 + a22][h22 + c22] = 0 <= a22 && 6 >= a22 && (c22 == 0 || c22 == 6) || 0 <= c22 && 6 >= c22 && (a22 == 0 || a22 == 6) || 2 <= a22 && 4 >= a22 && 2 <= c22 && 4 >= c22 ? true : false);
      }
      function b2(b22, a22) {
        for (var f3 = d2 = 4 * c2 + 17, k2 = Array(f3), m2 = 0; m2 < f3; m2 += 1) {
          k2[m2] = Array(f3);
          for (var p2 = 0; p2 < f3; p2 += 1)
            k2[m2][p2] = null;
        }
        r22 = k2;
        e24(0, 0);
        e24(d2 - 7, 0);
        e24(0, d2 - 7);
        f3 = y2.G(c2);
        for (k2 = 0; k2 < f3.length; k2 += 1)
          for (m2 = 0; m2 < f3.length; m2 += 1) {
            p2 = f3[k2];
            var q = f3[m2];
            if (r22[p2][q] == null)
              for (var n32 = -2; 2 >= n32; n32 += 1)
                for (var l5 = -2; 2 >= l5; l5 += 1)
                  r22[p2 + n32][q + l5] = n32 == -2 || n32 == 2 || l5 == -2 || l5 == 2 || n32 == 0 && l5 == 0;
          }
        for (f3 = 8; f3 < d2 - 8; f3 += 1)
          r22[f3][6] == null && (r22[f3][6] = f3 % 2 == 0);
        for (f3 = 8; f3 < d2 - 8; f3 += 1)
          r22[6][f3] == null && (r22[6][f3] = f3 % 2 == 0);
        f3 = y2.w(h3 << 3 | a22);
        for (k2 = 0; 15 > k2; k2 += 1)
          m2 = !b22 && (f3 >> k2 & 1) == 1, r22[6 > k2 ? k2 : 8 > k2 ? k2 + 1 : d2 - 15 + k2][8] = m2, r22[8][8 > k2 ? d2 - k2 - 1 : 9 > k2 ? 15 - k2 : 14 - k2] = m2;
        r22[d2 - 8][8] = !b22;
        if (7 <= c2) {
          f3 = y2.A(c2);
          for (k2 = 0; 18 > k2; k2 += 1)
            m2 = !b22 && (f3 >> k2 & 1) == 1, r22[Math.floor(k2 / 3)][k2 % 3 + d2 - 8 - 3] = m2;
          for (k2 = 0; 18 > k2; k2 += 1)
            m2 = !b22 && (f3 >> k2 & 1) == 1, r22[k2 % 3 + d2 - 8 - 3][Math.floor(k2 / 3)] = m2;
        }
        if (g2 == null) {
          b22 = t4.I(c2, h3);
          f3 = B();
          for (k2 = 0; k2 < x2.length; k2 += 1)
            m2 = x2[k2], f3.put(4, 4), f3.put(m2.b(), y2.f(4, c2)), m2.write(f3);
          for (k2 = m2 = 0; k2 < b22.length; k2 += 1)
            m2 += b22[k2].j;
          if (f3.f() > 8 * m2)
            throw Error("code length overflow. (" + f3.f() + ">" + 8 * m2 + ")");
          for (f3.f() + 4 <= 8 * m2 && f3.put(0, 4); f3.f() % 8 != 0; )
            f3.m(false);
          for (; !(f3.f() >= 8 * m2); ) {
            f3.put(236, 8);
            if (f3.f() >= 8 * m2)
              break;
            f3.put(17, 8);
          }
          var u22 = 0;
          m2 = k2 = 0;
          p2 = Array(b22.length);
          q = Array(b22.length);
          for (n32 = 0; n32 < b22.length; n32 += 1) {
            var v22 = b22[n32].j, w22 = b22[n32].o - v22;
            k2 = Math.max(k2, v22);
            m2 = Math.max(m2, w22);
            p2[n32] = Array(v22);
            for (l5 = 0; l5 < p2[n32].length; l5 += 1)
              p2[n32][l5] = 255 & f3.B()[l5 + u22];
            u22 += v22;
            l5 = y2.C(w22);
            v22 = z(p2[n32], l5.b() - 1).l(l5);
            q[n32] = Array(l5.b() - 1);
            for (l5 = 0; l5 < q[n32].length; l5 += 1)
              w22 = l5 + v22.b() - q[n32].length, q[n32][l5] = 0 <= w22 ? v22.c(w22) : 0;
          }
          for (l5 = f3 = 0; l5 < b22.length; l5 += 1)
            f3 += b22[l5].o;
          f3 = Array(f3);
          for (l5 = u22 = 0; l5 < k2; l5 += 1)
            for (n32 = 0; n32 < b22.length; n32 += 1)
              l5 < p2[n32].length && (f3[u22] = p2[n32][l5], u22 += 1);
          for (l5 = 0; l5 < m2; l5 += 1)
            for (n32 = 0; n32 < b22.length; n32 += 1)
              l5 < q[n32].length && (f3[u22] = q[n32][l5], u22 += 1);
          g2 = f3;
        }
        b22 = g2;
        f3 = -1;
        k2 = d2 - 1;
        m2 = 7;
        p2 = 0;
        a22 = y2.F(a22);
        for (q = d2 - 1; 0 < q; q -= 2)
          for (q == 6 && --q; ; ) {
            for (n32 = 0; 2 > n32; n32 += 1)
              r22[k2][q - n32] == null && (l5 = false, p2 < b22.length && (l5 = (b22[p2] >>> m2 & 1) == 1), a22(k2, q - n32) && (l5 = !l5), r22[k2][q - n32] = l5, --m2, m2 == -1 && (p2 += 1, m2 = 7));
            k2 += f3;
            if (0 > k2 || d2 <= k2) {
              k2 -= f3;
              f3 = -f3;
              break;
            }
          }
      }
      var h3 = A2[a2], r22 = null, d2 = 0, g2 = null, x2 = [], u2 = { u: function(b22) {
        b22 = w2(b22);
        x2.push(b22);
        g2 = null;
      }, a: function(b22, a22) {
        if (0 > b22 || d2 <= b22 || 0 > a22 || d2 <= a22)
          throw Error(b22 + "," + a22);
        return r22[b22][a22];
      }, h: function() {
        return d2;
      }, J: function() {
        for (var a22 = 0, h22 = 0, c22 = 0; 8 > c22; c22 += 1) {
          b2(true, c22);
          var d22 = y2.D(u2);
          if (c22 == 0 || a22 > d22)
            a22 = d22, h22 = c22;
        }
        b2(false, h22);
      } };
      return u2;
    }
    function z(c2, a2) {
      if (typeof c2.length == "undefined")
        throw Error(c2.length + "/" + a2);
      var e24 = function() {
        for (var b22 = 0; b22 < c2.length && c2[b22] == 0; )
          b22 += 1;
        for (var r22 = Array(c2.length - b22 + a2), d2 = 0; d2 < c2.length - b22; d2 += 1)
          r22[d2] = c2[d2 + b22];
        return r22;
      }(), b2 = { c: function(b22) {
        return e24[b22];
      }, b: function() {
        return e24.length;
      }, multiply: function(a22) {
        for (var h3 = Array(b2.b() + a22.b() - 1), c22 = 0; c22 < b2.b(); c22 += 1)
          for (var g2 = 0; g2 < a22.b(); g2 += 1)
            h3[c22 + g2] ^= v2.i(v2.g(b2.c(c22)) + v2.g(a22.c(g2)));
        return z(h3, 0);
      }, l: function(a22) {
        if (0 > b2.b() - a22.b())
          return b2;
        for (var c22 = v2.g(b2.c(0)) - v2.g(a22.c(0)), h3 = Array(b2.b()), g2 = 0; g2 < b2.b(); g2 += 1)
          h3[g2] = b2.c(g2);
        for (g2 = 0; g2 < a22.b(); g2 += 1)
          h3[g2] ^= v2.i(v2.g(a22.c(g2)) + c22);
        return z(h3, 0).l(a22);
      } };
      return b2;
    }
    C2.s = function(c2) {
      for (var a2 = [], e24 = 0; e24 < c2.length; e24++) {
        var b2 = c2.charCodeAt(e24);
        128 > b2 ? a2.push(b2) : 2048 > b2 ? a2.push(192 | b2 >> 6, 128 | b2 & 63) : 55296 > b2 || 57344 <= b2 ? a2.push(224 | b2 >> 12, 128 | b2 >> 6 & 63, 128 | b2 & 63) : (e24++, b2 = 65536 + ((b2 & 1023) << 10 | c2.charCodeAt(e24) & 1023), a2.push(240 | b2 >> 18, 128 | b2 >> 12 & 63, 128 | b2 >> 6 & 63, 128 | b2 & 63));
      }
      return a2;
    };
    var A2 = { L: 1, M: 0, Q: 3, H: 2 }, y2 = function() {
      function c2(b2) {
        for (var a22 = 0; b2 != 0; )
          a22 += 1, b2 >>>= 1;
        return a22;
      }
      var a2 = [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
      ], e24 = { w: function(b2) {
        for (var a22 = b2 << 10; 0 <= c2(a22) - c2(1335); )
          a22 ^= 1335 << c2(a22) - c2(1335);
        return (b2 << 10 | a22) ^ 21522;
      }, A: function(b2) {
        for (var a22 = b2 << 12; 0 <= c2(a22) - c2(7973); )
          a22 ^= 7973 << c2(a22) - c2(7973);
        return b2 << 12 | a22;
      }, G: function(b2) {
        return a2[b2 - 1];
      }, F: function(b2) {
        switch (b2) {
          case 0:
            return function(b22, a22) {
              return (b22 + a22) % 2 == 0;
            };
          case 1:
            return function(b22) {
              return b22 % 2 == 0;
            };
          case 2:
            return function(b22, a22) {
              return a22 % 3 == 0;
            };
          case 3:
            return function(b22, a22) {
              return (b22 + a22) % 3 == 0;
            };
          case 4:
            return function(b22, a22) {
              return (Math.floor(b22 / 2) + Math.floor(a22 / 3)) % 2 == 0;
            };
          case 5:
            return function(b22, a22) {
              return b22 * a22 % 2 + b22 * a22 % 3 == 0;
            };
          case 6:
            return function(b22, a22) {
              return (b22 * a22 % 2 + b22 * a22 % 3) % 2 == 0;
            };
          case 7:
            return function(b22, a22) {
              return (b22 * a22 % 3 + (b22 + a22) % 2) % 2 == 0;
            };
          default:
            throw Error("bad maskPattern:" + b2);
        }
      }, C: function(b2) {
        for (var a22 = z([1], 0), c22 = 0; c22 < b2; c22 += 1)
          a22 = a22.multiply(z([1, v2.i(c22)], 0));
        return a22;
      }, f: function(b2, a22) {
        if (b2 != 4 || 1 > a22 || 40 < a22)
          throw Error("mode: " + b2 + "; type: " + a22);
        return 10 > a22 ? 8 : 16;
      }, D: function(b2) {
        for (var a22 = b2.h(), c22 = 0, d2 = 0; d2 < a22; d2 += 1)
          for (var g2 = 0; g2 < a22; g2 += 1) {
            for (var e33 = 0, t23 = b2.a(d2, g2), p2 = -1; 1 >= p2; p2 += 1)
              if (!(0 > d2 + p2 || a22 <= d2 + p2))
                for (var q = -1; 1 >= q; q += 1)
                  0 > g2 + q || a22 <= g2 + q || (p2 != 0 || q != 0) && t23 == b2.a(d2 + p2, g2 + q) && (e33 += 1);
            5 < e33 && (c22 += 3 + e33 - 5);
          }
        for (d2 = 0; d2 < a22 - 1; d2 += 1)
          for (g2 = 0; g2 < a22 - 1; g2 += 1)
            if (e33 = 0, b2.a(d2, g2) && (e33 += 1), b2.a(d2 + 1, g2) && (e33 += 1), b2.a(d2, g2 + 1) && (e33 += 1), b2.a(d2 + 1, g2 + 1) && (e33 += 1), e33 == 0 || e33 == 4)
              c22 += 3;
        for (d2 = 0; d2 < a22; d2 += 1)
          for (g2 = 0; g2 < a22 - 6; g2 += 1)
            b2.a(d2, g2) && !b2.a(d2, g2 + 1) && b2.a(d2, g2 + 2) && b2.a(d2, g2 + 3) && b2.a(d2, g2 + 4) && !b2.a(d2, g2 + 5) && b2.a(d2, g2 + 6) && (c22 += 40);
        for (g2 = 0; g2 < a22; g2 += 1)
          for (d2 = 0; d2 < a22 - 6; d2 += 1)
            b2.a(d2, g2) && !b2.a(d2 + 1, g2) && b2.a(d2 + 2, g2) && b2.a(d2 + 3, g2) && b2.a(d2 + 4, g2) && !b2.a(d2 + 5, g2) && b2.a(d2 + 6, g2) && (c22 += 40);
        for (g2 = e33 = 0; g2 < a22; g2 += 1)
          for (d2 = 0; d2 < a22; d2 += 1)
            b2.a(d2, g2) && (e33 += 1);
        return c22 += Math.abs(100 * e33 / a22 / a22 - 50) / 5 * 10;
      } };
      return e24;
    }(), v2 = function() {
      for (var c2 = Array(256), a2 = Array(256), e24 = 0; 8 > e24; e24 += 1)
        c2[e24] = 1 << e24;
      for (e24 = 8; 256 > e24; e24 += 1)
        c2[e24] = c2[e24 - 4] ^ c2[e24 - 5] ^ c2[e24 - 6] ^ c2[e24 - 8];
      for (e24 = 0; 255 > e24; e24 += 1)
        a2[c2[e24]] = e24;
      return { g: function(b2) {
        if (1 > b2)
          throw Error("glog(" + b2 + ")");
        return a2[b2];
      }, i: function(b2) {
        for (; 0 > b2; )
          b2 += 255;
        for (; 256 <= b2; )
          b2 -= 255;
        return c2[b2];
      } };
    }(), t4 = function() {
      function c2(b2, c22) {
        switch (c22) {
          case A2.L:
            return a2[4 * (b2 - 1)];
          case A2.M:
            return a2[4 * (b2 - 1) + 1];
          case A2.Q:
            return a2[4 * (b2 - 1) + 2];
          case A2.H:
            return a2[4 * (b2 - 1) + 3];
        }
      }
      var a2 = [
        [1, 26, 19],
        [1, 26, 16],
        [1, 26, 13],
        [1, 26, 9],
        [1, 44, 34],
        [1, 44, 28],
        [1, 44, 22],
        [1, 44, 16],
        [1, 70, 55],
        [1, 70, 44],
        [2, 35, 17],
        [2, 35, 13],
        [1, 100, 80],
        [2, 50, 32],
        [2, 50, 24],
        [4, 25, 9],
        [1, 134, 108],
        [2, 67, 43],
        [2, 33, 15, 2, 34, 16],
        [2, 33, 11, 2, 34, 12],
        [2, 86, 68],
        [4, 43, 27],
        [4, 43, 19],
        [4, 43, 15],
        [2, 98, 78],
        [4, 49, 31],
        [2, 32, 14, 4, 33, 15],
        [4, 39, 13, 1, 40, 14],
        [2, 121, 97],
        [2, 60, 38, 2, 61, 39],
        [4, 40, 18, 2, 41, 19],
        [4, 40, 14, 2, 41, 15],
        [2, 146, 116],
        [
          3,
          58,
          36,
          2,
          59,
          37
        ],
        [4, 36, 16, 4, 37, 17],
        [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69],
        [4, 69, 43, 1, 70, 44],
        [6, 43, 19, 2, 44, 20],
        [6, 43, 15, 2, 44, 16],
        [4, 101, 81],
        [1, 80, 50, 4, 81, 51],
        [4, 50, 22, 4, 51, 23],
        [3, 36, 12, 8, 37, 13],
        [2, 116, 92, 2, 117, 93],
        [6, 58, 36, 2, 59, 37],
        [4, 46, 20, 6, 47, 21],
        [7, 42, 14, 4, 43, 15],
        [4, 133, 107],
        [8, 59, 37, 1, 60, 38],
        [8, 44, 20, 4, 45, 21],
        [12, 33, 11, 4, 34, 12],
        [3, 145, 115, 1, 146, 116],
        [4, 64, 40, 5, 65, 41],
        [11, 36, 16, 5, 37, 17],
        [11, 36, 12, 5, 37, 13],
        [5, 109, 87, 1, 110, 88],
        [5, 65, 41, 5, 66, 42],
        [5, 54, 24, 7, 55, 25],
        [11, 36, 12, 7, 37, 13],
        [5, 122, 98, 1, 123, 99],
        [
          7,
          73,
          45,
          3,
          74,
          46
        ],
        [15, 43, 19, 2, 44, 20],
        [3, 45, 15, 13, 46, 16],
        [1, 135, 107, 5, 136, 108],
        [10, 74, 46, 1, 75, 47],
        [1, 50, 22, 15, 51, 23],
        [2, 42, 14, 17, 43, 15],
        [5, 150, 120, 1, 151, 121],
        [9, 69, 43, 4, 70, 44],
        [17, 50, 22, 1, 51, 23],
        [2, 42, 14, 19, 43, 15],
        [3, 141, 113, 4, 142, 114],
        [3, 70, 44, 11, 71, 45],
        [17, 47, 21, 4, 48, 22],
        [9, 39, 13, 16, 40, 14],
        [3, 135, 107, 5, 136, 108],
        [3, 67, 41, 13, 68, 42],
        [15, 54, 24, 5, 55, 25],
        [15, 43, 15, 10, 44, 16],
        [4, 144, 116, 4, 145, 117],
        [17, 68, 42],
        [17, 50, 22, 6, 51, 23],
        [19, 46, 16, 6, 47, 17],
        [2, 139, 111, 7, 140, 112],
        [17, 74, 46],
        [7, 54, 24, 16, 55, 25],
        [34, 37, 13],
        [
          4,
          151,
          121,
          5,
          152,
          122
        ],
        [4, 75, 47, 14, 76, 48],
        [11, 54, 24, 14, 55, 25],
        [16, 45, 15, 14, 46, 16],
        [6, 147, 117, 4, 148, 118],
        [6, 73, 45, 14, 74, 46],
        [11, 54, 24, 16, 55, 25],
        [30, 46, 16, 2, 47, 17],
        [8, 132, 106, 4, 133, 107],
        [8, 75, 47, 13, 76, 48],
        [7, 54, 24, 22, 55, 25],
        [22, 45, 15, 13, 46, 16],
        [10, 142, 114, 2, 143, 115],
        [19, 74, 46, 4, 75, 47],
        [28, 50, 22, 6, 51, 23],
        [33, 46, 16, 4, 47, 17],
        [8, 152, 122, 4, 153, 123],
        [22, 73, 45, 3, 74, 46],
        [8, 53, 23, 26, 54, 24],
        [12, 45, 15, 28, 46, 16],
        [3, 147, 117, 10, 148, 118],
        [3, 73, 45, 23, 74, 46],
        [4, 54, 24, 31, 55, 25],
        [11, 45, 15, 31, 46, 16],
        [7, 146, 116, 7, 147, 117],
        [21, 73, 45, 7, 74, 46],
        [1, 53, 23, 37, 54, 24],
        [19, 45, 15, 26, 46, 16],
        [5, 145, 115, 10, 146, 116],
        [19, 75, 47, 10, 76, 48],
        [15, 54, 24, 25, 55, 25],
        [23, 45, 15, 25, 46, 16],
        [13, 145, 115, 3, 146, 116],
        [2, 74, 46, 29, 75, 47],
        [42, 54, 24, 1, 55, 25],
        [23, 45, 15, 28, 46, 16],
        [17, 145, 115],
        [10, 74, 46, 23, 75, 47],
        [10, 54, 24, 35, 55, 25],
        [19, 45, 15, 35, 46, 16],
        [17, 145, 115, 1, 146, 116],
        [14, 74, 46, 21, 75, 47],
        [29, 54, 24, 19, 55, 25],
        [11, 45, 15, 46, 46, 16],
        [13, 145, 115, 6, 146, 116],
        [14, 74, 46, 23, 75, 47],
        [44, 54, 24, 7, 55, 25],
        [59, 46, 16, 1, 47, 17],
        [12, 151, 121, 7, 152, 122],
        [12, 75, 47, 26, 76, 48],
        [39, 54, 24, 14, 55, 25],
        [22, 45, 15, 41, 46, 16],
        [6, 151, 121, 14, 152, 122],
        [6, 75, 47, 34, 76, 48],
        [46, 54, 24, 10, 55, 25],
        [2, 45, 15, 64, 46, 16],
        [17, 152, 122, 4, 153, 123],
        [29, 74, 46, 14, 75, 47],
        [49, 54, 24, 10, 55, 25],
        [24, 45, 15, 46, 46, 16],
        [4, 152, 122, 18, 153, 123],
        [13, 74, 46, 32, 75, 47],
        [48, 54, 24, 14, 55, 25],
        [42, 45, 15, 32, 46, 16],
        [20, 147, 117, 4, 148, 118],
        [40, 75, 47, 7, 76, 48],
        [43, 54, 24, 22, 55, 25],
        [10, 45, 15, 67, 46, 16],
        [19, 148, 118, 6, 149, 119],
        [18, 75, 47, 31, 76, 48],
        [34, 54, 24, 34, 55, 25],
        [20, 45, 15, 61, 46, 16]
      ], e24 = { I: function(b2, a22) {
        var e33 = c2(b2, a22);
        if (typeof e33 == "undefined")
          throw Error("bad rs block @ typeNumber:" + b2 + "/errorCorrectLevel:" + a22);
        b2 = e33.length / 3;
        a22 = [];
        for (var d2 = 0; d2 < b2; d2 += 1)
          for (var g2 = e33[3 * d2], h3 = e33[3 * d2 + 1], t23 = e33[3 * d2 + 2], p2 = 0; p2 < g2; p2 += 1) {
            var q = t23, f3 = {};
            f3.o = h3;
            f3.j = q;
            a22.push(f3);
          }
        return a22;
      } };
      return e24;
    }();
    return C2;
  }());
  var qr_creator_es6_min_default = QrCreator;
  var qr_code_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .qr-code {
    position: relative;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;
  var SlQrCode = class extends n4 {
    constructor() {
      super(...arguments);
      this.value = "";
      this.label = "";
      this.size = 128;
      this.fill = "#000";
      this.background = "#fff";
      this.radius = 0;
      this.errorCorrection = "H";
    }
    firstUpdated() {
      this.generate();
    }
    generate() {
      if (!this.hasUpdated) {
        return;
      }
      qr_creator_es6_min_default.render({
        text: this.value,
        radius: this.radius,
        ecLevel: this.errorCorrection,
        fill: this.fill,
        background: this.background === "transparent" ? null : this.background,
        size: this.size * 2
      }, this.canvas);
    }
    render() {
      return y`
      <div
        class="qr-code"
        part="base"
        style=${i24({
        width: `${this.size}px`,
        height: `${this.size}px`
      })}
      >
        <canvas role="img" aria-label=${this.label || this.value}></canvas>
      </div>
    `;
    }
  };
  SlQrCode.styles = qr_code_styles_default;
  __decorateClass([
    i23("canvas")
  ], SlQrCode.prototype, "canvas", 2);
  __decorateClass([
    e4()
  ], SlQrCode.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlQrCode.prototype, "label", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlQrCode.prototype, "size", 2);
  __decorateClass([
    e4()
  ], SlQrCode.prototype, "fill", 2);
  __decorateClass([
    e4()
  ], SlQrCode.prototype, "background", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlQrCode.prototype, "radius", 2);
  __decorateClass([
    e4({ attribute: "error-correction" })
  ], SlQrCode.prototype, "errorCorrection", 2);
  __decorateClass([
    watch("background"),
    watch("errorCorrection"),
    watch("fill"),
    watch("radius"),
    watch("size"),
    watch("value")
  ], SlQrCode.prototype, "generate", 1);
  SlQrCode = __decorateClass([
    n5("sl-qr-code")
  ], SlQrCode);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3QVVXEOR.js
  var image_comparer_styles_default = r`
  ${component_styles_default}

  :host {
    --divider-width: 2px;
    --handle-size: 2.5rem;

    display: inline-block;
    position: relative;
  }

  .image-comparer {
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  .image-comparer__before,
  .image-comparer__after {
    pointer-events: none;
  }

  .image-comparer__before ::slotted(img),
  .image-comparer__after ::slotted(img),
  .image-comparer__before ::slotted(svg),
  .image-comparer__after ::slotted(svg) {
    display: block;
    max-width: 100% !important;
    height: auto;
  }

  .image-comparer__after {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  }

  .image-comparer__divider {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    width: var(--divider-width);
    height: 100%;
    background-color: rgb(var(--sl-color-neutral-0));
    transform: translateX(calc(var(--divider-width) / -2));
    cursor: ew-resize;
  }

  .image-comparer__handle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: calc(50% - (var(--handle-size) / 2));
    width: var(--handle-size);
    height: var(--handle-size);
    background-color: rgb(var(--sl-color-neutral-0));
    border-radius: var(--sl-border-radius-circle);
    font-size: calc(var(--handle-size) * 0.5);
    color: rgb(var(--sl-color-neutral-500));
    cursor: inherit;
    z-index: 10;
  }

  .image-comparer__handle${focusVisibleSelector} {
    outline: none;
    box-shadow: var(--sl-focus-ring);
  }
`;
  var SlImageComparer = class extends n4 {
    constructor() {
      super(...arguments);
      this.position = 50;
    }
    handleDrag(event) {
      const { width } = this.base.getBoundingClientRect();
      function drag(event2, container, onMove) {
        const move = (event3) => {
          const dims = container.getBoundingClientRect();
          const defaultView = container.ownerDocument.defaultView;
          const offsetX = dims.left + defaultView.pageXOffset;
          const offsetY = dims.top + defaultView.pageYOffset;
          const x2 = (event3.changedTouches ? event3.changedTouches[0].pageX : event3.pageX) - offsetX;
          const y2 = (event3.changedTouches ? event3.changedTouches[0].pageY : event3.pageY) - offsetY;
          onMove(x2, y2);
        };
        move(event2);
        const stop = () => {
          document.removeEventListener("mousemove", move);
          document.removeEventListener("touchmove", move);
          document.removeEventListener("mouseup", stop);
          document.removeEventListener("touchend", stop);
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("touchmove", move);
        document.addEventListener("mouseup", stop);
        document.addEventListener("touchend", stop);
      }
      event.preventDefault();
      drag(event, this.base, (x2) => {
        this.position = Number(clamp2(x2 / width * 100, 0, 100).toFixed(2));
      });
    }
    handleKeyDown(event) {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        const incr = event.shiftKey ? 10 : 1;
        let newPosition = this.position;
        event.preventDefault();
        if (event.key === "ArrowLeft")
          newPosition = newPosition - incr;
        if (event.key === "ArrowRight")
          newPosition = newPosition + incr;
        if (event.key === "Home")
          newPosition = 0;
        if (event.key === "End")
          newPosition = 100;
        newPosition = clamp2(newPosition, 0, 100);
        this.position = newPosition;
      }
    }
    handlePositionChange() {
      emit(this, "sl-change");
    }
    render() {
      return y`
      <div part="base" class="image-comparer" @keydown=${this.handleKeyDown}>
        <div class="image-comparer__image">
          <div part="before" class="image-comparer__before">
            <slot name="before"></slot>
          </div>

          <div
            part="after"
            class="image-comparer__after"
            style=${i24({ clipPath: `inset(0 ${100 - this.position}% 0 0)` })}
          >
            <slot name="after"></slot>
          </div>
        </div>

        <div
          part="divider"
          class="image-comparer__divider"
          style=${i24({ left: this.position + "%" })}
          @mousedown=${this.handleDrag}
          @touchstart=${this.handleDrag}
        >
          <div
            part="handle"
            class="image-comparer__handle"
            role="scrollbar"
            aria-valuenow=${this.position}
            aria-valuemin="0"
            aria-valuemax="100"
            tabindex="0"
          >
            <slot name="handle-icon">
              <sl-icon class="image-comparer__handle-icon" name="grip-vertical" library="system"></sl-icon>
            </slot>
          </div>
        </div>
      </div>
    `;
    }
  };
  SlImageComparer.styles = image_comparer_styles_default;
  __decorateClass([
    i23(".image-comparer")
  ], SlImageComparer.prototype, "base", 2);
  __decorateClass([
    i23(".image-comparer__handle")
  ], SlImageComparer.prototype, "handle", 2);
  __decorateClass([
    e4({ type: Number, reflect: true })
  ], SlImageComparer.prototype, "position", 2);
  __decorateClass([
    watch("position", { waitUntilFirstUpdate: true })
  ], SlImageComparer.prototype, "handlePositionChange", 1);
  SlImageComparer = __decorateClass([
    n5("sl-image-comparer")
  ], SlImageComparer);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.DTM5B7PO.js
  var includeFiles = new Map();
  var requestInclude = async (src, mode = "cors") => {
    if (includeFiles.has(src)) {
      return includeFiles.get(src);
    } else {
      const request = fetch(src, { mode }).then(async (response) => {
        return {
          ok: response.ok,
          status: response.status,
          html: await response.text()
        };
      });
      includeFiles.set(src, request);
      return request;
    }
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.JPVERGSU.js
  var include_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }
`;
  var SlInclude = class extends n4 {
    constructor() {
      super(...arguments);
      this.mode = "cors";
      this.allowScripts = false;
    }
    executeScript(script) {
      const newScript = document.createElement("script");
      [...script.attributes].map((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = script.textContent;
      script.parentNode.replaceChild(newScript, script);
    }
    async handleSrcChange() {
      try {
        const src = this.src;
        const file = await requestInclude(src, this.mode);
        if (src !== this.src) {
          return;
        }
        if (!file) {
          return;
        }
        if (!file.ok) {
          emit(this, "sl-error", { detail: { status: file.status } });
          return;
        }
        this.innerHTML = file.html;
        if (this.allowScripts) {
          [...this.querySelectorAll("script")].map((script) => this.executeScript(script));
        }
        emit(this, "sl-load");
      } catch (e24) {
        emit(this, "sl-error", { detail: { status: -1 } });
      }
    }
    render() {
      return y`<slot></slot>`;
    }
  };
  SlInclude.styles = include_styles_default;
  __decorateClass([
    e4()
  ], SlInclude.prototype, "src", 2);
  __decorateClass([
    e4()
  ], SlInclude.prototype, "mode", 2);
  __decorateClass([
    e4({ attribute: "allow-scripts", type: Boolean })
  ], SlInclude.prototype, "allowScripts", 2);
  __decorateClass([
    watch("src")
  ], SlInclude.prototype, "handleSrcChange", 1);
  SlInclude = __decorateClass([
    n5("sl-include")
  ], SlInclude);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.FBWBXHYE.js
  var divider_styles_default = r`
  ${component_styles_default}

  :host {
    --color: rgb(var(--sl-panel-border-color));
    --width: var(--sl-panel-border-width);
    --spacing: var(--sl-spacing-medium);
  }

  :host(:not([vertical])) .menu-divider {
    display: block;
    border-top: solid var(--width) var(--color);
    margin: var(--spacing) 0;
  }

  :host([vertical]) {
    height: 100%;
  }

  :host([vertical]) .menu-divider {
    display: inline-block;
    height: 100%;
    border-left: solid var(--width) var(--color);
    margin: 0 var(--spacing);
  }
`;
  var SlDivider = class extends n4 {
    constructor() {
      super(...arguments);
      this.vertical = false;
    }
    firstUpdated() {
      this.setAttribute("role", "separator");
    }
    handleVerticalChange() {
      this.setAttribute("aria-orientation", this.vertical ? "vertical" : "horizontal");
    }
    render() {
      return y` <div part="base" class="menu-divider"></div> `;
    }
  };
  SlDivider.styles = divider_styles_default;
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDivider.prototype, "vertical", 2);
  __decorateClass([
    watch("vertical")
  ], SlDivider.prototype, "handleVerticalChange", 1);
  SlDivider = __decorateClass([
    n5("sl-divider")
  ], SlDivider);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.DTSUHNT6.js
  function isTabbable(el) {
    const tag = el.tagName.toLowerCase();
    if (el.getAttribute("tabindex") === "-1") {
      return false;
    }
    if (el.hasAttribute("disabled")) {
      return false;
    }
    if (el.hasAttribute("aria-disabled") && el.getAttribute("aria-disabled") !== "false") {
      return false;
    }
    if (tag === "input" && el.getAttribute("type") === "radio" && !el.hasAttribute("checked")) {
      return false;
    }
    if (!el.offsetParent) {
      return false;
    }
    if (window.getComputedStyle(el).visibility === "hidden") {
      return false;
    }
    if ((tag === "audio" || tag === "video") && el.hasAttribute("controls")) {
      return true;
    }
    if (el.hasAttribute("tabindex")) {
      return true;
    }
    if (el.hasAttribute("contenteditable") && el.getAttribute("contenteditable") !== "false") {
      return true;
    }
    return ["button", "input", "select", "textarea", "a", "audio", "video", "summary"].includes(tag);
  }
  function getTabbableBoundary(root) {
    const allElements = [];
    function walk(el) {
      if (el instanceof HTMLElement) {
        allElements.push(el);
        if (el.shadowRoot && el.shadowRoot.mode === "open") {
          walk(el.shadowRoot);
        }
      }
      [...el.querySelectorAll("*")].map((e5) => walk(e5));
    }
    walk(root);
    const start3 = allElements.find((el) => isTabbable(el)) || null;
    const end2 = allElements.reverse().find((el) => isTabbable(el)) || null;
    return { start: start3, end: end2 };
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.P4ITZG26.js
  function isPreventScrollSupported() {
    let supported = false;
    document.createElement("div").focus({
      get preventScroll() {
        supported = true;
        return false;
      }
    });
    return supported;
  }
  var activeModals = [];
  var Modal = class {
    constructor(element) {
      this.tabDirection = "forward";
      this.element = element;
      this.handleFocusIn = this.handleFocusIn.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    activate() {
      activeModals.push(this.element);
      document.addEventListener("focusin", this.handleFocusIn);
      document.addEventListener("keydown", this.handleKeyDown);
    }
    deactivate() {
      activeModals = activeModals.filter((modal) => modal !== this.element);
      document.removeEventListener("focusin", this.handleFocusIn);
      document.removeEventListener("keydown", this.handleKeyDown);
    }
    isActive() {
      return activeModals[activeModals.length - 1] === this.element;
    }
    handleFocusIn(event) {
      const path = event.composedPath();
      if (this.isActive() && !path.includes(this.element)) {
        const { start: start3, end: end2 } = getTabbableBoundary(this.element);
        const target = this.tabDirection === "forward" ? start3 : end2;
        if (typeof (target == null ? void 0 : target.focus) === "function") {
          target.focus({ preventScroll: true });
        }
      }
    }
    handleKeyDown(event) {
      if (event.key === "Tab" && event.shiftKey) {
        this.tabDirection = "backward";
        setTimeout(() => this.tabDirection = "forward");
      }
    }
  };
  var modal_default = Modal;

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.MVU6JTZ5.js
  function uppercaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  var drawer_styles_default = r`
  ${component_styles_default}

  :host {
    --size: 25rem;
    --header-spacing: var(--sl-spacing-large);
    --body-spacing: var(--sl-spacing-large);
    --footer-spacing: var(--sl-spacing-large);

    display: contents;
  }

  .drawer {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
  }

  .drawer--contained {
    position: absolute;
    z-index: initial;
  }

  .drawer--fixed {
    position: fixed;
    z-index: var(--sl-z-index-drawer);
  }

  .drawer__panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    z-index: 2;
    max-width: 100%;
    max-height: 100%;
    background-color: rgb(var(--sl-panel-background-color));
    box-shadow: var(--sl-shadow-x-large);
    transition: var(--sl-transition-medium) transform;
    overflow: auto;
    pointer-events: all;
  }

  .drawer__panel:focus {
    outline: none;
  }

  .drawer--top .drawer__panel {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0;
    width: 100%;
    height: var(--size);
  }

  .drawer--end .drawer__panel {
    top: 0;
    right: 0;
    bottom: auto;
    left: auto;
    width: var(--size);
    height: 100%;
  }

  .drawer--bottom .drawer__panel {
    top: auto;
    right: auto;
    bottom: 0;
    left: 0;
    width: 100%;
    height: var(--size);
  }

  .drawer--start .drawer__panel {
    top: 0;
    right: auto;
    bottom: auto;
    left: 0;
    width: var(--size);
    height: 100%;
  }

  .drawer__header {
    display: flex;
  }

  .drawer__title {
    flex: 1 1 auto;
    font-size: var(--sl-font-size-large);
    line-height: var(--sl-line-height-dense);
    padding: var(--header-spacing);
  }

  .drawer__close {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-x-large);
    padding: 0 var(--header-spacing);
  }

  .drawer__body {
    flex: 1 1 auto;
    padding: var(--body-spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .drawer__footer {
    text-align: right;
    padding: var(--footer-spacing);
  }

  .drawer__footer ::slotted(sl-button:not(:last-of-type)) {
    margin-right: var(--sl-spacing-x-small);
  }

  .drawer:not(.drawer--has-footer) .drawer__footer {
    display: none;
  }

  .drawer__overlay {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgb(var(--sl-overlay-background-color) / var(--sl-overlay-opacity));
    pointer-events: all;
  }

  .drawer--contained .drawer__overlay {
    position: absolute;
  }
`;
  var hasPreventScroll = isPreventScrollSupported();
  var id9 = 0;
  var SlDrawer = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `drawer-${++id9}`;
      this.hasFooter = false;
      this.open = false;
      this.label = "";
      this.placement = "end";
      this.contained = false;
      this.noHeader = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.modal = new modal_default(this);
      this.handleSlotChange();
    }
    firstUpdated() {
      this.drawer.hidden = !this.open;
      if (this.open && !this.contained) {
        this.modal.activate();
        lockBodyScrolling(this);
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      unlockBodyScrolling(this);
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    requestClose() {
      const slRequestClose = emit(this, "sl-request-close", { cancelable: true });
      if (slRequestClose.defaultPrevented) {
        const animation = getAnimation(this, "drawer.denyClose");
        animateTo(this.panel, animation.keyframes, animation.options);
        return;
      }
      this.hide();
    }
    handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        this.requestClose();
      }
    }
    async handleOpenChange() {
      if (this.open) {
        emit(this, "sl-show");
        this.originalTrigger = document.activeElement;
        if (!this.contained) {
          this.modal.activate();
          lockBodyScrolling(this);
        }
        await Promise.all([stopAnimations(this.drawer), stopAnimations(this.overlay)]);
        this.drawer.hidden = false;
        if (hasPreventScroll) {
          const slInitialFocus = emit(this, "sl-initial-focus", { cancelable: true });
          if (!slInitialFocus.defaultPrevented) {
            this.panel.focus({ preventScroll: true });
          }
        }
        const panelAnimation = getAnimation(this, `drawer.show${uppercaseFirstLetter(this.placement)}`);
        const overlayAnimation = getAnimation(this, "drawer.overlay.show");
        await Promise.all([
          animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options),
          animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options)
        ]);
        if (!hasPreventScroll) {
          const slInitialFocus = emit(this, "sl-initial-focus", { cancelable: true });
          if (!slInitialFocus.defaultPrevented) {
            this.panel.focus({ preventScroll: true });
          }
        }
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        this.modal.deactivate();
        unlockBodyScrolling(this);
        await Promise.all([stopAnimations(this.drawer), stopAnimations(this.overlay)]);
        const panelAnimation = getAnimation(this, `drawer.hide${uppercaseFirstLetter(this.placement)}`);
        const overlayAnimation = getAnimation(this, "drawer.overlay.hide");
        await Promise.all([
          animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options),
          animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options)
        ]);
        this.drawer.hidden = true;
        const trigger = this.originalTrigger;
        if (trigger && typeof trigger.focus === "function") {
          setTimeout(() => trigger.focus());
        }
        emit(this, "sl-after-hide");
      }
    }
    handleSlotChange() {
      this.hasFooter = hasSlot(this, "footer");
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        drawer: true,
        "drawer--open": this.open,
        "drawer--top": this.placement === "top",
        "drawer--end": this.placement === "end",
        "drawer--bottom": this.placement === "bottom",
        "drawer--start": this.placement === "start",
        "drawer--contained": this.contained,
        "drawer--fixed": !this.contained,
        "drawer--has-footer": this.hasFooter
      })}
        @keydown=${this.handleKeyDown}
      >
        <div part="overlay" class="drawer__overlay" @click=${this.requestClose} tabindex="-1"></div>

        <div
          part="panel"
          class="drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-hidden=${this.open ? "false" : "true"}
          aria-label=${l4(this.noHeader ? this.label : void 0)}
          aria-labelledby=${l4(!this.noHeader ? `${this.componentId}-title` : void 0)}
          tabindex="0"
        >
          ${!this.noHeader ? y`
                <header part="header" class="drawer__header">
                  <span part="title" class="drawer__title" id=${`${this.componentId}-title`}>
                    <!-- If there's no label, use an invisible character to prevent the heading from collapsing -->
                    <slot name="label"> ${this.label || String.fromCharCode(65279)} </slot>
                  </span>
                  <sl-icon-button
                    exportparts="base:close-button"
                    class="drawer__close"
                    name="x"
                    library="system"
                    @click=${this.requestClose}
                  ></sl-icon-button>
                </header>
              ` : ""}

          <div part="body" class="drawer__body">
            <slot></slot>
          </div>

          <footer part="footer" class="drawer__footer">
            <slot name="footer" @slotchange=${this.handleSlotChange}></slot>
          </footer>
        </div>
      </div>
    `;
    }
  };
  SlDrawer.styles = drawer_styles_default;
  __decorateClass([
    i23(".drawer")
  ], SlDrawer.prototype, "drawer", 2);
  __decorateClass([
    i23(".drawer__panel")
  ], SlDrawer.prototype, "panel", 2);
  __decorateClass([
    i23(".drawer__overlay")
  ], SlDrawer.prototype, "overlay", 2);
  __decorateClass([
    t3()
  ], SlDrawer.prototype, "hasFooter", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDrawer.prototype, "open", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlDrawer.prototype, "label", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlDrawer.prototype, "placement", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDrawer.prototype, "contained", 2);
  __decorateClass([
    e4({ attribute: "no-header", type: Boolean, reflect: true })
  ], SlDrawer.prototype, "noHeader", 2);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlDrawer.prototype, "handleOpenChange", 1);
  SlDrawer = __decorateClass([
    n5("sl-drawer")
  ], SlDrawer);
  setDefaultAnimation("drawer.showTop", {
    keyframes: [
      { opacity: 0, transform: "translateY(-100%)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.hideTop", {
    keyframes: [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-100%)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.showEnd", {
    keyframes: [
      { opacity: 0, transform: "translateX(100%)" },
      { opacity: 1, transform: "translateX(0)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.hideEnd", {
    keyframes: [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(100%)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.showBottom", {
    keyframes: [
      { opacity: 0, transform: "translateY(100%)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.hideBottom", {
    keyframes: [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(100%)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.showStart", {
    keyframes: [
      { opacity: 0, transform: "translateX(-100%)" },
      { opacity: 1, transform: "translateX(0)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.hideStart", {
    keyframes: [
      { opacity: 1, transform: "translateX(0)" },
      { opacity: 0, transform: "translateX(-100%)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("drawer.denyClose", {
    keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.01)" }, { transform: "scale(1)" }],
    options: { duration: 250 }
  });
  setDefaultAnimation("drawer.overlay.show", {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 250 }
  });
  setDefaultAnimation("drawer.overlay.hide", {
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
    options: { duration: 250 }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.QL7TFEQJ.js
  var form_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }
`;
  var SlForm = class extends n4 {
    constructor() {
      super(...arguments);
      this.novalidate = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.formControls = [
        {
          tag: "button",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null,
          click: (event) => {
            const target = event.target;
            if (target.type === "submit") {
              this.submit();
            }
          }
        },
        {
          tag: "input",
          serialize: (el, formData) => {
            if (!el.name || el.disabled) {
              return;
            }
            if ((el.type === "checkbox" || el.type === "radio") && !el.checked) {
              return;
            }
            if (el.type === "file") {
              [...el.files].map((file) => formData.append(el.name, file));
              return;
            }
            formData.append(el.name, el.value);
          },
          click: (event) => {
            const target = event.target;
            if (target.type === "submit") {
              this.submit();
            }
          },
          keyDown: (event) => {
            const target = event.target;
            if (event.key === "Enter" && !event.defaultPrevented && !["checkbox", "file", "radio"].includes(target.type)) {
              this.submit();
            }
          }
        },
        {
          tag: "select",
          serialize: (el, formData) => {
            if (el.name && !el.disabled) {
              if (el.multiple) {
                const selectedOptions = [...el.querySelectorAll("option:checked")];
                if (selectedOptions.length) {
                  selectedOptions.map((option) => formData.append(el.name, option.value));
                } else {
                  formData.append(el.name, "");
                }
              } else {
                formData.append(el.name, el.value);
              }
            }
          }
        },
        {
          tag: "sl-button",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null,
          click: (event) => {
            const target = event.target;
            if (target.submit) {
              this.submit();
            }
          }
        },
        {
          tag: "sl-checkbox",
          serialize: (el, formData) => el.name && el.checked && !el.disabled ? formData.append(el.name, el.value) : null
        },
        {
          tag: "sl-color-picker",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null
        },
        {
          tag: "sl-input",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null,
          keyDown: (event) => {
            if (event.key === "Enter" && !event.defaultPrevented) {
              this.submit();
            }
          }
        },
        {
          tag: "sl-radio",
          serialize: (el, formData) => el.name && el.checked && !el.disabled ? formData.append(el.name, el.value) : null
        },
        {
          tag: "sl-range",
          serialize: (el, formData) => {
            if (el.name && !el.disabled) {
              formData.append(el.name, el.value + "");
            }
          }
        },
        {
          tag: "sl-select",
          serialize: (el, formData) => {
            if (el.name && !el.disabled) {
              if (el.multiple) {
                const selectedOptions = [...el.value];
                if (selectedOptions.length) {
                  selectedOptions.map((value) => formData.append(el.name, value));
                } else {
                  formData.append(el.name, "");
                }
              } else {
                formData.append(el.name, el.value + "");
              }
            }
          }
        },
        {
          tag: "sl-switch",
          serialize: (el, formData) => el.name && el.checked && !el.disabled ? formData.append(el.name, el.value) : null
        },
        {
          tag: "sl-textarea",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null
        },
        {
          tag: "textarea",
          serialize: (el, formData) => el.name && !el.disabled ? formData.append(el.name, el.value) : null
        }
      ];
    }
    getFormData() {
      const formData = new FormData();
      const formControls = this.getFormControls();
      formControls.map((el) => this.serializeElement(el, formData));
      return formData;
    }
    getFormControls() {
      const slot = this.form.querySelector("slot");
      const tags = this.formControls.map((control) => control.tag);
      return slot.assignedElements({ flatten: true }).reduce((all, el) => all.concat(el, [...el.querySelectorAll("*")]), []).filter((el) => tags.includes(el.tagName.toLowerCase()));
    }
    submit() {
      const formData = this.getFormData();
      const formControls = this.getFormControls();
      const formControlsThatReport = formControls.filter((el) => typeof el.reportValidity === "function");
      if (!this.novalidate) {
        for (const el of formControlsThatReport) {
          const isValid = el.reportValidity();
          if (!isValid) {
            return false;
          }
        }
      }
      emit(this, "sl-submit", { detail: { formData, formControls } });
      return true;
    }
    handleClick(event) {
      const target = event.target;
      const tag = target.tagName.toLowerCase();
      for (const formControl of this.formControls) {
        if (formControl.tag === tag && formControl.click) {
          formControl.click(event);
        }
      }
    }
    handleKeyDown(event) {
      const target = event.target;
      const tag = target.tagName.toLowerCase();
      for (const formControl of this.formControls) {
        if (formControl.tag === tag && formControl.keyDown) {
          formControl.keyDown(event);
        }
      }
    }
    serializeElement(el, formData) {
      const tag = el.tagName.toLowerCase();
      for (const formControl of this.formControls) {
        if (formControl.tag === tag) {
          return formControl.serialize(el, formData);
        }
      }
      return null;
    }
    render() {
      return y`
      <div part="base" class="form" role="form" @click=${this.handleClick} @keydown=${this.handleKeyDown}>
        <slot></slot>
      </div>
    `;
    }
  };
  SlForm.styles = form_styles_default;
  __decorateClass([
    i23(".form")
  ], SlForm.prototype, "form", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlForm.prototype, "novalidate", 2);
  SlForm = __decorateClass([
    n5("sl-form")
  ], SlForm);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.N3LBHWG7.js
  function formatBytes(bytes, options) {
    options = Object.assign({
      unit: "bytes",
      locale: void 0
    }, options);
    const byteUnits = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const bitUnits = ["b", "kbit", "Mbit", "Gbit", "Tbit", "Pbit", "Ebit", "Zbit", "Ybit"];
    const units = options.unit === "bytes" ? byteUnits : bitUnits;
    const isNegative = bytes < 0;
    bytes = Math.abs(bytes);
    if (bytes === 0)
      return "0 B";
    const i4 = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1);
    const num = Number((bytes / Math.pow(1e3, i4)).toPrecision(3));
    const numString = num.toLocaleString(options.locale);
    const prefix = isNegative ? "-" : "";
    return `${prefix}${numString} ${units[i4]}`;
  }
  var SlFormatBytes = class extends n4 {
    constructor() {
      super(...arguments);
      this.value = 0;
      this.unit = "bytes";
    }
    render() {
      return formatBytes(this.value, {
        unit: this.unit,
        locale: this.locale
      });
    }
  };
  __decorateClass([
    e4({ type: Number })
  ], SlFormatBytes.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlFormatBytes.prototype, "unit", 2);
  __decorateClass([
    e4()
  ], SlFormatBytes.prototype, "locale", 2);
  SlFormatBytes = __decorateClass([
    n5("sl-format-bytes")
  ], SlFormatBytes);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.3HVYS55R.js
  var SlFormatDate = class extends n4 {
    constructor() {
      super(...arguments);
      this.date = new Date();
      this.hourFormat = "auto";
    }
    render() {
      const date = new Date(this.date);
      const hour12 = this.hourFormat === "auto" ? void 0 : this.hourFormat === "12";
      if (isNaN(date.getMilliseconds())) {
        return;
      }
      return new Intl.DateTimeFormat(this.locale, {
        weekday: this.weekday,
        era: this.era,
        year: this.year,
        month: this.month,
        day: this.day,
        hour: this.hour,
        minute: this.minute,
        second: this.second,
        timeZoneName: this.timeZoneName,
        timeZone: this.timeZone,
        hour12
      }).format(date);
    }
  };
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "date", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "locale", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "weekday", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "era", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "year", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "month", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "day", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "hour", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "minute", 2);
  __decorateClass([
    e4()
  ], SlFormatDate.prototype, "second", 2);
  __decorateClass([
    e4({ attribute: "time-zone-name" })
  ], SlFormatDate.prototype, "timeZoneName", 2);
  __decorateClass([
    e4({ attribute: "time-zone" })
  ], SlFormatDate.prototype, "timeZone", 2);
  __decorateClass([
    e4({ attribute: "hour-format" })
  ], SlFormatDate.prototype, "hourFormat", 2);
  SlFormatDate = __decorateClass([
    n5("sl-format-date")
  ], SlFormatDate);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.AQLVB734.js
  var SlFormatNumber = class extends n4 {
    constructor() {
      super(...arguments);
      this.value = 0;
      this.type = "decimal";
      this.noGrouping = false;
      this.currency = "USD";
      this.currencyDisplay = "symbol";
    }
    render() {
      if (isNaN(this.value)) {
        return "";
      }
      return new Intl.NumberFormat(this.locale, {
        style: this.type,
        currency: this.currency,
        currencyDisplay: this.currencyDisplay,
        useGrouping: !this.noGrouping,
        minimumIntegerDigits: this.minimumIntegerDigits,
        minimumFractionDigits: this.minimumFractionDigits,
        maximumFractionDigits: this.maximumFractionDigits,
        minimumSignificantDigits: this.minimumSignificantDigits,
        maximumSignificantDigits: this.maximumSignificantDigits
      }).format(this.value);
    }
  };
  __decorateClass([
    e4({ type: Number })
  ], SlFormatNumber.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlFormatNumber.prototype, "locale", 2);
  __decorateClass([
    e4()
  ], SlFormatNumber.prototype, "type", 2);
  __decorateClass([
    e4({ attribute: "no-grouping", type: Boolean })
  ], SlFormatNumber.prototype, "noGrouping", 2);
  __decorateClass([
    e4()
  ], SlFormatNumber.prototype, "currency", 2);
  __decorateClass([
    e4({ attribute: "currency-display" })
  ], SlFormatNumber.prototype, "currencyDisplay", 2);
  __decorateClass([
    e4({ attribute: "minimum-integer-digits", type: Number })
  ], SlFormatNumber.prototype, "minimumIntegerDigits", 2);
  __decorateClass([
    e4({ attribute: "minimum-fraction-digits", type: Number })
  ], SlFormatNumber.prototype, "minimumFractionDigits", 2);
  __decorateClass([
    e4({ attribute: "maximum-fraction-digits", type: Number })
  ], SlFormatNumber.prototype, "maximumFractionDigits", 2);
  __decorateClass([
    e4({ attribute: "minimum-significant-digits", type: Number })
  ], SlFormatNumber.prototype, "minimumSignificantDigits", 2);
  __decorateClass([
    e4({ attribute: "maximum-significant-digits", type: Number })
  ], SlFormatNumber.prototype, "maximumSignificantDigits", 2);
  SlFormatNumber = __decorateClass([
    n5("sl-format-number")
  ], SlFormatNumber);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.AJPCCIUW.js
  var breadcrumb_item_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-flex;
  }

  .breadcrumb-item {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    color: rgb(var(--sl-color-neutral-600));
    line-height: var(--sl-line-height-normal);
    white-space: nowrap;
  }

  .breadcrumb-item__label {
    display: inline-block;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    text-decoration: none;
    color: inherit;
    background: none;
    border: none;
    border-radius: var(--sl-border-radius-medium);
    padding: 0;
    margin: 0;
    cursor: pointer;
    transition: var(--sl-transition-fast) --color;
  }

  :host(:not(:last-of-type)) .breadcrumb-item__label {
    color: rgb(var(--sl-color-primary-600));
  }

  :host(:not(:last-of-type)) .breadcrumb-item__label:hover {
    color: rgb(var(--sl-color-primary-500));
  }

  :host(:not(:last-of-type)) .breadcrumb-item__label:active {
    color: rgb(var(--sl-color-primary-600));
  }

  .breadcrumb-item__label${focusVisibleSelector} {
    outline: none;
    box-shadow: var(--sl-focus-ring);
  }

  .breadcrumb-item__prefix,
  .breadcrumb-item__suffix {
    display: none;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .breadcrumb-item--has-prefix .breadcrumb-item__prefix {
    display: inline-flex;
    margin-right: var(--sl-spacing-x-small);
  }

  .breadcrumb-item--has-suffix .breadcrumb-item__suffix {
    display: inline-flex;
    margin-left: var(--sl-spacing-x-small);
  }

  :host(:last-of-type) .breadcrumb-item__separator {
    display: none;
  }

  .breadcrumb-item__separator {
    display: inline-flex;
    align-items: center;
    margin: 0 var(--sl-spacing-x-small);
    user-select: none;
  }
`;
  var SlBreadcrumbItem = class extends n4 {
    constructor() {
      super(...arguments);
      this.hasPrefix = false;
      this.hasSuffix = false;
      this.rel = "noreferrer noopener";
    }
    handleSlotChange() {
      this.hasPrefix = hasSlot(this, "prefix");
      this.hasSuffix = hasSlot(this, "suffix");
    }
    render() {
      const isLink = this.href ? true : false;
      return y`
      <div
        part="base"
        class=${o5({
        "breadcrumb-item": true,
        "breadcrumb-item--has-prefix": this.hasPrefix,
        "breadcrumb-item--has-suffix": this.hasSuffix
      })}
      >
        <span part="prefix" class="breadcrumb-item__prefix">
          <slot name="prefix" @slotchange=${this.handleSlotChange}></slot>
        </span>

        ${isLink ? y`
              <a
                part="label"
                class="breadcrumb-item__label breadcrumb-item__label--link"
                href="${this.href}"
                target="${this.target}"
                rel=${l4(this.target ? this.rel : void 0)}
              >
                <slot></slot>
              </a>
            ` : y`
              <button part="label" type="button" class="breadcrumb-item__label breadcrumb-item__label--button">
                <slot></slot>
              </button>
            `}

        <span part="suffix" class="breadcrumb-item__suffix">
          <slot name="suffix" @slotchange=${this.handleSlotChange}></slot>
        </span>

        <span part="separator" class="breadcrumb-item__separator" aria-hidden="true">
          <slot name="separator"></slot>
        </span>
      </div>
    `;
    }
  };
  SlBreadcrumbItem.styles = breadcrumb_item_styles_default;
  __decorateClass([
    t3()
  ], SlBreadcrumbItem.prototype, "hasPrefix", 2);
  __decorateClass([
    t3()
  ], SlBreadcrumbItem.prototype, "hasSuffix", 2);
  __decorateClass([
    e4()
  ], SlBreadcrumbItem.prototype, "href", 2);
  __decorateClass([
    e4()
  ], SlBreadcrumbItem.prototype, "target", 2);
  __decorateClass([
    e4()
  ], SlBreadcrumbItem.prototype, "rel", 2);
  SlBreadcrumbItem = __decorateClass([
    n5("sl-breadcrumb-item")
  ], SlBreadcrumbItem);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.LXQRNSEM.js
  var card_styles_default = r`
  ${component_styles_default}

  :host {
    --border-color: rgb(var(--sl-color-neutral-200));
    --border-radius: var(--sl-border-radius-medium);
    --border-width: 1px;
    --padding: var(--sl-spacing-large);

    display: inline-block;
  }

  .card {
    display: flex;
    flex-direction: column;
    background-color: rgb(var(--sl-surface-base-alt));
    box-shadow: var(--sl-shadow-x-small);
    border: solid var(--border-width) var(--border-color);
    border-radius: var(--border-radius);
  }

  .card__image {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
    margin: calc(-1 * var(--border-width));
    overflow: hidden;
  }

  .card__image ::slotted(img) {
    display: block;
    width: 100%;
  }

  .card:not(.card--has-image) .card__image {
    display: none;
  }

  .card__header {
    border-bottom: solid var(--border-width) var(--border-color);
    padding: calc(var(--padding) / 2) var(--padding);
  }

  .card:not(.card--has-header) .card__header {
    display: none;
  }

  .card__body {
    padding: var(--padding);
  }

  .card--has-footer .card__footer {
    border-top: solid var(--border-width) var(--border-color);
    padding: var(--padding);
  }

  .card:not(.card--has-footer) .card__footer {
    display: none;
  }
`;
  var SlCard = class extends n4 {
    constructor() {
      super(...arguments);
      this.hasFooter = false;
      this.hasImage = false;
      this.hasHeader = false;
    }
    handleSlotChange() {
      this.hasFooter = hasSlot(this, "footer");
      this.hasImage = hasSlot(this, "image");
      this.hasHeader = hasSlot(this, "header");
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        card: true,
        "card--has-footer": this.hasFooter,
        "card--has-image": this.hasImage,
        "card--has-header": this.hasHeader
      })}
      >
        <div part="image" class="card__image">
          <slot name="image" @slotchange=${this.handleSlotChange}></slot>
        </div>

        <div part="header" class="card__header">
          <slot name="header" @slotchange=${this.handleSlotChange}></slot>
        </div>

        <div part="body" class="card__body">
          <slot></slot>
        </div>

        <div part="footer" class="card__footer">
          <slot name="footer" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
    }
  };
  SlCard.styles = card_styles_default;
  __decorateClass([
    t3()
  ], SlCard.prototype, "hasFooter", 2);
  __decorateClass([
    t3()
  ], SlCard.prototype, "hasImage", 2);
  __decorateClass([
    t3()
  ], SlCard.prototype, "hasHeader", 2);
  SlCard = __decorateClass([
    n5("sl-card")
  ], SlCard);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.BWSRDZWU.js
  var checkbox_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .checkbox {
    display: inline-flex;
    align-items: center;
    font-family: var(--sl-input-font-family);
    font-size: var(--sl-input-font-size-medium);
    font-weight: var(--sl-input-font-weight);
    color: rgb(var(--sl-input-color));
    vertical-align: middle;
    cursor: pointer;
  }

  .checkbox__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--sl-toggle-size);
    height: var(--sl-toggle-size);
    border: solid var(--sl-input-border-width) rgb(var(--sl-input-border-color));
    border-radius: 2px;
    background-color: rgb(var(--sl-input-background-color));
    color: rgb(var(--sl-color-neutral-0));
    transition: var(--sl-transition-fast) border-color, var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color, var(--sl-transition-fast) box-shadow;
  }

  .checkbox__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  .checkbox__control .checkbox__icon {
    display: inline-flex;
    width: var(--sl-toggle-size);
    height: var(--sl-toggle-size);
  }

  .checkbox__control .checkbox__icon svg {
    width: 100%;
    height: 100%;
  }

  /* Hover */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__control:hover {
    border-color: rgb(var(--sl-input-border-color-hover));
    background-color: rgb(var(--sl-input-background-color-hover));
  }

  /* Focus */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled)
    .checkbox__input${focusVisibleSelector}
    ~ .checkbox__control {
    border-color: rgb(var(--sl-input-border-color-focus));
    background-color: rgb(var(--sl-input-background-color-focus));
    box-shadow: var(--sl-focus-ring);
  }

  /* Checked/indeterminate */
  .checkbox--checked .checkbox__control,
  .checkbox--indeterminate .checkbox__control {
    border-color: rgb(var(--sl-color-primary-600));
    background-color: rgb(var(--sl-color-primary-600));
  }

  /* Checked/indeterminate + hover */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__control:hover,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__control:hover {
    border-color: rgb(var(--sl-color-primary-500));
    background-color: rgb(var(--sl-color-primary-500));
  }

  /* Checked/indeterminate + focus */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__input${focusVisibleSelector} ~ .checkbox__control,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled)
    .checkbox__input${focusVisibleSelector}
    ~ .checkbox__control {
    border-color: rgb(var(--sl-color-primary-500));
    background-color: rgb(var(--sl-color-primary-500));
    box-shadow: var(--sl-focus-ring);
  }

  /* Disabled */
  .checkbox--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkbox__label {
    line-height: var(--sl-toggle-size);
    margin-left: 0.5em;
    user-select: none;
  }
`;
  var id10 = 0;
  var SlCheckbox = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `checkbox-${++id10}`;
      this.labelId = `checkbox-label-${id10}`;
      this.hasFocus = false;
      this.disabled = false;
      this.required = false;
      this.checked = false;
      this.indeterminate = false;
      this.invalid = false;
    }
    firstUpdated() {
      this.invalid = !this.input.checkValidity();
    }
    click() {
      this.input.click();
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    handleClick() {
      this.checked = !this.checked;
      this.indeterminate = false;
      emit(this, "sl-change");
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleStateChange() {
      this.invalid = !this.input.checkValidity();
    }
    render() {
      return y`
      <label
        part="base"
        class=${o5({
        checkbox: true,
        "checkbox--checked": this.checked,
        "checkbox--disabled": this.disabled,
        "checkbox--focused": this.hasFocus,
        "checkbox--indeterminate": this.indeterminate
      })}
        for=${this.inputId}
      >
        <input
          id=${this.inputId}
          class="checkbox__input"
          type="checkbox"
          name=${l4(this.name)}
          value=${l4(this.value)}
          .indeterminate=${l3(this.indeterminate)}
          .checked=${l3(this.checked)}
          .disabled=${this.disabled}
          .required=${this.required}
          role="checkbox"
          aria-checked=${this.checked ? "true" : "false"}
          aria-labelledby=${this.labelId}
          @click=${this.handleClick}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
        />

        <span part="control" class="checkbox__control">
          ${this.checked ? y`
                <span part="checked-icon" class="checkbox__icon">
                  <svg viewBox="0 0 16 16">
                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
                      <g stroke="currentColor" stroke-width="2">
                        <g transform="translate(3.428571, 3.428571)">
                          <path d="M0,5.71428571 L3.42857143,9.14285714"></path>
                          <path d="M9.14285714,0 L3.42857143,9.14285714"></path>
                        </g>
                      </g>
                    </g>
                  </svg>
                </span>
              ` : ""}
          ${!this.checked && this.indeterminate ? y`
                <span part="indeterminate-icon" class="checkbox__icon">
                  <svg viewBox="0 0 16 16">
                    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
                      <g stroke="currentColor" stroke-width="2">
                        <g transform="translate(2.285714, 6.857143)">
                          <path d="M10.2857143,1.14285714 L1.14285714,1.14285714"></path>
                        </g>
                      </g>
                    </g>
                  </svg>
                </span>
              ` : ""}
        </span>

        <span part="label" id=${this.labelId} class="checkbox__label">
          <slot></slot>
        </span>
      </label>
    `;
    }
  };
  SlCheckbox.styles = checkbox_styles_default;
  __decorateClass([
    i23('input[type="checkbox"]')
  ], SlCheckbox.prototype, "input", 2);
  __decorateClass([
    t3()
  ], SlCheckbox.prototype, "hasFocus", 2);
  __decorateClass([
    e4()
  ], SlCheckbox.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlCheckbox.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlCheckbox.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlCheckbox.prototype, "required", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlCheckbox.prototype, "checked", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlCheckbox.prototype, "indeterminate", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlCheckbox.prototype, "invalid", 2);
  __decorateClass([
    watch("disabled")
  ], SlCheckbox.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("checked", { waitUntilFirstUpdate: true }),
    watch("indeterminate", { waitUntilFirstUpdate: true })
  ], SlCheckbox.prototype, "handleStateChange", 1);
  SlCheckbox = __decorateClass([
    n5("sl-checkbox")
  ], SlCheckbox);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.IBWS4CII.js
  var require_color_name = __commonJS({
    "node_modules/color-name/index.js"(exports, module) {
      "use strict";
      module.exports = {
        "aliceblue": [240, 248, 255],
        "antiquewhite": [250, 235, 215],
        "aqua": [0, 255, 255],
        "aquamarine": [127, 255, 212],
        "azure": [240, 255, 255],
        "beige": [245, 245, 220],
        "bisque": [255, 228, 196],
        "black": [0, 0, 0],
        "blanchedalmond": [255, 235, 205],
        "blue": [0, 0, 255],
        "blueviolet": [138, 43, 226],
        "brown": [165, 42, 42],
        "burlywood": [222, 184, 135],
        "cadetblue": [95, 158, 160],
        "chartreuse": [127, 255, 0],
        "chocolate": [210, 105, 30],
        "coral": [255, 127, 80],
        "cornflowerblue": [100, 149, 237],
        "cornsilk": [255, 248, 220],
        "crimson": [220, 20, 60],
        "cyan": [0, 255, 255],
        "darkblue": [0, 0, 139],
        "darkcyan": [0, 139, 139],
        "darkgoldenrod": [184, 134, 11],
        "darkgray": [169, 169, 169],
        "darkgreen": [0, 100, 0],
        "darkgrey": [169, 169, 169],
        "darkkhaki": [189, 183, 107],
        "darkmagenta": [139, 0, 139],
        "darkolivegreen": [85, 107, 47],
        "darkorange": [255, 140, 0],
        "darkorchid": [153, 50, 204],
        "darkred": [139, 0, 0],
        "darksalmon": [233, 150, 122],
        "darkseagreen": [143, 188, 143],
        "darkslateblue": [72, 61, 139],
        "darkslategray": [47, 79, 79],
        "darkslategrey": [47, 79, 79],
        "darkturquoise": [0, 206, 209],
        "darkviolet": [148, 0, 211],
        "deeppink": [255, 20, 147],
        "deepskyblue": [0, 191, 255],
        "dimgray": [105, 105, 105],
        "dimgrey": [105, 105, 105],
        "dodgerblue": [30, 144, 255],
        "firebrick": [178, 34, 34],
        "floralwhite": [255, 250, 240],
        "forestgreen": [34, 139, 34],
        "fuchsia": [255, 0, 255],
        "gainsboro": [220, 220, 220],
        "ghostwhite": [248, 248, 255],
        "gold": [255, 215, 0],
        "goldenrod": [218, 165, 32],
        "gray": [128, 128, 128],
        "green": [0, 128, 0],
        "greenyellow": [173, 255, 47],
        "grey": [128, 128, 128],
        "honeydew": [240, 255, 240],
        "hotpink": [255, 105, 180],
        "indianred": [205, 92, 92],
        "indigo": [75, 0, 130],
        "ivory": [255, 255, 240],
        "khaki": [240, 230, 140],
        "lavender": [230, 230, 250],
        "lavenderblush": [255, 240, 245],
        "lawngreen": [124, 252, 0],
        "lemonchiffon": [255, 250, 205],
        "lightblue": [173, 216, 230],
        "lightcoral": [240, 128, 128],
        "lightcyan": [224, 255, 255],
        "lightgoldenrodyellow": [250, 250, 210],
        "lightgray": [211, 211, 211],
        "lightgreen": [144, 238, 144],
        "lightgrey": [211, 211, 211],
        "lightpink": [255, 182, 193],
        "lightsalmon": [255, 160, 122],
        "lightseagreen": [32, 178, 170],
        "lightskyblue": [135, 206, 250],
        "lightslategray": [119, 136, 153],
        "lightslategrey": [119, 136, 153],
        "lightsteelblue": [176, 196, 222],
        "lightyellow": [255, 255, 224],
        "lime": [0, 255, 0],
        "limegreen": [50, 205, 50],
        "linen": [250, 240, 230],
        "magenta": [255, 0, 255],
        "maroon": [128, 0, 0],
        "mediumaquamarine": [102, 205, 170],
        "mediumblue": [0, 0, 205],
        "mediumorchid": [186, 85, 211],
        "mediumpurple": [147, 112, 219],
        "mediumseagreen": [60, 179, 113],
        "mediumslateblue": [123, 104, 238],
        "mediumspringgreen": [0, 250, 154],
        "mediumturquoise": [72, 209, 204],
        "mediumvioletred": [199, 21, 133],
        "midnightblue": [25, 25, 112],
        "mintcream": [245, 255, 250],
        "mistyrose": [255, 228, 225],
        "moccasin": [255, 228, 181],
        "navajowhite": [255, 222, 173],
        "navy": [0, 0, 128],
        "oldlace": [253, 245, 230],
        "olive": [128, 128, 0],
        "olivedrab": [107, 142, 35],
        "orange": [255, 165, 0],
        "orangered": [255, 69, 0],
        "orchid": [218, 112, 214],
        "palegoldenrod": [238, 232, 170],
        "palegreen": [152, 251, 152],
        "paleturquoise": [175, 238, 238],
        "palevioletred": [219, 112, 147],
        "papayawhip": [255, 239, 213],
        "peachpuff": [255, 218, 185],
        "peru": [205, 133, 63],
        "pink": [255, 192, 203],
        "plum": [221, 160, 221],
        "powderblue": [176, 224, 230],
        "purple": [128, 0, 128],
        "rebeccapurple": [102, 51, 153],
        "red": [255, 0, 0],
        "rosybrown": [188, 143, 143],
        "royalblue": [65, 105, 225],
        "saddlebrown": [139, 69, 19],
        "salmon": [250, 128, 114],
        "sandybrown": [244, 164, 96],
        "seagreen": [46, 139, 87],
        "seashell": [255, 245, 238],
        "sienna": [160, 82, 45],
        "silver": [192, 192, 192],
        "skyblue": [135, 206, 235],
        "slateblue": [106, 90, 205],
        "slategray": [112, 128, 144],
        "slategrey": [112, 128, 144],
        "snow": [255, 250, 250],
        "springgreen": [0, 255, 127],
        "steelblue": [70, 130, 180],
        "tan": [210, 180, 140],
        "teal": [0, 128, 128],
        "thistle": [216, 191, 216],
        "tomato": [255, 99, 71],
        "turquoise": [64, 224, 208],
        "violet": [238, 130, 238],
        "wheat": [245, 222, 179],
        "white": [255, 255, 255],
        "whitesmoke": [245, 245, 245],
        "yellow": [255, 255, 0],
        "yellowgreen": [154, 205, 50]
      };
    }
  });
  var require_is_arrayish = __commonJS({
    "node_modules/is-arrayish/index.js"(exports, module) {
      module.exports = function isArrayish(obj) {
        if (!obj || typeof obj === "string") {
          return false;
        }
        return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && (obj.splice instanceof Function || Object.getOwnPropertyDescriptor(obj, obj.length - 1) && obj.constructor.name !== "String");
      };
    }
  });
  var require_simple_swizzle = __commonJS({
    "node_modules/simple-swizzle/index.js"(exports, module) {
      "use strict";
      var isArrayish = require_is_arrayish();
      var concat = Array.prototype.concat;
      var slice = Array.prototype.slice;
      var swizzle = module.exports = function swizzle2(args) {
        var results = [];
        for (var i32 = 0, len = args.length; i32 < len; i32++) {
          var arg = args[i32];
          if (isArrayish(arg)) {
            results = concat.call(results, slice.call(arg));
          } else {
            results.push(arg);
          }
        }
        return results;
      };
      swizzle.wrap = function(fn2) {
        return function() {
          return fn2(swizzle(arguments));
        };
      };
    }
  });
  var require_color_string = __commonJS({
    "node_modules/color-string/index.js"(exports, module) {
      var colorNames = require_color_name();
      var swizzle = require_simple_swizzle();
      var reverseNames = {};
      for (var name in colorNames) {
        if (colorNames.hasOwnProperty(name)) {
          reverseNames[colorNames[name]] = name;
        }
      }
      var cs = module.exports = {
        to: {},
        get: {}
      };
      cs.get = function(string) {
        var prefix = string.substring(0, 3).toLowerCase();
        var val;
        var model;
        switch (prefix) {
          case "hsl":
            val = cs.get.hsl(string);
            model = "hsl";
            break;
          case "hwb":
            val = cs.get.hwb(string);
            model = "hwb";
            break;
          default:
            val = cs.get.rgb(string);
            model = "rgb";
            break;
        }
        if (!val) {
          return null;
        }
        return { model, value: val };
      };
      cs.get.rgb = function(string) {
        if (!string) {
          return null;
        }
        var abbr = /^#([a-f0-9]{3,4})$/i;
        var hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
        var rgba = /^rgba?\(\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*,\s*([+-]?\d+)\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
        var per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*,\s*([+-]?[\d\.]+)\%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
        var keyword = /(\D+)/;
        var rgb = [0, 0, 0, 1];
        var match;
        var i32;
        var hexAlpha;
        if (match = string.match(hex)) {
          hexAlpha = match[2];
          match = match[1];
          for (i32 = 0; i32 < 3; i32++) {
            var i222 = i32 * 2;
            rgb[i32] = parseInt(match.slice(i222, i222 + 2), 16);
          }
          if (hexAlpha) {
            rgb[3] = parseInt(hexAlpha, 16) / 255;
          }
        } else if (match = string.match(abbr)) {
          match = match[1];
          hexAlpha = match[3];
          for (i32 = 0; i32 < 3; i32++) {
            rgb[i32] = parseInt(match[i32] + match[i32], 16);
          }
          if (hexAlpha) {
            rgb[3] = parseInt(hexAlpha + hexAlpha, 16) / 255;
          }
        } else if (match = string.match(rgba)) {
          for (i32 = 0; i32 < 3; i32++) {
            rgb[i32] = parseInt(match[i32 + 1], 0);
          }
          if (match[4]) {
            rgb[3] = parseFloat(match[4]);
          }
        } else if (match = string.match(per)) {
          for (i32 = 0; i32 < 3; i32++) {
            rgb[i32] = Math.round(parseFloat(match[i32 + 1]) * 2.55);
          }
          if (match[4]) {
            rgb[3] = parseFloat(match[4]);
          }
        } else if (match = string.match(keyword)) {
          if (match[1] === "transparent") {
            return [0, 0, 0, 0];
          }
          rgb = colorNames[match[1]];
          if (!rgb) {
            return null;
          }
          rgb[3] = 1;
          return rgb;
        } else {
          return null;
        }
        for (i32 = 0; i32 < 3; i32++) {
          rgb[i32] = clamp22(rgb[i32], 0, 255);
        }
        rgb[3] = clamp22(rgb[3], 0, 1);
        return rgb;
      };
      cs.get.hsl = function(string) {
        if (!string) {
          return null;
        }
        var hsl = /^hsla?\(\s*([+-]?(?:\d*\.)?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
        var match = string.match(hsl);
        if (match) {
          var alpha = parseFloat(match[4]);
          var h3 = (parseFloat(match[1]) + 360) % 360;
          var s5 = clamp22(parseFloat(match[2]), 0, 100);
          var l32 = clamp22(parseFloat(match[3]), 0, 100);
          var a2 = clamp22(isNaN(alpha) ? 1 : alpha, 0, 1);
          return [h3, s5, l32, a2];
        }
        return null;
      };
      cs.get.hwb = function(string) {
        if (!string) {
          return null;
        }
        var hwb = /^hwb\(\s*([+-]?\d*[\.]?\d+)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?[\d\.]+)\s*)?\)$/;
        var match = string.match(hwb);
        if (match) {
          var alpha = parseFloat(match[4]);
          var h3 = (parseFloat(match[1]) % 360 + 360) % 360;
          var w2 = clamp22(parseFloat(match[2]), 0, 100);
          var b2 = clamp22(parseFloat(match[3]), 0, 100);
          var a2 = clamp22(isNaN(alpha) ? 1 : alpha, 0, 1);
          return [h3, w2, b2, a2];
        }
        return null;
      };
      cs.to.hex = function() {
        var rgba = swizzle(arguments);
        return "#" + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : "");
      };
      cs.to.rgb = function() {
        var rgba = swizzle(arguments);
        return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ")" : "rgba(" + Math.round(rgba[0]) + ", " + Math.round(rgba[1]) + ", " + Math.round(rgba[2]) + ", " + rgba[3] + ")";
      };
      cs.to.rgb.percent = function() {
        var rgba = swizzle(arguments);
        var r22 = Math.round(rgba[0] / 255 * 100);
        var g2 = Math.round(rgba[1] / 255 * 100);
        var b2 = Math.round(rgba[2] / 255 * 100);
        return rgba.length < 4 || rgba[3] === 1 ? "rgb(" + r22 + "%, " + g2 + "%, " + b2 + "%)" : "rgba(" + r22 + "%, " + g2 + "%, " + b2 + "%, " + rgba[3] + ")";
      };
      cs.to.hsl = function() {
        var hsla = swizzle(arguments);
        return hsla.length < 4 || hsla[3] === 1 ? "hsl(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%)" : "hsla(" + hsla[0] + ", " + hsla[1] + "%, " + hsla[2] + "%, " + hsla[3] + ")";
      };
      cs.to.hwb = function() {
        var hwba = swizzle(arguments);
        var a2 = "";
        if (hwba.length >= 4 && hwba[3] !== 1) {
          a2 = ", " + hwba[3];
        }
        return "hwb(" + hwba[0] + ", " + hwba[1] + "%, " + hwba[2] + "%" + a2 + ")";
      };
      cs.to.keyword = function(rgb) {
        return reverseNames[rgb.slice(0, 3)];
      };
      function clamp22(num, min2, max2) {
        return Math.min(Math.max(min2, num), max2);
      }
      function hexDouble(num) {
        var str = num.toString(16).toUpperCase();
        return str.length < 2 ? "0" + str : str;
      }
    }
  });
  var require_conversions = __commonJS({
    "node_modules/color-convert/conversions.js"(exports, module) {
      var cssKeywords = require_color_name();
      var reverseKeywords = {};
      for (var key in cssKeywords) {
        if (cssKeywords.hasOwnProperty(key)) {
          reverseKeywords[cssKeywords[key]] = key;
        }
      }
      var convert = module.exports = {
        rgb: { channels: 3, labels: "rgb" },
        hsl: { channels: 3, labels: "hsl" },
        hsv: { channels: 3, labels: "hsv" },
        hwb: { channels: 3, labels: "hwb" },
        cmyk: { channels: 4, labels: "cmyk" },
        xyz: { channels: 3, labels: "xyz" },
        lab: { channels: 3, labels: "lab" },
        lch: { channels: 3, labels: "lch" },
        hex: { channels: 1, labels: ["hex"] },
        keyword: { channels: 1, labels: ["keyword"] },
        ansi16: { channels: 1, labels: ["ansi16"] },
        ansi256: { channels: 1, labels: ["ansi256"] },
        hcg: { channels: 3, labels: ["h", "c", "g"] },
        apple: { channels: 3, labels: ["r16", "g16", "b16"] },
        gray: { channels: 1, labels: ["gray"] }
      };
      for (var model in convert) {
        if (convert.hasOwnProperty(model)) {
          if (!("channels" in convert[model])) {
            throw new Error("missing channels property: " + model);
          }
          if (!("labels" in convert[model])) {
            throw new Error("missing channel labels property: " + model);
          }
          if (convert[model].labels.length !== convert[model].channels) {
            throw new Error("channel and label counts mismatch: " + model);
          }
          channels = convert[model].channels;
          labels = convert[model].labels;
          delete convert[model].channels;
          delete convert[model].labels;
          Object.defineProperty(convert[model], "channels", { value: channels });
          Object.defineProperty(convert[model], "labels", { value: labels });
        }
      }
      var channels;
      var labels;
      convert.rgb.hsl = function(rgb) {
        var r22 = rgb[0] / 255;
        var g2 = rgb[1] / 255;
        var b2 = rgb[2] / 255;
        var min2 = Math.min(r22, g2, b2);
        var max2 = Math.max(r22, g2, b2);
        var delta = max2 - min2;
        var h3;
        var s5;
        var l32;
        if (max2 === min2) {
          h3 = 0;
        } else if (r22 === max2) {
          h3 = (g2 - b2) / delta;
        } else if (g2 === max2) {
          h3 = 2 + (b2 - r22) / delta;
        } else if (b2 === max2) {
          h3 = 4 + (r22 - g2) / delta;
        }
        h3 = Math.min(h3 * 60, 360);
        if (h3 < 0) {
          h3 += 360;
        }
        l32 = (min2 + max2) / 2;
        if (max2 === min2) {
          s5 = 0;
        } else if (l32 <= 0.5) {
          s5 = delta / (max2 + min2);
        } else {
          s5 = delta / (2 - max2 - min2);
        }
        return [h3, s5 * 100, l32 * 100];
      };
      convert.rgb.hsv = function(rgb) {
        var rdif;
        var gdif;
        var bdif;
        var h3;
        var s5;
        var r22 = rgb[0] / 255;
        var g2 = rgb[1] / 255;
        var b2 = rgb[2] / 255;
        var v2 = Math.max(r22, g2, b2);
        var diff = v2 - Math.min(r22, g2, b2);
        var diffc = function(c2) {
          return (v2 - c2) / 6 / diff + 1 / 2;
        };
        if (diff === 0) {
          h3 = s5 = 0;
        } else {
          s5 = diff / v2;
          rdif = diffc(r22);
          gdif = diffc(g2);
          bdif = diffc(b2);
          if (r22 === v2) {
            h3 = bdif - gdif;
          } else if (g2 === v2) {
            h3 = 1 / 3 + rdif - bdif;
          } else if (b2 === v2) {
            h3 = 2 / 3 + gdif - rdif;
          }
          if (h3 < 0) {
            h3 += 1;
          } else if (h3 > 1) {
            h3 -= 1;
          }
        }
        return [
          h3 * 360,
          s5 * 100,
          v2 * 100
        ];
      };
      convert.rgb.hwb = function(rgb) {
        var r22 = rgb[0];
        var g2 = rgb[1];
        var b2 = rgb[2];
        var h3 = convert.rgb.hsl(rgb)[0];
        var w2 = 1 / 255 * Math.min(r22, Math.min(g2, b2));
        b2 = 1 - 1 / 255 * Math.max(r22, Math.max(g2, b2));
        return [h3, w2 * 100, b2 * 100];
      };
      convert.rgb.cmyk = function(rgb) {
        var r22 = rgb[0] / 255;
        var g2 = rgb[1] / 255;
        var b2 = rgb[2] / 255;
        var c2;
        var m2;
        var y2;
        var k2;
        k2 = Math.min(1 - r22, 1 - g2, 1 - b2);
        c2 = (1 - r22 - k2) / (1 - k2) || 0;
        m2 = (1 - g2 - k2) / (1 - k2) || 0;
        y2 = (1 - b2 - k2) / (1 - k2) || 0;
        return [c2 * 100, m2 * 100, y2 * 100, k2 * 100];
      };
      function comparativeDistance(x2, y2) {
        return Math.pow(x2[0] - y2[0], 2) + Math.pow(x2[1] - y2[1], 2) + Math.pow(x2[2] - y2[2], 2);
      }
      convert.rgb.keyword = function(rgb) {
        var reversed = reverseKeywords[rgb];
        if (reversed) {
          return reversed;
        }
        var currentClosestDistance = Infinity;
        var currentClosestKeyword;
        for (var keyword in cssKeywords) {
          if (cssKeywords.hasOwnProperty(keyword)) {
            var value = cssKeywords[keyword];
            var distance = comparativeDistance(rgb, value);
            if (distance < currentClosestDistance) {
              currentClosestDistance = distance;
              currentClosestKeyword = keyword;
            }
          }
        }
        return currentClosestKeyword;
      };
      convert.keyword.rgb = function(keyword) {
        return cssKeywords[keyword];
      };
      convert.rgb.xyz = function(rgb) {
        var r22 = rgb[0] / 255;
        var g2 = rgb[1] / 255;
        var b2 = rgb[2] / 255;
        r22 = r22 > 0.04045 ? Math.pow((r22 + 0.055) / 1.055, 2.4) : r22 / 12.92;
        g2 = g2 > 0.04045 ? Math.pow((g2 + 0.055) / 1.055, 2.4) : g2 / 12.92;
        b2 = b2 > 0.04045 ? Math.pow((b2 + 0.055) / 1.055, 2.4) : b2 / 12.92;
        var x2 = r22 * 0.4124 + g2 * 0.3576 + b2 * 0.1805;
        var y2 = r22 * 0.2126 + g2 * 0.7152 + b2 * 0.0722;
        var z = r22 * 0.0193 + g2 * 0.1192 + b2 * 0.9505;
        return [x2 * 100, y2 * 100, z * 100];
      };
      convert.rgb.lab = function(rgb) {
        var xyz = convert.rgb.xyz(rgb);
        var x2 = xyz[0];
        var y2 = xyz[1];
        var z = xyz[2];
        var l32;
        var a2;
        var b2;
        x2 /= 95.047;
        y2 /= 100;
        z /= 108.883;
        x2 = x2 > 8856e-6 ? Math.pow(x2, 1 / 3) : 7.787 * x2 + 16 / 116;
        y2 = y2 > 8856e-6 ? Math.pow(y2, 1 / 3) : 7.787 * y2 + 16 / 116;
        z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
        l32 = 116 * y2 - 16;
        a2 = 500 * (x2 - y2);
        b2 = 200 * (y2 - z);
        return [l32, a2, b2];
      };
      convert.hsl.rgb = function(hsl) {
        var h3 = hsl[0] / 360;
        var s5 = hsl[1] / 100;
        var l32 = hsl[2] / 100;
        var t1;
        var t23;
        var t33;
        var rgb;
        var val;
        if (s5 === 0) {
          val = l32 * 255;
          return [val, val, val];
        }
        if (l32 < 0.5) {
          t23 = l32 * (1 + s5);
        } else {
          t23 = l32 + s5 - l32 * s5;
        }
        t1 = 2 * l32 - t23;
        rgb = [0, 0, 0];
        for (var i32 = 0; i32 < 3; i32++) {
          t33 = h3 + 1 / 3 * -(i32 - 1);
          if (t33 < 0) {
            t33++;
          }
          if (t33 > 1) {
            t33--;
          }
          if (6 * t33 < 1) {
            val = t1 + (t23 - t1) * 6 * t33;
          } else if (2 * t33 < 1) {
            val = t23;
          } else if (3 * t33 < 2) {
            val = t1 + (t23 - t1) * (2 / 3 - t33) * 6;
          } else {
            val = t1;
          }
          rgb[i32] = val * 255;
        }
        return rgb;
      };
      convert.hsl.hsv = function(hsl) {
        var h3 = hsl[0];
        var s5 = hsl[1] / 100;
        var l32 = hsl[2] / 100;
        var smin = s5;
        var lmin = Math.max(l32, 0.01);
        var sv;
        var v2;
        l32 *= 2;
        s5 *= l32 <= 1 ? l32 : 2 - l32;
        smin *= lmin <= 1 ? lmin : 2 - lmin;
        v2 = (l32 + s5) / 2;
        sv = l32 === 0 ? 2 * smin / (lmin + smin) : 2 * s5 / (l32 + s5);
        return [h3, sv * 100, v2 * 100];
      };
      convert.hsv.rgb = function(hsv) {
        var h3 = hsv[0] / 60;
        var s5 = hsv[1] / 100;
        var v2 = hsv[2] / 100;
        var hi = Math.floor(h3) % 6;
        var f3 = h3 - Math.floor(h3);
        var p2 = 255 * v2 * (1 - s5);
        var q = 255 * v2 * (1 - s5 * f3);
        var t23 = 255 * v2 * (1 - s5 * (1 - f3));
        v2 *= 255;
        switch (hi) {
          case 0:
            return [v2, t23, p2];
          case 1:
            return [q, v2, p2];
          case 2:
            return [p2, v2, t23];
          case 3:
            return [p2, q, v2];
          case 4:
            return [t23, p2, v2];
          case 5:
            return [v2, p2, q];
        }
      };
      convert.hsv.hsl = function(hsv) {
        var h3 = hsv[0];
        var s5 = hsv[1] / 100;
        var v2 = hsv[2] / 100;
        var vmin = Math.max(v2, 0.01);
        var lmin;
        var sl;
        var l32;
        l32 = (2 - s5) * v2;
        lmin = (2 - s5) * vmin;
        sl = s5 * vmin;
        sl /= lmin <= 1 ? lmin : 2 - lmin;
        sl = sl || 0;
        l32 /= 2;
        return [h3, sl * 100, l32 * 100];
      };
      convert.hwb.rgb = function(hwb) {
        var h3 = hwb[0] / 360;
        var wh = hwb[1] / 100;
        var bl = hwb[2] / 100;
        var ratio = wh + bl;
        var i32;
        var v2;
        var f3;
        var n32;
        if (ratio > 1) {
          wh /= ratio;
          bl /= ratio;
        }
        i32 = Math.floor(6 * h3);
        v2 = 1 - bl;
        f3 = 6 * h3 - i32;
        if ((i32 & 1) !== 0) {
          f3 = 1 - f3;
        }
        n32 = wh + f3 * (v2 - wh);
        var r22;
        var g2;
        var b2;
        switch (i32) {
          default:
          case 6:
          case 0:
            r22 = v2;
            g2 = n32;
            b2 = wh;
            break;
          case 1:
            r22 = n32;
            g2 = v2;
            b2 = wh;
            break;
          case 2:
            r22 = wh;
            g2 = v2;
            b2 = n32;
            break;
          case 3:
            r22 = wh;
            g2 = n32;
            b2 = v2;
            break;
          case 4:
            r22 = n32;
            g2 = wh;
            b2 = v2;
            break;
          case 5:
            r22 = v2;
            g2 = wh;
            b2 = n32;
            break;
        }
        return [r22 * 255, g2 * 255, b2 * 255];
      };
      convert.cmyk.rgb = function(cmyk) {
        var c2 = cmyk[0] / 100;
        var m2 = cmyk[1] / 100;
        var y2 = cmyk[2] / 100;
        var k2 = cmyk[3] / 100;
        var r22;
        var g2;
        var b2;
        r22 = 1 - Math.min(1, c2 * (1 - k2) + k2);
        g2 = 1 - Math.min(1, m2 * (1 - k2) + k2);
        b2 = 1 - Math.min(1, y2 * (1 - k2) + k2);
        return [r22 * 255, g2 * 255, b2 * 255];
      };
      convert.xyz.rgb = function(xyz) {
        var x2 = xyz[0] / 100;
        var y2 = xyz[1] / 100;
        var z = xyz[2] / 100;
        var r22;
        var g2;
        var b2;
        r22 = x2 * 3.2406 + y2 * -1.5372 + z * -0.4986;
        g2 = x2 * -0.9689 + y2 * 1.8758 + z * 0.0415;
        b2 = x2 * 0.0557 + y2 * -0.204 + z * 1.057;
        r22 = r22 > 31308e-7 ? 1.055 * Math.pow(r22, 1 / 2.4) - 0.055 : r22 * 12.92;
        g2 = g2 > 31308e-7 ? 1.055 * Math.pow(g2, 1 / 2.4) - 0.055 : g2 * 12.92;
        b2 = b2 > 31308e-7 ? 1.055 * Math.pow(b2, 1 / 2.4) - 0.055 : b2 * 12.92;
        r22 = Math.min(Math.max(0, r22), 1);
        g2 = Math.min(Math.max(0, g2), 1);
        b2 = Math.min(Math.max(0, b2), 1);
        return [r22 * 255, g2 * 255, b2 * 255];
      };
      convert.xyz.lab = function(xyz) {
        var x2 = xyz[0];
        var y2 = xyz[1];
        var z = xyz[2];
        var l32;
        var a2;
        var b2;
        x2 /= 95.047;
        y2 /= 100;
        z /= 108.883;
        x2 = x2 > 8856e-6 ? Math.pow(x2, 1 / 3) : 7.787 * x2 + 16 / 116;
        y2 = y2 > 8856e-6 ? Math.pow(y2, 1 / 3) : 7.787 * y2 + 16 / 116;
        z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
        l32 = 116 * y2 - 16;
        a2 = 500 * (x2 - y2);
        b2 = 200 * (y2 - z);
        return [l32, a2, b2];
      };
      convert.lab.xyz = function(lab) {
        var l32 = lab[0];
        var a2 = lab[1];
        var b2 = lab[2];
        var x2;
        var y2;
        var z;
        y2 = (l32 + 16) / 116;
        x2 = a2 / 500 + y2;
        z = y2 - b2 / 200;
        var y22 = Math.pow(y2, 3);
        var x22 = Math.pow(x2, 3);
        var z2 = Math.pow(z, 3);
        y2 = y22 > 8856e-6 ? y22 : (y2 - 16 / 116) / 7.787;
        x2 = x22 > 8856e-6 ? x22 : (x2 - 16 / 116) / 7.787;
        z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
        x2 *= 95.047;
        y2 *= 100;
        z *= 108.883;
        return [x2, y2, z];
      };
      convert.lab.lch = function(lab) {
        var l32 = lab[0];
        var a2 = lab[1];
        var b2 = lab[2];
        var hr;
        var h3;
        var c2;
        hr = Math.atan2(b2, a2);
        h3 = hr * 360 / 2 / Math.PI;
        if (h3 < 0) {
          h3 += 360;
        }
        c2 = Math.sqrt(a2 * a2 + b2 * b2);
        return [l32, c2, h3];
      };
      convert.lch.lab = function(lch) {
        var l32 = lch[0];
        var c2 = lch[1];
        var h3 = lch[2];
        var a2;
        var b2;
        var hr;
        hr = h3 / 360 * 2 * Math.PI;
        a2 = c2 * Math.cos(hr);
        b2 = c2 * Math.sin(hr);
        return [l32, a2, b2];
      };
      convert.rgb.ansi16 = function(args) {
        var r22 = args[0];
        var g2 = args[1];
        var b2 = args[2];
        var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2];
        value = Math.round(value / 50);
        if (value === 0) {
          return 30;
        }
        var ansi = 30 + (Math.round(b2 / 255) << 2 | Math.round(g2 / 255) << 1 | Math.round(r22 / 255));
        if (value === 2) {
          ansi += 60;
        }
        return ansi;
      };
      convert.hsv.ansi16 = function(args) {
        return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
      };
      convert.rgb.ansi256 = function(args) {
        var r22 = args[0];
        var g2 = args[1];
        var b2 = args[2];
        if (r22 === g2 && g2 === b2) {
          if (r22 < 8) {
            return 16;
          }
          if (r22 > 248) {
            return 231;
          }
          return Math.round((r22 - 8) / 247 * 24) + 232;
        }
        var ansi = 16 + 36 * Math.round(r22 / 255 * 5) + 6 * Math.round(g2 / 255 * 5) + Math.round(b2 / 255 * 5);
        return ansi;
      };
      convert.ansi16.rgb = function(args) {
        var color2 = args % 10;
        if (color2 === 0 || color2 === 7) {
          if (args > 50) {
            color2 += 3.5;
          }
          color2 = color2 / 10.5 * 255;
          return [color2, color2, color2];
        }
        var mult = (~~(args > 50) + 1) * 0.5;
        var r22 = (color2 & 1) * mult * 255;
        var g2 = (color2 >> 1 & 1) * mult * 255;
        var b2 = (color2 >> 2 & 1) * mult * 255;
        return [r22, g2, b2];
      };
      convert.ansi256.rgb = function(args) {
        if (args >= 232) {
          var c2 = (args - 232) * 10 + 8;
          return [c2, c2, c2];
        }
        args -= 16;
        var rem;
        var r22 = Math.floor(args / 36) / 5 * 255;
        var g2 = Math.floor((rem = args % 36) / 6) / 5 * 255;
        var b2 = rem % 6 / 5 * 255;
        return [r22, g2, b2];
      };
      convert.rgb.hex = function(args) {
        var integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
        var string = integer.toString(16).toUpperCase();
        return "000000".substring(string.length) + string;
      };
      convert.hex.rgb = function(args) {
        var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
        if (!match) {
          return [0, 0, 0];
        }
        var colorString = match[0];
        if (match[0].length === 3) {
          colorString = colorString.split("").map(function(char) {
            return char + char;
          }).join("");
        }
        var integer = parseInt(colorString, 16);
        var r22 = integer >> 16 & 255;
        var g2 = integer >> 8 & 255;
        var b2 = integer & 255;
        return [r22, g2, b2];
      };
      convert.rgb.hcg = function(rgb) {
        var r22 = rgb[0] / 255;
        var g2 = rgb[1] / 255;
        var b2 = rgb[2] / 255;
        var max2 = Math.max(Math.max(r22, g2), b2);
        var min2 = Math.min(Math.min(r22, g2), b2);
        var chroma = max2 - min2;
        var grayscale;
        var hue;
        if (chroma < 1) {
          grayscale = min2 / (1 - chroma);
        } else {
          grayscale = 0;
        }
        if (chroma <= 0) {
          hue = 0;
        } else if (max2 === r22) {
          hue = (g2 - b2) / chroma % 6;
        } else if (max2 === g2) {
          hue = 2 + (b2 - r22) / chroma;
        } else {
          hue = 4 + (r22 - g2) / chroma + 4;
        }
        hue /= 6;
        hue %= 1;
        return [hue * 360, chroma * 100, grayscale * 100];
      };
      convert.hsl.hcg = function(hsl) {
        var s5 = hsl[1] / 100;
        var l32 = hsl[2] / 100;
        var c2 = 1;
        var f3 = 0;
        if (l32 < 0.5) {
          c2 = 2 * s5 * l32;
        } else {
          c2 = 2 * s5 * (1 - l32);
        }
        if (c2 < 1) {
          f3 = (l32 - 0.5 * c2) / (1 - c2);
        }
        return [hsl[0], c2 * 100, f3 * 100];
      };
      convert.hsv.hcg = function(hsv) {
        var s5 = hsv[1] / 100;
        var v2 = hsv[2] / 100;
        var c2 = s5 * v2;
        var f3 = 0;
        if (c2 < 1) {
          f3 = (v2 - c2) / (1 - c2);
        }
        return [hsv[0], c2 * 100, f3 * 100];
      };
      convert.hcg.rgb = function(hcg) {
        var h3 = hcg[0] / 360;
        var c2 = hcg[1] / 100;
        var g2 = hcg[2] / 100;
        if (c2 === 0) {
          return [g2 * 255, g2 * 255, g2 * 255];
        }
        var pure = [0, 0, 0];
        var hi = h3 % 1 * 6;
        var v2 = hi % 1;
        var w2 = 1 - v2;
        var mg = 0;
        switch (Math.floor(hi)) {
          case 0:
            pure[0] = 1;
            pure[1] = v2;
            pure[2] = 0;
            break;
          case 1:
            pure[0] = w2;
            pure[1] = 1;
            pure[2] = 0;
            break;
          case 2:
            pure[0] = 0;
            pure[1] = 1;
            pure[2] = v2;
            break;
          case 3:
            pure[0] = 0;
            pure[1] = w2;
            pure[2] = 1;
            break;
          case 4:
            pure[0] = v2;
            pure[1] = 0;
            pure[2] = 1;
            break;
          default:
            pure[0] = 1;
            pure[1] = 0;
            pure[2] = w2;
        }
        mg = (1 - c2) * g2;
        return [
          (c2 * pure[0] + mg) * 255,
          (c2 * pure[1] + mg) * 255,
          (c2 * pure[2] + mg) * 255
        ];
      };
      convert.hcg.hsv = function(hcg) {
        var c2 = hcg[1] / 100;
        var g2 = hcg[2] / 100;
        var v2 = c2 + g2 * (1 - c2);
        var f3 = 0;
        if (v2 > 0) {
          f3 = c2 / v2;
        }
        return [hcg[0], f3 * 100, v2 * 100];
      };
      convert.hcg.hsl = function(hcg) {
        var c2 = hcg[1] / 100;
        var g2 = hcg[2] / 100;
        var l32 = g2 * (1 - c2) + 0.5 * c2;
        var s5 = 0;
        if (l32 > 0 && l32 < 0.5) {
          s5 = c2 / (2 * l32);
        } else if (l32 >= 0.5 && l32 < 1) {
          s5 = c2 / (2 * (1 - l32));
        }
        return [hcg[0], s5 * 100, l32 * 100];
      };
      convert.hcg.hwb = function(hcg) {
        var c2 = hcg[1] / 100;
        var g2 = hcg[2] / 100;
        var v2 = c2 + g2 * (1 - c2);
        return [hcg[0], (v2 - c2) * 100, (1 - v2) * 100];
      };
      convert.hwb.hcg = function(hwb) {
        var w2 = hwb[1] / 100;
        var b2 = hwb[2] / 100;
        var v2 = 1 - b2;
        var c2 = v2 - w2;
        var g2 = 0;
        if (c2 < 1) {
          g2 = (v2 - c2) / (1 - c2);
        }
        return [hwb[0], c2 * 100, g2 * 100];
      };
      convert.apple.rgb = function(apple) {
        return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
      };
      convert.rgb.apple = function(rgb) {
        return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
      };
      convert.gray.rgb = function(args) {
        return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
      };
      convert.gray.hsl = convert.gray.hsv = function(args) {
        return [0, 0, args[0]];
      };
      convert.gray.hwb = function(gray) {
        return [0, 100, gray[0]];
      };
      convert.gray.cmyk = function(gray) {
        return [0, 0, 0, gray[0]];
      };
      convert.gray.lab = function(gray) {
        return [gray[0], 0, 0];
      };
      convert.gray.hex = function(gray) {
        var val = Math.round(gray[0] / 100 * 255) & 255;
        var integer = (val << 16) + (val << 8) + val;
        var string = integer.toString(16).toUpperCase();
        return "000000".substring(string.length) + string;
      };
      convert.rgb.gray = function(rgb) {
        var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
        return [val / 255 * 100];
      };
    }
  });
  var require_route = __commonJS({
    "node_modules/color-convert/route.js"(exports, module) {
      var conversions = require_conversions();
      function buildGraph() {
        var graph = {};
        var models = Object.keys(conversions);
        for (var len = models.length, i32 = 0; i32 < len; i32++) {
          graph[models[i32]] = {
            distance: -1,
            parent: null
          };
        }
        return graph;
      }
      function deriveBFS(fromModel) {
        var graph = buildGraph();
        var queue = [fromModel];
        graph[fromModel].distance = 0;
        while (queue.length) {
          var current = queue.pop();
          var adjacents = Object.keys(conversions[current]);
          for (var len = adjacents.length, i32 = 0; i32 < len; i32++) {
            var adjacent = adjacents[i32];
            var node = graph[adjacent];
            if (node.distance === -1) {
              node.distance = graph[current].distance + 1;
              node.parent = current;
              queue.unshift(adjacent);
            }
          }
        }
        return graph;
      }
      function link(from, to) {
        return function(args) {
          return to(from(args));
        };
      }
      function wrapConversion(toModel, graph) {
        var path = [graph[toModel].parent, toModel];
        var fn2 = conversions[graph[toModel].parent][toModel];
        var cur = graph[toModel].parent;
        while (graph[cur].parent) {
          path.unshift(graph[cur].parent);
          fn2 = link(conversions[graph[cur].parent][cur], fn2);
          cur = graph[cur].parent;
        }
        fn2.conversion = path;
        return fn2;
      }
      module.exports = function(fromModel) {
        var graph = deriveBFS(fromModel);
        var conversion = {};
        var models = Object.keys(graph);
        for (var len = models.length, i32 = 0; i32 < len; i32++) {
          var toModel = models[i32];
          var node = graph[toModel];
          if (node.parent === null) {
            continue;
          }
          conversion[toModel] = wrapConversion(toModel, graph);
        }
        return conversion;
      };
    }
  });
  var require_color_convert = __commonJS({
    "node_modules/color-convert/index.js"(exports, module) {
      var conversions = require_conversions();
      var route = require_route();
      var convert = {};
      var models = Object.keys(conversions);
      function wrapRaw(fn2) {
        var wrappedFn = function(args) {
          if (args === void 0 || args === null) {
            return args;
          }
          if (arguments.length > 1) {
            args = Array.prototype.slice.call(arguments);
          }
          return fn2(args);
        };
        if ("conversion" in fn2) {
          wrappedFn.conversion = fn2.conversion;
        }
        return wrappedFn;
      }
      function wrapRounded(fn2) {
        var wrappedFn = function(args) {
          if (args === void 0 || args === null) {
            return args;
          }
          if (arguments.length > 1) {
            args = Array.prototype.slice.call(arguments);
          }
          var result = fn2(args);
          if (typeof result === "object") {
            for (var len = result.length, i32 = 0; i32 < len; i32++) {
              result[i32] = Math.round(result[i32]);
            }
          }
          return result;
        };
        if ("conversion" in fn2) {
          wrappedFn.conversion = fn2.conversion;
        }
        return wrappedFn;
      }
      models.forEach(function(fromModel) {
        convert[fromModel] = {};
        Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
        Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
        var routes = route(fromModel);
        var routeModels = Object.keys(routes);
        routeModels.forEach(function(toModel) {
          var fn2 = routes[toModel];
          convert[fromModel][toModel] = wrapRounded(fn2);
          convert[fromModel][toModel].raw = wrapRaw(fn2);
        });
      });
      module.exports = convert;
    }
  });
  var require_color = __commonJS({
    "node_modules/color/index.js"(exports, module) {
      "use strict";
      var colorString = require_color_string();
      var convert = require_color_convert();
      var _slice = [].slice;
      var skippedModels = [
        "keyword",
        "gray",
        "hex"
      ];
      var hashedModelKeys = {};
      Object.keys(convert).forEach(function(model) {
        hashedModelKeys[_slice.call(convert[model].labels).sort().join("")] = model;
      });
      var limiters = {};
      function Color(obj, model) {
        if (!(this instanceof Color)) {
          return new Color(obj, model);
        }
        if (model && model in skippedModels) {
          model = null;
        }
        if (model && !(model in convert)) {
          throw new Error("Unknown model: " + model);
        }
        var i32;
        var channels;
        if (obj == null) {
          this.model = "rgb";
          this.color = [0, 0, 0];
          this.valpha = 1;
        } else if (obj instanceof Color) {
          this.model = obj.model;
          this.color = obj.color.slice();
          this.valpha = obj.valpha;
        } else if (typeof obj === "string") {
          var result = colorString.get(obj);
          if (result === null) {
            throw new Error("Unable to parse color from string: " + obj);
          }
          this.model = result.model;
          channels = convert[this.model].channels;
          this.color = result.value.slice(0, channels);
          this.valpha = typeof result.value[channels] === "number" ? result.value[channels] : 1;
        } else if (obj.length) {
          this.model = model || "rgb";
          channels = convert[this.model].channels;
          var newArr = _slice.call(obj, 0, channels);
          this.color = zeroArray(newArr, channels);
          this.valpha = typeof obj[channels] === "number" ? obj[channels] : 1;
        } else if (typeof obj === "number") {
          obj &= 16777215;
          this.model = "rgb";
          this.color = [
            obj >> 16 & 255,
            obj >> 8 & 255,
            obj & 255
          ];
          this.valpha = 1;
        } else {
          this.valpha = 1;
          var keys = Object.keys(obj);
          if ("alpha" in obj) {
            keys.splice(keys.indexOf("alpha"), 1);
            this.valpha = typeof obj.alpha === "number" ? obj.alpha : 0;
          }
          var hashedKeys = keys.sort().join("");
          if (!(hashedKeys in hashedModelKeys)) {
            throw new Error("Unable to parse color from object: " + JSON.stringify(obj));
          }
          this.model = hashedModelKeys[hashedKeys];
          var labels = convert[this.model].labels;
          var color2 = [];
          for (i32 = 0; i32 < labels.length; i32++) {
            color2.push(obj[labels[i32]]);
          }
          this.color = zeroArray(color2);
        }
        if (limiters[this.model]) {
          channels = convert[this.model].channels;
          for (i32 = 0; i32 < channels; i32++) {
            var limit = limiters[this.model][i32];
            if (limit) {
              this.color[i32] = limit(this.color[i32]);
            }
          }
        }
        this.valpha = Math.max(0, Math.min(1, this.valpha));
        if (Object.freeze) {
          Object.freeze(this);
        }
      }
      Color.prototype = {
        toString: function() {
          return this.string();
        },
        toJSON: function() {
          return this[this.model]();
        },
        string: function(places) {
          var self2 = this.model in colorString.to ? this : this.rgb();
          self2 = self2.round(typeof places === "number" ? places : 1);
          var args = self2.valpha === 1 ? self2.color : self2.color.concat(this.valpha);
          return colorString.to[self2.model](args);
        },
        percentString: function(places) {
          var self2 = this.rgb().round(typeof places === "number" ? places : 1);
          var args = self2.valpha === 1 ? self2.color : self2.color.concat(this.valpha);
          return colorString.to.rgb.percent(args);
        },
        array: function() {
          return this.valpha === 1 ? this.color.slice() : this.color.concat(this.valpha);
        },
        object: function() {
          var result = {};
          var channels = convert[this.model].channels;
          var labels = convert[this.model].labels;
          for (var i32 = 0; i32 < channels; i32++) {
            result[labels[i32]] = this.color[i32];
          }
          if (this.valpha !== 1) {
            result.alpha = this.valpha;
          }
          return result;
        },
        unitArray: function() {
          var rgb = this.rgb().color;
          rgb[0] /= 255;
          rgb[1] /= 255;
          rgb[2] /= 255;
          if (this.valpha !== 1) {
            rgb.push(this.valpha);
          }
          return rgb;
        },
        unitObject: function() {
          var rgb = this.rgb().object();
          rgb.r /= 255;
          rgb.g /= 255;
          rgb.b /= 255;
          if (this.valpha !== 1) {
            rgb.alpha = this.valpha;
          }
          return rgb;
        },
        round: function(places) {
          places = Math.max(places || 0, 0);
          return new Color(this.color.map(roundToPlace(places)).concat(this.valpha), this.model);
        },
        alpha: function(val) {
          if (arguments.length) {
            return new Color(this.color.concat(Math.max(0, Math.min(1, val))), this.model);
          }
          return this.valpha;
        },
        red: getset("rgb", 0, maxfn(255)),
        green: getset("rgb", 1, maxfn(255)),
        blue: getset("rgb", 2, maxfn(255)),
        hue: getset(["hsl", "hsv", "hsl", "hwb", "hcg"], 0, function(val) {
          return (val % 360 + 360) % 360;
        }),
        saturationl: getset("hsl", 1, maxfn(100)),
        lightness: getset("hsl", 2, maxfn(100)),
        saturationv: getset("hsv", 1, maxfn(100)),
        value: getset("hsv", 2, maxfn(100)),
        chroma: getset("hcg", 1, maxfn(100)),
        gray: getset("hcg", 2, maxfn(100)),
        white: getset("hwb", 1, maxfn(100)),
        wblack: getset("hwb", 2, maxfn(100)),
        cyan: getset("cmyk", 0, maxfn(100)),
        magenta: getset("cmyk", 1, maxfn(100)),
        yellow: getset("cmyk", 2, maxfn(100)),
        black: getset("cmyk", 3, maxfn(100)),
        x: getset("xyz", 0, maxfn(100)),
        y: getset("xyz", 1, maxfn(100)),
        z: getset("xyz", 2, maxfn(100)),
        l: getset("lab", 0, maxfn(100)),
        a: getset("lab", 1),
        b: getset("lab", 2),
        keyword: function(val) {
          if (arguments.length) {
            return new Color(val);
          }
          return convert[this.model].keyword(this.color);
        },
        hex: function(val) {
          if (arguments.length) {
            return new Color(val);
          }
          return colorString.to.hex(this.rgb().round().color);
        },
        rgbNumber: function() {
          var rgb = this.rgb().color;
          return (rgb[0] & 255) << 16 | (rgb[1] & 255) << 8 | rgb[2] & 255;
        },
        luminosity: function() {
          var rgb = this.rgb().color;
          var lum = [];
          for (var i32 = 0; i32 < rgb.length; i32++) {
            var chan = rgb[i32] / 255;
            lum[i32] = chan <= 0.03928 ? chan / 12.92 : Math.pow((chan + 0.055) / 1.055, 2.4);
          }
          return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
        },
        contrast: function(color2) {
          var lum1 = this.luminosity();
          var lum2 = color2.luminosity();
          if (lum1 > lum2) {
            return (lum1 + 0.05) / (lum2 + 0.05);
          }
          return (lum2 + 0.05) / (lum1 + 0.05);
        },
        level: function(color2) {
          var contrastRatio = this.contrast(color2);
          if (contrastRatio >= 7.1) {
            return "AAA";
          }
          return contrastRatio >= 4.5 ? "AA" : "";
        },
        isDark: function() {
          var rgb = this.rgb().color;
          var yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1e3;
          return yiq < 128;
        },
        isLight: function() {
          return !this.isDark();
        },
        negate: function() {
          var rgb = this.rgb();
          for (var i32 = 0; i32 < 3; i32++) {
            rgb.color[i32] = 255 - rgb.color[i32];
          }
          return rgb;
        },
        lighten: function(ratio) {
          var hsl = this.hsl();
          hsl.color[2] += hsl.color[2] * ratio;
          return hsl;
        },
        darken: function(ratio) {
          var hsl = this.hsl();
          hsl.color[2] -= hsl.color[2] * ratio;
          return hsl;
        },
        saturate: function(ratio) {
          var hsl = this.hsl();
          hsl.color[1] += hsl.color[1] * ratio;
          return hsl;
        },
        desaturate: function(ratio) {
          var hsl = this.hsl();
          hsl.color[1] -= hsl.color[1] * ratio;
          return hsl;
        },
        whiten: function(ratio) {
          var hwb = this.hwb();
          hwb.color[1] += hwb.color[1] * ratio;
          return hwb;
        },
        blacken: function(ratio) {
          var hwb = this.hwb();
          hwb.color[2] += hwb.color[2] * ratio;
          return hwb;
        },
        grayscale: function() {
          var rgb = this.rgb().color;
          var val = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
          return Color.rgb(val, val, val);
        },
        fade: function(ratio) {
          return this.alpha(this.valpha - this.valpha * ratio);
        },
        opaquer: function(ratio) {
          return this.alpha(this.valpha + this.valpha * ratio);
        },
        rotate: function(degrees) {
          var hsl = this.hsl();
          var hue = hsl.color[0];
          hue = (hue + degrees) % 360;
          hue = hue < 0 ? 360 + hue : hue;
          hsl.color[0] = hue;
          return hsl;
        },
        mix: function(mixinColor, weight) {
          if (!mixinColor || !mixinColor.rgb) {
            throw new Error('Argument to "mix" was not a Color instance, but rather an instance of ' + typeof mixinColor);
          }
          var color1 = mixinColor.rgb();
          var color2 = this.rgb();
          var p2 = weight === void 0 ? 0.5 : weight;
          var w2 = 2 * p2 - 1;
          var a2 = color1.alpha() - color2.alpha();
          var w1 = ((w2 * a2 === -1 ? w2 : (w2 + a2) / (1 + w2 * a2)) + 1) / 2;
          var w22 = 1 - w1;
          return Color.rgb(w1 * color1.red() + w22 * color2.red(), w1 * color1.green() + w22 * color2.green(), w1 * color1.blue() + w22 * color2.blue(), color1.alpha() * p2 + color2.alpha() * (1 - p2));
        }
      };
      Object.keys(convert).forEach(function(model) {
        if (skippedModels.indexOf(model) !== -1) {
          return;
        }
        var channels = convert[model].channels;
        Color.prototype[model] = function() {
          if (this.model === model) {
            return new Color(this);
          }
          if (arguments.length) {
            return new Color(arguments, model);
          }
          var newAlpha = typeof arguments[channels] === "number" ? channels : this.valpha;
          return new Color(assertArray(convert[this.model][model].raw(this.color)).concat(newAlpha), model);
        };
        Color[model] = function(color2) {
          if (typeof color2 === "number") {
            color2 = zeroArray(_slice.call(arguments), channels);
          }
          return new Color(color2, model);
        };
      });
      function roundTo(num, places) {
        return Number(num.toFixed(places));
      }
      function roundToPlace(places) {
        return function(num) {
          return roundTo(num, places);
        };
      }
      function getset(model, channel, modifier) {
        model = Array.isArray(model) ? model : [model];
        model.forEach(function(m2) {
          (limiters[m2] || (limiters[m2] = []))[channel] = modifier;
        });
        model = model[0];
        return function(val) {
          var result;
          if (arguments.length) {
            if (modifier) {
              val = modifier(val);
            }
            result = this[model]();
            result.color[channel] = val;
            return result;
          }
          result = this[model]().color[channel];
          if (modifier) {
            result = modifier(result);
          }
          return result;
        };
      }
      function maxfn(max2) {
        return function(v2) {
          return Math.max(0, Math.min(max2, v2));
        };
      }
      function assertArray(val) {
        return Array.isArray(val) ? val : [val];
      }
      function zeroArray(arr, length) {
        for (var i32 = 0; i32 < length; i32++) {
          if (typeof arr[i32] !== "number") {
            arr[i32] = 0;
          }
        }
        return arr;
      }
      module.exports = Color;
    }
  });
  var import_color = __toModule(require_color());
  var color_picker_styles_default = r`
  ${component_styles_default}

  :host {
    --grid-width: 280px;
    --grid-height: 200px;
    --grid-handle-size: 16px;
    --slider-height: 15px;
    --slider-handle-size: 17px;
    --swatch-size: 25px;

    display: inline-block;
  }

  .color-picker {
    width: var(--grid-width);
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    color: var(--color);
    background-color: rgb(var(--sl-panel-background-color));
    border-radius: var(--sl-border-radius-medium);
    user-select: none;
  }

  .color-picker--inline {
    border: solid var(--sl-panel-border-width) rgb(var(--sl-panel-border-color));
  }

  .color-picker__grid {
    position: relative;
    height: var(--grid-height);
    background-image: linear-gradient(
        to bottom,
        hsl(0, 0%, 100%) 0%,
        hsla(0, 0%, 100%, 0) 50%,
        hsla(0, 0%, 0%, 0) 50%,
        hsl(0, 0%, 0%) 100%
      ),
      linear-gradient(to right, hsl(0, 0%, 50%) 0%, hsla(0, 0%, 50%, 0) 100%);
    border-top-left-radius: var(--sl-border-radius-medium);
    border-top-right-radius: var(--sl-border-radius-medium);
    cursor: crosshair;
  }

  .color-picker__grid-handle {
    position: absolute;
    width: var(--grid-handle-size);
    height: var(--grid-handle-size);
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
    border: solid 2px white;
    margin-top: calc(var(--grid-handle-size) / -2);
    margin-left: calc(var(--grid-handle-size) / -2);
  }

  .color-picker__grid-handle${focusVisibleSelector} {
    outline: none;
    box-shadow: 0 0 0 1px rgb(var(--sl-color-primary-500)), var(--sl-focus-ring);
  }

  .color-picker__controls {
    padding: var(--sl-spacing-small);
    display: flex;
    align-items: center;
  }

  .color-picker__sliders {
    flex: 1 1 auto;
  }

  .color-picker__slider {
    position: relative;
    height: var(--slider-height);
    border-radius: var(--sl-border-radius-pill);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  .color-picker__slider:not(:last-of-type) {
    margin-bottom: var(--sl-spacing-small);
  }

  .color-picker__slider-handle {
    position: absolute;
    top: calc(50% - var(--slider-handle-size) / 2);
    width: var(--slider-handle-size);
    height: var(--slider-handle-size);
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
    margin-left: calc(var(--slider-handle-size) / -2);
  }

  .color-picker__slider-handle${focusVisibleSelector} {
    outline: none;
    box-shadow: 0 0 0 1px rgb(var(--sl-color-primary-500)), var(--sl-focus-ring);
  }

  .color-picker__hue {
    background-image: linear-gradient(
      to right,
      rgb(255, 0, 0) 0%,
      rgb(255, 255, 0) 17%,
      rgb(0, 255, 0) 33%,
      rgb(0, 255, 255) 50%,
      rgb(0, 0, 255) 67%,
      rgb(255, 0, 255) 83%,
      rgb(255, 0, 0) 100%
    );
  }

  .color-picker__alpha .color-picker__alpha-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
  }

  .color-picker__preview {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 3.25rem;
    height: 2.25rem;
    border: none;
    border-radius: var(--sl-input-border-radius-medium);
    background: none;
    margin-left: var(--sl-spacing-small);
    cursor: copy;
  }

  .color-picker__preview:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);

    /* We use a custom property in lieu of currentColor because of https://bugs.webkit.org/show_bug.cgi?id=216780 */
    background-color: var(--preview-color);
  }

  .color-picker__preview${focusVisibleSelector} {
    box-shadow: var(--sl-focus-ring);
    outline: none;
  }

  .color-picker__preview-color {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: solid 1px rgba(0, 0, 0, 0.125);
  }

  .color-picker__preview-color--copied {
    animation: pulse 0.75s;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgb(var(--sl-focus-ring-color));
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  .color-picker__user-input {
    display: flex;
    padding: 0 var(--sl-spacing-small) var(--sl-spacing-small) var(--sl-spacing-small);
  }

  .color-picker__user-input sl-input {
    min-width: 0; /* fix input width in Safari */
    flex: 1 1 auto;
  }

  .color-picker__user-input sl-button-group {
    margin-left: var(--sl-spacing-small);
  }

  .color-picker__user-input sl-button {
    min-width: 3.25rem;
    max-width: 3.25rem;
    font-size: 1rem;
  }

  .color-picker__swatches {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-gap: 0.5rem;
    justify-items: center;
    border-top: solid 1px rgb(var(--sl-color-neutral-200));
    padding: var(--sl-spacing-small);
  }

  .color-picker__swatch {
    position: relative;
    width: var(--swatch-size);
    height: var(--swatch-size);
    border-radius: var(--sl-border-radius-small);
  }

  .color-picker__swatch .color-picker__swatch-color {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: solid 1px rgba(0, 0, 0, 0.125);
    border-radius: inherit;
    cursor: pointer;
  }

  .color-picker__swatch${focusVisibleSelector} {
    outline: none;
    box-shadow: var(--sl-focus-ring);
  }

  .color-picker__transparent-bg {
    background-image: linear-gradient(45deg, rgb(var(--sl-color-neutral-300)) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgb(var(--sl-color-neutral-300)) 75%),
      linear-gradient(45deg, transparent 75%, rgb(var(--sl-color-neutral-300)) 75%),
      linear-gradient(45deg, rgb(var(--sl-color-neutral-300)) 25%, transparent 25%);
    background-size: 10px 10px;
    background-position: 0 0, 0 0, -5px -5px, 5px 5px;
  }

  .color-picker--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .color-picker--disabled .color-picker__grid,
  .color-picker--disabled .color-picker__grid-handle,
  .color-picker--disabled .color-picker__slider,
  .color-picker--disabled .color-picker__slider-handle,
  .color-picker--disabled .color-picker__preview,
  .color-picker--disabled .color-picker__swatch,
  .color-picker--disabled .color-picker__swatch-color {
    pointer-events: none;
  }

  /*
   * Color dropdown
   */

  .color-dropdown::part(panel) {
    max-height: none;
    overflow: visible;
  }

  .color-dropdown__trigger {
    display: inline-block;
    position: relative;
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: var(--sl-transition-fast) box-shadow;
  }

  .color-dropdown__trigger.color-dropdown__trigger--small {
    width: var(--sl-input-height-small);
    height: var(--sl-input-height-small);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger.color-dropdown__trigger--medium {
    width: var(--sl-input-height-medium);
    height: var(--sl-input-height-medium);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger.color-dropdown__trigger--large {
    width: var(--sl-input-height-large);
    height: var(--sl-input-height-large);
    border-radius: var(--sl-border-radius-circle);
  }

  .color-dropdown__trigger:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background-color: currentColor;
    box-shadow: inset 0 0 0 1px rgb(var(--sl-color-neutral-1000) / 25%);
    transition: inherit;
  }

  .color-dropdown__trigger${focusVisibleSelector} {
    outline: none;
  }

  .color-dropdown__trigger${focusVisibleSelector}:not(.color-dropdown__trigger--disabled) {
    box-shadow: var(--sl-focus-ring);
    outline: none;
  }

  .color-dropdown__trigger${focusVisibleSelector}:not(.color-dropdown__trigger--disabled):before {
    box-shadow: inset 0 0 0 1px rgb(var(--sl-color-primary-500));
  }

  .color-dropdown__trigger.color-dropdown__trigger--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
  var hasEyeDropper = "EyeDropper" in window;
  var SlColorPicker = class extends n4 {
    constructor() {
      super(...arguments);
      this.isSafeValue = false;
      this.inputValue = "";
      this.hue = 0;
      this.saturation = 100;
      this.lightness = 100;
      this.alpha = 100;
      this.value = "#ffffff";
      this.format = "hex";
      this.inline = false;
      this.size = "medium";
      this.noFormatToggle = false;
      this.name = "";
      this.disabled = false;
      this.invalid = false;
      this.hoist = false;
      this.opacity = false;
      this.uppercase = false;
      this.swatches = [
        "#d0021b",
        "#f5a623",
        "#f8e71c",
        "#8b572a",
        "#7ed321",
        "#417505",
        "#bd10e0",
        "#9013fe",
        "#4a90e2",
        "#50e3c2",
        "#b8e986",
        "#000",
        "#444",
        "#888",
        "#ccc",
        "#fff"
      ];
    }
    connectedCallback() {
      super.connectedCallback();
      if (!this.setColor(this.value)) {
        this.setColor(`#ffff`);
      }
      this.inputValue = this.value;
      this.lastValueEmitted = this.value;
      this.syncValues();
    }
    getFormattedValue(format = "hex") {
      const currentColor = this.parseColor(`hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha / 100})`);
      if (!currentColor) {
        return "";
      }
      switch (format) {
        case "hex":
          return currentColor.hex;
        case "hexa":
          return currentColor.hexa;
        case "rgb":
          return currentColor.rgb.string;
        case "rgba":
          return currentColor.rgba.string;
        case "hsl":
          return currentColor.hsl.string;
        case "hsla":
          return currentColor.hsla.string;
        default:
          return "";
      }
    }
    reportValidity() {
      if (!this.inline && this.input.invalid) {
        return new Promise((resolve) => {
          this.dropdown.addEventListener("sl-after-show", () => {
            this.input.reportValidity();
            resolve();
          }, { once: true });
          this.dropdown.show();
        });
      } else {
        return this.input.reportValidity();
      }
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = this.input.invalid;
    }
    handleCopy() {
      this.input.select();
      document.execCommand("copy");
      this.previewButton.focus();
      this.previewButton.classList.add("color-picker__preview-color--copied");
      this.previewButton.addEventListener("animationend", () => this.previewButton.classList.remove("color-picker__preview-color--copied"));
    }
    handleFormatToggle() {
      const formats = ["hex", "rgb", "hsl"];
      const nextIndex = (formats.indexOf(this.format) + 1) % formats.length;
      this.format = formats[nextIndex];
    }
    handleAlphaDrag(event) {
      const container = this.shadowRoot.querySelector(".color-picker__slider.color-picker__alpha");
      const handle = container.querySelector(".color-picker__slider-handle");
      const { width } = container.getBoundingClientRect();
      handle.focus();
      event.preventDefault();
      this.handleDrag(event, container, (x2) => {
        this.alpha = clamp2(x2 / width * 100, 0, 100);
        this.syncValues();
      });
    }
    handleHueDrag(event) {
      const container = this.shadowRoot.querySelector(".color-picker__slider.color-picker__hue");
      const handle = container.querySelector(".color-picker__slider-handle");
      const { width } = container.getBoundingClientRect();
      handle.focus();
      event.preventDefault();
      this.handleDrag(event, container, (x2) => {
        this.hue = clamp2(x2 / width * 360, 0, 360);
        this.syncValues();
      });
    }
    handleGridDrag(event) {
      const grid = this.shadowRoot.querySelector(".color-picker__grid");
      const handle = grid.querySelector(".color-picker__grid-handle");
      const { width, height } = grid.getBoundingClientRect();
      handle.focus();
      event.preventDefault();
      this.handleDrag(event, grid, (x2, y2) => {
        this.saturation = clamp2(x2 / width * 100, 0, 100);
        this.lightness = clamp2(100 - y2 / height * 100, 0, 100);
        this.syncValues();
      });
    }
    handleDrag(event, container, onMove) {
      if (this.disabled) {
        return;
      }
      const move = (event2) => {
        const dims = container.getBoundingClientRect();
        const defaultView = container.ownerDocument.defaultView;
        const offsetX = dims.left + defaultView.pageXOffset;
        const offsetY = dims.top + defaultView.pageYOffset;
        const x2 = (event2.changedTouches ? event2.changedTouches[0].pageX : event2.pageX) - offsetX;
        const y2 = (event2.changedTouches ? event2.changedTouches[0].pageY : event2.pageY) - offsetY;
        onMove(x2, y2);
      };
      move(event);
      const stop = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("touchmove", move);
        document.removeEventListener("mouseup", stop);
        document.removeEventListener("touchend", stop);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("touchmove", move);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchend", stop);
    }
    handleAlphaKeyDown(event) {
      const increment = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.alpha = clamp2(this.alpha - increment, 0, 100);
        this.syncValues();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.alpha = clamp2(this.alpha + increment, 0, 100);
        this.syncValues();
      }
      if (event.key === "Home") {
        event.preventDefault();
        this.alpha = 0;
        this.syncValues();
      }
      if (event.key === "End") {
        event.preventDefault();
        this.alpha = 100;
        this.syncValues();
      }
    }
    handleHueKeyDown(event) {
      const increment = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.hue = clamp2(this.hue - increment, 0, 360);
        this.syncValues();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.hue = clamp2(this.hue + increment, 0, 360);
        this.syncValues();
      }
      if (event.key === "Home") {
        event.preventDefault();
        this.hue = 0;
        this.syncValues();
      }
      if (event.key === "End") {
        event.preventDefault();
        this.hue = 360;
        this.syncValues();
      }
    }
    handleGridKeyDown(event) {
      const increment = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.saturation = clamp2(this.saturation - increment, 0, 100);
        this.syncValues();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.saturation = clamp2(this.saturation + increment, 0, 100);
        this.syncValues();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.lightness = clamp2(this.lightness + increment, 0, 100);
        this.syncValues();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.lightness = clamp2(this.lightness - increment, 0, 100);
        this.syncValues();
      }
    }
    handleInputChange(event) {
      const target = event.target;
      this.setColor(target.value);
      target.value = this.value;
      event.stopPropagation();
    }
    handleInputKeyDown(event) {
      if (event.key === "Enter") {
        this.setColor(this.input.value);
        this.input.value = this.value;
        setTimeout(() => this.input.select());
      }
    }
    normalizeColorString(colorString) {
      if (/rgba?/i.test(colorString)) {
        const rgba = colorString.replace(/[^\d.%]/g, " ").split(" ").map((val) => val.trim()).filter((val) => val.length);
        if (rgba.length < 4) {
          rgba[3] = "1";
        }
        if (rgba[3].indexOf("%") > -1) {
          rgba[3] = (Number(rgba[3].replace(/%/g, "")) / 100).toString();
        }
        return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
      }
      if (/hsla?/i.test(colorString)) {
        const hsla = colorString.replace(/[^\d.%]/g, " ").split(" ").map((val) => val.trim()).filter((val) => val.length);
        if (hsla.length < 4) {
          hsla[3] = "1";
        }
        if (hsla[3].indexOf("%") > -1) {
          hsla[3] = (Number(hsla[3].replace(/%/g, "")) / 100).toString();
        }
        return `hsla(${hsla[0]}, ${hsla[1]}, ${hsla[2]}, ${hsla[3]})`;
      }
      if (/^[0-9a-f]+$/i.test(colorString)) {
        return `#${colorString}`;
      }
      return colorString;
    }
    parseColor(colorString) {
      function toHex(value) {
        const hex2 = Math.round(value).toString(16);
        return hex2.length === 1 ? `0${hex2}` : hex2;
      }
      let parsed;
      colorString = this.normalizeColorString(colorString);
      try {
        parsed = (0, import_color.default)(colorString);
      } catch (e24) {
        return false;
      }
      const hsl = {
        h: parsed.hsl().color[0],
        s: parsed.hsl().color[1],
        l: parsed.hsl().color[2],
        a: parsed.hsl().valpha
      };
      const rgb = {
        r: parsed.rgb().color[0],
        g: parsed.rgb().color[1],
        b: parsed.rgb().color[2],
        a: parsed.rgb().valpha
      };
      const hex = {
        r: toHex(parsed.rgb().color[0]),
        g: toHex(parsed.rgb().color[1]),
        b: toHex(parsed.rgb().color[2]),
        a: toHex(parsed.rgb().valpha * 255)
      };
      return {
        hsl: {
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          string: this.setLetterCase(`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`)
        },
        hsla: {
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: hsl.a,
          string: this.setLetterCase(`hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${Number(hsl.a.toFixed(2).toString())})`)
        },
        rgb: {
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          string: this.setLetterCase(`rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`)
        },
        rgba: {
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          a: rgb.a,
          string: this.setLetterCase(`rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${Number(rgb.a.toFixed(2).toString())})`)
        },
        hex: this.setLetterCase(`#${hex.r}${hex.g}${hex.b}`),
        hexa: this.setLetterCase(`#${hex.r}${hex.g}${hex.b}${hex.a}`)
      };
    }
    setColor(colorString) {
      const newColor = this.parseColor(colorString);
      if (!newColor) {
        return false;
      }
      this.hue = newColor.hsla.h;
      this.saturation = newColor.hsla.s;
      this.lightness = newColor.hsla.l;
      this.alpha = this.opacity ? newColor.hsla.a * 100 : 100;
      this.syncValues();
      return true;
    }
    setLetterCase(string) {
      if (typeof string !== "string")
        return "";
      return this.uppercase ? string.toUpperCase() : string.toLowerCase();
    }
    async syncValues() {
      const currentColor = this.parseColor(`hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha / 100})`);
      if (!currentColor) {
        return;
      }
      if (this.format === "hsl") {
        this.inputValue = this.opacity ? currentColor.hsla.string : currentColor.hsl.string;
      } else if (this.format === "rgb") {
        this.inputValue = this.opacity ? currentColor.rgba.string : currentColor.rgb.string;
      } else {
        this.inputValue = this.opacity ? currentColor.hexa : currentColor.hex;
      }
      this.isSafeValue = true;
      this.value = this.inputValue;
      await this.updateComplete;
      this.isSafeValue = false;
    }
    handleAfterHide() {
      this.previewButton.classList.remove("color-picker__preview-color--copied");
    }
    handleEyeDropper() {
      if (!hasEyeDropper) {
        return;
      }
      const eyeDropper = new EyeDropper();
      eyeDropper.open().then((colorSelectionResult) => this.setColor(colorSelectionResult.sRGBHex)).catch(() => {
      });
    }
    handleFormatChange() {
      this.syncValues();
    }
    handleOpacityChange() {
      this.alpha = 100;
    }
    handleValueChange(oldValue, newValue) {
      if (!this.isSafeValue) {
        const newColor = this.parseColor(newValue);
        if (newColor) {
          this.inputValue = this.value;
          this.hue = newColor.hsla.h;
          this.saturation = newColor.hsla.s;
          this.lightness = newColor.hsla.l;
          this.alpha = newColor.hsla.a * 100;
        } else {
          this.inputValue = oldValue;
        }
      }
      if (this.value !== this.lastValueEmitted) {
        emit(this, "sl-change");
        this.lastValueEmitted = this.value;
      }
    }
    render() {
      const x2 = this.saturation;
      const y2 = 100 - this.lightness;
      const colorPicker = y`
      <div
        part="base"
        class=${o5({
        "color-picker": true,
        "color-picker--inline": this.inline,
        "color-picker--disabled": this.disabled
      })}
        aria-disabled=${this.disabled ? "true" : "false"}
      >
        <div
          part="grid"
          class="color-picker__grid"
          style=${i24({ backgroundColor: `hsl(${this.hue}deg, 100%, 50%)` })}
          @mousedown=${this.handleGridDrag}
          @touchstart=${this.handleGridDrag}
        >
          <span
            part="grid-handle"
            class="color-picker__grid-handle"
            style=${i24({
        top: `${y2}%`,
        left: `${x2}%`,
        backgroundColor: `hsla(${this.hue}deg, ${this.saturation}%, ${this.lightness}%)`
      })}
            role="slider"
            aria-label="HSL"
            aria-valuetext=${`hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness)}%)`}
            tabindex=${l4(this.disabled ? void 0 : "0")}
            @keydown=${this.handleGridKeyDown}
          ></span>
        </div>

        <div class="color-picker__controls">
          <div class="color-picker__sliders">
            <div
              part="slider hue-slider"
              class="color-picker__hue color-picker__slider"
              @mousedown=${this.handleHueDrag}
              @touchstart=${this.handleHueDrag}
            >
              <span
                part="slider-handle"
                class="color-picker__slider-handle"
                style=${i24({
        left: `${this.hue === 0 ? 0 : 100 / (360 / this.hue)}%`
      })}
                role="slider"
                aria-label="hue"
                aria-orientation="horizontal"
                aria-valuemin="0"
                aria-valuemax="360"
                aria-valuenow=${Math.round(this.hue)}
                tabindex=${l4(this.disabled ? void 0 : "0")}
                @keydown=${this.handleHueKeyDown}
              ></span>
            </div>

            ${this.opacity ? y`
                  <div
                    part="slider opacity-slider"
                    class="color-picker__alpha color-picker__slider color-picker__transparent-bg"
                    @mousedown="${this.handleAlphaDrag}"
                    @touchstart="${this.handleAlphaDrag}"
                  >
                    <div
                      class="color-picker__alpha-gradient"
                      style=${i24({
        backgroundImage: `linear-gradient(
                          to right,
                          hsl(${this.hue}deg, ${this.saturation}%, ${this.lightness}%, 0%) 0%,
                          hsl(${this.hue}deg, ${this.saturation}%, ${this.lightness}%) 100%
                        )`
      })}
                    ></div>
                    <span
                      part="slider-handle"
                      class="color-picker__slider-handle"
                      style=${i24({
        left: `${this.alpha}%`
      })}
                      role="slider"
                      aria-label="alpha"
                      aria-orientation="horizontal"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow=${Math.round(this.alpha)}
                      tabindex=${l4(this.disabled ? void 0 : "0")}
                      @keydown=${this.handleAlphaKeyDown}
                    ></span>
                  </div>
                ` : ""}
          </div>

          <button
            type="button"
            part="preview"
            class="color-picker__preview color-picker__transparent-bg"
            aria-label="Copy"
            style=${i24({
        "--preview-color": `hsla(${this.hue}deg, ${this.saturation}%, ${this.lightness}%, ${this.alpha / 100})`
      })}
            @click=${this.handleCopy}
          ></button>
        </div>

        <div class="color-picker__user-input">
          <sl-input
            part="input"
            type="text"
            name=${this.name}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            .value=${l3(this.inputValue)}
            ?disabled=${this.disabled}
            @keydown=${this.handleInputKeyDown}
            @sl-change=${this.handleInputChange}
          ></sl-input>

          <sl-button-group>
            ${!this.noFormatToggle ? y`
                  <sl-button
                    aria-label="Change format"
                    exportparts="base:format-button"
                    @click=${this.handleFormatToggle}
                  >
                    ${this.setLetterCase(this.format)}
                  </sl-button>
                ` : ""}
            ${hasEyeDropper ? y`
                  <sl-button exportparts="base:eye-dropper-button" @click=${this.handleEyeDropper}>
                    <sl-icon library="system" name="eyedropper" label="Select a color from the screen"></sl-icon>
                  </sl-button>
                ` : ""}
          </sl-button-group>
        </div>

        ${this.swatches ? y`
              <div part="swatches" class="color-picker__swatches">
                ${this.swatches.map((swatch) => {
        return y`
                    <div
                      part="swatch"
                      class="color-picker__swatch color-picker__transparent-bg"
                      tabindex=${l4(this.disabled ? void 0 : "0")}
                      role="button"
                      aria-label=${swatch}
                      @click=${() => !this.disabled && this.setColor(swatch)}
                      @keydown=${(event) => !this.disabled && event.key === "Enter" && this.setColor(swatch)}
                    >
                      <div class="color-picker__swatch-color" style=${i24({ backgroundColor: swatch })}></div>
                    </div>
                  `;
      })}
              </div>
            ` : ""}
      </div>
    `;
      if (this.inline) {
        return colorPicker;
      }
      return y`
      <sl-dropdown
        class="color-dropdown"
        aria-disabled=${this.disabled ? "true" : "false"}
        .containing-element=${this}
        ?disabled=${this.disabled}
        ?hoist=${this.hoist}
        @sl-after-hide=${this.handleAfterHide}
      >
        <button
          part="trigger"
          slot="trigger"
          class=${o5({
        "color-dropdown__trigger": true,
        "color-dropdown__trigger--disabled": this.disabled,
        "color-dropdown__trigger--small": this.size === "small",
        "color-dropdown__trigger--medium": this.size === "medium",
        "color-dropdown__trigger--large": this.size === "large",
        "color-picker__transparent-bg": true
      })}
          style=${i24({
        color: `hsla(${this.hue}deg, ${this.saturation}%, ${this.lightness}%, ${this.alpha / 100})`
      })}
          type="button"
        ></button>
        ${colorPicker}
      </sl-dropdown>
    `;
    }
  };
  SlColorPicker.styles = color_picker_styles_default;
  __decorateClass([
    i23('[part="input"]')
  ], SlColorPicker.prototype, "input", 2);
  __decorateClass([
    i23('[part="preview"]')
  ], SlColorPicker.prototype, "previewButton", 2);
  __decorateClass([
    i23(".color-dropdown")
  ], SlColorPicker.prototype, "dropdown", 2);
  __decorateClass([
    t3()
  ], SlColorPicker.prototype, "inputValue", 2);
  __decorateClass([
    t3()
  ], SlColorPicker.prototype, "hue", 2);
  __decorateClass([
    t3()
  ], SlColorPicker.prototype, "saturation", 2);
  __decorateClass([
    t3()
  ], SlColorPicker.prototype, "lightness", 2);
  __decorateClass([
    t3()
  ], SlColorPicker.prototype, "alpha", 2);
  __decorateClass([
    e4()
  ], SlColorPicker.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlColorPicker.prototype, "format", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlColorPicker.prototype, "inline", 2);
  __decorateClass([
    e4()
  ], SlColorPicker.prototype, "size", 2);
  __decorateClass([
    e4({ attribute: "no-format-toggle", type: Boolean })
  ], SlColorPicker.prototype, "noFormatToggle", 2);
  __decorateClass([
    e4()
  ], SlColorPicker.prototype, "name", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlColorPicker.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlColorPicker.prototype, "invalid", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlColorPicker.prototype, "hoist", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlColorPicker.prototype, "opacity", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlColorPicker.prototype, "uppercase", 2);
  __decorateClass([
    e4({ attribute: false })
  ], SlColorPicker.prototype, "swatches", 2);
  __decorateClass([
    watch("format")
  ], SlColorPicker.prototype, "handleFormatChange", 1);
  __decorateClass([
    watch("opacity")
  ], SlColorPicker.prototype, "handleOpacityChange", 1);
  __decorateClass([
    watch("value")
  ], SlColorPicker.prototype, "handleValueChange", 1);
  SlColorPicker = __decorateClass([
    n5("sl-color-picker")
  ], SlColorPicker);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.PSLL7PDN.js
  var input_styles_default = r`
  ${component_styles_default}
  ${form_control_styles_default}

  :host {
    display: block;
  }

  .input {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: text;
    transition: var(--sl-transition-fast) color, var(--sl-transition-fast) border, var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  /* Standard inputs */
  .input--standard {
    background-color: rgb(var(--sl-input-background-color));
    border: solid var(--sl-input-border-width) rgb(var(--sl-input-border-color));
  }

  .input--standard:hover:not(.input--disabled) {
    background-color: rgb(var(--sl-input-background-color-hover));
    border-color: rgb(var(--sl-input-border-color-hover));
  }

  .input--standard.input--focused:not(.input--disabled) {
    background-color: rgb(var(--sl-input-background-color-focus));
    border-color: rgb(var(--sl-input-border-color-focus));
    box-shadow: var(--sl-focus-ring);
  }

  .input--standard.input--focused:not(.input--disabled) .input__control {
    color: rgb(var(--sl-input-color-focus));
  }

  .input--standard.input--disabled {
    background-color: rgb(var(--sl-input-background-color-disabled));
    border-color: rgb(var(--sl-input-border-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--standard.input--disabled .input__control {
    color: rgb(var(--sl-input-color-disabled));
  }

  .input--standard.input--disabled .input__control::placeholder {
    color: rgb(var(--sl-input-placeholder-color-disabled));
  }

  /* Filled inputs */
  .input--filled {
    border: none;
    background-color: rgb(var(--sl-input-filled-background-color));
    color: rgb(var(--sl-input-color));
  }

  .input--filled:hover:not(.input--disabled) {
    background-color: rgb(var(--sl-input-filled-background-color-hover));
  }

  .input--filled.input--focused:not(.input--disabled) {
    background-color: rgb(var(--sl-input-filled-background-color-focus));
    box-shadow: var(--sl-focus-ring);
  }

  .input--filled.input--disabled {
    background-color: rgb(var(--sl-input-filled-background-color-disabled));
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input__control {
    flex: 1 1 auto;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    min-width: 0;
    height: 100%;
    color: rgb(var(--sl-input-color));
    border: none;
    background: none;
    box-shadow: none;
    padding: 0;
    margin: 0;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .input__control::-webkit-search-decoration,
  .input__control::-webkit-search-cancel-button,
  .input__control::-webkit-search-results-button,
  .input__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .input__control:-webkit-autofill,
  .input__control:-webkit-autofill:hover,
  .input__control:-webkit-autofill:focus,
  .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) rgb(var(--sl-input-background-color-hover)) inset !important;
    -webkit-text-fill-color: rgb(var(--sl-color-primary-500));
  }

  .input__control::placeholder {
    color: rgb(var(--sl-input-placeholder-color));
    user-select: none;
  }

  .input:hover:not(.input--disabled) .input__control {
    color: rgb(var(--sl-input-color-hover));
  }

  .input__control:focus {
    outline: none;
  }

  .input__prefix,
  .input__suffix {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  .input__prefix ::slotted(sl-icon),
  .input__suffix ::slotted(sl-icon) {
    color: rgb(var(--sl-input-icon-color));
  }

  /*
   * Size modifiers
   */

  .input--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    height: var(--sl-input-height-small);
  }

  .input--small .input__control {
    height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    margin: 0 var(--sl-input-spacing-small);
  }

  .input--small .input__clear,
  .input--small .input__password-toggle {
    margin-right: var(--sl-input-spacing-small);
  }

  .input--small .input__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-small);
  }

  .input--small .input__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-small);
  }

  .input--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    height: var(--sl-input-height-medium);
  }

  .input--medium .input__control {
    height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    margin: 0 var(--sl-input-spacing-medium);
  }

  .input--medium .input__clear,
  .input--medium .input__password-toggle {
    margin-right: var(--sl-input-spacing-medium);
  }

  .input--medium .input__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-medium);
  }

  .input--medium .input__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-medium);
  }

  .input--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    height: var(--sl-input-height-large);
  }

  .input--large .input__control {
    height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    margin: 0 var(--sl-input-spacing-large);
  }

  .input--large .input__clear,
  .input--large .input__password-toggle {
    margin-right: var(--sl-input-spacing-large);
  }

  .input--large .input__prefix ::slotted(*) {
    margin-left: var(--sl-input-spacing-large);
  }

  .input--large .input__suffix ::slotted(*) {
    margin-right: var(--sl-input-spacing-large);
  }

  /*
   * Pill modifier
   */

  .input--pill.input--small {
    border-radius: var(--sl-input-height-small);
  }

  .input--pill.input--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .input--pill.input--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Clearable + Password Toggle
   */

  .input__clear,
  .input__password-toggle {
    display: inline-flex;
    align-items: center;
    font-size: inherit;
    color: rgb(var(--sl-input-icon-color));
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .input__clear:hover,
  .input__password-toggle:hover {
    color: rgb(var(--sl-input-icon-color-hover));
  }

  .input__clear:focus,
  .input__password-toggle:focus {
    outline: none;
  }

  .input--empty .input__clear {
    visibility: hidden;
  }

  /* Don't show the browser's password toggle in Edge */
  ::-ms-reveal {
    display: none;
  }
`;
  var id11 = 0;
  var SlInput = class extends n4 {
    constructor() {
      super(...arguments);
      this.inputId = `input-${++id11}`;
      this.helpTextId = `input-help-text-${id11}`;
      this.labelId = `input-label-${id11}`;
      this.hasFocus = false;
      this.hasHelpTextSlot = false;
      this.hasLabelSlot = false;
      this.isPasswordVisible = false;
      this.type = "text";
      this.size = "medium";
      this.value = "";
      this.filled = false;
      this.pill = false;
      this.helpText = "";
      this.clearable = false;
      this.togglePassword = false;
      this.disabled = false;
      this.readonly = false;
      this.required = false;
      this.invalid = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleSlotChange = this.handleSlotChange.bind(this);
      this.shadowRoot.addEventListener("slotchange", this.handleSlotChange);
    }
    firstUpdated() {
      this.invalid = !this.input.checkValidity();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.shadowRoot.removeEventListener("slotchange", this.handleSlotChange);
    }
    focus(options) {
      this.input.focus(options);
    }
    blur() {
      this.input.blur();
    }
    select() {
      return this.input.select();
    }
    setSelectionRange(selectionStart, selectionEnd, selectionDirection = "none") {
      return this.input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    }
    setRangeText(replacement, start3, end2, selectMode = "preserve") {
      this.input.setRangeText(replacement, start3, end2, selectMode);
      if (this.value !== this.input.value) {
        this.value = this.input.value;
        emit(this, "sl-input");
        emit(this, "sl-change");
      }
    }
    reportValidity() {
      return this.input.reportValidity();
    }
    setCustomValidity(message) {
      this.input.setCustomValidity(message);
      this.invalid = !this.input.checkValidity();
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleChange() {
      this.value = this.input.value;
      emit(this, "sl-change");
    }
    handleClearClick(event) {
      this.value = "";
      emit(this, "sl-clear");
      emit(this, "sl-input");
      emit(this, "sl-change");
      this.input.focus();
      event.stopPropagation();
    }
    handleDisabledChange() {
      if (this.input) {
        this.input.disabled = this.disabled;
        this.invalid = !this.input.checkValidity();
      }
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleInput() {
      this.value = this.input.value;
      emit(this, "sl-input");
    }
    handleInvalid() {
      this.invalid = true;
    }
    handlePasswordToggle() {
      this.isPasswordVisible = !this.isPasswordVisible;
    }
    handleSlotChange() {
      this.hasHelpTextSlot = hasSlot(this, "help-text");
      this.hasLabelSlot = hasSlot(this, "label");
    }
    handleValueChange() {
      if (this.input) {
        this.invalid = !this.input.checkValidity();
      }
    }
    render() {
      var _a, _b;
      return renderFormControl({
        inputId: this.inputId,
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpTextId: this.helpTextId,
        helpText: this.helpText,
        hasHelpTextSlot: this.hasHelpTextSlot,
        size: this.size
      }, y`
        <div
          part="base"
          class=${o5({
        input: true,
        "input--small": this.size === "small",
        "input--medium": this.size === "medium",
        "input--large": this.size === "large",
        "input--pill": this.pill,
        "input--standard": !this.filled,
        "input--filled": this.filled,
        "input--disabled": this.disabled,
        "input--focused": this.hasFocus,
        "input--empty": ((_a = this.value) == null ? void 0 : _a.length) === 0,
        "input--invalid": this.invalid
      })}
        >
          <span part="prefix" class="input__prefix">
            <slot name="prefix"></slot>
          </span>

          <input
            part="input"
            id=${this.inputId}
            class="input__control"
            type=${this.type === "password" && this.isPasswordVisible ? "text" : this.type}
            name=${l4(this.name)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            placeholder=${l4(this.placeholder)}
            minlength=${l4(this.minlength)}
            maxlength=${l4(this.maxlength)}
            min=${l4(this.min)}
            max=${l4(this.max)}
            step=${l4(this.step)}
            .value=${l3(this.value)}
            autocapitalize=${l4(this.autocapitalize)}
            autocomplete=${l4(this.autocomplete)}
            autocorrect=${l4(this.autocorrect)}
            ?autofocus=${this.autofocus}
            spellcheck=${l4(this.spellcheck)}
            pattern=${l4(this.pattern)}
            inputmode=${l4(this.inputmode)}
            aria-labelledby=${l4(getLabelledBy({
        label: this.label,
        labelId: this.labelId,
        hasLabelSlot: this.hasLabelSlot,
        helpText: this.helpText,
        helpTextId: this.helpTextId,
        hasHelpTextSlot: this.hasHelpTextSlot
      }))}
            aria-invalid=${this.invalid ? "true" : "false"}
            @change=${this.handleChange}
            @input=${this.handleInput}
            @invalid=${this.handleInvalid}
            @focus=${this.handleFocus}
            @blur=${this.handleBlur}
          />

          ${this.clearable && ((_b = this.value) == null ? void 0 : _b.length) > 0 ? y`
                <button
                  part="clear-button"
                  class="input__clear"
                  type="button"
                  @click=${this.handleClearClick}
                  tabindex="-1"
                >
                  <slot name="clear-icon">
                    <sl-icon name="x-circle-fill" library="system"></sl-icon>
                  </slot>
                </button>
              ` : ""}
          ${this.togglePassword ? y`
                <button
                  part="password-toggle-button"
                  class="input__password-toggle"
                  type="button"
                  @click=${this.handlePasswordToggle}
                  tabindex="-1"
                >
                  ${this.isPasswordVisible ? y`
                        <slot name="show-password-icon">
                          <sl-icon name="eye-slash" library="system"></sl-icon>
                        </slot>
                      ` : y`
                        <slot name="hide-password-icon">
                          <sl-icon name="eye" library="system"></sl-icon>
                        </slot>
                      `}
                </button>
              ` : ""}

          <span part="suffix" class="input__suffix">
            <slot name="suffix"></slot>
          </span>
        </div>
      `);
    }
  };
  SlInput.styles = input_styles_default;
  __decorateClass([
    i23(".input__control")
  ], SlInput.prototype, "input", 2);
  __decorateClass([
    t3()
  ], SlInput.prototype, "hasFocus", 2);
  __decorateClass([
    t3()
  ], SlInput.prototype, "hasHelpTextSlot", 2);
  __decorateClass([
    t3()
  ], SlInput.prototype, "hasLabelSlot", 2);
  __decorateClass([
    t3()
  ], SlInput.prototype, "isPasswordVisible", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlInput.prototype, "type", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlInput.prototype, "size", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "value", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "filled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "pill", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "label", 2);
  __decorateClass([
    e4({ attribute: "help-text" })
  ], SlInput.prototype, "helpText", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlInput.prototype, "clearable", 2);
  __decorateClass([
    e4({ attribute: "toggle-password", type: Boolean })
  ], SlInput.prototype, "togglePassword", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "placeholder", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "readonly", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlInput.prototype, "minlength", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlInput.prototype, "maxlength", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "min", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "max", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlInput.prototype, "step", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "pattern", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "required", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlInput.prototype, "invalid", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "autocapitalize", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "autocorrect", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "autocomplete", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlInput.prototype, "autofocus", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlInput.prototype, "spellcheck", 2);
  __decorateClass([
    e4()
  ], SlInput.prototype, "inputmode", 2);
  __decorateClass([
    watch("disabled")
  ], SlInput.prototype, "handleDisabledChange", 1);
  __decorateClass([
    watch("helpText"),
    watch("label")
  ], SlInput.prototype, "handleSlotChange", 1);
  __decorateClass([
    watch("value")
  ], SlInput.prototype, "handleValueChange", 1);
  SlInput = __decorateClass([
    n5("sl-input")
  ], SlInput);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.YSAZ2NRU.js
  var dropdown_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .dropdown {
    position: relative;
  }

  .dropdown__trigger {
    display: block;
  }

  .dropdown__positioner {
    position: absolute;
    z-index: var(--sl-z-index-dropdown);
  }

  .dropdown__panel {
    max-height: 75vh;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    color: var(--color);
    background-color: rgb(var(--sl-panel-background-color));
    border: solid var(--sl-panel-border-width) rgb(var(--sl-panel-border-color));
    border-radius: var(--sl-border-radius-medium);
    box-shadow: var(--sl-shadow-large);
    overflow: auto;
    overscroll-behavior: none;
    pointer-events: none;
  }

  .dropdown--open .dropdown__panel {
    pointer-events: all;
  }

  .dropdown__positioner[data-popper-placement^='top'] .dropdown__panel {
    transform-origin: bottom;
  }

  .dropdown__positioner[data-popper-placement^='bottom'] .dropdown__panel {
    transform-origin: top;
  }

  .dropdown__positioner[data-popper-placement^='left'] .dropdown__panel {
    transform-origin: right;
  }

  .dropdown__positioner[data-popper-placement^='right'] .dropdown__panel {
    transform-origin: left;
  }
`;
  var id12 = 0;
  var SlDropdown = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `dropdown-${++id12}`;
      this.open = false;
      this.placement = "bottom-start";
      this.disabled = false;
      this.stayOpenOnSelect = false;
      this.distance = 0;
      this.skidding = 0;
      this.hoist = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleMenuItemActivate = this.handleMenuItemActivate.bind(this);
      this.handlePanelSelect = this.handlePanelSelect.bind(this);
      this.handleDocumentKeyDown = this.handleDocumentKeyDown.bind(this);
      this.handleDocumentMouseDown = this.handleDocumentMouseDown.bind(this);
      if (!this.containingElement) {
        this.containingElement = this;
      }
      this.updateComplete.then(() => {
        this.popover = createPopper(this.trigger, this.positioner, {
          placement: this.placement,
          strategy: this.hoist ? "fixed" : "absolute",
          modifiers: [
            {
              name: "flip",
              options: {
                boundary: "viewport"
              }
            },
            {
              name: "offset",
              options: {
                offset: [this.skidding, this.distance]
              }
            }
          ]
        });
      });
    }
    firstUpdated() {
      this.panel.hidden = !this.open;
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.hide();
      this.popover.destroy();
    }
    focusOnTrigger() {
      const slot = this.trigger.querySelector("slot");
      const trigger = slot.assignedElements({ flatten: true })[0];
      if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
      }
    }
    getMenu() {
      const slot = this.panel.querySelector("slot");
      return slot.assignedElements({ flatten: true }).filter((el) => el.tagName.toLowerCase() === "sl-menu")[0];
    }
    handleDocumentKeyDown(event) {
      var _a;
      if (event.key === "Escape") {
        this.hide();
        this.focusOnTrigger();
        return;
      }
      if (event.key === "Tab") {
        if (this.open && ((_a = document.activeElement) == null ? void 0 : _a.tagName.toLowerCase()) === "sl-menu-item") {
          event.preventDefault();
          this.hide();
          this.focusOnTrigger();
          return;
        }
        setTimeout(() => {
          var _a2, _b;
          const activeElement = this.containingElement.getRootNode() instanceof ShadowRoot ? (_b = (_a2 = document.activeElement) == null ? void 0 : _a2.shadowRoot) == null ? void 0 : _b.activeElement : document.activeElement;
          if ((activeElement == null ? void 0 : activeElement.closest(this.containingElement.tagName.toLowerCase())) !== this.containingElement) {
            this.hide();
            return;
          }
        });
      }
    }
    handleDocumentMouseDown(event) {
      const path = event.composedPath();
      if (!path.includes(this.containingElement)) {
        this.hide();
        return;
      }
    }
    handleMenuItemActivate(event) {
      const item = event.target;
      scrollIntoView(item, this.panel);
    }
    handlePanelSelect(event) {
      const target = event.target;
      if (!this.stayOpenOnSelect && target.tagName.toLowerCase() === "sl-menu") {
        this.hide();
        this.focusOnTrigger();
      }
    }
    handlePopoverOptionsChange() {
      if (this.popover) {
        this.popover.setOptions({
          placement: this.placement,
          strategy: this.hoist ? "fixed" : "absolute",
          modifiers: [
            {
              name: "flip",
              options: {
                boundary: "viewport"
              }
            },
            {
              name: "offset",
              options: {
                offset: [this.skidding, this.distance]
              }
            }
          ]
        });
      }
    }
    handleTriggerClick() {
      this.open ? this.hide() : this.show();
    }
    handleTriggerKeyDown(event) {
      const menu = this.getMenu();
      const menuItems = menu ? [...menu.querySelectorAll("sl-menu-item")] : [];
      const firstMenuItem = menuItems[0];
      const lastMenuItem = menuItems[menuItems.length - 1];
      if (event.key === "Escape") {
        this.focusOnTrigger();
        this.hide();
        return;
      }
      if ([" ", "Enter"].includes(event.key)) {
        event.preventDefault();
        this.open ? this.hide() : this.show();
        return;
      }
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        if (!this.open) {
          this.show();
        }
        if (event.key === "ArrowDown" && firstMenuItem) {
          const menu2 = this.getMenu();
          menu2.setCurrentItem(firstMenuItem);
          firstMenuItem.focus();
          return;
        }
        if (event.key === "ArrowUp" && lastMenuItem) {
          menu.setCurrentItem(lastMenuItem);
          lastMenuItem.focus();
          return;
        }
      }
      const ignoredKeys = ["Tab", "Shift", "Meta", "Ctrl", "Alt"];
      if (this.open && menu && !ignoredKeys.includes(event.key)) {
        menu.typeToSelect(event.key);
        return;
      }
    }
    handleTriggerKeyUp(event) {
      if (event.key === " ") {
        event.preventDefault();
      }
    }
    handleTriggerSlotChange() {
      this.updateAccessibleTrigger();
    }
    updateAccessibleTrigger() {
      if (this.trigger) {
        const slot = this.trigger.querySelector("slot");
        const assignedElements = slot.assignedElements({ flatten: true });
        const accessibleTrigger = assignedElements.find((el) => getTabbableBoundary(el).start);
        if (accessibleTrigger) {
          accessibleTrigger.setAttribute("aria-haspopup", "true");
          accessibleTrigger.setAttribute("aria-expanded", this.open ? "true" : "false");
        }
      }
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    reposition() {
      if (!this.open) {
        return;
      }
      this.popover.update();
    }
    async handleOpenChange() {
      if (this.disabled) {
        return;
      }
      this.updateAccessibleTrigger();
      if (this.open) {
        emit(this, "sl-show");
        this.panel.addEventListener("sl-activate", this.handleMenuItemActivate);
        this.panel.addEventListener("sl-select", this.handlePanelSelect);
        document.addEventListener("keydown", this.handleDocumentKeyDown);
        document.addEventListener("mousedown", this.handleDocumentMouseDown);
        await stopAnimations(this);
        this.popover.update();
        this.panel.hidden = false;
        const { keyframes, options } = getAnimation(this, "dropdown.show");
        await animateTo(this.panel, keyframes, options);
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        this.panel.removeEventListener("sl-activate", this.handleMenuItemActivate);
        this.panel.removeEventListener("sl-select", this.handlePanelSelect);
        document.removeEventListener("keydown", this.handleDocumentKeyDown);
        document.removeEventListener("mousedown", this.handleDocumentMouseDown);
        await stopAnimations(this);
        const { keyframes, options } = getAnimation(this, "dropdown.hide");
        await animateTo(this.panel, keyframes, options);
        this.panel.hidden = true;
        emit(this, "sl-after-hide");
      }
    }
    render() {
      return y`
      <div
        part="base"
        id=${this.componentId}
        class=${o5({
        dropdown: true,
        "dropdown--open": this.open
      })}
      >
        <span
          part="trigger"
          class="dropdown__trigger"
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeyDown}
          @keyup=${this.handleTriggerKeyUp}
        >
          <slot name="trigger" @slotchange=${this.handleTriggerSlotChange}></slot>
        </span>

        <!-- Position the panel with a wrapper since the popover makes use of translate. This let's us add animations
        on the panel without interfering with the position. -->
        <div class="dropdown__positioner">
          <div
            part="panel"
            class="dropdown__panel"
            role="menu"
            aria-hidden=${this.open ? "false" : "true"}
            aria-labelledby=${this.componentId}
          >
            <slot></slot>
          </div>
        </div>
      </div>
    `;
    }
  };
  SlDropdown.styles = dropdown_styles_default;
  __decorateClass([
    i23(".dropdown__trigger")
  ], SlDropdown.prototype, "trigger", 2);
  __decorateClass([
    i23(".dropdown__panel")
  ], SlDropdown.prototype, "panel", 2);
  __decorateClass([
    i23(".dropdown__positioner")
  ], SlDropdown.prototype, "positioner", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDropdown.prototype, "open", 2);
  __decorateClass([
    e4()
  ], SlDropdown.prototype, "placement", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlDropdown.prototype, "disabled", 2);
  __decorateClass([
    e4({ attribute: "stay-open-on-select", type: Boolean, reflect: true })
  ], SlDropdown.prototype, "stayOpenOnSelect", 2);
  __decorateClass([
    e4({ attribute: false })
  ], SlDropdown.prototype, "containingElement", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlDropdown.prototype, "distance", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlDropdown.prototype, "skidding", 2);
  __decorateClass([
    e4({ type: Boolean })
  ], SlDropdown.prototype, "hoist", 2);
  __decorateClass([
    watch("distance"),
    watch("hoist"),
    watch("placement"),
    watch("skidding")
  ], SlDropdown.prototype, "handlePopoverOptionsChange", 1);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlDropdown.prototype, "handleOpenChange", 1);
  SlDropdown = __decorateClass([
    n5("sl-dropdown")
  ], SlDropdown);
  setDefaultAnimation("dropdown.show", {
    keyframes: [
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    options: { duration: 150, easing: "ease" }
  });
  setDefaultAnimation("dropdown.hide", {
    keyframes: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.9)" }
    ],
    options: { duration: 150, easing: "ease" }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ZTLESLPR.js
  var button_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
    width: auto;
    cursor: pointer;
  }

  .button {
    display: inline-flex;
    align-items: stretch;
    justify-content: center;
    width: 100%;
    border-style: solid;
    border-width: var(--sl-input-border-width);
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-font-weight-semibold);
    text-decoration: none;
    user-select: none;
    white-space: nowrap;
    vertical-align: middle;
    padding: 0;
    transition: var(--sl-transition-fast) background-color, var(--sl-transition-fast) color,
      var(--sl-transition-fast) border, var(--sl-transition-fast) box-shadow;
    cursor: inherit;
  }

  .button::-moz-focus-inner {
    border: 0;
  }

  .button:focus {
    outline: none;
  }

  .button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* When disabled, prevent mouse events from bubbling up */
  .button--disabled * {
    pointer-events: none;
  }

  /* Clicks on icons shouldn't prevent the button from gaining focus */
  .button::slotted(sl-icon) {
    pointer-events: none;
  }

  .button__prefix,
  .button__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .button__label ::slotted(sl-icon) {
    vertical-align: -2px;
  }

  /*
   * Standard buttons
   */

  /* Default */
  .button--standard.button--default {
    background-color: rgb(var(--sl-color-neutral-0));
    border-color: rgb(var(--sl-color-neutral-300));
    color: rgb(var(--sl-color-neutral-700));
  }

  .button--standard.button--default:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-50));
    border-color: rgb(var(--sl-color-primary-300));
    color: rgb(var(--sl-color-primary-700));
  }

  .button--standard.button--default${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-50));
    border-color: rgb(var(--sl-color-primary-400));
    color: rgb(var(--sl-color-primary-700));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--default:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-100));
    border-color: rgb(var(--sl-color-primary-400));
    color: rgb(var(--sl-color-primary-700));
  }

  /* Primary */
  .button--standard.button--primary {
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--primary:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--primary${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-500));
    border-color: rgb(var(--sl-color-primary-500));
    color: rgb(var(--sl-color-neutral-0));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--primary:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-600));
    border-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Success */
  .button--standard.button--success {
    background-color: rgb(var(--sl-color-success-600));
    border-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--success:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-success-500));
    border-color: rgb(var(--sl-color-success-500));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--success${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-success-600));
    border-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-neutral-0));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-success-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--success:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-success-600));
    border-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Neutral */
  .button--standard.button--neutral {
    background-color: rgb(var(--sl-color-neutral-600));
    border-color: rgb(var(--sl-color-neutral-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--neutral:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-neutral-500));
    border-color: rgb(var(--sl-color-neutral-500));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--neutral${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-neutral-500));
    border-color: rgb(var(--sl-color-neutral-500));
    color: rgb(var(--sl-color-neutral-0));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-neutral-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--neutral:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-neutral-600));
    border-color: rgb(var(--sl-color-neutral-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Warning */
  .button--standard.button--warning {
    background-color: rgb(var(--sl-color-warning-600));
    border-color: rgb(var(--sl-color-warning-600));
    color: rgb(var(--sl-color-neutral-0));
  }
  .button--standard.button--warning:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-warning-500));
    border-color: rgb(var(--sl-color-warning-500));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--warning${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-warning-500));
    border-color: rgb(var(--sl-color-warning-500));
    color: rgb(var(--sl-color-neutral-0));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-warning-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--warning:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-warning-600));
    border-color: rgb(var(--sl-color-warning-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Danger */
  .button--standard.button--danger {
    background-color: rgb(var(--sl-color-danger-600));
    border-color: rgb(var(--sl-color-danger-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--danger:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-danger-500));
    border-color: rgb(var(--sl-color-danger-500));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--standard.button--danger${focusVisibleSelector}:not(.button--disabled) {
    background-color: rgb(var(--sl-color-danger-500));
    border-color: rgb(var(--sl-color-danger-500));
    color: rgb(var(--sl-color-neutral-0));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-danger-500) / var(--sl-focus-ring-alpha));
  }

  .button--standard.button--danger:active:not(.button--disabled) {
    background-color: rgb(var(--sl-color-danger-600));
    border-color: rgb(var(--sl-color-danger-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /*
   * Outline buttons
   */

  .button--outline {
    background: none;
    border: solid 1px;
  }

  /* Default */
  .button--outline.button--default {
    border-color: rgb(var(--sl-color-neutral-300));
    color: rgb(var(--sl-color-neutral-700));
  }

  .button--outline.button--default:hover:not(.button--disabled) {
    border-color: rgb(var(--sl-color-primary-600));
    background-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--default${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-primary-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--default:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-primary-700));
    background-color: rgb(var(--sl-color-primary-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Primary */
  .button--outline.button--primary {
    border-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-primary-600));
  }

  .button--outline.button--primary:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--primary${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-primary-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--primary:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-primary-700));
    background-color: rgb(var(--sl-color-primary-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Success */
  .button--outline.button--success {
    border-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-success-600));
  }

  .button--outline.button--success:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--success${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-success-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-success-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--success:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-success-700));
    background-color: rgb(var(--sl-color-success-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Neutral */
  .button--outline.button--neutral {
    border-color: rgb(var(--sl-color-neutral-600));
    color: rgb(var(--sl-color-neutral-600));
  }

  .button--outline.button--neutral:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-neutral-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--neutral${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-neutral-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-neutral-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--neutral:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-neutral-700));
    background-color: rgb(var(--sl-color-neutral-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Warning */
  .button--outline.button--warning {
    border-color: rgb(var(--sl-color-warning-600));
    color: rgb(var(--sl-color-warning-600));
  }

  .button--outline.button--warning:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-warning-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--warning${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-warning-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-warning-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--warning:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-warning-700));
    background-color: rgb(var(--sl-color-warning-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Danger */
  .button--outline.button--danger {
    border-color: rgb(var(--sl-color-danger-600));
    color: rgb(var(--sl-color-danger-600));
  }

  .button--outline.button--danger:hover:not(.button--disabled) {
    background-color: rgb(var(--sl-color-danger-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .button--outline.button--danger${focusVisibleSelector}:not(.button--disabled) {
    border-color: rgb(var(--sl-color-danger-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-danger-500) / var(--sl-focus-ring-alpha));
  }

  .button--outline.button--danger:active:not(.button--disabled) {
    border-color: rgb(var(--sl-color-danger-700));
    background-color: rgb(var(--sl-color-danger-700));
    color: rgb(var(--sl-color-neutral-0));
  }

  /*
   * Text buttons
   */

  .button--text {
    background-color: transparent;
    border-color: transparent;
    color: rgb(var(--sl-color-primary-600));
  }

  .button--text:hover:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: rgb(var(--sl-color-primary-500));
  }

  .button--text${focusVisibleSelector}:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: rgb(var(--sl-color-primary-500));
    box-shadow: 0 0 0 var(--sl-focus-ring-width) rgb(var(--sl-color-primary-500) / var(--sl-focus-ring-alpha));
  }

  .button--text:active:not(.button--disabled) {
    background-color: transparent;
    border-color: transparent;
    color: rgb(var(--sl-color-primary-700));
  }

  /*
   * Size modifiers
   */

  .button--small {
    font-size: var(--sl-button-font-size-small);
    height: var(--sl-input-height-small);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
  }

  .button--medium {
    font-size: var(--sl-button-font-size-medium);
    height: var(--sl-input-height-medium);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
  }

  .button--large {
    font-size: var(--sl-button-font-size-large);
    height: var(--sl-input-height-large);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
  }

  /*
   * Pill modifier
   */

  .button--pill.button--small {
    border-radius: var(--sl-input-height-small);
  }

  .button--pill.button--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .button--pill.button--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Circle modifier
   */

  .button--circle {
    padding-left: 0;
    padding-right: 0;
  }

  .button--circle.button--small {
    width: var(--sl-input-height-small);
    border-radius: 50%;
  }

  .button--circle.button--medium {
    width: var(--sl-input-height-medium);
    border-radius: 50%;
  }

  .button--circle.button--large {
    width: var(--sl-input-height-large);
    border-radius: 50%;
  }

  .button--circle .button__prefix,
  .button--circle .button__suffix,
  .button--circle .button__caret {
    display: none;
  }

  /*
   * Caret modifier
   */

  .button--caret .button__suffix {
    display: none;
  }

  .button--caret .button__caret {
    display: flex;
    align-items: center;
  }

  .button--caret .button__caret svg {
    width: 1em;
    height: 1em;
  }

  /*
   * Loading modifier
   */

  .button--loading {
    position: relative;
    cursor: wait;
  }

  .button--loading .button__prefix,
  .button--loading .button__label,
  .button--loading .button__suffix,
  .button--loading .button__caret {
    visibility: hidden;
  }

  .button--loading sl-spinner {
    --indicator-color: currentColor;
    position: absolute;
    font-size: 1em;
    height: 1em;
    width: 1em;
    top: calc(50% - 0.5em);
    left: calc(50% - 0.5em);
  }

  /*
   * Badges
   */

  .button ::slotted(sl-badge) {
    position: absolute;
    top: 0;
    right: 0;
    transform: translateY(-50%) translateX(50%);
    pointer-events: none;
  }

  /*
   * Button spacing
   */

  .button--has-label.button--small .button__label {
    padding: 0 var(--sl-spacing-small);
  }

  .button--has-label.button--medium .button__label {
    padding: 0 var(--sl-spacing-medium);
  }

  .button--has-label.button--large .button__label {
    padding: 0 var(--sl-spacing-large);
  }

  .button--has-prefix.button--small {
    padding-left: var(--sl-spacing-x-small);
  }

  .button--has-prefix.button--small .button__label {
    padding-left: var(--sl-spacing-x-small);
  }

  .button--has-prefix.button--medium {
    padding-left: var(--sl-spacing-small);
  }

  .button--has-prefix.button--medium .button__label {
    padding-left: var(--sl-spacing-small);
  }

  .button--has-prefix.button--large {
    padding-left: var(--sl-spacing-small);
  }

  .button--has-prefix.button--large .button__label {
    padding-left: var(--sl-spacing-small);
  }

  .button--has-suffix.button--small,
  .button--caret.button--small {
    padding-right: var(--sl-spacing-x-small);
  }

  .button--has-suffix.button--small .button__label,
  .button--caret.button--small .button__label {
    padding-right: var(--sl-spacing-x-small);
  }

  .button--has-suffix.button--medium,
  .button--caret.button--medium {
    padding-right: var(--sl-spacing-small);
  }

  .button--has-suffix.button--medium .button__label,
  .button--caret.button--medium .button__label {
    padding-right: var(--sl-spacing-small);
  }

  .button--has-suffix.button--large,
  .button--caret.button--large {
    padding-right: var(--sl-spacing-small);
  }

  .button--has-suffix.button--large .button__label,
  .button--caret.button--large .button__label {
    padding-right: var(--sl-spacing-small);
  }

  /*
   * Button groups support a variety of button types (e.g. buttons with tooltips, buttons as dropdown triggers, etc.).
   * This means buttons aren't always direct descendants of the button group, thus we can't target them with the
   * ::slotted selector. To work around this, the button group component does some magic to add these special classes to
   * buttons and we style them here instead.
   */

  :host(.sl-button-group__button--first:not(.sl-button-group__button--last)) .button {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  :host(.sl-button-group__button--inner) .button {
    border-radius: 0;
  }

  :host(.sl-button-group__button--last:not(.sl-button-group__button--first)) .button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  /* All except the first */
  :host(.sl-button-group__button:not(.sl-button-group__button--first)) {
    margin-left: calc(-1 * var(--sl-input-border-width));
  }

  /* Add a visual separator between solid buttons */
  :host(.sl-button-group__button:not(.sl-button-group__button--focus, .sl-button-group__button--first, [type='default']):not(:hover, :active, :focus))
    .button:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-left: solid 1px rgb(var(--sl-color-neutral-0) / 20%);
  }

  /* Bump focused buttons up so their focus ring isn't clipped */
  :host(.sl-button-group__button--hover) {
    z-index: 1;
  }

  :host(.sl-button-group__button--focus) {
    z-index: 2;
  }
`;
  var SlButton = class extends n4 {
    constructor() {
      super(...arguments);
      this.hasFocus = false;
      this.hasLabel = false;
      this.hasPrefix = false;
      this.hasSuffix = false;
      this.type = "default";
      this.size = "medium";
      this.caret = false;
      this.disabled = false;
      this.loading = false;
      this.outline = false;
      this.pill = false;
      this.circle = false;
      this.submit = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.handleSlotChange();
    }
    click() {
      this.button.click();
    }
    focus(options) {
      this.button.focus(options);
    }
    blur() {
      this.button.blur();
    }
    handleSlotChange() {
      this.hasLabel = hasSlot(this);
      this.hasPrefix = hasSlot(this, "prefix");
      this.hasSuffix = hasSlot(this, "suffix");
    }
    handleBlur() {
      this.hasFocus = false;
      emit(this, "sl-blur");
    }
    handleFocus() {
      this.hasFocus = true;
      emit(this, "sl-focus");
    }
    handleClick(event) {
      if (this.disabled || this.loading) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    render() {
      const isLink = this.href ? true : false;
      const interior = y`
      <span part="prefix" class="button__prefix">
        <slot @slotchange=${this.handleSlotChange} name="prefix"></slot>
      </span>
      <span part="label" class="button__label">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </span>
      <span part="suffix" class="button__suffix">
        <slot @slotchange=${this.handleSlotChange} name="suffix"></slot>
      </span>
      ${this.caret ? y`
            <span part="caret" class="button__caret">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          ` : ""}
      ${this.loading ? y`<sl-spinner></sl-spinner>` : ""}
    `;
      return isLink ? y`
          <a
            part="base"
            class=${o5({
        button: true,
        "button--default": this.type === "default",
        "button--primary": this.type === "primary",
        "button--success": this.type === "success",
        "button--neutral": this.type === "neutral",
        "button--warning": this.type === "warning",
        "button--danger": this.type === "danger",
        "button--text": this.type === "text",
        "button--small": this.size === "small",
        "button--medium": this.size === "medium",
        "button--large": this.size === "large",
        "button--caret": this.caret,
        "button--circle": this.circle,
        "button--disabled": this.disabled,
        "button--focused": this.hasFocus,
        "button--loading": this.loading,
        "button--standard": !this.outline,
        "button--outline": this.outline,
        "button--pill": this.pill,
        "button--has-label": this.hasLabel,
        "button--has-prefix": this.hasPrefix,
        "button--has-suffix": this.hasSuffix
      })}
            href=${l4(this.href)}
            target=${l4(this.target)}
            download=${l4(this.download)}
            rel=${l4(this.target ? "noreferrer noopener" : void 0)}
            role="button"
            aria-disabled=${this.disabled ? "true" : "false"}
            tabindex=${this.disabled ? "-1" : "0"}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
            @click=${this.handleClick}
          >
            ${interior}
          </a>
        ` : y`
          <button
            part="base"
            class=${o5({
        button: true,
        "button--default": this.type === "default",
        "button--primary": this.type === "primary",
        "button--success": this.type === "success",
        "button--neutral": this.type === "neutral",
        "button--warning": this.type === "warning",
        "button--danger": this.type === "danger",
        "button--text": this.type === "text",
        "button--small": this.size === "small",
        "button--medium": this.size === "medium",
        "button--large": this.size === "large",
        "button--caret": this.caret,
        "button--circle": this.circle,
        "button--disabled": this.disabled,
        "button--focused": this.hasFocus,
        "button--loading": this.loading,
        "button--standard": !this.outline,
        "button--outline": this.outline,
        "button--pill": this.pill,
        "button--has-label": this.hasLabel,
        "button--has-prefix": this.hasPrefix,
        "button--has-suffix": this.hasSuffix
      })}
            ?disabled=${this.disabled}
            type=${this.submit ? "submit" : "button"}
            name=${l4(this.name)}
            value=${l4(this.value)}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
            @click=${this.handleClick}
          >
            ${interior}
          </button>
        `;
    }
  };
  SlButton.styles = button_styles_default;
  __decorateClass([
    i23(".button")
  ], SlButton.prototype, "button", 2);
  __decorateClass([
    t3()
  ], SlButton.prototype, "hasFocus", 2);
  __decorateClass([
    t3()
  ], SlButton.prototype, "hasLabel", 2);
  __decorateClass([
    t3()
  ], SlButton.prototype, "hasPrefix", 2);
  __decorateClass([
    t3()
  ], SlButton.prototype, "hasSuffix", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlButton.prototype, "type", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlButton.prototype, "size", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "caret", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "disabled", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "loading", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "outline", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "pill", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "circle", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlButton.prototype, "submit", 2);
  __decorateClass([
    e4()
  ], SlButton.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlButton.prototype, "value", 2);
  __decorateClass([
    e4()
  ], SlButton.prototype, "href", 2);
  __decorateClass([
    e4()
  ], SlButton.prototype, "target", 2);
  __decorateClass([
    e4()
  ], SlButton.prototype, "download", 2);
  SlButton = __decorateClass([
    n5("sl-button")
  ], SlButton);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.4W7IZJQJ.js
  var spinner_styles_default = r`
  ${component_styles_default}

  :host {
    --track-width: 2px;
    --track-color: rgb(var(--sl-color-neutral-500) / 20%);
    --indicator-color: rgb(var(--sl-color-primary-600));
    --speed: 2.5s;

    display: inline-flex;
    width: 1em;
    height: 1em;
  }

  .spinner {
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
  }

  .spinner__track,
  .spinner__indicator {
    fill: none;
    stroke-width: var(--track-width);
    r: calc(0.5em - var(--track-width) / 2);
    cx: 0.5em;
    cy: 0.5em;
    transform-origin: 50% 50%;
  }

  .spinner__track {
    stroke: var(--track-color);
    transform-origin: 0% 0%;
  }

  .spinner__indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    transform-origin: 50% 50%;
    transform: rotate(90deg);
    animation: spin var(--speed) linear infinite;
  }

  @keyframes spin {
    0% {
      stroke-dasharray: 0.2em 3em;
      transform: rotate(0deg);
    }

    50% {
      stroke-dasharray: 2.2em 3em;
      transform: rotate(450deg);
    }

    100% {
      stroke-dasharray: 0.2em 3em;
      transform: rotate(1080deg);
    }
  }
`;
  var SlSpinner = class extends n4 {
    render() {
      return y`
      <svg part="base" class="spinner" aria-busy="true" aria-live="polite">
        <circle class="spinner__track"></circle>
        <circle class="spinner__indicator"></circle>
      </svg>
    `;
    }
  };
  SlSpinner.styles = spinner_styles_default;
  SlSpinner = __decorateClass([
    n5("sl-spinner")
  ], SlSpinner);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.UBBO3XSS.js
  var button_group_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .button-group {
    display: flex;
    flex-wrap: nowrap;
  }
`;
  var SlButtonGroup = class extends n4 {
    constructor() {
      super(...arguments);
      this.label = "";
    }
    handleFocus(event) {
      const button = findButton(event.target);
      button == null ? void 0 : button.classList.add("sl-button-group__button--focus");
    }
    handleBlur(event) {
      const button = findButton(event.target);
      button == null ? void 0 : button.classList.remove("sl-button-group__button--focus");
    }
    handleMouseOver(event) {
      const button = findButton(event.target);
      button == null ? void 0 : button.classList.add("sl-button-group__button--hover");
    }
    handleMouseOut(event) {
      const button = findButton(event.target);
      button == null ? void 0 : button.classList.remove("sl-button-group__button--hover");
    }
    handleSlotChange() {
      const slottedElements = [...this.defaultSlot.assignedElements({ flatten: true })];
      slottedElements.map((el) => {
        const index = slottedElements.indexOf(el);
        const button = findButton(el);
        if (button) {
          button.classList.add("sl-button-group__button");
          button.classList.toggle("sl-button-group__button--first", index === 0);
          button.classList.toggle("sl-button-group__button--inner", index > 0 && index < slottedElements.length - 1);
          button.classList.toggle("sl-button-group__button--last", index === slottedElements.length - 1);
        }
      });
    }
    render() {
      return y`
      <div
        part="base"
        class="button-group"
        role="group"
        aria-label=${this.label}
        @focusout=${this.handleBlur}
        @focusin=${this.handleFocus}
        @mouseover=${this.handleMouseOver}
        @mouseout=${this.handleMouseOut}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
    }
  };
  SlButtonGroup.styles = button_group_styles_default;
  __decorateClass([
    i23("slot")
  ], SlButtonGroup.prototype, "defaultSlot", 2);
  __decorateClass([
    e4()
  ], SlButtonGroup.prototype, "label", 2);
  SlButtonGroup = __decorateClass([
    n5("sl-button-group")
  ], SlButtonGroup);
  function findButton(el) {
    return el.tagName.toLowerCase() === "sl-button" ? el : el.querySelector("sl-button");
  }

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.CHUKLK5E.js
  var details_styles_default = r`
  ${component_styles_default}

  :host {
    display: block;
  }

  .details {
    border: solid 1px rgb(var(--sl-color-neutral-200));
    border-radius: var(--sl-border-radius-medium);
    background-color: rgb(var(--sl-color-neutral-0));
    overflow-anchor: none;
  }

  .details--disabled {
    opacity: 0.5;
  }

  .details__header {
    display: flex;
    align-items: center;
    border-radius: inherit;
    padding: var(--sl-spacing-medium);
    user-select: none;
    cursor: pointer;
  }

  .details__header:focus {
    outline: none;
  }

  .details__header${focusVisibleSelector} {
    box-shadow: var(--sl-focus-ring);
  }

  .details--disabled .details__header {
    cursor: not-allowed;
  }

  .details--disabled .details__header${focusVisibleSelector} {
    outline: none;
    box-shadow: none;
  }

  .details__summary {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
  }

  .details__summary-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    transition: var(--sl-transition-medium) transform ease;
  }

  .details--open .details__summary-icon {
    transform: rotate(90deg);
  }

  .details__body {
    overflow: hidden;
  }

  .details__content {
    padding: var(--sl-spacing-medium);
  }
`;
  var id13 = 0;
  var SlDetails = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `details-${++id13}`;
      this.open = false;
      this.disabled = false;
    }
    firstUpdated() {
      this.body.hidden = !this.open;
      this.body.style.height = this.open ? "auto" : "0";
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    handleSummaryClick() {
      if (!this.disabled) {
        this.open ? this.hide() : this.show();
        this.header.focus();
      }
    }
    handleSummaryKeyDown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.open ? this.hide() : this.show();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        this.hide();
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        this.show();
      }
    }
    async handleOpenChange() {
      if (this.open) {
        emit(this, "sl-show");
        await stopAnimations(this);
        this.body.hidden = false;
        const { keyframes, options } = getAnimation(this, "details.show");
        await animateTo(this.body, shimKeyframesHeightAuto(keyframes, this.body.scrollHeight), options);
        this.body.style.height = "auto";
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        await stopAnimations(this);
        const { keyframes, options } = getAnimation(this, "details.hide");
        await animateTo(this.body, shimKeyframesHeightAuto(keyframes, this.body.scrollHeight), options);
        this.body.hidden = true;
        this.body.style.height = "auto";
        emit(this, "sl-after-hide");
      }
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        details: true,
        "details--open": this.open,
        "details--disabled": this.disabled
      })}
      >
        <header
          part="header"
          id=${`${this.componentId}-header`}
          class="details__header"
          role="button"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${`${this.componentId}-content`}
          aria-disabled=${this.disabled ? "true" : "false"}
          tabindex=${this.disabled ? "-1" : "0"}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <div part="summary" class="details__summary">
            <slot name="summary">${this.summary}</slot>
          </div>

          <span part="summary-icon" class="details__summary-icon">
            <sl-icon name="chevron-right" library="system"></sl-icon>
          </span>
        </header>

        <div class="details__body">
          <div
            part="content"
            id=${`${this.componentId}-content`}
            class="details__content"
            role="region"
            aria-labelledby=${`${this.componentId}-header`}
          >
            <slot></slot>
          </div>
        </div>
      </div>
    `;
    }
  };
  SlDetails.styles = details_styles_default;
  __decorateClass([
    i23(".details")
  ], SlDetails.prototype, "details", 2);
  __decorateClass([
    i23(".details__header")
  ], SlDetails.prototype, "header", 2);
  __decorateClass([
    i23(".details__body")
  ], SlDetails.prototype, "body", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDetails.prototype, "open", 2);
  __decorateClass([
    e4()
  ], SlDetails.prototype, "summary", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDetails.prototype, "disabled", 2);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlDetails.prototype, "handleOpenChange", 1);
  SlDetails = __decorateClass([
    n5("sl-details")
  ], SlDetails);
  setDefaultAnimation("details.show", {
    keyframes: [
      { height: "0", opacity: "0" },
      { height: "auto", opacity: "1" }
    ],
    options: { duration: 250, easing: "linear" }
  });
  setDefaultAnimation("details.hide", {
    keyframes: [
      { height: "auto", opacity: "1" },
      { height: "0", opacity: "0" }
    ],
    options: { duration: 250, easing: "linear" }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.S437OBPC.js
  var dialog_styles_default = r`
  ${component_styles_default}

  :host {
    --width: 31rem;
    --header-spacing: var(--sl-spacing-large);
    --body-spacing: var(--sl-spacing-large);
    --footer-spacing: var(--sl-spacing-large);

    display: contents;
  }

  .dialog {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: var(--sl-z-index-dialog);
  }

  .dialog__panel {
    display: flex;
    flex-direction: column;
    z-index: 2;
    width: var(--width);
    max-width: calc(100% - var(--sl-spacing-2x-large));
    max-height: calc(100% - var(--sl-spacing-2x-large));
    background-color: rgb(var(--sl-panel-background-color));
    border-radius: var(--sl-border-radius-medium);
    box-shadow: var(--sl-shadow-x-large);
  }

  .dialog__panel:focus {
    outline: none;
  }

  /* Ensure there's enough vertical padding for phones that don't update vh when chrome appears (e.g. iPhone) */
  @media screen and (max-width: 420px) {
    .dialog__panel {
      max-height: 80vh;
    }
  }

  .dialog--open .dialog__panel {
    display: flex;
    opacity: 1;
    transform: none;
  }

  .dialog__header {
    flex: 0 0 auto;
    display: flex;
  }

  .dialog__title {
    flex: 1 1 auto;
    font-size: var(--sl-font-size-large);
    line-height: var(--sl-line-height-dense);
    padding: var(--header-spacing);
  }

  .dialog__close {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-x-large);
    padding: 0 var(--header-spacing);
  }

  .dialog__body {
    flex: 1 1 auto;
    padding: var(--body-spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dialog__footer {
    flex: 0 0 auto;
    text-align: right;
    padding: var(--footer-spacing);
  }

  .dialog__footer ::slotted(sl-button:not(:first-of-type)) {
    margin-left: var(--sl-spacing-x-small);
  }

  .dialog:not(.dialog--has-footer) .dialog__footer {
    display: none;
  }

  .dialog__overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgb(var(--sl-overlay-background-color) / var(--sl-overlay-opacity));
  }
`;
  var hasPreventScroll2 = isPreventScrollSupported();
  var id14 = 0;
  var SlDialog = class extends n4 {
    constructor() {
      super(...arguments);
      this.componentId = `dialog-${++id14}`;
      this.hasFooter = false;
      this.open = false;
      this.label = "";
      this.noHeader = false;
    }
    connectedCallback() {
      super.connectedCallback();
      this.modal = new modal_default(this);
      this.handleSlotChange();
    }
    firstUpdated() {
      this.dialog.hidden = !this.open;
      if (this.open) {
        this.modal.activate();
        lockBodyScrolling(this);
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      unlockBodyScrolling(this);
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    requestClose() {
      const slRequestClose = emit(this, "sl-request-close", { cancelable: true });
      if (slRequestClose.defaultPrevented) {
        const animation = getAnimation(this, "dialog.denyClose");
        animateTo(this.panel, animation.keyframes, animation.options);
        return;
      }
      this.hide();
    }
    handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        this.requestClose();
      }
    }
    async handleOpenChange() {
      if (this.open) {
        emit(this, "sl-show");
        this.originalTrigger = document.activeElement;
        this.modal.activate();
        lockBodyScrolling(this);
        await Promise.all([stopAnimations(this.dialog), stopAnimations(this.overlay)]);
        this.dialog.hidden = false;
        if (hasPreventScroll2) {
          const slInitialFocus = emit(this, "sl-initial-focus", { cancelable: true });
          if (!slInitialFocus.defaultPrevented) {
            this.panel.focus({ preventScroll: true });
          }
        }
        const panelAnimation = getAnimation(this, "dialog.show");
        const overlayAnimation = getAnimation(this, "dialog.overlay.show");
        await Promise.all([
          animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options),
          animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options)
        ]);
        if (!hasPreventScroll2) {
          const slInitialFocus = emit(this, "sl-initial-focus", { cancelable: true });
          if (!slInitialFocus.defaultPrevented) {
            this.panel.focus({ preventScroll: true });
          }
        }
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        this.modal.deactivate();
        await Promise.all([stopAnimations(this.dialog), stopAnimations(this.overlay)]);
        const panelAnimation = getAnimation(this, "dialog.hide");
        const overlayAnimation = getAnimation(this, "dialog.overlay.hide");
        await Promise.all([
          animateTo(this.panel, panelAnimation.keyframes, panelAnimation.options),
          animateTo(this.overlay, overlayAnimation.keyframes, overlayAnimation.options)
        ]);
        this.dialog.hidden = true;
        unlockBodyScrolling(this);
        const trigger = this.originalTrigger;
        if (trigger && typeof trigger.focus === "function") {
          setTimeout(() => trigger.focus());
        }
        emit(this, "sl-after-hide");
      }
    }
    handleSlotChange() {
      this.hasFooter = hasSlot(this, "footer");
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        dialog: true,
        "dialog--open": this.open,
        "dialog--has-footer": this.hasFooter
      })}
        @keydown=${this.handleKeyDown}
      >
        <div part="overlay" class="dialog__overlay" @click=${this.requestClose} tabindex="-1"></div>

        <div
          part="panel"
          class="dialog__panel"
          role="dialog"
          aria-modal="true"
          aria-hidden=${this.open ? "false" : "true"}
          aria-label=${l4(this.noHeader ? this.label : void 0)}
          aria-labelledby=${l4(!this.noHeader ? `${this.componentId}-title` : void 0)}
          tabindex="0"
        >
          ${!this.noHeader ? y`
                <header part="header" class="dialog__header">
                  <span part="title" class="dialog__title" id=${`${this.componentId}-title`}>
                    <slot name="label"> ${this.label || String.fromCharCode(65279)} </slot>
                  </span>
                  <sl-icon-button
                    exportparts="base:close-button"
                    class="dialog__close"
                    name="x"
                    library="system"
                    @click="${this.requestClose}"
                  ></sl-icon-button>
                </header>
              ` : ""}

          <div part="body" class="dialog__body">
            <slot></slot>
          </div>

          <footer part="footer" class="dialog__footer">
            <slot name="footer" @slotchange=${this.handleSlotChange}></slot>
          </footer>
        </div>
      </div>
    `;
    }
  };
  SlDialog.styles = dialog_styles_default;
  __decorateClass([
    i23(".dialog")
  ], SlDialog.prototype, "dialog", 2);
  __decorateClass([
    i23(".dialog__panel")
  ], SlDialog.prototype, "panel", 2);
  __decorateClass([
    i23(".dialog__overlay")
  ], SlDialog.prototype, "overlay", 2);
  __decorateClass([
    t3()
  ], SlDialog.prototype, "hasFooter", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlDialog.prototype, "open", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlDialog.prototype, "label", 2);
  __decorateClass([
    e4({ attribute: "no-header", type: Boolean, reflect: true })
  ], SlDialog.prototype, "noHeader", 2);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlDialog.prototype, "handleOpenChange", 1);
  SlDialog = __decorateClass([
    n5("sl-dialog")
  ], SlDialog);
  setDefaultAnimation("dialog.show", {
    keyframes: [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("dialog.hide", {
    keyframes: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.8)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("dialog.denyClose", {
    keyframes: [{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(1)" }],
    options: { duration: 250 }
  });
  setDefaultAnimation("dialog.overlay.show", {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 250 }
  });
  setDefaultAnimation("dialog.overlay.hide", {
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
    options: { duration: 250 }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.MZZ5CQV2.js
  var alert_styles_default = r`
  ${component_styles_default}

  :host {
    display: contents;

    /* For better DX, we'll reset the margin here so the base part can inherit it */
    margin: 0;
  }

  .alert {
    position: relative;
    display: flex;
    align-items: stretch;
    background-color: rgb(var(--sl-surface-base-alt));
    border: solid var(--sl-panel-border-width) rgb(var(--sl-panel-border-color));
    border-top-width: calc(var(--sl-panel-border-width) * 3);
    border-radius: var(--sl-border-radius-medium);
    box-shadow: var(--box-shadow);
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-normal);
    line-height: 1.6;
    color: rgb(var(--sl-color-neutral-700));
    margin: inherit;
  }

  .alert__icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-large);
  }

  .alert__icon ::slotted(*) {
    margin-left: var(--sl-spacing-large);
  }

  .alert--primary {
    border-top-color: rgb(var(--sl-color-primary-600));
  }

  .alert--primary .alert__icon {
    color: rgb(var(--sl-color-primary-600));
  }

  .alert--success {
    border-top-color: rgb(var(--sl-color-success-600));
  }

  .alert--success .alert__icon {
    color: rgb(var(--sl-color-success-600));
  }

  .alert--neutral {
    border-top-color: rgb(var(--sl-color-neutral-600));
  }

  .alert--neutral .alert__icon {
    color: rgb(var(--sl-color-neutral-600));
  }

  .alert--warning {
    border-top-color: rgb(var(--sl-color-warning-600));
  }

  .alert--warning .alert__icon {
    color: rgb(var(--sl-color-warning-600));
  }

  .alert--danger {
    border-top-color: rgb(var(--sl-color-danger-600));
  }

  .alert--danger .alert__icon {
    color: rgb(var(--sl-color-danger-600));
  }

  .alert__message {
    flex: 1 1 auto;
    padding: var(--sl-spacing-large);
    overflow: hidden;
  }

  .alert__close {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    font-size: var(--sl-font-size-large);
    padding-right: var(--sl-spacing-medium);
  }
`;
  var toastStack = Object.assign(document.createElement("div"), { className: "sl-toast-stack" });
  var SlAlert = class extends n4 {
    constructor() {
      super(...arguments);
      this.open = false;
      this.closable = false;
      this.type = "primary";
      this.duration = Infinity;
    }
    firstUpdated() {
      this.base.hidden = !this.open;
    }
    async show() {
      if (this.open) {
        return;
      }
      this.open = true;
      return waitForEvent(this, "sl-after-show");
    }
    async hide() {
      if (!this.open) {
        return;
      }
      this.open = false;
      return waitForEvent(this, "sl-after-hide");
    }
    async toast() {
      return new Promise((resolve) => {
        if (!toastStack.parentElement) {
          document.body.append(toastStack);
        }
        toastStack.appendChild(this);
        requestAnimationFrame(() => {
          this.clientWidth;
          this.show();
        });
        this.addEventListener("sl-after-hide", () => {
          toastStack.removeChild(this);
          resolve();
          if (!toastStack.querySelector("sl-alert")) {
            toastStack.remove();
          }
        }, { once: true });
      });
    }
    restartAutoHide() {
      clearTimeout(this.autoHideTimeout);
      if (this.open && this.duration < Infinity) {
        this.autoHideTimeout = setTimeout(() => this.hide(), this.duration);
      }
    }
    handleCloseClick() {
      this.hide();
    }
    handleMouseMove() {
      this.restartAutoHide();
    }
    async handleOpenChange() {
      if (this.open) {
        emit(this, "sl-show");
        if (this.duration < Infinity) {
          this.restartAutoHide();
        }
        await stopAnimations(this.base);
        this.base.hidden = false;
        const { keyframes, options } = getAnimation(this, "alert.show");
        await animateTo(this.base, keyframes, options);
        emit(this, "sl-after-show");
      } else {
        emit(this, "sl-hide");
        clearTimeout(this.autoHideTimeout);
        await stopAnimations(this.base);
        const { keyframes, options } = getAnimation(this, "alert.hide");
        await animateTo(this.base, keyframes, options);
        this.base.hidden = true;
        emit(this, "sl-after-hide");
      }
    }
    handleDurationChange() {
      this.restartAutoHide();
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        alert: true,
        "alert--open": this.open,
        "alert--closable": this.closable,
        "alert--primary": this.type === "primary",
        "alert--success": this.type === "success",
        "alert--neutral": this.type === "neutral",
        "alert--warning": this.type === "warning",
        "alert--danger": this.type === "danger"
      })}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-hidden=${this.open ? "false" : "true"}
        @mousemove=${this.handleMouseMove}
      >
        <span part="icon" class="alert__icon">
          <slot name="icon"></slot>
        </span>

        <span part="message" class="alert__message">
          <slot></slot>
        </span>

        ${this.closable ? y`
              <span class="alert__close">
                <sl-icon-button
                  exportparts="base:close-button"
                  name="x"
                  library="system"
                  @click=${this.handleCloseClick}
                ></sl-icon-button>
              </span>
            ` : ""}
      </div>
    `;
    }
  };
  SlAlert.styles = alert_styles_default;
  __decorateClass([
    i23('[part="base"]')
  ], SlAlert.prototype, "base", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlAlert.prototype, "open", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlAlert.prototype, "closable", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlAlert.prototype, "type", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlAlert.prototype, "duration", 2);
  __decorateClass([
    watch("open", { waitUntilFirstUpdate: true })
  ], SlAlert.prototype, "handleOpenChange", 1);
  __decorateClass([
    watch("duration")
  ], SlAlert.prototype, "handleDurationChange", 1);
  SlAlert = __decorateClass([
    n5("sl-alert")
  ], SlAlert);
  setDefaultAnimation("alert.show", {
    keyframes: [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 1, transform: "scale(1)" }
    ],
    options: { duration: 250, easing: "ease" }
  });
  setDefaultAnimation("alert.hide", {
    keyframes: [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.8)" }
    ],
    options: { duration: 250, easing: "ease" }
  });

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.OBQZMEYB.js
  var icon_button_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;
  }

  .icon-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: var(--sl-border-radius-medium);
    font-size: inherit;
    color: rgb(var(--sl-color-neutral-600));
    padding: var(--sl-spacing-x-small);
    cursor: pointer;
    transition: var(--sl-transition-medium) color;
    -webkit-appearance: none;
  }

  .icon-button:hover:not(.icon-button--disabled),
  .icon-button:focus:not(.icon-button--disabled) {
    color: rgb(var(--sl-color-primary-600));
  }

  .icon-button:active:not(.icon-button--disabled) {
    color: rgb(var(--sl-color-primary-700));
  }

  .icon-button:focus {
    outline: none;
  }

  .icon-button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button${focusVisibleSelector} {
    box-shadow: var(--sl-focus-ring);
  }
`;
  var SlIconButton = class extends n4 {
    constructor() {
      super(...arguments);
      this.label = "";
      this.disabled = false;
    }
    render() {
      const isLink = this.href ? true : false;
      const interior = y`
      <sl-icon
        name=${l4(this.name)}
        library=${l4(this.library)}
        src=${l4(this.src)}
        aria-hidden="true"
      ></sl-icon>
    `;
      return isLink ? y`
          <a
            part="base"
            class="icon-button"
            href=${l4(this.href)}
            target=${l4(this.target)}
            download=${l4(this.download)}
            rel=${l4(this.target ? "noreferrer noopener" : void 0)}
            role="button"
            aria-disabled=${this.disabled ? "true" : "false"}
            aria-label="${this.label}"
            tabindex=${this.disabled ? "-1" : "0"}
          >
            ${interior}
          </a>
        ` : y`
          <button
            part="base"
            class=${o5({
        "icon-button": true,
        "icon-button--disabled": this.disabled
      })}
            ?disabled=${this.disabled}
            type="button"
            aria-label=${this.label}
          >
            ${interior}
          </button>
        `;
    }
  };
  SlIconButton.styles = icon_button_styles_default;
  __decorateClass([
    i23("button")
  ], SlIconButton.prototype, "button", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "name", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "library", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "src", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "href", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "target", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "download", 2);
  __decorateClass([
    e4()
  ], SlIconButton.prototype, "label", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlIconButton.prototype, "disabled", 2);
  SlIconButton = __decorateClass([
    n5("sl-icon-button")
  ], SlIconButton);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.P3C2CSPZ.js
  var animated_image_styles_default = r`
  ${component_styles_default}

  :host {
    --control-box-size: 2.5rem;
    --icon-size: calc(var(--control-box-size) * 0.625);
    display: inline-flex;
    position: relative;
    cursor: pointer;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
  }

  img[aria-hidden='true'] {
    display: none;
  }

  .animated-image__control-box {
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    top: calc(50% - var(--control-box-size) / 2);
    right: calc(50% - var(--control-box-size) / 2);
    width: var(--control-box-size);
    height: var(--control-box-size);
    font-size: var(--icon-size);
    background: none;
    border: none;
    background-color: rgb(var(--sl-color-neutral-1000) / 50%);
    border-radius: var(--sl-border-radius-circle);
    color: rgb(var(--sl-color-neutral-0));
    pointer-events: none;
    transition: var(--sl-transition-fast) opacity;
  }

  :host([play]:hover) .animated-image__control-box {
    opacity: 1;
    transform: scale(1);
  }

  :host([play]:not(:hover)) .animated-image__control-box {
    opacity: 0;
  }
`;
  var SlAnimatedImage = class extends n4 {
    constructor() {
      super(...arguments);
      this.isLoaded = false;
    }
    handleClick() {
      this.play = !this.play;
    }
    handleLoad() {
      const canvas = document.createElement("canvas");
      const { width, height } = this.animatedImage;
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(this.animatedImage, 0, 0, width, height);
      this.frozenFrame = canvas.toDataURL("image/gif");
      if (!this.isLoaded) {
        emit(this, "sl-load");
        this.isLoaded = true;
      }
    }
    handleError() {
      emit(this, "sl-error");
    }
    async handlePlayChange() {
      if (this.play) {
        this.animatedImage.src = "";
        this.animatedImage.src = this.src;
      }
    }
    handleSrcChange() {
      this.isLoaded = false;
    }
    render() {
      return y`
      <div class="animated-image">
        <img
          class="animated-image__animated"
          src=${this.src}
          alt=${this.alt}
          crossorigin="anonymous"
          aria-hidden=${this.play ? "false" : "true"}
          @click=${this.handleClick}
          @load=${this.handleLoad}
          @error=${this.handleError}
        />

        ${this.isLoaded ? y`
              <img
                class="animated-image__frozen"
                src=${this.frozenFrame}
                alt=${this.alt}
                aria-hidden=${this.play ? "true" : "false"}
                @click=${this.handleClick}
              />

              <div part="control-box" class="animated-image__control-box">
                ${this.play ? y`<sl-icon part="pause-icon" name="pause-fill" library="system"></sl-icon>` : y`<sl-icon part="play-icon" name="play-fill" library="system"></sl-icon>`}
              </div>
            ` : ""}
      </div>
    `;
    }
  };
  SlAnimatedImage.styles = animated_image_styles_default;
  __decorateClass([
    t3()
  ], SlAnimatedImage.prototype, "frozenFrame", 2);
  __decorateClass([
    t3()
  ], SlAnimatedImage.prototype, "isLoaded", 2);
  __decorateClass([
    i23(".animated-image__animated")
  ], SlAnimatedImage.prototype, "animatedImage", 2);
  __decorateClass([
    e4()
  ], SlAnimatedImage.prototype, "src", 2);
  __decorateClass([
    e4()
  ], SlAnimatedImage.prototype, "alt", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlAnimatedImage.prototype, "play", 2);
  __decorateClass([
    watch("play")
  ], SlAnimatedImage.prototype, "handlePlayChange", 1);
  __decorateClass([
    watch("src")
  ], SlAnimatedImage.prototype, "handleSrcChange", 1);
  SlAnimatedImage = __decorateClass([
    n5("sl-animated-image")
  ], SlAnimatedImage);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.ZRVM725B.js
  var dist_exports = {};
  __export2(dist_exports, {
    backInDown: () => backInDown,
    backInLeft: () => backInLeft,
    backInRight: () => backInRight,
    backInUp: () => backInUp,
    backOutDown: () => backOutDown,
    backOutLeft: () => backOutLeft,
    backOutRight: () => backOutRight,
    backOutUp: () => backOutUp,
    bounce: () => bounce,
    bounceIn: () => bounceIn,
    bounceInDown: () => bounceInDown,
    bounceInLeft: () => bounceInLeft,
    bounceInRight: () => bounceInRight,
    bounceInUp: () => bounceInUp,
    bounceOut: () => bounceOut,
    bounceOutDown: () => bounceOutDown,
    bounceOutLeft: () => bounceOutLeft,
    bounceOutRight: () => bounceOutRight,
    bounceOutUp: () => bounceOutUp,
    easings: () => easings,
    fadeIn: () => fadeIn,
    fadeInBottomLeft: () => fadeInBottomLeft,
    fadeInBottomRight: () => fadeInBottomRight,
    fadeInDown: () => fadeInDown,
    fadeInDownBig: () => fadeInDownBig,
    fadeInLeft: () => fadeInLeft,
    fadeInLeftBig: () => fadeInLeftBig,
    fadeInRight: () => fadeInRight,
    fadeInRightBig: () => fadeInRightBig,
    fadeInTopLeft: () => fadeInTopLeft,
    fadeInTopRight: () => fadeInTopRight,
    fadeInUp: () => fadeInUp,
    fadeInUpBig: () => fadeInUpBig,
    fadeOut: () => fadeOut,
    fadeOutBottomLeft: () => fadeOutBottomLeft,
    fadeOutBottomRight: () => fadeOutBottomRight,
    fadeOutDown: () => fadeOutDown,
    fadeOutDownBig: () => fadeOutDownBig,
    fadeOutLeft: () => fadeOutLeft,
    fadeOutLeftBig: () => fadeOutLeftBig,
    fadeOutRight: () => fadeOutRight,
    fadeOutRightBig: () => fadeOutRightBig,
    fadeOutTopLeft: () => fadeOutTopLeft,
    fadeOutTopRight: () => fadeOutTopRight,
    fadeOutUp: () => fadeOutUp,
    fadeOutUpBig: () => fadeOutUpBig,
    flash: () => flash,
    flip: () => flip2,
    flipInX: () => flipInX,
    flipInY: () => flipInY,
    flipOutX: () => flipOutX,
    flipOutY: () => flipOutY,
    headShake: () => headShake,
    heartBeat: () => heartBeat,
    hinge: () => hinge,
    jackInTheBox: () => jackInTheBox,
    jello: () => jello,
    lightSpeedInLeft: () => lightSpeedInLeft,
    lightSpeedInRight: () => lightSpeedInRight,
    lightSpeedOutLeft: () => lightSpeedOutLeft,
    lightSpeedOutRight: () => lightSpeedOutRight,
    pulse: () => pulse,
    rollIn: () => rollIn,
    rollOut: () => rollOut,
    rotateIn: () => rotateIn,
    rotateInDownLeft: () => rotateInDownLeft,
    rotateInDownRight: () => rotateInDownRight,
    rotateInUpLeft: () => rotateInUpLeft,
    rotateInUpRight: () => rotateInUpRight,
    rotateOut: () => rotateOut,
    rotateOutDownLeft: () => rotateOutDownLeft,
    rotateOutDownRight: () => rotateOutDownRight,
    rotateOutUpLeft: () => rotateOutUpLeft,
    rotateOutUpRight: () => rotateOutUpRight,
    rubberBand: () => rubberBand,
    shake: () => shake,
    shakeX: () => shakeX,
    shakeY: () => shakeY,
    slideInDown: () => slideInDown,
    slideInLeft: () => slideInLeft,
    slideInRight: () => slideInRight,
    slideInUp: () => slideInUp,
    slideOutDown: () => slideOutDown,
    slideOutLeft: () => slideOutLeft,
    slideOutRight: () => slideOutRight,
    slideOutUp: () => slideOutUp,
    swing: () => swing,
    tada: () => tada,
    wobble: () => wobble,
    zoomIn: () => zoomIn,
    zoomInDown: () => zoomInDown,
    zoomInLeft: () => zoomInLeft,
    zoomInRight: () => zoomInRight,
    zoomInUp: () => zoomInUp,
    zoomOut: () => zoomOut,
    zoomOutDown: () => zoomOutDown,
    zoomOutLeft: () => zoomOutLeft,
    zoomOutRight: () => zoomOutRight,
    zoomOutUp: () => zoomOutUp
  });
  var bounce = [
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", transform: "translate3d(0, 0, 0)" },
    { offset: 0.2, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", transform: "translate3d(0, 0, 0)" },
    { offset: 0.4, easing: "cubic-bezier(0.755, 0.05, 0.855, 0.06)", transform: "translate3d(0, -30px, 0) scaleY(1.1)" },
    { offset: 0.43, easing: "cubic-bezier(0.755, 0.05, 0.855, 0.06)", transform: "translate3d(0, -30px, 0) scaleY(1.1)" },
    { offset: 0.53, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", transform: "translate3d(0, 0, 0)" },
    { offset: 0.7, easing: "cubic-bezier(0.755, 0.05, 0.855, 0.06)", transform: "translate3d(0, -15px, 0) scaleY(1.05)" },
    {
      offset: 0.8,
      "transition-timing-function": "cubic-bezier(0.215, 0.61, 0.355, 1)",
      transform: "translate3d(0, 0, 0) scaleY(0.95)"
    },
    { offset: 0.9, transform: "translate3d(0, -4px, 0) scaleY(1.02)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", transform: "translate3d(0, 0, 0)" }
  ];
  var flash = [
    { offset: 0, opacity: "1" },
    { offset: 0.25, opacity: "0" },
    { offset: 0.5, opacity: "1" },
    { offset: 0.75, opacity: "0" },
    { offset: 1, opacity: "1" }
  ];
  var headShake = [
    { offset: 0, transform: "translateX(0)" },
    { offset: 0.065, transform: "translateX(-6px) rotateY(-9deg)" },
    { offset: 0.185, transform: "translateX(5px) rotateY(7deg)" },
    { offset: 0.315, transform: "translateX(-3px) rotateY(-5deg)" },
    { offset: 0.435, transform: "translateX(2px) rotateY(3deg)" },
    { offset: 0.5, transform: "translateX(0)" }
  ];
  var heartBeat = [
    { offset: 0, transform: "scale(1)" },
    { offset: 0.14, transform: "scale(1.3)" },
    { offset: 0.28, transform: "scale(1)" },
    { offset: 0.42, transform: "scale(1.3)" },
    { offset: 0.7, transform: "scale(1)" }
  ];
  var jello = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 0.111, transform: "translate3d(0, 0, 0)" },
    { offset: 0.222, transform: "skewX(-12.5deg) skewY(-12.5deg)" },
    { offset: 0.33299999999999996, transform: "skewX(6.25deg) skewY(6.25deg)" },
    { offset: 0.444, transform: "skewX(-3.125deg) skewY(-3.125deg)" },
    { offset: 0.555, transform: "skewX(1.5625deg) skewY(1.5625deg)" },
    { offset: 0.6659999999999999, transform: "skewX(-0.78125deg) skewY(-0.78125deg)" },
    { offset: 0.777, transform: "skewX(0.390625deg) skewY(0.390625deg)" },
    { offset: 0.888, transform: "skewX(-0.1953125deg) skewY(-0.1953125deg)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var pulse = [
    { offset: 0, transform: "scale3d(1, 1, 1)" },
    { offset: 0.5, transform: "scale3d(1.05, 1.05, 1.05)" },
    { offset: 1, transform: "scale3d(1, 1, 1)" }
  ];
  var rubberBand = [
    { offset: 0, transform: "scale3d(1, 1, 1)" },
    { offset: 0.3, transform: "scale3d(1.25, 0.75, 1)" },
    { offset: 0.4, transform: "scale3d(0.75, 1.25, 1)" },
    { offset: 0.5, transform: "scale3d(1.15, 0.85, 1)" },
    { offset: 0.65, transform: "scale3d(0.95, 1.05, 1)" },
    { offset: 0.75, transform: "scale3d(1.05, 0.95, 1)" },
    { offset: 1, transform: "scale3d(1, 1, 1)" }
  ];
  var shake = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 0.1, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.2, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.3, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.4, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.5, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.6, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.7, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.8, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.9, transform: "translate3d(-10px, 0, 0)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var shakeX = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 0.1, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.2, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.3, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.4, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.5, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.6, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.7, transform: "translate3d(-10px, 0, 0)" },
    { offset: 0.8, transform: "translate3d(10px, 0, 0)" },
    { offset: 0.9, transform: "translate3d(-10px, 0, 0)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var shakeY = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 0.1, transform: "translate3d(0, -10px, 0)" },
    { offset: 0.2, transform: "translate3d(0, 10px, 0)" },
    { offset: 0.3, transform: "translate3d(0, -10px, 0)" },
    { offset: 0.4, transform: "translate3d(0, 10px, 0)" },
    { offset: 0.5, transform: "translate3d(0, -10px, 0)" },
    { offset: 0.6, transform: "translate3d(0, 10px, 0)" },
    { offset: 0.7, transform: "translate3d(0, -10px, 0)" },
    { offset: 0.8, transform: "translate3d(0, 10px, 0)" },
    { offset: 0.9, transform: "translate3d(0, -10px, 0)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var swing = [
    { offset: 0.2, transform: "rotate3d(0, 0, 1, 15deg)" },
    { offset: 0.4, transform: "rotate3d(0, 0, 1, -10deg)" },
    { offset: 0.6, transform: "rotate3d(0, 0, 1, 5deg)" },
    { offset: 0.8, transform: "rotate3d(0, 0, 1, -5deg)" },
    { offset: 1, transform: "rotate3d(0, 0, 1, 0deg)" }
  ];
  var tada = [
    { offset: 0, transform: "scale3d(1, 1, 1)" },
    { offset: 0.1, transform: "scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.2, transform: "scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.3, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)" },
    { offset: 0.4, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.5, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)" },
    { offset: 0.6, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.7, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)" },
    { offset: 0.8, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.9, transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)" },
    { offset: 1, transform: "scale3d(1, 1, 1)" }
  ];
  var wobble = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 0.15, transform: "translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg)" },
    { offset: 0.3, transform: "translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)" },
    { offset: 0.45, transform: "translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)" },
    { offset: 0.6, transform: "translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)" },
    { offset: 0.75, transform: "translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var backInDown = [
    { offset: 0, transform: "translateY(-1200px) scale(0.7)", opacity: "0.7" },
    { offset: 0.8, transform: "translateY(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "scale(1)", opacity: "1" }
  ];
  var backInLeft = [
    { offset: 0, transform: "translateX(-2000px) scale(0.7)", opacity: "0.7" },
    { offset: 0.8, transform: "translateX(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "scale(1)", opacity: "1" }
  ];
  var backInRight = [
    { offset: 0, transform: "translateX(2000px) scale(0.7)", opacity: "0.7" },
    { offset: 0.8, transform: "translateX(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "scale(1)", opacity: "1" }
  ];
  var backInUp = [
    { offset: 0, transform: "translateY(1200px) scale(0.7)", opacity: "0.7" },
    { offset: 0.8, transform: "translateY(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "scale(1)", opacity: "1" }
  ];
  var backOutDown = [
    { offset: 0, transform: "scale(1)", opacity: "1" },
    { offset: 0.2, transform: "translateY(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "translateY(700px) scale(0.7)", opacity: "0.7" }
  ];
  var backOutLeft = [
    { offset: 0, transform: "scale(1)", opacity: "1" },
    { offset: 0.2, transform: "translateX(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "translateX(-2000px) scale(0.7)", opacity: "0.7" }
  ];
  var backOutRight = [
    { offset: 0, transform: "scale(1)", opacity: "1" },
    { offset: 0.2, transform: "translateX(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "translateX(2000px) scale(0.7)", opacity: "0.7" }
  ];
  var backOutUp = [
    { offset: 0, transform: "scale(1)", opacity: "1" },
    { offset: 0.2, transform: "translateY(0px) scale(0.7)", opacity: "0.7" },
    { offset: 1, transform: "translateY(-700px) scale(0.7)", opacity: "0.7" }
  ];
  var bounceIn = [
    { offset: 0, opacity: "0", transform: "scale3d(0.3, 0.3, 0.3)" },
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.2, transform: "scale3d(1.1, 1.1, 1.1)" },
    { offset: 0.2, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.4, transform: "scale3d(0.9, 0.9, 0.9)" },
    { offset: 0.4, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.6, opacity: "1", transform: "scale3d(1.03, 1.03, 1.03)" },
    { offset: 0.6, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.8, transform: "scale3d(0.97, 0.97, 0.97)" },
    { offset: 0.8, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 1, opacity: "1", transform: "scale3d(1, 1, 1)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" }
  ];
  var bounceInDown = [
    { offset: 0, opacity: "0", transform: "translate3d(0, -3000px, 0) scaleY(3)" },
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.6, opacity: "1", transform: "translate3d(0, 25px, 0) scaleY(0.9)" },
    { offset: 0.6, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.75, transform: "translate3d(0, -10px, 0) scaleY(0.95)" },
    { offset: 0.75, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.9, transform: "translate3d(0, 5px, 0) scaleY(0.985)" },
    { offset: 0.9, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" }
  ];
  var bounceInLeft = [
    { offset: 0, opacity: "0", transform: "translate3d(-3000px, 0, 0) scaleX(3)" },
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.6, opacity: "1", transform: "translate3d(25px, 0, 0) scaleX(1)" },
    { offset: 0.6, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.75, transform: "translate3d(-10px, 0, 0) scaleX(0.98)" },
    { offset: 0.75, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.9, transform: "translate3d(5px, 0, 0) scaleX(0.995)" },
    { offset: 0.9, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" }
  ];
  var bounceInRight = [
    { offset: 0, opacity: "0", transform: "translate3d(3000px, 0, 0) scaleX(3)" },
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.6, opacity: "1", transform: "translate3d(-25px, 0, 0) scaleX(1)" },
    { offset: 0.6, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.75, transform: "translate3d(10px, 0, 0) scaleX(0.98)" },
    { offset: 0.75, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.9, transform: "translate3d(-5px, 0, 0) scaleX(0.995)" },
    { offset: 0.9, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" }
  ];
  var bounceInUp = [
    { offset: 0, opacity: "0", transform: "translate3d(0, 3000px, 0) scaleY(5)" },
    { offset: 0, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.6, opacity: "1", transform: "translate3d(0, -20px, 0) scaleY(0.9)" },
    { offset: 0.6, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.75, transform: "translate3d(0, 10px, 0) scaleY(0.95)" },
    { offset: 0.75, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 0.9, transform: "translate3d(0, -5px, 0) scaleY(0.985)" },
    { offset: 0.9, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" },
    { offset: 1, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" }
  ];
  var bounceOut = [
    { offset: 0.2, transform: "scale3d(0.9, 0.9, 0.9)" },
    { offset: 0.5, opacity: "1", transform: "scale3d(1.1, 1.1, 1.1)" },
    { offset: 0.55, opacity: "1", transform: "scale3d(1.1, 1.1, 1.1)" },
    { offset: 1, opacity: "0", transform: "scale3d(0.3, 0.3, 0.3)" }
  ];
  var bounceOutDown = [
    { offset: 0.2, transform: "translate3d(0, 10px, 0) scaleY(0.985)" },
    { offset: 0.4, opacity: "1", transform: "translate3d(0, -20px, 0) scaleY(0.9)" },
    { offset: 0.45, opacity: "1", transform: "translate3d(0, -20px, 0) scaleY(0.9)" },
    { offset: 1, opacity: "0", transform: "translate3d(0, 2000px, 0) scaleY(3)" }
  ];
  var bounceOutLeft = [
    { offset: 0.2, opacity: "1", transform: "translate3d(20px, 0, 0) scaleX(0.9)" },
    { offset: 1, opacity: "0", transform: "translate3d(-2000px, 0, 0) scaleX(2)" }
  ];
  var bounceOutRight = [
    { offset: 0.2, opacity: "1", transform: "translate3d(-20px, 0, 0) scaleX(0.9)" },
    { offset: 1, opacity: "0", transform: "translate3d(2000px, 0, 0) scaleX(2)" }
  ];
  var bounceOutUp = [
    { offset: 0.2, transform: "translate3d(0, -10px, 0) scaleY(0.985)" },
    { offset: 0.4, opacity: "1", transform: "translate3d(0, 20px, 0) scaleY(0.9)" },
    { offset: 0.45, opacity: "1", transform: "translate3d(0, 20px, 0) scaleY(0.9)" },
    { offset: 1, opacity: "0", transform: "translate3d(0, -2000px, 0) scaleY(3)" }
  ];
  var fadeIn = [
    { offset: 0, opacity: "0" },
    { offset: 1, opacity: "1" }
  ];
  var fadeInBottomLeft = [
    { offset: 0, opacity: "0", transform: "translate3d(-100%, 100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInBottomRight = [
    { offset: 0, opacity: "0", transform: "translate3d(100%, 100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInDown = [
    { offset: 0, opacity: "0", transform: "translate3d(0, -100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInDownBig = [
    { offset: 0, opacity: "0", transform: "translate3d(0, -2000px, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInLeft = [
    { offset: 0, opacity: "0", transform: "translate3d(-100%, 0, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInLeftBig = [
    { offset: 0, opacity: "0", transform: "translate3d(-2000px, 0, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInRight = [
    { offset: 0, opacity: "0", transform: "translate3d(100%, 0, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInRightBig = [
    { offset: 0, opacity: "0", transform: "translate3d(2000px, 0, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInTopLeft = [
    { offset: 0, opacity: "0", transform: "translate3d(-100%, -100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInTopRight = [
    { offset: 0, opacity: "0", transform: "translate3d(100%, -100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInUp = [
    { offset: 0, opacity: "0", transform: "translate3d(0, 100%, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeInUpBig = [
    { offset: 0, opacity: "0", transform: "translate3d(0, 2000px, 0)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var fadeOut = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0" }
  ];
  var fadeOutBottomLeft = [
    { offset: 0, opacity: "1", transform: "translate3d(0, 0, 0)" },
    { offset: 1, opacity: "0", transform: "translate3d(-100%, 100%, 0)" }
  ];
  var fadeOutBottomRight = [
    { offset: 0, opacity: "1", transform: "translate3d(0, 0, 0)" },
    { offset: 1, opacity: "0", transform: "translate3d(100%, 100%, 0)" }
  ];
  var fadeOutDown = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(0, 100%, 0)" }
  ];
  var fadeOutDownBig = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(0, 2000px, 0)" }
  ];
  var fadeOutLeft = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(-100%, 0, 0)" }
  ];
  var fadeOutLeftBig = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(-2000px, 0, 0)" }
  ];
  var fadeOutRight = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(100%, 0, 0)" }
  ];
  var fadeOutRightBig = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(2000px, 0, 0)" }
  ];
  var fadeOutTopLeft = [
    { offset: 0, opacity: "1", transform: "translate3d(0, 0, 0)" },
    { offset: 1, opacity: "0", transform: "translate3d(-100%, -100%, 0)" }
  ];
  var fadeOutTopRight = [
    { offset: 0, opacity: "1", transform: "translate3d(0, 0, 0)" },
    { offset: 1, opacity: "0", transform: "translate3d(100%, -100%, 0)" }
  ];
  var fadeOutUp = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(0, -100%, 0)" }
  ];
  var fadeOutUpBig = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(0, -2000px, 0)" }
  ];
  var flip2 = [
    {
      offset: 0,
      transform: "perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, -360deg)",
      easing: "ease-out"
    },
    {
      offset: 0.4,
      transform: "perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px)\n      rotate3d(0, 1, 0, -190deg)",
      easing: "ease-out"
    },
    {
      offset: 0.5,
      transform: "perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 150px)\n      rotate3d(0, 1, 0, -170deg)",
      easing: "ease-in"
    },
    {
      offset: 0.8,
      transform: "perspective(400px) scale3d(0.95, 0.95, 0.95) translate3d(0, 0, 0)\n      rotate3d(0, 1, 0, 0deg)",
      easing: "ease-in"
    },
    {
      offset: 1,
      transform: "perspective(400px) scale3d(1, 1, 1) translate3d(0, 0, 0) rotate3d(0, 1, 0, 0deg)",
      easing: "ease-in"
    }
  ];
  var flipInX = [
    { offset: 0, transform: "perspective(400px) rotate3d(1, 0, 0, 90deg)", easing: "ease-in", opacity: "0" },
    { offset: 0.4, transform: "perspective(400px) rotate3d(1, 0, 0, -20deg)", easing: "ease-in" },
    { offset: 0.6, transform: "perspective(400px) rotate3d(1, 0, 0, 10deg)", opacity: "1" },
    { offset: 0.8, transform: "perspective(400px) rotate3d(1, 0, 0, -5deg)" },
    { offset: 1, transform: "perspective(400px)" }
  ];
  var flipInY = [
    { offset: 0, transform: "perspective(400px) rotate3d(0, 1, 0, 90deg)", easing: "ease-in", opacity: "0" },
    { offset: 0.4, transform: "perspective(400px) rotate3d(0, 1, 0, -20deg)", easing: "ease-in" },
    { offset: 0.6, transform: "perspective(400px) rotate3d(0, 1, 0, 10deg)", opacity: "1" },
    { offset: 0.8, transform: "perspective(400px) rotate3d(0, 1, 0, -5deg)" },
    { offset: 1, transform: "perspective(400px)" }
  ];
  var flipOutX = [
    { offset: 0, transform: "perspective(400px)" },
    { offset: 0.3, transform: "perspective(400px) rotate3d(1, 0, 0, -20deg)", opacity: "1" },
    { offset: 1, transform: "perspective(400px) rotate3d(1, 0, 0, 90deg)", opacity: "0" }
  ];
  var flipOutY = [
    { offset: 0, transform: "perspective(400px)" },
    { offset: 0.3, transform: "perspective(400px) rotate3d(0, 1, 0, -15deg)", opacity: "1" },
    { offset: 1, transform: "perspective(400px) rotate3d(0, 1, 0, 90deg)", opacity: "0" }
  ];
  var lightSpeedInLeft = [
    { offset: 0, transform: "translate3d(-100%, 0, 0) skewX(30deg)", opacity: "0" },
    { offset: 0.6, transform: "skewX(-20deg)", opacity: "1" },
    { offset: 0.8, transform: "skewX(5deg)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var lightSpeedInRight = [
    { offset: 0, transform: "translate3d(100%, 0, 0) skewX(-30deg)", opacity: "0" },
    { offset: 0.6, transform: "skewX(20deg)", opacity: "1" },
    { offset: 0.8, transform: "skewX(-5deg)" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var lightSpeedOutLeft = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "translate3d(-100%, 0, 0) skewX(-30deg)", opacity: "0" }
  ];
  var lightSpeedOutRight = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "translate3d(100%, 0, 0) skewX(30deg)", opacity: "0" }
  ];
  var rotateIn = [
    { offset: 0, transform: "rotate3d(0, 0, 1, -200deg)", opacity: "0" },
    { offset: 1, transform: "translate3d(0, 0, 0)", opacity: "1" }
  ];
  var rotateInDownLeft = [
    { offset: 0, transform: "rotate3d(0, 0, 1, -45deg)", opacity: "0" },
    { offset: 1, transform: "translate3d(0, 0, 0)", opacity: "1" }
  ];
  var rotateInDownRight = [
    { offset: 0, transform: "rotate3d(0, 0, 1, 45deg)", opacity: "0" },
    { offset: 1, transform: "translate3d(0, 0, 0)", opacity: "1" }
  ];
  var rotateInUpLeft = [
    { offset: 0, transform: "rotate3d(0, 0, 1, 45deg)", opacity: "0" },
    { offset: 1, transform: "translate3d(0, 0, 0)", opacity: "1" }
  ];
  var rotateInUpRight = [
    { offset: 0, transform: "rotate3d(0, 0, 1, -90deg)", opacity: "0" },
    { offset: 1, transform: "translate3d(0, 0, 0)", opacity: "1" }
  ];
  var rotateOut = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "rotate3d(0, 0, 1, 200deg)", opacity: "0" }
  ];
  var rotateOutDownLeft = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "rotate3d(0, 0, 1, 45deg)", opacity: "0" }
  ];
  var rotateOutDownRight = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "rotate3d(0, 0, 1, -45deg)", opacity: "0" }
  ];
  var rotateOutUpLeft = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "rotate3d(0, 0, 1, -45deg)", opacity: "0" }
  ];
  var rotateOutUpRight = [
    { offset: 0, opacity: "1" },
    { offset: 1, transform: "rotate3d(0, 0, 1, 90deg)", opacity: "0" }
  ];
  var slideInDown = [
    { offset: 0, transform: "translate3d(0, -100%, 0)", visibility: "visible" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var slideInLeft = [
    { offset: 0, transform: "translate3d(-100%, 0, 0)", visibility: "visible" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var slideInRight = [
    { offset: 0, transform: "translate3d(100%, 0, 0)", visibility: "visible" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var slideInUp = [
    { offset: 0, transform: "translate3d(0, 100%, 0)", visibility: "visible" },
    { offset: 1, transform: "translate3d(0, 0, 0)" }
  ];
  var slideOutDown = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 1, visibility: "hidden", transform: "translate3d(0, 100%, 0)" }
  ];
  var slideOutLeft = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 1, visibility: "hidden", transform: "translate3d(-100%, 0, 0)" }
  ];
  var slideOutRight = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 1, visibility: "hidden", transform: "translate3d(100%, 0, 0)" }
  ];
  var slideOutUp = [
    { offset: 0, transform: "translate3d(0, 0, 0)" },
    { offset: 1, visibility: "hidden", transform: "translate3d(0, -100%, 0)" }
  ];
  var hinge = [
    { offset: 0, easing: "ease-in-out" },
    { offset: 0.2, transform: "rotate3d(0, 0, 1, 80deg)", easing: "ease-in-out" },
    { offset: 0.4, transform: "rotate3d(0, 0, 1, 60deg)", easing: "ease-in-out", opacity: "1" },
    { offset: 0.6, transform: "rotate3d(0, 0, 1, 80deg)", easing: "ease-in-out" },
    { offset: 0.8, transform: "rotate3d(0, 0, 1, 60deg)", easing: "ease-in-out", opacity: "1" },
    { offset: 1, transform: "translate3d(0, 700px, 0)", opacity: "0" }
  ];
  var jackInTheBox = [
    { offset: 0, opacity: "0", transform: "scale(0.1) rotate(30deg)", "transform-origin": "center bottom" },
    { offset: 0.5, transform: "rotate(-10deg)" },
    { offset: 0.7, transform: "rotate(3deg)" },
    { offset: 1, opacity: "1", transform: "scale(1)" }
  ];
  var rollIn = [
    { offset: 0, opacity: "0", transform: "translate3d(-100%, 0, 0) rotate3d(0, 0, 1, -120deg)" },
    { offset: 1, opacity: "1", transform: "translate3d(0, 0, 0)" }
  ];
  var rollOut = [
    { offset: 0, opacity: "1" },
    { offset: 1, opacity: "0", transform: "translate3d(100%, 0, 0) rotate3d(0, 0, 1, 120deg)" }
  ];
  var zoomIn = [
    { offset: 0, opacity: "0", transform: "scale3d(0.3, 0.3, 0.3)" },
    { offset: 0.5, opacity: "1" }
  ];
  var zoomInDown = [
    {
      offset: 0,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(0, -1000px, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 0.6,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var zoomInLeft = [
    {
      offset: 0,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(-1000px, 0, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 0.6,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(10px, 0, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var zoomInRight = [
    {
      offset: 0,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(1000px, 0, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 0.6,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(-10px, 0, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var zoomInUp = [
    {
      offset: 0,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(0, 1000px, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 0.6,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var zoomOut = [
    { offset: 0, opacity: "1" },
    { offset: 0.5, opacity: "0", transform: "scale3d(0.3, 0.3, 0.3)" },
    { offset: 1, opacity: "0" }
  ];
  var zoomOutDown = [
    {
      offset: 0.4,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(0, -60px, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 1,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(0, 2000px, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var zoomOutLeft = [
    { offset: 0.4, opacity: "1", transform: "scale3d(0.475, 0.475, 0.475) translate3d(42px, 0, 0)" },
    { offset: 1, opacity: "0", transform: "scale(0.1) translate3d(-2000px, 0, 0)" }
  ];
  var zoomOutRight = [
    { offset: 0.4, opacity: "1", transform: "scale3d(0.475, 0.475, 0.475) translate3d(-42px, 0, 0)" },
    { offset: 1, opacity: "0", transform: "scale(0.1) translate3d(2000px, 0, 0)" }
  ];
  var zoomOutUp = [
    {
      offset: 0.4,
      opacity: "1",
      transform: "scale3d(0.475, 0.475, 0.475) translate3d(0, 60px, 0)",
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)"
    },
    {
      offset: 1,
      opacity: "0",
      transform: "scale3d(0.1, 0.1, 0.1) translate3d(0, -2000px, 0)",
      easing: "cubic-bezier(0.175, 0.885, 0.32, 1)"
    }
  ];
  var easings = {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    easeInSine: "cubic-bezier(0.47, 0, 0.745, 0.715)",
    easeOutSine: "cubic-bezier(0.39, 0.575, 0.565, 1)",
    easeInOutSine: "cubic-bezier(0.445, 0.05, 0.55, 0.95)",
    easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
    easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
    easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
    easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)",
    easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
    easeInQuart: "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
    easeOutQuart: "cubic-bezier(0.165, 0.84, 0.44, 1)",
    easeInOutQuart: "cubic-bezier(0.77, 0, 0.175, 1)",
    easeInQuint: "cubic-bezier(0.755, 0.05, 0.855, 0.06)",
    easeOutQuint: "cubic-bezier(0.23, 1, 0.32, 1)",
    easeInOutQuint: "cubic-bezier(0.86, 0, 0.07, 1)",
    easeInExpo: "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
    easeOutExpo: "cubic-bezier(0.19, 1, 0.22, 1)",
    easeInOutExpo: "cubic-bezier(1, 0, 0, 1)",
    easeInCirc: "cubic-bezier(0.6, 0.04, 0.98, 0.335)",
    easeOutCirc: "cubic-bezier(0.075, 0.82, 0.165, 1)",
    easeInOutCirc: "cubic-bezier(0.785, 0.135, 0.15, 0.86)",
    easeInBack: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
    easeOutBack: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  };

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.E74XTVO2.js
  var animation_styles_default = r`
  ${component_styles_default}

  :host {
    display: contents;
  }
`;
  var SlAnimation = class extends n4 {
    constructor() {
      super(...arguments);
      this.hasStarted = false;
      this.name = "none";
      this.play = false;
      this.delay = 0;
      this.direction = "normal";
      this.duration = 1e3;
      this.easing = "linear";
      this.endDelay = 0;
      this.fill = "auto";
      this.iterations = Infinity;
      this.iterationStart = 0;
      this.playbackRate = 1;
    }
    get currentTime() {
      var _a;
      return ((_a = this.animation) == null ? void 0 : _a.currentTime) || 0;
    }
    set currentTime(time) {
      if (this.animation) {
        this.animation.currentTime = time;
      }
    }
    connectedCallback() {
      super.connectedCallback();
      this.createAnimation();
      this.handleAnimationCancel = this.handleAnimationCancel.bind(this);
      this.handleAnimationFinish = this.handleAnimationFinish.bind(this);
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.destroyAnimation();
    }
    async handleAnimationChange() {
      if (!this.hasUpdated) {
        return;
      }
      this.createAnimation();
    }
    handleAnimationFinish() {
      this.play = false;
      this.hasStarted = false;
      emit(this, "sl-finish");
    }
    handleAnimationCancel() {
      this.play = false;
      this.hasStarted = false;
      emit(this, "sl-cancel");
    }
    handlePlayChange() {
      if (this.animation) {
        if (this.play && !this.hasStarted) {
          this.hasStarted = true;
          emit(this, "sl-start");
        }
        this.play ? this.animation.play() : this.animation.pause();
        return true;
      } else {
        return false;
      }
    }
    handlePlaybackRateChange() {
      if (this.animation) {
        this.animation.playbackRate = this.playbackRate;
      }
    }
    handleSlotChange() {
      this.destroyAnimation();
      this.createAnimation();
    }
    async createAnimation() {
      const easing = dist_exports.easings[this.easing] || this.easing;
      const keyframes = this.keyframes ? this.keyframes : dist_exports[this.name];
      const slot = await this.defaultSlot;
      const element = slot.assignedElements()[0];
      if (!element) {
        return false;
      }
      this.destroyAnimation();
      this.animation = element.animate(keyframes, {
        delay: this.delay,
        direction: this.direction,
        duration: this.duration,
        easing,
        endDelay: this.endDelay,
        fill: this.fill,
        iterationStart: this.iterationStart,
        iterations: this.iterations
      });
      this.animation.playbackRate = this.playbackRate;
      this.animation.addEventListener("cancel", this.handleAnimationCancel);
      this.animation.addEventListener("finish", this.handleAnimationFinish);
      if (this.play) {
        this.hasStarted = true;
        emit(this, "sl-start");
      } else {
        this.animation.pause();
      }
      return true;
    }
    destroyAnimation() {
      if (this.animation) {
        this.animation.cancel();
        this.animation.removeEventListener("cancel", this.handleAnimationCancel);
        this.animation.removeEventListener("finish", this.handleAnimationFinish);
        this.hasStarted = false;
      }
    }
    cancel() {
      try {
        this.animation.cancel();
      } catch (e33) {
      }
    }
    finish() {
      try {
        this.animation.finish();
      } catch (e33) {
      }
    }
    render() {
      return y` <slot @slotchange=${this.handleSlotChange}></slot> `;
    }
  };
  SlAnimation.styles = animation_styles_default;
  __decorateClass([
    e23("slot")
  ], SlAnimation.prototype, "defaultSlot", 2);
  __decorateClass([
    e4()
  ], SlAnimation.prototype, "name", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlAnimation.prototype, "play", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlAnimation.prototype, "delay", 2);
  __decorateClass([
    e4()
  ], SlAnimation.prototype, "direction", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlAnimation.prototype, "duration", 2);
  __decorateClass([
    e4()
  ], SlAnimation.prototype, "easing", 2);
  __decorateClass([
    e4({ attribute: "end-delay", type: Number })
  ], SlAnimation.prototype, "endDelay", 2);
  __decorateClass([
    e4()
  ], SlAnimation.prototype, "fill", 2);
  __decorateClass([
    e4({ type: Number })
  ], SlAnimation.prototype, "iterations", 2);
  __decorateClass([
    e4({ attribute: "iteration-start", type: Number })
  ], SlAnimation.prototype, "iterationStart", 2);
  __decorateClass([
    e4({ attribute: false })
  ], SlAnimation.prototype, "keyframes", 2);
  __decorateClass([
    e4({ attribute: "playback-rate", type: Number })
  ], SlAnimation.prototype, "playbackRate", 2);
  __decorateClass([
    watch("name"),
    watch("delay"),
    watch("direction"),
    watch("duration"),
    watch("easing"),
    watch("endDelay"),
    watch("fill"),
    watch("iterations"),
    watch("iterationsStart"),
    watch("keyframes")
  ], SlAnimation.prototype, "handleAnimationChange", 1);
  __decorateClass([
    watch("play")
  ], SlAnimation.prototype, "handlePlayChange", 1);
  __decorateClass([
    watch("playbackRate")
  ], SlAnimation.prototype, "handlePlaybackRateChange", 1);
  SlAnimation = __decorateClass([
    n5("sl-animation")
  ], SlAnimation);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2RKFFWHG.js
  var badge_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-flex;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--sl-font-size-x-small);
    font-weight: var(--sl-font-weight-semibold);
    letter-spacing: var(--sl-letter-spacing-normal);
    line-height: 1;
    border-radius: var(--sl-border-radius-small);
    border: solid 1px rgb(var(--sl-color-neutral-0));
    white-space: nowrap;
    padding: 3px 6px;
    user-select: none;
    cursor: inherit;
  }

  /* Type modifiers */
  .badge--primary {
    background-color: rgb(var(--sl-color-primary-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .badge--success {
    background-color: rgb(var(--sl-color-success-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .badge--neutral {
    background-color: rgb(var(--sl-color-neutral-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .badge--warning {
    background-color: rgb(var(--sl-color-warning-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  .badge--danger {
    background-color: rgb(var(--sl-color-danger-600));
    color: rgb(var(--sl-color-neutral-0));
  }

  /* Pill modifier */
  .badge--pill {
    border-radius: var(--sl-border-radius-pill);
  }

  /* Pulse modifier */
  .badge--pulse {
    animation: pulse 1.5s infinite;
  }

  .badge--pulse.badge--primary {
    --pulse-color: rgb(var(--sl-color-primary-600));
  }

  .badge--pulse.badge--success {
    --pulse-color: rgb(var(--sl-color-success-600));
  }

  .badge--pulse.badge--neutral {
    --pulse-color: rgb(var(--sl-color-neutral-600));
  }

  .badge--pulse.badge--warning {
    --pulse-color: rgb(var(--sl-color-warning-600));
  }

  .badge--pulse.badge--danger {
    --pulse-color: rgb(var(--sl-color-danger-600));
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 var(--pulse-color);
    }
    70% {
      box-shadow: 0 0 0 0.5rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }
`;
  var SlBadge = class extends n4 {
    constructor() {
      super(...arguments);
      this.type = "primary";
      this.pill = false;
      this.pulse = false;
    }
    render() {
      return y`
      <span
        part="base"
        class=${o5({
        badge: true,
        "badge--primary": this.type === "primary",
        "badge--success": this.type === "success",
        "badge--neutral": this.type === "neutral",
        "badge--warning": this.type === "warning",
        "badge--danger": this.type === "danger",
        "badge--pill": this.pill,
        "badge--pulse": this.pulse
      })}
        role="status"
      >
        <slot></slot>
      </span>
    `;
    }
  };
  SlBadge.styles = badge_styles_default;
  __decorateClass([
    e4({ reflect: true })
  ], SlBadge.prototype, "type", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlBadge.prototype, "pill", 2);
  __decorateClass([
    e4({ type: Boolean, reflect: true })
  ], SlBadge.prototype, "pulse", 2);
  SlBadge = __decorateClass([
    n5("sl-badge")
  ], SlBadge);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.2NRYR2GU.js
  var breadcrumb_styles_default = r`
  ${component_styles_default}

  .breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
`;
  var SlBreadcrumb = class extends n4 {
    constructor() {
      super(...arguments);
      this.label = "Breadcrumb";
    }
    getSeparator() {
      const separator = this.separatorSlot.assignedElements({ flatten: true })[0];
      const clone = separator.cloneNode(true);
      [clone, ...clone.querySelectorAll("[id]")].map((el) => el.removeAttribute("id"));
      clone.slot = "separator";
      return clone;
    }
    handleSlotChange() {
      const items = [...this.defaultSlot.assignedElements({ flatten: true })].filter((item) => item.tagName.toLowerCase() === "sl-breadcrumb-item");
      items.map((item, index) => {
        const separator = item.querySelector('[slot="separator"]');
        if (!separator) {
          item.append(this.getSeparator());
        }
        if (index === items.length - 1) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
    }
    render() {
      return y`
      <nav part="base" class="breadcrumb" aria-label=${this.label}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </nav>

      <slot name="separator" hidden aria-hidden="true">
        <sl-icon name="chevron-right" library="system"></sl-icon>
      </slot>
    `;
    }
  };
  SlBreadcrumb.styles = breadcrumb_styles_default;
  __decorateClass([
    i23("slot")
  ], SlBreadcrumb.prototype, "defaultSlot", 2);
  __decorateClass([
    i23('slot[name="separator"]')
  ], SlBreadcrumb.prototype, "separatorSlot", 2);
  __decorateClass([
    e4()
  ], SlBreadcrumb.prototype, "label", 2);
  SlBreadcrumb = __decorateClass([
    n5("sl-breadcrumb")
  ], SlBreadcrumb);

  // ../../node_modules/@shoelace-style/shoelace/dist/chunks/chunk.RQBWTREG.js
  var avatar_styles_default = r`
  ${component_styles_default}

  :host {
    display: inline-block;

    --size: 3rem;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: var(--size);
    height: var(--size);
    background-color: rgb(var(--sl-color-neutral-400));
    font-family: var(--sl-font-sans);
    font-size: calc(var(--size) * 0.5);
    font-weight: var(--sl-font-weight-normal);
    color: rgb(var(--sl-color-neutral-0));
    overflow: hidden;
    user-select: none;
    vertical-align: middle;
  }

  .avatar--circle {
    border-radius: var(--sl-border-radius-circle);
  }

  .avatar--rounded {
    border-radius: var(--sl-border-radius-medium);
  }

  .avatar--square {
    border-radius: 0;
  }

  .avatar__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .avatar__initials {
    line-height: 1;
    text-transform: uppercase;
  }

  .avatar__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
  var SlAvatar = class extends n4 {
    constructor() {
      super(...arguments);
      this.hasError = false;
      this.shape = "circle";
    }
    render() {
      return y`
      <div
        part="base"
        class=${o5({
        avatar: true,
        "avatar--circle": this.shape === "circle",
        "avatar--rounded": this.shape === "rounded",
        "avatar--square": this.shape === "square"
      })}
        aria-label=${this.alt}
      >
        ${this.initials ? y` <div part="initials" class="avatar__initials">${this.initials}</div> ` : y`
              <div part="icon" class="avatar__icon">
                <slot name="icon">
                  <sl-icon name="person-fill" library="system"></sl-icon>
                </slot>
              </div>
            `}
        ${this.image && !this.hasError ? y`
              <img
                part="image"
                class="avatar__image"
                src="${this.image}"
                alt=""
                @error="${() => this.hasError = true}"
              />
            ` : ""}
      </div>
    `;
    }
  };
  SlAvatar.styles = avatar_styles_default;
  __decorateClass([
    t3()
  ], SlAvatar.prototype, "hasError", 2);
  __decorateClass([
    e4()
  ], SlAvatar.prototype, "image", 2);
  __decorateClass([
    e4()
  ], SlAvatar.prototype, "alt", 2);
  __decorateClass([
    e4()
  ], SlAvatar.prototype, "initials", 2);
  __decorateClass([
    e4({ reflect: true })
  ], SlAvatar.prototype, "shape", 2);
  SlAvatar = __decorateClass([
    n5("sl-avatar")
  ], SlAvatar);

  // application.js
  setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.60/dist/");
})();
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
