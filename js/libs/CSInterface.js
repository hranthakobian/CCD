/**
 * Adobe CEP CSInterface Library (CEP 7.0+ & UXP Bridge Support)
 */

var SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};

function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope;
    this.appId = appId;
    this.extensionId = extensionId;
    this.data = "";
}

function CSInterface() {
    this.hostEnvironment = this.getHostEnvironment();
}

CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";

CSInterface.prototype.getHostEnvironment = function() {
    if (window.__adobe_cep__ && window.__adobe_cep__.getHostEnvironment) {
        try {
            return JSON.parse(window.__adobe_cep__.getHostEnvironment());
        } catch (e) {
            return null;
        }
    }
    return null;
};

CSInterface.prototype.closeExtension = function() {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    }
};

CSInterface.prototype.getSystemPath = function(pathType) {
    if (window.__adobe_cep__) {
        var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
        var OSVersion = this.getOSInformation();
        if (OSVersion.indexOf("Windows") >= 0) {
            path = path.replace("file:///", "");
        } else if (OSVersion.indexOf("Mac") >= 0) {
            path = path.replace("file://", "");
        }
        return path;
    }
    return "";
};

CSInterface.prototype.evalScript = function(script, callback) {
    if (callback === null || callback === undefined) {
        callback = function() {};
    }
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback);
    } else if (typeof window.generateCalendar === "function") {
        try {
            var fn = new Function("return " + script);
            var res = fn();
            callback(String(res));
        } catch (err) {
            callback("ERROR: " + err.message);
        }
    } else {
        callback("CEP_NOT_AVAILABLE");
    }
};

CSInterface.prototype.getApplicationID = function() {
    var env = this.getHostEnvironment();
    return env ? env.appId : "IDSN";
};

CSInterface.prototype.getExtensionID = function() {
    if (window.__adobe_cep__) {
        return window.__adobe_cep__.getExtensionId();
    }
    return "com.calendar.generator.panel";
};

CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    }
};

CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    }
};

CSInterface.prototype.dispatchEvent = function(event) {
    if (window.__adobe_cep__) {
        if (typeof event.data === "object") {
            event.data = JSON.stringify(event.data);
        }
        window.__adobe_cep__.dispatchEvent(event);
    }
};

CSInterface.prototype.getOSInformation = function() {
    var userAgent = navigator.userAgent || "";
    if (navigator.platform === "Win32" || navigator.platform === "Windows") {
        return "Windows";
    } else if (navigator.platform && navigator.platform.indexOf("Mac") >= 0) {
        return "Mac OS";
    }
    return userAgent;
};
