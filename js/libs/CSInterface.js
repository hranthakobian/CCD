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
            var trimmed = String(script || "").trim();
            if (trimmed.indexOf("getDocumentUnitAndSize(") === 0) {
                var resDoc = (typeof window.getDocumentUnitAndSize === "function")
                    ? window.getDocumentUnitAndSize()
                    : '{"hasDoc":false,"unit":"mm","pageW":210,"pageH":297,"w":184.6,"h":271.6,"x":12.7,"y":12.7}';
                callback(String(resDoc));
                return;
            }
            if (trimmed.indexOf("getHostThemeInfo(") === 0) {
                var resTheme = (typeof window.getHostThemeInfo === "function")
                    ? window.getHostThemeInfo()
                    : '{"hasHost":false,"brightness":0.0,"theme":"dark"}';
                callback(String(resTheme));
                return;
            }
            if (trimmed.indexOf("getInstalledFontFamilies(") === 0) {
                var resFonts = (typeof window.getInstalledFontFamilies === "function")
                    ? window.getInstalledFontFamilies()
                    : "[]";
                callback(String(resFonts));
                return;
            }
            if (trimmed.indexOf("resetToCleanDocument(") === 0) {
                var resClean = (typeof window.resetToCleanDocument === "function")
                    ? window.resetToCleanDocument()
                    : "CLEAN_OK";
                callback(String(resClean));
                return;
            }
            if (trimmed.indexOf("renderSkeletonShimmerInDesign(") === 0) {
                var matchSkel = trimmed.match(/^renderSkeletonShimmerInDesign\s*\(\s*(['"])([\s\S]*?)\1\s*,\s*(\d+)\s*\)$/);
                if (matchSkel && typeof window.renderSkeletonShimmerInDesign === "function") {
                    var rawArgSkel = matchSkel[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                    var stepArg = parseInt(matchSkel[3], 10) || 0;
                    var resSkel = window.renderSkeletonShimmerInDesign(rawArgSkel, stepArg);
                    callback(String(resSkel));
                    return;
                }
            }
            if (trimmed.indexOf("generateCalendarFromConfig(") === 0) {
                var matchCfg = trimmed.match(/^generateCalendarFromConfig\s*\(\s*(['"])([\s\S]*?)\1\s*\)$/);
                if (matchCfg && typeof window.generateCalendarFromConfig === "function") {
                    var rawArgCfg = matchCfg[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                    var resCfg = window.generateCalendarFromConfig(rawArgCfg);
                    callback(String(resCfg));
                    return;
                }
            }
            if (trimmed.indexOf("generateCalendar(") === 0) {
                var matchGen = trimmed.match(/^generateCalendar\s*\(\s*(['"])([\s\S]*?)\1\s*\)$/);
                if (matchGen) {
                    var rawArgGen = matchGen[2].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                    if (rawArgGen.indexOf("{") !== -1 && typeof window.generateCalendarFromConfig === "function") {
                        var resGenCfg = window.generateCalendarFromConfig(rawArgGen);
                        callback(String(resGenCfg));
                        return;
                    }
                    if (typeof window.generateCalendar === "function") {
                        var resGen = window.generateCalendar(rawArgGen);
                        callback(String(resGen));
                        return;
                    }
                }
            }

            // Safe fallback evaluation
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
