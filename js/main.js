(function() {
    "use strict";

    var csInterface = new CSInterface();

    var PALETTE_COLORS = [
        "#FFFFFF", "#F4F4F4", "#DCE6F2", "#BBDEFB", "#C8E6C9", "#FFF9C4", "#FFECB3", "#FFCDD2",
        "#9E9E9E", "#616161", "#1B365D", "#0D47A1", "#1B5E20", "#F57F17", "#E65100", "#D32F2F",
        "#1F1F1F", "#000000", "#283593", "#006064", "#4A148C", "#880E4F", "#B71C1C", "#FFF5F5"
    ];

    var UNIT_TO_MM = {
        mm: 1,
        cm: 10,
        in: 25.4,
        pt: 25.4 / 72,
        px: 25.4 / 72
    };

    var isInitialized = false;
    var activeColorInputId = null;
    var liveRenderTimer = null;
    var progressAnimTimer = null;
    var hideProgressTimer = null;
    var isRendering = false;
    var pendingRenderMode = null;
    var currentUnit = "mm";

    function byId(id) {
        return document.getElementById(id);
    }

    function readNumber(id, fallbackVal, minVal, maxVal) {
        var el = byId(id);
        var val = parseFloat(el ? el.value : String(fallbackVal));
        if (isNaN(val) || val < minVal || val > maxVal) {
            return fallbackVal;
        }
        return val;
    }

    function readHex(id, fallbackHex) {
        var el = byId(id);
        var raw = el ? String(el.value || "").trim() : fallbackHex;
        if (!raw) {
            return fallbackHex;
        }
        if (raw.charAt(0) !== "#") {
            raw = "#" + raw;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
            return raw.toUpperCase();
        }
        if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
            var r = raw.charAt(1);
            var g = raw.charAt(2);
            var b = raw.charAt(3);
            return ("#" + r + r + g + g + b + b).toUpperCase();
        }
        return fallbackHex;
    }

    function updateUnitLabels(unitCode) {
        var labels = document.querySelectorAll(".unit-label");
        for (var i = 0; i < labels.length; i++) {
            labels[i].textContent = unitCode;
        }
    }

    function convertUnitValues(fromUnit, toUnit) {
        if (fromUnit === toUnit) {
            return;
        }
        var fromFactor = UNIT_TO_MM[fromUnit] || 1;
        var toFactor = UNIT_TO_MM[toUnit] || 1;
        var ratio = fromFactor / toFactor;

        var ids = ["tableWidthInput", "tableHeightInput", "tableLeftInput", "tableTopInput", "cellPadXInput", "cellPadYInput"];
        for (var i = 0; i < ids.length; i++) {
            var el = byId(ids[i]);
            if (el) {
                var val = parseFloat(el.value);
                if (!isNaN(val)) {
                    el.value = String(Math.round(val * ratio * 100) / 100);
                }
            }
        }
    }

    function syncFromInDesignDocument(triggerRenderAfter) {
        csInterface.evalScript("getDocumentUnitAndSize()", function(res) {
            if (!res || res === "CEP_NOT_AVAILABLE") {
                return;
            }
            try {
                var info = JSON.parse(res);
                if (info && info.unit) {
                    currentUnit = info.unit;
                    if (byId("unitSelect")) {
                        byId("unitSelect").value = info.unit;
                    }
                    updateUnitLabels(info.unit);
                    if (info.hasDoc) {
                        if (byId("tableWidthInput")) {
                            byId("tableWidthInput").value = String(info.w);
                        }
                        if (byId("tableHeightInput")) {
                            byId("tableHeightInput").value = String(info.h);
                        }
                        if (byId("tableLeftInput")) {
                            byId("tableLeftInput").value = String(info.x);
                        }
                        if (byId("tableTopInput")) {
                            byId("tableTopInput").value = String(info.y);
                        }
                    }
                    updatePanelPreview();
                    if (triggerRenderAfter) {
                        scheduleLiveInDesignUpdate();
                    }
                }
            } catch (e) {}
        });
    }

    function showLoadingProgress(percent, text) {
        var container = byId("loadingContainer");
        var fill = byId("loadingBarFill");
        var txt = byId("loadingText");
        var pct = byId("loadingPercent");
        if (!container || !fill) {
            return;
        }
        if (hideProgressTimer) {
            clearTimeout(hideProgressTimer);
            hideProgressTimer = null;
        }
        container.className = "loading-container";
        fill.style.width = percent + "%";
        if (txt && text) {
            txt.textContent = text;
        }
        if (pct) {
            pct.textContent = percent + "%";
        }
    }

    function finishLoadingProgress() {
        if (progressAnimTimer) {
            clearInterval(progressAnimTimer);
            progressAnimTimer = null;
        }
        showLoadingProgress(100, "Ավարտված է (100%)");
        hideProgressTimer = setTimeout(function() {
            var container = byId("loadingContainer");
            if (container) {
                container.className = "loading-container hidden";
            }
        }, 420);
    }

    function getFormConfig(overrideMode) {
        var previewModeEl = byId("previewModeSelect");
        var chosenMode = overrideMode || (previewModeEl ? previewModeEl.value : "all");

        return {
            mode: chosenMode,
            livePreview: byId("inDesignLivePreview") ? Boolean(byId("inDesignLivePreview").checked) : true,
            enableSkeleton: byId("enableSkeletonCheckbox") ? Boolean(byId("enableSkeletonCheckbox").checked) : true,
            year: Math.round(readNumber("yearInput", 2026, 1000, 9999)),
            month: Math.round(readNumber("monthSelect", 0, 0, 11)),
            lang: byId("langSelect") ? byId("langSelect").value : "hy",
            startDay: byId("startDaySelect") ? byId("startDaySelect").value : "mon",
            showTitle: byId("showTitleCheckbox") ? Boolean(byId("showTitleCheckbox").checked) : true,
            showWeekdays: byId("showWeekdaysCheckbox") ? Boolean(byId("showWeekdaysCheckbox").checked) : true,
            enableHolidays: byId("enableHolidaysCheckbox") ? Boolean(byId("enableHolidaysCheckbox").checked) : true,
            country: byId("countrySelect") ? byId("countrySelect").value : "AM",
            showInCellHoliday: byId("showInCellHolidayCheckbox") ? Boolean(byId("showInCellHolidayCheckbox").checked) : true,
            showFooterCaption: byId("showFooterCaptionCheckbox") ? Boolean(byId("showFooterCaptionCheckbox").checked) : true,
            showPadding: byId("paddingCheckbox") ? Boolean(byId("paddingCheckbox").checked) : true,
            unit: byId("unitSelect") ? byId("unitSelect").value : "mm",
            tableWidth: readNumber("tableWidthInput", 174, 5, 5000),
            tableHeight: readNumber("tableHeightInput", 250, 5, 5000),
            tableLeft: readNumber("tableLeftInput", 18, 0, 5000),
            tableTop: readNumber("tableTopInput", 18, 0, 5000),
            cellPadX: readNumber("cellPadXInput", 1.5, 0, 200),
            cellPadY: readNumber("cellPadYInput", 1.5, 0, 200),
            cellMargin: readNumber("cellMarginInput", 0.75, 0, 30),
            cellAlignH: byId("cellAlignHSelect") ? byId("cellAlignHSelect").value : "CENTER",
            cellAlignV: byId("cellAlignVSelect") ? byId("cellAlignVSelect").value : "CENTER",
            titleFont: byId("titleFont") ? byId("titleFont").value : "Calibri",
            titleSize: readNumber("titleSize", 18, 6, 120),
            headerFont: byId("headerFont") ? byId("headerFont").value : "Calibri",
            headerSize: readNumber("headerSize", 11, 6, 72),
            dayFont: byId("dayFont") ? byId("dayFont").value : "Calibri",
            daySize: readNumber("daySize", 12, 6, 72),
            weekendSize: readNumber("weekendSize", 12, 6, 72),
            paddingSize: readNumber("paddingSize", 10, 6, 72),
            titleTextColor: readHex("titleTextColor", "#FFFFFF"),
            titleBgColor: readHex("titleBgColor", "#1B365D"),
            headerTextColor: readHex("headerTextColor", "#1B365D"),
            headerBgColor: readHex("headerBgColor", "#DCE6F2"),
            dayTextColor: readHex("dayTextColor", "#1F1F1F"),
            dayBgColor: readHex("dayBgColor", "#FFFFFF"),
            weekendTextColor: readHex("weekendTextColor", "#C62828"),
            weekendBgColor: readHex("weekendBgColor", "#FFF5F5"),
            paddingTextColor: readHex("paddingTextColor", "#9E9E9E"),
            paddingBgColor: readHex("paddingBgColor", "#F4F4F4"),
            holidayTextColor: readHex("holidayTextColor", "#FFFFFF"),
            holidayBgColor: readHex("holidayBgColor", "#D32F2F"),
            movableTextColor: readHex("movableTextColor", "#0D47A1"),
            movableBgColor: readHex("movableBgColor", "#BBDEFB")
        };
    }

    function syncSwatchButtons() {
        var buttons = document.querySelectorAll(".swatch-btn");
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var targetId = btn.getAttribute("data-target");
            var hex = readHex(targetId, "#000000");
            btn.style.backgroundColor = hex;
        }
    }

    function getCalendarMatrix(year, month, startDay) {
        var firstDayOfMonth = new Date(year, month, 1).getDay();
        var daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        var daysInPrevMonth = new Date(year, month, 0).getDate();

        var startOffset = (startDay === "mon") ? ((firstDayOfMonth + 6) % 7) : firstDayOfMonth;
        var totalSlotsNeeded = startOffset + daysInCurrentMonth;
        var weekRows = Math.ceil(totalSlotsNeeded / 7);
        var totalCells = weekRows * 7;

        var cells = [];
        for (var i = 0; i < totalCells; i++) {
            if (i < startOffset) {
                cells.push({
                    day: daysInPrevMonth - startOffset + 1 + i,
                    isPadding: true
                });
            } else if (i < startOffset + daysInCurrentMonth) {
                cells.push({
                    day: i - startOffset + 1,
                    isPadding: false
                });
            } else {
                cells.push({
                    day: i - (startOffset + daysInCurrentMonth) + 1,
                    isPadding: true
                });
            }
        }

        return {
            startOffset: startOffset,
            daysInCurrentMonth: daysInCurrentMonth,
            weekRows: weekRows,
            cells: cells
        };
    }

    function updatePanelPreview() {
        syncSwatchButtons();
        var livePreviewText = byId("livePreviewText");
        var livePreviewGrid = byId("livePreviewGrid");
        var holidaySummaryBox = byId("holidaySummaryBox");
        if (!livePreviewText || !livePreviewGrid) {
            return;
        }

        var cfg = getFormConfig();
        var locale = (typeof window.getLocaleData === "function")
            ? window.getLocaleData(cfg.lang)
            : { months: ["Հունվար"], daysMon: ["Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ", "Կիր"], daysSun: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ"] };

        var monthTitle = locale.months[cfg.month] + " " + cfg.year;
        var dayHeaders = cfg.startDay === "mon" ? locale.daysMon : locale.daysSun;
        var scopeLabel = cfg.mode === "all" ? "12 ամիս (12 էջ)" : ("1 ամիս (" + locale.months[cfg.month] + ")");

        var holidaysMap = (cfg.enableHolidays && typeof window.getYearHolidays === "function")
            ? window.getYearHolidays(cfg.year, cfg.country, cfg.lang)
            : {};

        if (cfg.showTitle) {
            livePreviewText.style.display = "block";
            livePreviewText.style.backgroundColor = cfg.titleBgColor;
            livePreviewText.style.color = cfg.titleTextColor;
            livePreviewText.textContent = monthTitle + " — " + scopeLabel + " | " + cfg.tableWidth + "x" + cfg.tableHeight + " " + cfg.unit;
        } else {
            livePreviewText.style.display = "none";
        }

        livePreviewGrid.innerHTML = "";

        if (cfg.showWeekdays) {
            for (var h = 0; h < 7; h++) {
                var headerEl = document.createElement("div");
                headerEl.className = "preview-cell";
                headerEl.style.backgroundColor = cfg.headerBgColor;
                headerEl.style.color = cfg.headerTextColor;
                headerEl.style.fontWeight = "700";
                headerEl.textContent = dayHeaders[h];
                livePreviewGrid.appendChild(headerEl);
            }
        }

        var matrix = getCalendarMatrix(cfg.year, cfg.month, cfg.startDay);
        var isMon = (cfg.startDay === "mon");
        var cssTextAlign = cfg.cellAlignH === "LEFT" ? "left" : (cfg.cellAlignH === "RIGHT" ? "right" : "center");

        for (var c = 0; c < matrix.cells.length; c++) {
            var item = matrix.cells[c];
            var colIdx = c % 7;
            var isWeekend = isMon ? (colIdx === 5 || colIdx === 6) : (colIdx === 0 || colIdx === 6);
            var cellEl = document.createElement("div");
            cellEl.className = "preview-cell";
            cellEl.style.textAlign = cssTextAlign;

            if (item.isPadding) {
                if (cfg.showPadding) {
                    cellEl.style.backgroundColor = cfg.paddingBgColor;
                    cellEl.style.color = cfg.paddingTextColor;
                    cellEl.textContent = String(item.day);
                } else {
                    cellEl.style.backgroundColor = "transparent";
                    cellEl.textContent = "";
                }
            } else {
                var hInfo = cfg.enableHolidays ? holidaysMap[cfg.month + "-" + item.day] : null;
                cellEl.textContent = String(item.day);
                if (hInfo) {
                    if (hInfo.isMovable) {
                        cellEl.style.backgroundColor = cfg.movableBgColor;
                        cellEl.style.color = cfg.movableTextColor;
                    } else {
                        cellEl.style.backgroundColor = cfg.holidayBgColor;
                        cellEl.style.color = cfg.holidayTextColor;
                    }
                    cellEl.title = hInfo.name;
                } else if (isWeekend) {
                    cellEl.style.backgroundColor = cfg.weekendBgColor;
                    cellEl.style.color = cfg.weekendTextColor;
                } else {
                    cellEl.style.backgroundColor = cfg.dayBgColor;
                    cellEl.style.color = cfg.dayTextColor;
                }
            }
            livePreviewGrid.appendChild(cellEl);
        }

        if (holidaySummaryBox) {
            holidaySummaryBox.innerHTML = "";
            if (!cfg.enableHolidays || !cfg.showFooterCaption) {
                holidaySummaryBox.textContent = !cfg.enableHolidays ? "Տոները անջատված են։" : "Տակագրերը անջատված են։";
                return;
            }
            var monthHolidays = [];
            for (var d = 1; d <= matrix.daysInCurrentMonth; d++) {
                var hk = cfg.month + "-" + d;
                if (holidaysMap[hk]) {
                    monthHolidays.push(holidaysMap[hk]);
                }
            }
            if (monthHolidays.length === 0) {
                holidaySummaryBox.textContent = locale.months[cfg.month] + " ամսում նշված տոներ չկան։";
            } else {
                for (var mIdx = 0; mIdx < monthHolidays.length; mIdx++) {
                    var mh = monthHolidays[mIdx];
                    var rowDiv = document.createElement("div");
                    rowDiv.className = "holiday-item";
                    var badge = document.createElement("span");
                    badge.className = "holiday-badge";
                    if (mh.isMovable) {
                        badge.style.backgroundColor = cfg.movableBgColor;
                        badge.style.color = cfg.movableTextColor;
                        badge.textContent = mh.day + " (Շարժ.)";
                    } else {
                        badge.style.backgroundColor = cfg.holidayBgColor;
                        badge.style.color = cfg.holidayTextColor;
                        badge.textContent = mh.day + " (Անշ.)";
                    }
                    var nameSpan = document.createElement("span");
                    nameSpan.textContent = mh.name;
                    rowDiv.appendChild(badge);
                    rowDiv.appendChild(nameSpan);
                    holidaySummaryBox.appendChild(rowDiv);
                }
            }
        }
    }

    function runFinalCalendarGeneration(cfg, escapedJson, isLivePreview) {
        var statusMsg = byId("statusMsg");
        showLoadingProgress(75, "Գեներացվում է օրացույցը InDesign-ում...");
        var scriptCall = "generateCalendarFromConfig('" + escapedJson + "')";

        csInterface.evalScript(scriptCall, function(result) {
            isRendering = false;
            finishLoadingProgress();

            if (pendingRenderMode) {
                var nextMode = pendingRenderMode;
                pendingRenderMode = null;
                executeInDesignGeneration(nextMode, true);
                return;
            }
            if (!statusMsg) {
                return;
            }
            if (result && result.indexOf("SUCCESS:12") === 0) {
                statusMsg.className = "status-msg success";
                statusMsg.textContent = isLivePreview
                    ? "Live Preview՝ բոլոր 12 էջերը թարմացվեցին։"
                    : "Բոլոր 12 ամիսները (12 էջ) հաջողությամբ ստեղծվեցին։";
            } else if (result && result.indexOf("SUCCESS:1") === 0) {
                statusMsg.className = "status-msg success";
                statusMsg.textContent = isLivePreview
                    ? "Live Preview՝ ընտրված ամսվա էջը թարմացվեց։"
                    : "Ընտրված ամսվա աղյուսակը հաջողությամբ ստեղծվեց։";
            } else if (result === "CEP_NOT_AVAILABLE") {
                statusMsg.className = "status-msg error";
                statusMsg.textContent = "InDesign միջավայրը հասանելի չէ։";
            } else {
                statusMsg.className = "status-msg error";
                statusMsg.textContent = "Սխալ՝ " + (result || "Անհայտ սխալ");
            }
        });
    }

    function executeInDesignGeneration(mode, isLivePreview) {
        var statusMsg = byId("statusMsg");
        if (isRendering) {
            pendingRenderMode = mode;
            return;
        }
        isRendering = true;

        var cfg = getFormConfig(mode);
        var jsonPayload = JSON.stringify(cfg);
        var escapedJson = jsonPayload.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

        if (statusMsg) {
            statusMsg.className = "status-msg";
            statusMsg.textContent = cfg.enableSkeleton
                ? "Սկելետոն շիմեր անիմացիա էջում..."
                : "Ստեղծվում է օրացույցը InDesign-ում...";
        }

        if (cfg.enableSkeleton) {
            showLoadingProgress(35, "Սկելետոն շիմեր (Step 1)...");
            var skelCall1 = "renderSkeletonShimmerInDesign('" + escapedJson + "', 0)";
            csInterface.evalScript(skelCall1, function() {
                setTimeout(function() {
                    showLoadingProgress(55, "Սկելետոն շիմեր (Step 2)...");
                    var skelCall2 = "renderSkeletonShimmerInDesign('" + escapedJson + "', 1)";
                    csInterface.evalScript(skelCall2, function() {
                        setTimeout(function() {
                            runFinalCalendarGeneration(cfg, escapedJson, isLivePreview);
                        }, 85);
                    });
                }, 85);
            });
        } else {
            runFinalCalendarGeneration(cfg, escapedJson, isLivePreview);
        }
    }

    function scheduleLiveInDesignUpdate() {
        updatePanelPreview();
        var liveToggle = byId("inDesignLivePreview");
        if (!liveToggle || !liveToggle.checked) {
            return;
        }
        showLoadingProgress(18, "Պատրաստվում է թարմացման...");
        if (liveRenderTimer) {
            clearTimeout(liveRenderTimer);
        }
        liveRenderTimer = setTimeout(function() {
            var modeEl = byId("previewModeSelect");
            var mode = modeEl ? modeEl.value : "all";
            executeInDesignGeneration(mode, true);
        }, 420);
    }

    function initSwatchPalette() {
        var paletteEl = byId("swatchPalette");
        if (!paletteEl) {
            return;
        }
        paletteEl.innerHTML = "";
        for (var i = 0; i < PALETTE_COLORS.length; i++) {
            var cHex = PALETTE_COLORS[i];
            var item = document.createElement("div");
            item.className = "palette-item";
            item.style.backgroundColor = cHex;
            item.setAttribute("data-color", cHex);
            item.addEventListener("click", function(ev) {
                var picked = ev.currentTarget.getAttribute("data-color");
                if (activeColorInputId) {
                    var targetInput = byId(activeColorInputId);
                    if (targetInput) {
                        targetInput.value = picked;
                    }
                }
                paletteEl.className = "swatch-palette hidden";
                activeColorInputId = null;
                scheduleLiveInDesignUpdate();
            });
            paletteEl.appendChild(item);
        }

        var swatchBtns = document.querySelectorAll(".swatch-btn");
        for (var b = 0; b < swatchBtns.length; b++) {
            swatchBtns[b].addEventListener("click", function(ev) {
                var targetId = ev.currentTarget.getAttribute("data-target");
                if (activeColorInputId === targetId && paletteEl.className.indexOf("hidden") === -1) {
                    paletteEl.className = "swatch-palette hidden";
                    activeColorInputId = null;
                } else {
                    activeColorInputId = targetId;
                    paletteEl.className = "swatch-palette";
                }
            });
        }
    }

    function initCheckboxRows() {
        var rows = document.querySelectorAll(".checkbox-row");
        for (var i = 0; i < rows.length; i++) {
            rows[i].addEventListener("click", function(ev) {
                if (ev.target && ev.target.tagName && ev.target.tagName.toLowerCase() === "input") {
                    return;
                }
                var checkId = ev.currentTarget.getAttribute("data-check");
                var chk = byId(checkId);
                if (chk) {
                    chk.checked = !chk.checked;
                    scheduleLiveInDesignUpdate();
                }
            });
        }
    }

    function initUI() {
        if (!isInitialized && byId("generateAllBtn")) {
            initSwatchPalette();
            initCheckboxRows();

            var toggleBtn = byId("toggleLivePreviewBtn");
            var liveChk = byId("inDesignLivePreview");
            if (toggleBtn && liveChk) {
                toggleBtn.addEventListener("click", function() {
                    liveChk.checked = !liveChk.checked;
                    if (liveChk.checked) {
                        toggleBtn.className = "btn-live-toggle active";
                        toggleBtn.textContent = "Live Preview՝ ՄԻԱՑՎԱԾ Է (Սեղմեք անջատելու համար)";
                        scheduleLiveInDesignUpdate();
                    } else {
                        if (liveRenderTimer) {
                            clearTimeout(liveRenderTimer);
                        }
                        toggleBtn.className = "btn-live-toggle inactive";
                        toggleBtn.textContent = "Live Preview՝ ԱՆՋԱՏՎԱԾ Է (Սեղմեք միացնելու համար)";
                        if (byId("loadingContainer")) {
                            byId("loadingContainer").className = "loading-container hidden";
                        }
                    }
                });
            }

            var unitSelect = byId("unitSelect");
            if (unitSelect) {
                unitSelect.addEventListener("change", function() {
                    var newUnit = unitSelect.value;
                    convertUnitValues(currentUnit, newUnit);
                    currentUnit = newUnit;
                    updateUnitLabels(newUnit);
                    scheduleLiveInDesignUpdate();
                });
            }

            var syncBtn = byId("syncDocSettingsBtn");
            if (syncBtn) {
                syncBtn.addEventListener("click", function() {
                    syncFromInDesignDocument(true);
                });
            }

            var inputs = document.querySelectorAll("input, select");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].id === "unitSelect" || inputs[i].id === "inDesignLivePreview") {
                    continue;
                }
                inputs[i].addEventListener("input", scheduleLiveInDesignUpdate);
                inputs[i].addEventListener("change", scheduleLiveInDesignUpdate);
            }

            byId("generateAllBtn").addEventListener("click", function() {
                if (byId("previewModeSelect")) {
                    byId("previewModeSelect").value = "all";
                }
                updatePanelPreview();
                executeInDesignGeneration("all", false);
            });

            byId("generateSingleBtn").addEventListener("click", function() {
                if (byId("previewModeSelect")) {
                    byId("previewModeSelect").value = "single";
                }
                updatePanelPreview();
                executeInDesignGeneration("single", false);
            });

            isInitialized = true;
            syncFromInDesignDocument(false);
        }
        updatePanelPreview();
    }

    if (typeof require === "function") {
        try {
            var uxp = require("uxp");
            if (uxp && uxp.entrypoints && typeof uxp.entrypoints.setup === "function") {
                uxp.entrypoints.setup({
                    panels: {
                        calendarGeneratorPanel: {
                            create: function() {
                                initUI();
                            },
                            show: function() {
                                initUI();
                            }
                        }
                    },
                    commands: {
                        generateCalendarNow: {
                            run: function() {
                                initUI();
                                executeInDesignGeneration("all", false);
                            }
                        }
                    }
                });
            }
        } catch (e) {
            // Running outside UXP
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUI);
    } else {
        initUI();
    }
})();
