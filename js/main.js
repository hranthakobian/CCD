(function() {
    "use strict";

    var csInterface = new CSInterface();

    var PLUGIN_VERSION = "1.2.0";
    var GITHUB_REPO = "hranthakobian/CCD";
    var GITHUB_RELEASES_API = "https://api.github.com/repos/" + GITHUB_REPO + "/releases/latest";
    var GITHUB_RELEASES_LIST_API = "https://api.github.com/repos/" + GITHUB_REPO + "/releases";
    var GITHUB_RAW_MANIFEST = "https://raw.githubusercontent.com/" + GITHUB_REPO + "/main/manifest.json";
    var GITHUB_RELEASES_WEB = "https://github.com/" + GITHUB_REPO + "/releases";

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

    var UI_TRANSLATIONS = {
        hy: {
            panelTitle: "Օրացույցի Ստեղծիչ",
            subtitle: "12 Ամիս եւ Shimmer",
            checkUpdateTitle: "Ստուգել թարմացումները GitHub-ում",
            updateAvailableTitle: "Հասանելի է նոր տարբերակ՝ ",
            updateUpToDateTitle: "Դուք օգտագործում եք վերջին տարբերակը",
            updateChecking: "Ստուգվում են թարմացումները...",
            updateInstalling: "Թարմացվում է GitHub-ից...",
            updateInstalledSuccess: "Թարմացումը տեղադրվեց։ Վերաբեռնվում է...",
            updateError: "Չհաջողվեց ստուգել թարմացումները GitHub-ից։",
            updateNowBtn: "Թարմացնել հիմա",
            openGithubBtn: "Բացել GitHub-ում",
            loadingUpdating: "Թարմացվում է InDesign-ում...",
            loadingPreparing: "Պատրաստվում է թարմացման...",
            loadingShimmer: "Սահուն շիմեր անիմացիա...",
            loadingGenerating: "Ստեղծվում է օրացույցը InDesign-ում...",
            loadingDone: "Ավարտված է (100%)",
            startPreviewBtn: "▶ Սկսել",
            startPreviewText: "Սկսել",
            refreshBtn: "↻ Թարմացնել",
            refreshText: "Թարմացնել",
            refreshBtnTitle: "Թարմացնել InDesign-ում",
            liveActiveBtn: "Ուղիղ Նախադիտում՝ ՄԻԱՑՎԱԾ",
            liveInactiveBtn: "Ուղիղ Նախադիտում՝ ԱՆՋԱՏՎԱԾ",
            livePreviewShort: "Ուղիղ Նախադիտում",
            genCalendarBtn: "Ստեղծել օրացույցը",
            genAllText: "Ստեղծել (12 էջ)",
            genSingleText: "Ստեղծել (1 էջ)",
            resetDocBtn: "Մաքուր թուղթ",
            scopeBadge12: "12 էջ",
            scopeBadge1: "1 էջ",
            statusCleaningDoc: "Մաքրվում է փաստաթուղթը...",
            statusDocCleaned: "Փաստաթուղթը մաքրվեց (Մաքուր թուղթ)։",
            statusAutoSynced: "InDesign-ը միացված է․ ինքնաթարմացվեց։",
            previewScopeLabel: "Նախադիտման եւ ստեղծման ծավալ",
            scopeAll12: "Բոլոր 12 ամիսները (12 էջ)",
            scopeSingle1: "Միայն ընտրված ամիսը (1 էջ)",
            skeletonToggleLabel: "Սկելետոն շիմեր անիմացիա InDesign-ի էջերում",
            sec1Title: "1. Հիմնական, Լեզուներ, Վերնագրեր եւ Տոներ",
            yearLabel: "Տարի",
            monthLabel: "Ամիս (1 ամսվա համար)",
            month0: "Հունվար",
            month1: "Փետրվար",
            month2: "Մարտ",
            month3: "Ապրիլ",
            month4: "Մայիս",
            month5: "Հունիս",
            month6: "Հուլիս",
            month7: "Օգոստոս",
            month8: "Սեպտեմբեր",
            month9: "Հոկտեմբեր",
            month10: "Նոյեմբեր",
            month11: "Դեկտեմբեր",
            calLangLabel: "Լեզու (12 լեզու)",
            lang_hy: "Հայերեն (Արեւելահայերեն)",
            lang_hy_w: "Հայերեն (Արեւմտահայերեն)",
            lang_en: "Անգլերեն (English)",
            lang_ru: "Ռուսերեն (Русский)",
            lang_fr: "Ֆրանսերեն (Français)",
            lang_de: "Գերմաներեն (Deutsch)",
            lang_es: "Իսպաներեն (Español)",
            lang_it: "Իտալերեն (Italiano)",
            lang_pt: "Պորտուգալերեն (Português)",
            lang_ka: "Վրացերեն (ქართული)",
            lang_el: "Հունարեն (Ελληνικά)",
            lang_pl: "Լեհերեն (Polski)",
            startDayLabel: "Շաբաթվա սկիզբ",
            startMon: "Երկուշաբթի",
            startSun: "Կիրակի",
            showTitleLabel: "Ցուցադրել ամսվա եւ տարվա վերնագիրը",
            showWeekdaysLabel: "Ցուցադրել շաբաթվա օրերի վերնագրի տողը",
            showPaddingLabel: "Ցուցադրել նախորդ/հաջորդ ամիսների թվերը",
            forceSixRowsLabel: "Բոլոր ամիսները դարձնել 6 տողանի",
            enableHolidaysLabel: "Միացնել տոները (Անշարժ եւ շարժական)",
            countryLabel: "Երկիր (Տոների բազա)",
            country_AM: "Հայաստան (Պետական + Եկեղեցական շարժական)",
            country_RU: "Ռուսաստան (Պետական + Ուղղափառ շարժական)",
            country_US: "ԱՄՆ (Դաշնային + Շարժական տոներ)",
            country_FR: "Ֆրանսիա (Ազգային + Շարժական տոներ)",
            country_DE: "Գերմանիա (Ազգային + Շարժական տոներ)",
            country_GE: "Վրաստան (Պետական + Ուղղափառ շարժական)",
            country_EU: "Եվրոպա / Միջազգային",
            showInCellHolidayLabel: "Ցուցադրել տոների տեքստը վանդակների մեջ",
            showFooterCaptionLabel: "Ցուցադրել տակագրերը (Ամսվա տոների ստորին տող)",
            sec2Title: "2. Չափեր, Միավոր, Padding, Margin եւ Դիրք",
            unitLabel: "Չափման միավոր",
            unit_mm: "Միլիմետր (mm)",
            unit_cm: "Սանտիմետր (cm)",
            unit_pt: "Պունկտ (pt)",
            unit_in: "Դյույմ (in)",
            unit_px: "Պիքսել (px)",
            syncPageBtn: "Վերցնել էջից (Auto)",
            widthLabel: "Լայնություն",
            heightLabel: "Բարձրություն",
            leftMarginLabel: "Margin Ձախ X",
            topMarginLabel: "Margin Վերեւ Y",
            cellPadXLabel: "Բջիջ Padding X",
            cellPadYLabel: "Բջիջ Padding Y",
            cellMarginLabel: "Բջիջների Margin / Եզր (pt)",
            cellPosLabel: "Բջիջի դիրք (9-կետ)",
            alignH_LEFT: "Ձախ",
            alignH_CENTER: "Կենտ.",
            alignH_RIGHT: "Աջ",
            alignV_TOP: "Վերեւ",
            alignV_CENTER: "Կենտ.",
            alignV_BOTTOM: "Ներքեւ",
            sec3Title: "3. Տառատեսակներ եւ Տառաչափ (Typography)",
            titleFontLabel: "Վերնագրի տառատեսակ",
            headerFontLabel: "Շաբաթվա օրերի տառատեսակ",
            dayFontLabel: "Օրերի թվերի տառատեսակ",
            defaultCalibri: "Calibri (Լռելյայն)",
            sizePtLabel: "Չափ (pt)",
            weekendSizeLabel: "Շաբաթ-Կիրակի (pt)",
            paddingSizeLabel: "Հարեւան ամիսներ (pt)",
            sec4Title: "4. Գույներ եւ Վանդակների Տեսք (Colors)",
            colElem: "Տարր",
            colTextColor: "Տեքստի գույն",
            colBgColor: "Վանդակի ֆոն",
            colorTitleRow: "Ամիս / Տարի (Վերնագիր)",
            colorHeaderRow: "Առաջին տող (Օրեր)",
            colorRegularDays: "Սովորական օրեր",
            colorWeekendDays: "Շաբաթ - Կիրակի",
            colorPaddingDays: "Նախորդ/Հաջորդ ամիս",
            colorFixedHolidays: "Պետական տոներ",
            colorMovableHolidays: "Շարժական տոներ",
            sec5PreviewTitle: "Նախադիտում եւ Տոների Ցանկ",
            genAllBtn: "Ստեղծել 12 ամիսները (12 էջ)",
            genSingleBtn: "Ստեղծել միայն ընտրված ամիսը",
            scopeShortAll: "12 ամիս (12 էջ)",
            scopeShortSinglePrefix: "1 ամիս (",
            holidaysDisabledMsg: "Տոները անջատված են։",
            captionsDisabledMsg: "Տակագրերը անջատված են։",
            noHolidaysInMonthSuffix: " ամսում նշված տոներ չկան։",
            badgeMovable: " (Շարժ.)",
            badgeFixed: " (Անշ.)",
            statusLive12: "Ուղիղ Նախադիտում՝ բոլոր 12 էջերը թարմացվեցին։",
            statusGen12: "Բոլոր 12 ամիսները (12 էջ) հաջողությամբ ստեղծվեցին։",
            statusLive1: "Ուղիղ Նախադիտում՝ ընտրված ամսվա էջը թարմացվեց։",
            statusGen1: "Ընտրված ամսվա աղյուսակը հաջողությամբ ստեղծվեց։",
            statusNoHost: "InDesign միջավայրը հասանելի չէ։",
            statusErrorPrefix: "Սխալ՝ ",
            statusUnknownError: "Անհայտ սխալ",
            statusShimmerPage: "Սահուն շիմեր անիմացիա էջում...",
            statusCreatingCal: "Ստեղծվում է օրացույցը InDesign-ում..."
        },
        en: {
            panelTitle: "Օրացույցի Ստեղծիչ",
            subtitle: "12 Months & Shimmer",
            checkUpdateTitle: "Check for updates on GitHub",
            updateAvailableTitle: "New version available: ",
            updateUpToDateTitle: "You are using the latest version",
            updateChecking: "Checking for updates...",
            updateInstalling: "Updating from GitHub...",
            updateInstalledSuccess: "Update installed! Reloading...",
            updateError: "Could not check updates from GitHub.",
            updateNowBtn: "Update Now",
            openGithubBtn: "View on GitHub",
            loadingUpdating: "Updating in InDesign...",
            loadingPreparing: "Preparing update...",
            loadingShimmer: "Smooth shimmer animation...",
            loadingGenerating: "Generating calendar in InDesign...",
            loadingDone: "Completed (100%)",
            startPreviewBtn: "▶ Start",
            startPreviewText: "Start",
            refreshBtn: "↻ Refresh",
            refreshText: "Refresh",
            refreshBtnTitle: "Refresh in InDesign",
            liveActiveBtn: "Live Preview: ON",
            liveInactiveBtn: "Live Preview: OFF",
            livePreviewShort: "Live Preview",
            genCalendarBtn: "Generate Calendar",
            genAllText: "Generate (12 Pages)",
            genSingleText: "Generate (1 Page)",
            resetDocBtn: "Clean Page",
            scopeBadge12: "12 Pages",
            scopeBadge1: "1 Page",
            statusCleaningDoc: "Cleaning document...",
            statusDocCleaned: "Document cleared (Clean sheet).",
            statusAutoSynced: "Connected to InDesign: auto-updated.",
            previewScopeLabel: "Preview & Generation Scope",
            scopeAll12: "All 12 Months (12 Pages)",
            scopeSingle1: "Selected Month Only (1 Page)",
            skeletonToggleLabel: "Skeleton shimmer animation on InDesign pages",
            sec1Title: "1. General, Languages, Headers & Holidays",
            yearLabel: "Year",
            monthLabel: "Month (for 1 page)",
            month0: "January",
            month1: "February",
            month2: "March",
            month3: "April",
            month4: "May",
            month5: "June",
            month6: "July",
            month7: "August",
            month8: "September",
            month9: "October",
            month10: "November",
            month11: "December",
            calLangLabel: "Calendar Language (12)",
            lang_hy: "Armenian (Eastern)",
            lang_hy_w: "Armenian (Western)",
            lang_en: "English",
            lang_ru: "Russian (Русский)",
            lang_fr: "French (Français)",
            lang_de: "German (Deutsch)",
            lang_es: "Spanish (Español)",
            lang_it: "Italian (Italiano)",
            lang_pt: "Portuguese (Português)",
            lang_ka: "Georgian (ქართული)",
            lang_el: "Greek (Ελληνικά)",
            lang_pl: "Polish (Polski)",
            startDayLabel: "Week Starts On",
            startMon: "Monday",
            startSun: "Sunday",
            showTitleLabel: "Show Month & Year Title Row",
            showWeekdaysLabel: "Show Weekday Names Header Row",
            showPaddingLabel: "Show Prev/Next Month Padding Days",
            forceSixRowsLabel: "Make all months 6 rows",
            enableHolidaysLabel: "Enable Holidays (Fixed & Movable)",
            countryLabel: "Country (Holiday Database)",
            country_AM: "Armenia (State + Church Movable)",
            country_RU: "Russia (State + Orthodox Movable)",
            country_US: "USA (Federal + Movable Holidays)",
            country_FR: "France (National + Movable Holidays)",
            country_DE: "Germany (National + Movable Holidays)",
            country_GE: "Georgia (State + Orthodox Movable)",
            country_EU: "Europe / International",
            showInCellHolidayLabel: "Show Holiday Names Inside Cells",
            showFooterCaptionLabel: "Show Footer Captions (Bottom Holiday Row)",
            sec2Title: "2. Dimensions, Unit, Padding, Margin & Position",
            unitLabel: "Measurement Unit",
            unit_mm: "Millimeters (mm)",
            unit_cm: "Centimeters (cm)",
            unit_pt: "Points (pt)",
            unit_in: "Inches (in)",
            unit_px: "Pixels (px)",
            syncPageBtn: "Sync from Page (Auto)",
            widthLabel: "Width",
            heightLabel: "Height",
            leftMarginLabel: "Left Margin X",
            topMarginLabel: "Top Margin Y",
            cellPadXLabel: "Cell Padding X",
            cellPadYLabel: "Cell Padding Y",
            cellMarginLabel: "Cell Border / Stroke (pt)",
            cellPosLabel: "Cell Alignment (9-pt)",
            alignH_LEFT: "Left",
            alignH_CENTER: "Cent.",
            alignH_RIGHT: "Right",
            alignV_TOP: "Top",
            alignV_CENTER: "Mid.",
            alignV_BOTTOM: "Bot.",
            sec3Title: "3. Fonts & Font Sizes (Typography)",
            titleFontLabel: "Title Font",
            headerFontLabel: "Weekdays Header Font",
            dayFontLabel: "Day Numbers Font",
            defaultCalibri: "Calibri (Default)",
            sizePtLabel: "Size (pt)",
            weekendSizeLabel: "Weekend (pt)",
            paddingSizeLabel: "Adjacent Months (pt)",
            sec4Title: "4. Colors & Cell Appearance",
            colElem: "Element",
            colTextColor: "Text Color",
            colBgColor: "Cell Fill",
            colorTitleRow: "Month / Year (Title)",
            colorHeaderRow: "First Row (Weekdays)",
            colorRegularDays: "Regular Days",
            colorWeekendDays: "Saturday - Sunday",
            colorPaddingDays: "Prev/Next Month",
            colorFixedHolidays: "Public Holidays",
            colorMovableHolidays: "Movable Holidays",
            sec5PreviewTitle: "Preview & Holidays Summary",
            genAllBtn: "Generate All 12 Months (12 Pages)",
            genSingleBtn: "Generate Selected Month Only",
            scopeShortAll: "12 months (12 pages)",
            scopeShortSinglePrefix: "1 month (",
            holidaysDisabledMsg: "Holidays are disabled.",
            captionsDisabledMsg: "Footer captions are disabled.",
            noHolidaysInMonthSuffix: " has no listed holidays.",
            badgeMovable: " (Mov.)",
            badgeFixed: " (Fixed)",
            statusLive12: "Live Preview: All 12 pages updated.",
            statusGen12: "All 12 months (12 pages) generated successfully.",
            statusLive1: "Live Preview: Selected month page updated.",
            statusGen1: "Selected month calendar generated successfully.",
            statusNoHost: "InDesign environment is not available.",
            statusErrorPrefix: "Error: ",
            statusUnknownError: "Unknown error",
            statusShimmerPage: "Smooth shimmer animation on page...",
            statusCreatingCal: "Creating calendar in InDesign..."
        }
    };

    var isInitialized = false;
    var currentUiLang = "hy";
    var usePageMargins = true;
    var activeColorInputId = null;
    var liveRenderTimer = null;
    var progressAnimTimer = null;
    var currentProgressPct = 0;
    var targetProgressPct = 0;
    var hideProgressTimer = null;
    var isRendering = false;
    var pendingRenderMode = null;
    var pendingRenderIsLive = false;
    var currentUnit = "mm";
    var currentAlignH = "CENTER";
    var currentAlignV = "CENTER";
    var latestReleaseUrl = GITHUB_RELEASES_WEB;
    var latestReleaseTag = null;
    var themePollTimer = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function t(key) {
        var dict = UI_TRANSLATIONS[currentUiLang] || UI_TRANSLATIONS.hy;
        return dict[key] !== undefined ? dict[key] : (UI_TRANSLATIONS.hy[key] || key);
    }

    function applyUiLanguage(langCode) {
        currentUiLang = (langCode === "en") ? "en" : "hy";
        try {
            localStorage.setItem("ccd_ui_lang", currentUiLang);
        } catch (eStorage) {}

        try {
            if (document.documentElement) {
                document.documentElement.lang = currentUiLang;
            }
        } catch (eDocLang) {}

        var hyBtn = byId("uiLangHyBtn");
        var enBtn = byId("uiLangEnBtn");
        if (hyBtn && enBtn) {
            hyBtn.className = currentUiLang === "hy" ? "lang-btn active" : "lang-btn";
            enBtn.className = currentUiLang === "en" ? "lang-btn active" : "lang-btn";
        }

        var checkUpdateBtn = byId("checkUpdateBtn");
        if (checkUpdateBtn) {
            checkUpdateBtn.title = t("checkUpdateTitle");
        }

        var nodes = document.querySelectorAll("[data-i18n]");
        for (var i = 0; i < nodes.length; i++) {
            var k = nodes[i].getAttribute("data-i18n");
            if (k) {
                nodes[i].textContent = t(k);
            }
        }

        var liveChk = byId("inDesignLivePreview");
        var toggleBtn = byId("toggleLivePreviewBtn");
        var liveText = byId("liveBtnText");
        if (toggleBtn && liveChk) {
            toggleBtn.className = liveChk.checked ? "btn-action btn-live active" : "btn-action btn-live inactive";
            if (liveText) {
                liveText.textContent = t("livePreviewShort");
            }
        }

        updateAlignReadouts();
        updateScopeUI();
        updateStartButtonState(isRendering);
        updatePanelPreview();
    }

    var isStarted = false;

    function updateScopeUI() {
        var previewModeEl = byId("previewModeSelect");
        var mode = previewModeEl ? previewModeEl.value : "all";
        var scopeBadge = byId("previewScopeBadge");
        var genBtnText = byId("generateBtnText");

        if (scopeBadge) {
            scopeBadge.textContent = (mode === "all") ? t("scopeBadge12") : t("scopeBadge1");
        }
        if (genBtnText) {
            genBtnText.textContent = (mode === "all") ? t("genAllText") : t("genSingleText");
        }
    }

    function updateStartButtonState(rendering) {
        var startBtn = byId("startPreviewBtn");
        var iconEl = byId("startBtnIcon");
        var textEl = byId("startBtnText");
        if (!startBtn) return;

        if (isStarted) {
            startBtn.className = "btn-action btn-start started";
            startBtn.title = t("refreshBtnTitle");
            if (textEl) {
                textEl.textContent = t("refreshText");
            }
            if (iconEl) {
                iconEl.textContent = "↻";
                if (rendering) {
                    iconEl.className = "btn-icon spinning";
                } else {
                    iconEl.className = "btn-icon";
                }
            }
        } else {
            startBtn.className = "btn-action btn-start";
            startBtn.title = t("startPreviewBtn");
            if (textEl) {
                textEl.textContent = t("startPreviewText");
            }
            if (iconEl) {
                iconEl.textContent = "▶";
                iconEl.className = "btn-icon";
            }
        }
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

    function loadInstalledFontsFromHost() {
        csInterface.evalScript("getInstalledFontFamilies()", function(res) {
            if (!res || res === "CEP_NOT_AVAILABLE") {
                return;
            }
            try {
                var families = JSON.parse(res);
                if (!Array.isArray(families) || families.length === 0) {
                    return;
                }
                var selects = document.querySelectorAll(".font-select");
                for (var s = 0; s < selects.length; s++) {
                    var sel = selects[s];
                    var prevVal = sel.value || "Calibri";
                    var existing = {};
                    for (var o = 0; o < sel.options.length; o++) {
                        existing[sel.options[o].value] = true;
                    }
                    for (var f = 0; f < families.length; f++) {
                        var fam = families[f];
                        if (fam && !existing[fam]) {
                            existing[fam] = true;
                            var opt = document.createElement("option");
                            opt.value = fam;
                            opt.textContent = fam;
                            sel.appendChild(opt);
                        }
                    }
                    sel.value = prevVal;
                }
            } catch (e) {}
        });
    }

    function syncFromInDesignDocument(triggerRenderAfter, callback) {
        csInterface.evalScript("getDocumentUnitAndSize()", function(res) {
            if (!res || res === "CEP_NOT_AVAILABLE") {
                if (typeof callback === "function") callback();
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
                    if (usePageMargins) {
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
            if (typeof callback === "function") callback();
        });
    }

    var inDesignConnected = false;
    var lastDocStateKey = "";

    function checkAndAutoSyncInDesign(triggerUpdate) {
        csInterface.evalScript("getDocumentUnitAndSize()", function(res) {
            if (!res || res === "CEP_NOT_AVAILABLE") {
                inDesignConnected = false;
                return;
            }
            try {
                var info = JSON.parse(res);
                if (info && info.hasDoc) {
                    var docKey = info.unit + "_" + info.pageW + "_" + info.pageH + "_" + info.w + "_" + info.h;
                    var wasConnected = inDesignConnected;
                    inDesignConnected = true;

                    if (!wasConnected || docKey !== lastDocStateKey) {
                        lastDocStateKey = docKey;
                        currentUnit = info.unit;
                        if (byId("unitSelect")) {
                            byId("unitSelect").value = info.unit;
                        }
                        updateUnitLabels(info.unit);
                        if (usePageMargins) {
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
                        if (triggerUpdate) {
                            scheduleLiveInDesignUpdate();
                        }
                    }
                } else {
                    inDesignConnected = false;
                }
            } catch (e) {}
        });
    }

    function initInDesignAutoConnect() {
        checkAndAutoSyncInDesign(true);

        try {
            csInterface.addEventListener("documentAfterActivate", function() {
                usePageMargins = true;
                checkAndAutoSyncInDesign(true);
            });
            csInterface.addEventListener("documentAfterOpen", function() {
                usePageMargins = true;
                checkAndAutoSyncInDesign(true);
            });
            csInterface.addEventListener("documentAfterNew", function() {
                usePageMargins = true;
                checkAndAutoSyncInDesign(true);
            });
        } catch (eCepEvents) {}

        try {
            setInterval(function() {
                checkAndAutoSyncInDesign(true);
            }, 2500);
        } catch (eTimer) {}
    }

    function stepProgressInterpolation() {
        var fill = byId("loadingBarFill");
        var pct = byId("loadingPercent");
        if (!fill) {
            return;
        }
        if (currentProgressPct < targetProgressPct) {
            var diff = targetProgressPct - currentProgressPct;
            var step = Math.max(1, Math.ceil(diff * 0.28));
            currentProgressPct = Math.min(targetProgressPct, currentProgressPct + step);
            fill.style.width = currentProgressPct + "%";
            if (pct) {
                pct.textContent = currentProgressPct + "%";
            }
        }
    }

    function showLoadingProgress(percent, text) {
        var container = byId("loadingContainer");
        var fill = byId("loadingBarFill");
        var txt = byId("loadingText");
        var pct = byId("loadingPercent");
        var previewGrid = byId("livePreviewGrid");
        if (!container || !fill) {
            return;
        }
        if (hideProgressTimer) {
            clearTimeout(hideProgressTimer);
            hideProgressTimer = null;
        }
        container.className = "loading-container";
        if (previewGrid && previewGrid.className.indexOf("shimmering") === -1) {
            previewGrid.className = "preview-grid shimmering";
        }
        targetProgressPct = Math.max(0, Math.min(100, percent));
        if (targetProgressPct < currentProgressPct) {
            currentProgressPct = targetProgressPct;
        }
        fill.style.width = currentProgressPct + "%";
        if (txt && text) {
            txt.textContent = text;
        }
        if (pct) {
            pct.textContent = currentProgressPct + "%";
        }
        if (!progressAnimTimer) {
            progressAnimTimer = setInterval(stepProgressInterpolation, 24);
        }
    }

    function finishLoadingProgress() {
        if (progressAnimTimer) {
            clearInterval(progressAnimTimer);
            progressAnimTimer = null;
        }
        currentProgressPct = 100;
        targetProgressPct = 100;
        var fill = byId("loadingBarFill");
        var txt = byId("loadingText");
        var pct = byId("loadingPercent");
        var previewGrid = byId("livePreviewGrid");
        if (fill) {
            fill.style.width = "100%";
        }
        if (txt) {
            txt.textContent = t("loadingDone");
        }
        if (pct) {
            pct.textContent = "100%";
        }
        if (previewGrid) {
            previewGrid.className = "preview-grid";
        }
        hideProgressTimer = setTimeout(function() {
            var container = byId("loadingContainer");
            if (container) {
                container.className = "loading-container hidden";
            }
            currentProgressPct = 0;
            targetProgressPct = 0;
        }, 380);
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
            forceSixRows: byId("forceSixRowsCheckbox") ? Boolean(byId("forceSixRowsCheckbox").checked) : false,
            unit: byId("unitSelect") ? byId("unitSelect").value : "mm",
            usePageMargins: Boolean(usePageMargins),
            tableWidth: readNumber("tableWidthInput", 184.6, 5, 5000),
            tableHeight: readNumber("tableHeightInput", 271.6, 5, 5000),
            tableLeft: readNumber("tableLeftInput", 12.7, 0, 5000),
            tableTop: readNumber("tableTopInput", 12.7, 0, 5000),
            cellPadX: readNumber("cellPadXInput", 1.5, 0, 200),
            cellPadY: readNumber("cellPadYInput", 1.5, 0, 200),
            cellMargin: readNumber("cellMarginInput", 0.75, 0, 30),
            cellAlignH: currentAlignH || "CENTER",
            cellAlignV: currentAlignV || "CENTER",
            titleFont: byId("titleFont") ? byId("titleFont").value : "Calibri",
            titleSize: readNumber("titleSize", 18, 6, 120),
            headerFont: byId("headerFont") ? byId("headerFont").value : "Calibri",
            headerSize: readNumber("headerSize", 11, 6, 96),
            dayFont: byId("dayFont") ? byId("dayFont").value : "Calibri",
            daySize: readNumber("daySize", 12, 6, 96),
            weekendSize: readNumber("weekendSize", 12, 6, 96),
            paddingSize: readNumber("paddingSize", 10, 6, 96),
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

    function getDaysInMonthSafe(year, month) {
        if (typeof window.getDaysInMonth === "function") {
            return window.getDaysInMonth(year, month);
        }
        var m = ((month % 12) + 12) % 12;
        var y = year + Math.floor(month / 12);
        if (m === 1) {
            return ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 29 : 28;
        }
        var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[m];
    }

    function getCalendarMatrix(year, month, startDay, forceSixRows) {
        var firstDayOfMonth = new Date(year, month, 1).getDay();
        var daysInCurrentMonth = getDaysInMonthSafe(year, month);
        var daysInPrevMonth = getDaysInMonthSafe(year, month - 1);

        var startOffset = (startDay === "mon") ? ((firstDayOfMonth + 6) % 7) : firstDayOfMonth;
        var totalSlotsNeeded = startOffset + daysInCurrentMonth;
        var weekRows = Math.ceil(totalSlotsNeeded / 7);
        if (forceSixRows) {
            weekRows = 6;
        } else if (weekRows < 5) {
            weekRows = 5;
        }
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
        updateScopeUI();
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
        var scopeLabel = cfg.mode === "all"
            ? t("scopeShortAll")
            : (t("scopeShortSinglePrefix") + locale.months[cfg.month] + ")");

        var holidaysMap = (cfg.enableHolidays && typeof window.getYearHolidays === "function")
            ? window.getYearHolidays(cfg.year, cfg.country, cfg.lang)
            : {};

        if (cfg.showTitle) {
            livePreviewText.style.display = "block";
            livePreviewText.style.backgroundColor = cfg.titleBgColor;
            livePreviewText.style.color = cfg.titleTextColor;
            livePreviewText.textContent = monthTitle + " — " + scopeLabel + " | " + cfg.tableWidth + "×" + cfg.tableHeight + " " + cfg.unit;
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
                headerEl.style.alignItems = "center";
                headerEl.style.justifyContent = "center";
                headerEl.textContent = dayHeaders[h];
                livePreviewGrid.appendChild(headerEl);
            }
        }

        var matrix = getCalendarMatrix(cfg.year, cfg.month, cfg.startDay, cfg.forceSixRows);
        var isMon = (cfg.startDay === "mon");
        var flexAlignH = cfg.cellAlignH === "LEFT" ? "flex-start" : (cfg.cellAlignH === "RIGHT" ? "flex-end" : "center");
        var flexAlignV = cfg.cellAlignV === "TOP" ? "flex-start" : (cfg.cellAlignV === "BOTTOM" ? "flex-end" : "center");

        for (var c = 0; c < matrix.cells.length; c++) {
            var item = matrix.cells[c];
            var colIdx = c % 7;
            var isWeekend = isMon ? (colIdx === 5 || colIdx === 6) : (colIdx === 0 || colIdx === 6);
            var cellEl = document.createElement("div");
            cellEl.className = "preview-cell";
            cellEl.style.alignItems = flexAlignH;
            cellEl.style.justifyContent = flexAlignV;

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
                holidaySummaryBox.textContent = !cfg.enableHolidays ? t("holidaysDisabledMsg") : t("captionsDisabledMsg");
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
                holidaySummaryBox.textContent = locale.months[cfg.month] + t("noHolidaysInMonthSuffix");
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
                        badge.textContent = mh.day + t("badgeMovable");
                    } else {
                        badge.style.backgroundColor = cfg.holidayBgColor;
                        badge.style.color = cfg.holidayTextColor;
                        badge.textContent = mh.day + t("badgeFixed");
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
        showLoadingProgress(85, t("loadingGenerating"));
        var scriptCall = "generateCalendarFromConfig('" + escapedJson + "')";

        csInterface.evalScript(scriptCall, function(result) {
            isRendering = false;
            updateStartButtonState(false);
            finishLoadingProgress();

            if (usePageMargins) {
                syncFromInDesignDocument(false);
            }

            if (pendingRenderMode) {
                var nextMode = pendingRenderMode;
                var nextIsLive = pendingRenderIsLive;
                pendingRenderMode = null;
                pendingRenderIsLive = false;
                executeInDesignGeneration(nextMode, nextIsLive);
                return;
            }
            if (!statusMsg) {
                return;
            }
            if (result && result.indexOf("SUCCESS:12") === 0) {
                statusMsg.className = "status-msg success";
                statusMsg.textContent = isLivePreview ? t("statusLive12") : t("statusGen12");
            } else if (result && result.indexOf("SUCCESS:1") === 0) {
                statusMsg.className = "status-msg success";
                statusMsg.textContent = isLivePreview ? t("statusLive1") : t("statusGen1");
            } else if (result === "CEP_NOT_AVAILABLE") {
                statusMsg.className = "status-msg error";
                statusMsg.textContent = t("statusNoHost");
            } else {
                statusMsg.className = "status-msg error";
                statusMsg.textContent = t("statusErrorPrefix") + (result || t("statusUnknownError"));
            }
        });
    }

    function executeInDesignGeneration(mode, isLivePreview) {
        var statusMsg = byId("statusMsg");
        if (isRendering) {
            pendingRenderMode = mode;
            pendingRenderIsLive = isLivePreview;
            return;
        }
        isRendering = true;
        updateStartButtonState(true);

        var cfg = getFormConfig(mode);
        var jsonPayload = JSON.stringify(cfg);
        var escapedJson = jsonPayload.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

        if (statusMsg) {
            statusMsg.className = "status-msg";
            statusMsg.textContent = (cfg.enableSkeleton && isLivePreview) ? t("statusShimmerPage") : t("statusCreatingCal");
        }

        if (cfg.enableSkeleton && isLivePreview) {
            showLoadingProgress(30, t("loadingShimmer"));
            var skelCall0 = "renderSkeletonShimmerInDesign('" + escapedJson + "', 0)";
            csInterface.evalScript(skelCall0, function() {
                setTimeout(function() {
                    showLoadingProgress(50, t("loadingShimmer"));
                    var skelCall1 = "renderSkeletonShimmerInDesign('" + escapedJson + "', 1)";
                    csInterface.evalScript(skelCall1, function() {
                        setTimeout(function() {
                            showLoadingProgress(70, t("loadingShimmer"));
                            var skelCall2 = "renderSkeletonShimmerInDesign('" + escapedJson + "', 2)";
                            csInterface.evalScript(skelCall2, function() {
                                setTimeout(function() {
                                    runFinalCalendarGeneration(cfg, escapedJson, isLivePreview);
                                }, 45);
                            });
                        }, 45);
                    });
                }, 45);
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
        showLoadingProgress(18, t("loadingPreparing"));
        if (liveRenderTimer) {
            clearTimeout(liveRenderTimer);
        }
        liveRenderTimer = setTimeout(function() {
            var modeEl = byId("previewModeSelect");
            var mode = modeEl ? modeEl.value : "all";
            executeInDesignGeneration(mode, true);
        }, 340);
    }

    /* 3. Scrubby Slider on Labels */
    function initScrubbyLabels() {
        var labels = document.querySelectorAll("label.scrub-label");
        var dimIds = {
            tableWidthInput: true,
            tableHeightInput: true,
            tableLeftInput: true,
            tableTopInput: true
        };

        for (var i = 0; i < labels.length; i++) {
            (function(lbl) {
                lbl.addEventListener("mousedown", function(ev) {
                    if (ev.button !== 0) {
                        return;
                    }
                    var targetId = lbl.getAttribute("for");
                    var inputEl = targetId ? byId(targetId) : null;
                    if (!inputEl || inputEl.disabled) {
                        return;
                    }
                    ev.preventDefault();

                    var startX = ev.clientX;
                    var startVal = parseFloat(inputEl.value);
                    if (isNaN(startVal)) {
                        startVal = 0;
                    }
                    var stepAttr = parseFloat(inputEl.getAttribute("step")) || 1;
                    var minAttr = parseFloat(inputEl.getAttribute("min"));
                    var maxAttr = parseFloat(inputEl.getAttribute("max"));
                    var hasMoved = false;

                    document.body.classList.add("is-scrubbing");
                    lbl.classList.add("scrubbing-active");

                    function onMouseMove(moveEv) {
                        var dx = moveEv.clientX - startX;
                        if (Math.abs(dx) < 2 && !hasMoved) {
                            return;
                        }
                        hasMoved = true;

                        var mult = 1;
                        if (moveEv.shiftKey) {
                            mult = 10;
                        } else if (moveEv.altKey) {
                            mult = 0.1;
                        }

                        var deltaSteps = Math.round(dx / 3);
                        var rawNew = startVal + deltaSteps * stepAttr * mult;
                        if (!isNaN(minAttr) && rawNew < minAttr) {
                            rawNew = minAttr;
                        }
                        if (!isNaN(maxAttr) && rawNew > maxAttr) {
                            rawNew = maxAttr;
                        }

                        var rounded = Math.round(rawNew * 100) / 100;
                        if (String(rounded) !== inputEl.value) {
                            inputEl.value = String(rounded);
                            if (dimIds[targetId]) {
                                usePageMargins = false;
                            }
                            scheduleLiveInDesignUpdate();
                        }
                    }

                    function onMouseUp() {
                        document.body.classList.remove("is-scrubbing");
                        lbl.classList.remove("scrubbing-active");
                        window.removeEventListener("mousemove", onMouseMove);
                        window.removeEventListener("mouseup", onMouseUp);
                        if (!hasMoved) {
                            inputEl.focus();
                            if (typeof inputEl.select === "function") {
                                inputEl.select();
                            }
                        }
                    }

                    window.addEventListener("mousemove", onMouseMove);
                    window.addEventListener("mouseup", onMouseUp);
                });
            })(labels[i]);
        }
    }

    /* 4. 9-Point Coordinate Alignment Locator */
    function updateAlignReadouts() {
        var xOut = byId("alignXReadout");
        var yOut = byId("alignYReadout");
        if (xOut) {
            xOut.textContent = t("alignH_" + currentAlignH);
        }
        if (yOut) {
            yOut.textContent = t("alignV_" + currentAlignV);
        }
    }

    function initCellAlignGrid() {
        var grid = byId("cellAlignGrid");
        if (!grid) {
            return;
        }
        currentAlignH = grid.getAttribute("data-align-h") || "CENTER";
        currentAlignV = grid.getAttribute("data-align-v") || "CENTER";
        var cells = grid.querySelectorAll(".ref-point-cell");
        for (var i = 0; i < cells.length; i++) {
            cells[i].addEventListener("click", function(ev) {
                var btn = ev.currentTarget;
                currentAlignH = btn.getAttribute("data-align-h") || "CENTER";
                currentAlignV = btn.getAttribute("data-align-v") || "CENTER";
                grid.setAttribute("data-align-h", currentAlignH);
                grid.setAttribute("data-align-v", currentAlignV);
                for (var j = 0; j < cells.length; j++) {
                    cells[j].className = (cells[j] === btn) ? "ref-point-cell active" : "ref-point-cell";
                }
                updateAlignReadouts();
                scheduleLiveInDesignUpdate();
            });
        }
        updateAlignReadouts();
    }

    function initRoleButtonsKeyboard() {
        var roleBtns = document.querySelectorAll("[role='button']");
        for (var i = 0; i < roleBtns.length; i++) {
            roleBtns[i].addEventListener("keydown", function(ev) {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    ev.currentTarget.click();
                }
            });
        }
    }

    /* 8. GitHub Releases Update System */
    function normalizeVersion(verStr) {
        return String(verStr || "").trim().replace(/^[vV]/, "");
    }

    function compareSemver(verA, verB) {
        var aParts = normalizeVersion(verA).split(".");
        var bParts = normalizeVersion(verB).split(".");
        for (var i = 0; i < 3; i++) {
            var numA = parseInt(aParts[i], 10) || 0;
            var numB = parseInt(bParts[i], 10) || 0;
            if (numA > numB) return 1;
            if (numA < numB) return -1;
        }
        return 0;
    }

    function openUrlInBrowser(url) {
        if (!url) return;
        try {
            if (typeof require === "function") {
                var uxp = require("uxp");
                if (uxp && uxp.shell && typeof uxp.shell.openExternal === "function") {
                    uxp.shell.openExternal(url);
                    return;
                }
            }
        } catch (eUxp) {}

        try {
            if (window.__adobe_cep__ && window.__adobe_cep__.util && typeof window.__adobe_cep__.util.openURLInDefaultBrowser === "function") {
                window.__adobe_cep__.util.openURLInDefaultBrowser(url);
                return;
            }
        } catch (eCep) {}

        try {
            window.open(url, "_blank");
        } catch (eWin) {}
    }

    function fetchJsonUrl(url, callback) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Accept", "application/vnd.github.v3+json");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            callback(null, JSON.parse(xhr.responseText));
                        } catch (eParse) {
                            callback(eParse, null);
                        }
                    } else {
                        callback(new Error("HTTP " + xhr.status), null);
                    }
                }
            };
            xhr.send();
        } catch (err) {
            callback(err, null);
        }
    }

    function showUpdateBanner(remoteVer, notes, htmlUrl, isNewer) {
        var banner = byId("updateBanner");
        var titleEl = byId("updateBannerTitle");
        var notesEl = byId("updateBannerNotes");
        var installBtn = byId("installUpdateBtn");
        if (!banner || !titleEl) {
            return;
        }
        latestReleaseUrl = htmlUrl || GITHUB_RELEASES_WEB;
        latestReleaseTag = remoteVer;
        banner.className = "update-banner";
        if (isNewer) {
            titleEl.textContent = t("updateAvailableTitle") + "v" + normalizeVersion(remoteVer);
            if (notesEl) {
                notesEl.textContent = notes || "GitHub Release v" + normalizeVersion(remoteVer);
            }
            if (installBtn) {
                installBtn.style.display = "inline-block";
            }
        } else {
            titleEl.textContent = t("updateUpToDateTitle") + " (v" + PLUGIN_VERSION + ")";
            if (notesEl) {
                notesEl.textContent = notes || "";
            }
            if (installBtn) {
                installBtn.style.display = "none";
            }
        }
    }

    function checkForUpdates(silentIfUpToDate) {
        var statusMsg = byId("statusMsg");
        if (!silentIfUpToDate && statusMsg) {
            statusMsg.className = "status-msg";
            statusMsg.textContent = t("updateChecking");
        }

        fetchJsonUrl(GITHUB_RELEASES_API, function(err, relData) {
            if (!err && relData && relData.tag_name) {
                var rVer = normalizeVersion(relData.tag_name);
                var isNew = compareSemver(rVer, PLUGIN_VERSION) > 0;
                if (isNew || !silentIfUpToDate) {
                    showUpdateBanner(rVer, relData.name || relData.body || "", relData.html_url || GITHUB_RELEASES_WEB, isNew);
                }
                if (!silentIfUpToDate && statusMsg) {
                    statusMsg.textContent = "";
                }
                return;
            }

            fetchJsonUrl(GITHUB_RELEASES_LIST_API, function(err2, listData) {
                if (!err2 && Array.isArray(listData) && listData.length > 0 && listData[0].tag_name) {
                    var topRel = listData[0];
                    var rVer2 = normalizeVersion(topRel.tag_name);
                    var isNew2 = compareSemver(rVer2, PLUGIN_VERSION) > 0;
                    if (isNew2 || !silentIfUpToDate) {
                        showUpdateBanner(rVer2, topRel.name || topRel.body || "", topRel.html_url || GITHUB_RELEASES_WEB, isNew2);
                    }
                    if (!silentIfUpToDate && statusMsg) {
                        statusMsg.textContent = "";
                    }
                    return;
                }

                fetchJsonUrl(GITHUB_RAW_MANIFEST, function(err3, manifestData) {
                    if (!err3 && manifestData && manifestData.version) {
                        var mVer = normalizeVersion(manifestData.version);
                        var isNew3 = compareSemver(mVer, PLUGIN_VERSION) > 0;
                        if (isNew3 || !silentIfUpToDate) {
                            showUpdateBanner(mVer, "", GITHUB_RELEASES_WEB, isNew3);
                        }
                        if (!silentIfUpToDate && statusMsg) {
                            statusMsg.textContent = "";
                        }
                    } else if (!silentIfUpToDate && statusMsg) {
                        statusMsg.className = "status-msg error";
                        statusMsg.textContent = t("updateError");
                    }
                });
            });
        });
    }

    function installUpdateFromGithub() {
        var statusMsg = byId("statusMsg");
        if (statusMsg) {
            statusMsg.className = "status-msg";
            statusMsg.textContent = t("updateInstalling");
        }

        var refBranch = latestReleaseTag ? ("v" + normalizeVersion(latestReleaseTag)) : "main";
        var filesToUpdate = ["index.html", "manifest.json", "css/style.css", "js/main.js", "jsx/hostscript.jsx"];

        // Attempt direct in-place file update if Node.js fs is available (CEP with --enable-nodejs)
        try {
            if (typeof window.cep_node !== "undefined" || (typeof require === "function" && window.__adobe_cep__)) {
                var reqFn = (typeof window.cep_node !== "undefined" && window.cep_node.require) ? window.cep_node.require : require;
                var fs = reqFn("fs");
                var path = reqFn("path");
                var extDir = csInterface.getSystemPath(SystemPath.EXTENSION);
                if (fs && path && extDir) {
                    var completed = 0;
                    for (var i = 0; i < filesToUpdate.length; i++) {
                        (function(relPath) {
                            var rawUrl = "https://raw.githubusercontent.com/" + GITHUB_REPO + "/" + refBranch + "/" + relPath;
                            var xhr = new XMLHttpRequest();
                            xhr.open("GET", rawUrl, true);
                            xhr.onreadystatechange = function() {
                                if (xhr.readyState === 4) {
                                    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
                                        try {
                                            var fullTarget = path.join(extDir, relPath);
                                            fs.writeFileSync(fullTarget, xhr.responseText, "utf8");
                                        } catch (eW) {}
                                    }
                                    completed++;
                                    if (completed === filesToUpdate.length) {
                                        if (statusMsg) {
                                            statusMsg.className = "status-msg success";
                                            statusMsg.textContent = t("updateInstalledSuccess");
                                        }
                                        setTimeout(function() {
                                            window.location.reload();
                                        }, 900);
                                    }
                                }
                            };
                            xhr.send();
                        })(filesToUpdate[i]);
                    }
                    return;
                }
            }
        } catch (eNodeUpdate) {}

        openUrlInBrowser(latestReleaseUrl || GITHUB_RELEASES_WEB);
    }

    function initGithubUpdater() {
        var verLabel = byId("pluginVersionLabel");
        if (verLabel) {
            verLabel.textContent = "v" + PLUGIN_VERSION;
        }
        var checkBtn = byId("checkUpdateBtn");
        if (checkBtn) {
            checkBtn.addEventListener("click", function() {
                checkForUpdates(false);
            });
        }
        var dismissBtn = byId("dismissUpdateBtn");
        if (dismissBtn) {
            dismissBtn.addEventListener("click", function() {
                var banner = byId("updateBanner");
                if (banner) {
                    banner.className = "update-banner hidden";
                }
            });
        }
        var openBtn = byId("openReleaseUrlBtn");
        if (openBtn) {
            openBtn.addEventListener("click", function() {
                openUrlInBrowser(latestReleaseUrl || GITHUB_RELEASES_WEB);
            });
        }
        var installBtn = byId("installUpdateBtn");
        if (installBtn) {
            installBtn.addEventListener("click", installUpdateFromGithub);
        }

        // Silent check on startup
        setTimeout(function() {
            checkForUpdates(true);
        }, 1200);
    }

    /* 9. Real-time Application Theme Synchronization */
    function applyThemeByName(themeName, customRgb) {
        var validThemes = {
            "dark": true,
            "medium-dark": true,
            "medium-light": true,
            "light": true
        };
        var chosen = validThemes[themeName] ? themeName : "dark";
        if (document.body.getAttribute("data-theme") !== chosen) {
            document.body.setAttribute("data-theme", chosen);
        }
        if (customRgb && typeof customRgb.red === "number") {
            var r = Math.round(customRgb.red);
            var g = Math.round(customRgb.green);
            var b = Math.round(customRgb.blue);
            document.body.style.setProperty("--bg-main", "rgb(" + r + "," + g + "," + b + ")");
        } else {
            document.body.style.removeProperty("--bg-main");
        }
    }

    function syncThemeFromCEP() {
        try {
            var hostEnv = csInterface.getHostEnvironment();
            if (hostEnv && hostEnv.appSkinInfo && hostEnv.appSkinInfo.panelBackgroundColor) {
                var c = hostEnv.appSkinInfo.panelBackgroundColor.color;
                if (c && typeof c.red === "number") {
                    var lum = (0.299 * c.red + 0.587 * c.green + 0.114 * c.blue) / 255;
                    var theme = "dark";
                    if (lum >= 0.82) {
                        theme = "light";
                    } else if (lum >= 0.52) {
                        theme = "medium-light";
                    } else if (lum >= 0.26) {
                        theme = "medium-dark";
                    }
                    applyThemeByName(theme, c);
                    return true;
                }
            }
        } catch (eCepTheme) {}
        return false;
    }

    function syncThemeFromUXP() {
        try {
            if (document.theme && typeof document.theme.getCurrent === "function") {
                var uxpTheme = String(document.theme.getCurrent() || "").toLowerCase();
                if (uxpTheme === "lightest") {
                    applyThemeByName("light");
                    return true;
                } else if (uxpTheme === "light") {
                    applyThemeByName("medium-light");
                    return true;
                } else if (uxpTheme === "dark") {
                    applyThemeByName("medium-dark");
                    return true;
                } else if (uxpTheme === "darkest") {
                    applyThemeByName("dark");
                    return true;
                }
            }
        } catch (eUxpTheme) {}
        return false;
    }

    function pollHostThemeBrightness() {
        if (isRendering) {
            return;
        }
        csInterface.evalScript("getHostThemeInfo()", function(res) {
            if (!res || res === "CEP_NOT_AVAILABLE") {
                return;
            }
            try {
                var info = JSON.parse(res);
                if (info && info.hasHost && info.theme) {
                    applyThemeByName(info.theme);
                }
            } catch (e) {}
        });
    }

    function initThemeSync() {
        // 1. CEP real-time theme event
        syncThemeFromCEP();
        csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, function() {
            if (!syncThemeFromCEP()) {
                pollHostThemeBrightness();
            }
        });

        // 2. UXP real-time theme event
        syncThemeFromUXP();
        try {
            if (document.theme && document.theme.onUpdated && typeof document.theme.onUpdated.addListener === "function") {
                document.theme.onUpdated.addListener(function() {
                    if (!syncThemeFromUXP()) {
                        pollHostThemeBrightness();
                    }
                });
            }
        } catch (eUxpListener) {}

        // 3. CSS prefers-color-scheme media query listener
        try {
            if (window.matchMedia) {
                var mqLight = window.matchMedia("(prefers-color-scheme: light)");
                var onMqChange = function() {
                    if (!syncThemeFromUXP() && !syncThemeFromCEP()) {
                        pollHostThemeBrightness();
                    }
                };
                if (typeof mqLight.addEventListener === "function") {
                    mqLight.addEventListener("change", onMqChange);
                }
            }
        } catch (eMq) {}

        // 4. Direct InDesign uiBrightnessPreference polling for instant 4-stop sync
        try {
            pollHostThemeBrightness();
            if (themePollTimer) {
                clearInterval(themePollTimer);
            }
            themePollTimer = setInterval(pollHostThemeBrightness, 2500);
        } catch (eTimer) {}
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
            try { initSwatchPalette(); } catch (e) {}
            try { initCheckboxRows(); } catch (e) {}
            try { initScrubbyLabels(); } catch (e) {}
            try { initCellAlignGrid(); } catch (e) {}
            try { initRoleButtonsKeyboard(); } catch (e) {}
            try { initGithubUpdater(); } catch (e) {}
            try { initThemeSync(); } catch (e) {}

            var hyBtn = byId("uiLangHyBtn");
            var enBtn = byId("uiLangEnBtn");
            if (hyBtn) {
                hyBtn.addEventListener("click", function() {
                    applyUiLanguage("hy");
                });
            }
            if (enBtn) {
                enBtn.addEventListener("click", function() {
                    applyUiLanguage("en");
                });
            }

            try {
                var savedLang = localStorage.getItem("ccd_ui_lang");
                if (savedLang === "en" || savedLang === "hy") {
                    currentUiLang = savedLang;
                }
            } catch (eLang) {}
            applyUiLanguage(currentUiLang);

            var startBtn = byId("startPreviewBtn");
            if (startBtn) {
                startBtn.addEventListener("click", function() {
                    isStarted = true;
                    updateStartButtonState(true);

                    if (liveRenderTimer) {
                        clearTimeout(liveRenderTimer);
                        liveRenderTimer = null;
                    }
                    var liveChk = byId("inDesignLivePreview");
                    var toggleBtn = byId("toggleLivePreviewBtn");
                    var liveText = byId("liveBtnText");
                    if (liveChk && !liveChk.checked) {
                        liveChk.checked = true;
                        if (toggleBtn) {
                            toggleBtn.className = "btn-action btn-live active";
                            if (liveText) liveText.textContent = t("livePreviewShort");
                        }
                    }
                    var modeEl = byId("previewModeSelect");
                    var chosenMode = modeEl ? modeEl.value : "all";
                    if (usePageMargins) {
                        syncFromInDesignDocument(false, function() {
                            executeInDesignGeneration(chosenMode, true);
                        });
                    } else {
                        updatePanelPreview();
                        executeInDesignGeneration(chosenMode, true);
                    }
                });
            }

            var toggleBtn = byId("toggleLivePreviewBtn");
            var liveChk = byId("inDesignLivePreview");
            var liveText = byId("liveBtnText");
            if (toggleBtn && liveChk) {
                toggleBtn.addEventListener("click", function() {
                    liveChk.checked = !liveChk.checked;
                    if (liveChk.checked) {
                        toggleBtn.className = "btn-action btn-live active";
                        if (liveText) liveText.textContent = t("livePreviewShort");
                        scheduleLiveInDesignUpdate();
                    } else {
                        if (liveRenderTimer) {
                            clearTimeout(liveRenderTimer);
                        }
                        toggleBtn.className = "btn-action btn-live inactive";
                        if (liveText) liveText.textContent = t("livePreviewShort");
                        if (byId("loadingContainer")) {
                            byId("loadingContainer").className = "loading-container hidden";
                        }
                    }
                });
            }

            var genCalBtn = byId("generateCalendarBtn");
            if (genCalBtn) {
                genCalBtn.addEventListener("click", function() {
                    var modeEl = byId("previewModeSelect");
                    var chosenMode = modeEl ? modeEl.value : "all";
                    updatePanelPreview();
                    executeInDesignGeneration(chosenMode, false);
                });
            }

            var resetBtn = byId("resetDocBtn");
            if (resetBtn) {
                resetBtn.addEventListener("click", function() {
                    if (liveRenderTimer) {
                        clearTimeout(liveRenderTimer);
                        liveRenderTimer = null;
                    }
                    var statusMsg = byId("statusMsg");
                    if (statusMsg) {
                        statusMsg.className = "status-msg";
                        statusMsg.textContent = t("statusCleaningDoc");
                    }
                    showLoadingProgress(50, t("statusCleaningDoc"));

                    csInterface.evalScript("resetToCleanDocument()", function(result) {
                        finishLoadingProgress();
                        isStarted = false;
                        updateStartButtonState(false);
                        if (statusMsg) {
                            if (result && result.indexOf("CLEAN_OK") === 0) {
                                statusMsg.className = "status-msg success";
                                statusMsg.textContent = t("statusDocCleaned");
                            } else if (result === "CEP_NOT_AVAILABLE") {
                                statusMsg.className = "status-msg error";
                                statusMsg.textContent = t("statusNoHost");
                            } else {
                                statusMsg.className = "status-msg error";
                                statusMsg.textContent = t("statusErrorPrefix") + (result || t("statusUnknownError"));
                            }
                        }
                    });
                });
            }

            var previewModeSelect = byId("previewModeSelect");
            if (previewModeSelect) {
                previewModeSelect.addEventListener("change", function() {
                    updateScopeUI();
                    updatePanelPreview();
                    scheduleLiveInDesignUpdate();
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
                    usePageMargins = true;
                    syncFromInDesignDocument(true);
                });
            }

            var dimInputIds = {
                tableWidthInput: true,
                tableHeightInput: true,
                tableLeftInput: true,
                tableTopInput: true
            };

            var inputs = document.querySelectorAll("input, select");
            for (var i = 0; i < inputs.length; i++) {
                var inp = inputs[i];
                if (inp.id === "unitSelect" || inp.id === "inDesignLivePreview" || inp.id === "previewModeSelect" || inp.type === "hidden") {
                    continue;
                }
                if (dimInputIds[inp.id]) {
                    inp.addEventListener("input", function() {
                        usePageMargins = false;
                        scheduleLiveInDesignUpdate();
                    });
                    inp.addEventListener("change", function() {
                        usePageMargins = false;
                        scheduleLiveInDesignUpdate();
                    });
                } else {
                    inp.addEventListener("input", scheduleLiveInDesignUpdate);
                    inp.addEventListener("change", scheduleLiveInDesignUpdate);
                }
            }

            var genAll = byId("generateAllBtn");
            if (genAll) {
                genAll.addEventListener("click", function() {
                    if (byId("previewModeSelect")) byId("previewModeSelect").value = "all";
                    updateScopeUI();
                    updatePanelPreview();
                    executeInDesignGeneration("all", false);
                });
            }

            var genSingle = byId("generateSingleBtn");
            if (genSingle) {
                genSingle.addEventListener("click", function() {
                    if (byId("previewModeSelect")) byId("previewModeSelect").value = "single";
                    updateScopeUI();
                    updatePanelPreview();
                    executeInDesignGeneration("single", false);
                });
            }

            isInitialized = true;
            try { initInDesignAutoConnect(); } catch (eAuto) {}
            try { loadInstalledFontsFromHost(); } catch (eFonts) {}
        }
        updateScopeUI();
        updateStartButtonState(isRendering);
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
