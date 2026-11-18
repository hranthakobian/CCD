/**
 * Calendar Generator Pro - Fast ExtendScript & UXP Backend for Adobe InDesign
 */

function getInDesignContext() {
    if (typeof app !== "undefined" && app && app.documents) {
        return {
            app: app,
            ColorModel: (typeof ColorModel !== "undefined") ? ColorModel : null,
            ColorSpace: (typeof ColorSpace !== "undefined") ? ColorSpace : null,
            Justification: (typeof Justification !== "undefined") ? Justification : null,
            VerticalJustification: (typeof VerticalJustification !== "undefined") ? VerticalJustification : null,
            MeasurementUnits: (typeof MeasurementUnits !== "undefined") ? MeasurementUnits : null,
            RulerOrigin: (typeof RulerOrigin !== "undefined") ? RulerOrigin : null,
            PageSideOptions: (typeof PageSideOptions !== "undefined") ? PageSideOptions : null
        };
    }
    if (typeof require === "function") {
        try {
            var id = require("indesign");
            return {
                app: id.app,
                ColorModel: id.ColorModel,
                ColorSpace: id.ColorSpace,
                Justification: id.Justification,
                VerticalJustification: id.VerticalJustification,
                MeasurementUnits: id.MeasurementUnits,
                RulerOrigin: id.RulerOrigin,
                PageSideOptions: id.PageSideOptions
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}

function detectUnitCodeFromDoc(doc) {
    try {
        var u = doc.viewPreferences.horizontalMeasurementUnits;
        var uStr = String(u).toUpperCase();
        if (uStr.indexOf("CENTIMETER") !== -1 || u === 2053336435) {
            return "cm";
        }
        if (uStr.indexOf("INCH") !== -1 || u === 2053729891 || u === 2053729892) {
            return "in";
        }
        if (uStr.indexOf("POINT") !== -1 || u === 2054188905) {
            return "pt";
        }
        if (uStr.indexOf("PIXEL") !== -1 || u === 2054187384) {
            return "px";
        }
    } catch (e) {}
    return "mm";
}

function applyUnitToDoc(doc, ctx, unitCode) {
    if (!doc || !doc.viewPreferences || !ctx.MeasurementUnits) {
        return;
    }
    var mu = ctx.MeasurementUnits;
    var targetEnum = mu.MILLIMETERS;
    if (unitCode === "cm" && mu.CENTIMETERS) {
        targetEnum = mu.CENTIMETERS;
    } else if (unitCode === "pt" && mu.POINTS) {
        targetEnum = mu.POINTS;
    } else if (unitCode === "in") {
        targetEnum = mu.INCHES_DECIMAL ? mu.INCHES_DECIMAL : mu.INCHES;
    } else if (unitCode === "px" && mu.PIXELS) {
        targetEnum = mu.PIXELS;
    }
    try {
        if (targetEnum) {
            doc.viewPreferences.horizontalMeasurementUnits = targetEnum;
            doc.viewPreferences.verticalMeasurementUnits = targetEnum;
        }
    } catch (e) {}
}

function ptToUnit(ptVal, unitCode) {
    var mmVal = ptVal * (25.4 / 72.0);
    if (unitCode === "cm") {
        return mmVal / 10.0;
    }
    if (unitCode === "in") {
        return mmVal / 25.4;
    }
    if (unitCode === "pt" || unitCode === "px") {
        return ptVal;
    }
    return mmVal;
}

function getDaysInMonth(year, month) {
    var m = ((month % 12) + 12) % 12;
    var y = year + Math.floor(month / 12);
    if (m === 1) {
        return ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 29 : 28;
    }
    var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return days[m];
}

function getPageMarginBox(doc, page, unitCode, ctx) {
    var pb = page.bounds;
    var pTop = parseFloat(pb[0]) || 0;
    var pLeft = parseFloat(pb[1]) || 0;
    var pBottom = parseFloat(pb[2]) || 0;
    var pRight = parseFloat(pb[3]) || 0;
    var pH = Math.abs(pBottom - pTop);
    var pW = Math.abs(pRight - pLeft);
    if (isNaN(pW) || pW <= 0) {
        pW = 210;
    }
    if (isNaN(pH) || pH <= 0) {
        pH = 297;
    }

    var defaultMargin = ptToUnit(36, unitCode || "mm"); // 12.7mm (0.5 in)
    var mTop = defaultMargin;
    var mBottom = defaultMargin;
    var mLeft = defaultMargin;
    var mRight = defaultMargin;

    var mp = null;
    try {
        mp = page.marginPreferences;
    } catch (eMp1) {}
    if (!mp) {
        try {
            mp = doc.marginPreferences;
        } catch (eMp2) {}
    }

    if (mp) {
        var rawTop = parseFloat(mp.top);
        var rawBottom = parseFloat(mp.bottom);
        var rawLeft = parseFloat(mp.left);
        var rawRight = parseFloat(mp.right);
        if (!isNaN(rawTop) && rawTop >= 0) {
            mTop = rawTop;
        }
        if (!isNaN(rawBottom) && rawBottom >= 0) {
            mBottom = rawBottom;
        }
        if (!isNaN(rawLeft) && rawLeft >= 0) {
            mLeft = rawLeft;
        }
        if (!isNaN(rawRight) && rawRight >= 0) {
            mRight = rawRight;
        }

        try {
            var isFacing = doc.documentPreferences && doc.documentPreferences.facingPages;
            var isLeftHand = false;
            if (ctx && ctx.PageSideOptions && ctx.PageSideOptions.LEFT_HAND && page.side === ctx.PageSideOptions.LEFT_HAND) {
                isLeftHand = true;
            } else {
                var sideStr = String(page.side || "").toUpperCase();
                if (sideStr.indexOf("LEFT") !== -1 || sideStr === "1818653800") {
                    isLeftHand = true;
                }
            }
            if (isFacing && isLeftHand) {
                var tmp = mLeft;
                mLeft = mRight;
                mRight = tmp;
            }
        } catch (eSide) {}
    }

    var boxW = pW - mLeft - mRight;
    var boxH = pH - mTop - mBottom;
    if (boxW <= 10) {
        mLeft = Math.round(pW * 0.06 * 100) / 100;
        mRight = mLeft;
        boxW = pW - mLeft * 2;
    }
    if (boxH <= 10) {
        mTop = Math.round(pH * 0.06 * 100) / 100;
        mBottom = mTop;
        boxH = pH - mTop * 2;
    }

    return {
        pageOriginTop: pTop,
        pageOriginLeft: pLeft,
        pageW: Math.round(pW * 100) / 100,
        pageH: Math.round(pH * 100) / 100,
        x: Math.round(mLeft * 100) / 100,
        y: Math.round(mTop * 100) / 100,
        w: Math.round(boxW * 100) / 100,
        h: Math.round(boxH * 100) / 100
    };
}

function getDocumentUnitAndSize() {
    try {
        var ctx = getInDesignContext();
        if (!ctx || !ctx.app || ctx.app.documents.length === 0) {
            return '{"hasDoc":false,"unit":"mm","pageW":210,"pageH":297,"w":184.6,"h":271.6,"x":12.7,"y":12.7}';
        }
        var doc = ctx.app.activeDocument;
        var unitCode = detectUnitCodeFromDoc(doc);
        var activePage = (ctx.app.activeWindow && ctx.app.activeWindow.activePage)
            ? ctx.app.activeWindow.activePage
            : doc.pages.item(0);
        var box = getPageMarginBox(doc, activePage, unitCode, ctx);

        return '{"hasDoc":true,"unit":"' + unitCode + '"' +
            ',"pageW":' + box.pageW +
            ',"pageH":' + box.pageH +
            ',"w":' + box.w +
            ',"h":' + box.h +
            ',"x":' + box.x +
            ',"y":' + box.y + '}';
    } catch (err) {
        return '{"hasDoc":false,"unit":"mm","pageW":210,"pageH":297,"w":184.6,"h":271.6,"x":12.7,"y":12.7}';
    }
}

function getHostThemeInfo() {
    try {
        var ctx = getInDesignContext();
        if (!ctx || !ctx.app) {
            return '{"hasHost":false,"brightness":0.0,"theme":"dark"}';
        }
        var b = 0.0;
        try {
            b = parseFloat(ctx.app.generalPreferences.uiBrightnessPreference);
        } catch (eB) {
            b = 0.0;
        }
        if (isNaN(b)) {
            b = 0.0;
        }
        var themeName = "dark";
        if (b >= 0.85) {
            themeName = "light";
        } else if (b >= 0.505) {
            themeName = "medium-light";
        } else if (b >= 0.25) {
            themeName = "medium-dark";
        } else {
            themeName = "dark";
        }
        return '{"hasHost":true,"brightness":' + b + ',"theme":"' + themeName + '"}';
    } catch (e) {
        return '{"hasHost":false,"brightness":0.0,"theme":"dark"}';
    }
}

function hexToRgbArray(hexStr) {
    var clean = String(hexStr || "#000000").replace("#", "");
    if (clean.length === 3) {
        clean = clean.charAt(0) + clean.charAt(0) +
                clean.charAt(1) + clean.charAt(1) +
                clean.charAt(2) + clean.charAt(2);
    }
    var num = parseInt(clean, 16);
    if (isNaN(num)) {
        return [0, 0, 0];
    }
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    return [r, g, b];
}

function getOrCreateHexColor(doc, ctx, hexStr) {
    var normHex = String(hexStr || "#000000").toUpperCase().replace(/[^0-9A-F]/g, "");
    if (normHex.length !== 6) {
        normHex = "000000";
    }
    var swatchName = "Cal_RGB_" + normHex;
    var rgb = hexToRgbArray(normHex);

    try {
        var existingSwatch = doc.swatches.itemByName(swatchName);
        if (existingSwatch && existingSwatch.isValid) {
            return existingSwatch;
        }
    } catch (eSw1) {}

    try {
        var existingColor = doc.colors.itemByName(swatchName);
        if (existingColor && existingColor.isValid) {
            return existingColor;
        }
    } catch (eCol1) {}

    var props = {
        name: swatchName,
        colorValue: rgb
    };
    if (ctx && ctx.ColorModel && ctx.ColorModel.PROCESS) {
        props.model = ctx.ColorModel.PROCESS;
    }
    if (ctx && ctx.ColorSpace && ctx.ColorSpace.RGB) {
        props.space = ctx.ColorSpace.RGB;
    }
    try {
        return doc.colors.add(props);
    } catch (eAdd) {
        try {
            var sw2 = doc.swatches.itemByName(swatchName);
            if (sw2 && sw2.isValid) return sw2;
        } catch (eSw2) {}
        try {
            var col2 = doc.colors.itemByName(swatchName);
            if (col2 && col2.isValid) return col2;
        } catch (eCol2) {}
        try {
            var blk = doc.swatches.itemByName("Black");
            if (blk && blk.isValid) return blk;
        } catch (eBlk) {}
        return doc.swatches.item(0);
    }
}

function getLocaleData(lang) {
    var locales = {
        hy: {
            months: ["Հունվար", "Փետրվար", "Մարտ", "Ապրիլ", "Մայիս", "Հունիս", "Հուլիս", "Օգոստոս", "Սեպտեմբեր", "Հոկտեմբեր", "Նոյեմբեր", "Դեկտեմբեր"],
            daysMon: ["Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ", "Կիր"],
            daysSun: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ"],
            movableTag: "շարժական"
        },
        hy_w: {
            months: ["Յունուար", "Փետրուար", "Մարտ", "Ապրիլ", "Մայիս", "Յունիս", "Յուլիս", "Օգոստոս", "Սեպտեմբեր", "Հոկտեմբեր", "Նոյեմբեր", "Դեկտեմբեր"],
            daysMon: ["Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ", "Կիր"],
            daysSun: ["Կիր", "Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ"],
            movableTag: "շարժական"
        },
        en: {
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            daysMon: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            daysSun: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            movableTag: "movable"
        },
        ru: {
            months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
            daysMon: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
            daysSun: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
            movableTag: "переходящий"
        },
        fr: {
            months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
            daysMon: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
            daysSun: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
            movableTag: "mobile"
        },
        de: {
            months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            daysMon: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
            daysSun: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
            movableTag: "beweglich"
        },
        es: {
            months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            daysMon: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
            daysSun: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
            movableTag: "móvil"
        },
        it: {
            months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
            daysMon: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
            daysSun: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
            movableTag: "mobile"
        },
        pt: {
            months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
            daysMon: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
            daysSun: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
            movableTag: "móvel"
        },
        ka: {
            months: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
            daysMon: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"],
            daysSun: ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"],
            movableTag: "მოძრავი"
        },
        el: {
            months: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"],
            daysMon: ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"],
            daysSun: ["Κυρ", "Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ"],
            movableTag: "κινητή"
        },
        pl: {
            months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
            daysMon: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"],
            daysSun: ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"],
            movableTag: "ruchome"
        }
    };
    return locales[lang] ? locales[lang] : locales.hy;
}

function getGregorianEaster(year) {
    var a = year % 19;
    var b = Math.floor(year / 100);
    var c = year % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    var day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month: month, day: day };
}

function getOrthodoxEaster(year) {
    var a = year % 4;
    var b = year % 7;
    var c = year % 19;
    var d = (19 * c + 15) % 30;
    var e = (2 * a + 4 * b - d + 34) % 7;
    var monthJulian = Math.floor((d + e + 114) / 31) - 1;
    var dayJulian = ((d + e + 114) % 31) + 1;
    var centuryOffset = Math.floor(year / 100) - Math.floor(year / 400) - 2;
    var dt = new Date(year, monthJulian, dayJulian + centuryOffset);
    return { month: dt.getMonth(), day: dt.getDate() };
}

function offsetDate(year, month, day, deltaDays) {
    var dt = new Date(year, month, day + deltaDays);
    return { month: dt.getMonth(), day: dt.getDate() };
}

function getNthWeekdayOfMonth(year, month, targetWeekday, nth) {
    if (nth > 0) {
        var firstDay = new Date(year, month, 1).getDay();
        var diff = (targetWeekday - firstDay + 7) % 7;
        var day = 1 + diff + (nth - 1) * 7;
        return { month: month, day: day };
    } else {
        var lastDayNum = getDaysInMonth(year, month);
        var lastWday = new Date(year, month, lastDayNum).getDay();
        var diffBack = (lastWday - targetWeekday + 7) % 7;
        return { month: month, day: lastDayNum - diffBack };
    }
}

function getNearestSunday(year, month, refDay) {
    var wday = new Date(year, month, refDay).getDay();
    if (wday === 0) {
        return { month: month, day: refDay };
    }
    var distPrev = wday;
    var distNext = 7 - wday;
    var chosenDay = (distNext <= distPrev) ? (refDay + distNext) : (refDay - distPrev);
    return { month: month, day: chosenDay };
}

function pickLocalizedText(lang, hyText, enText, ruText) {
    if (lang === "hy" || lang === "hy_w") {
        return hyText;
    }
    if (lang === "ru") {
        return ruText;
    }
    return enText;
}

function getYearHolidays(year, country, lang) {
    var map = {};
    if (!country || country === "NONE") {
        return map;
    }

    function addHoliday(m, d, isMovable, hyName, enName, ruName) {
        var key = m + "-" + d;
        var title = pickLocalizedText(lang, hyName, enName, ruName);
        if (map[key]) {
            map[key].name = map[key].name + " / " + title;
            if (!isMovable) {
                map[key].isMovable = false;
            }
        } else {
            map[key] = {
                month: m,
                day: d,
                isMovable: Boolean(isMovable),
                name: title
            };
        }
    }

    var gregEaster = getGregorianEaster(year);
    var orthEaster = getOrthodoxEaster(year);

    if (country === "AM") {
        addHoliday(0, 1, false, "Ամանոր", "New Year", "Новый год");
        addHoliday(0, 2, false, "Ամանոր", "New Year", "Новый год");
        addHoliday(0, 6, false, "Սուրբ Ծնունդ", "Armenian Christmas", "Святое Рождество");
        addHoliday(0, 7, false, "Սբ. Ծննդյան Մեռելոց", "Christmas Memorial", "День поминовения");
        addHoliday(0, 28, false, "Բանակի օր", "Army Day", "День Армии");
        addHoliday(2, 8, false, "Կանանց տոն", "Women's Day", "Женский день");
        addHoliday(3, 7, false, "Մայրության եւ գեղեցկության տոն", "Motherhood & Beauty Day", "День материнства и красоты");
        addHoliday(3, 24, false, "Ցեղասպանության զոհերի հիշատակի օր", "Genocide Remembrance Day", "День памяти жертв Геноцида");
        addHoliday(4, 1, false, "Աշխատանքի օր", "Labor Day", "День труда");
        addHoliday(4, 9, false, "Հաղթանակի եւ խաղաղության տոն", "Victory & Peace Day", "День Победы и мира");
        addHoliday(4, 28, false, "Հանրապետության տոն", "Republic Day", "День Республики");
        addHoliday(6, 5, false, "Սահմանադրության օր", "Constitution Day", "День Конституции");
        addHoliday(8, 21, false, "Անկախության տոն", "Independence Day", "День Независимости");
        addHoliday(11, 31, false, "Ամանորի գիշեր", "New Year's Eve", "Канун Нового года");

        var vartanantz = offsetDate(year, gregEaster.month, gregEaster.day, -52);
        addHoliday(vartanantz.month, vartanantz.day, true, "Սուրբ Վարդանանց տոն", "St. Vartanantz Day", "День Св. Вардананц");
        var paregentan = offsetDate(year, gregEaster.month, gregEaster.day, -49);
        addHoliday(paregentan.month, paregentan.day, true, "Բուն Բարեկենդան", "Poon Paregentan", "Истинная Масленица");
        var palmSun = offsetDate(year, gregEaster.month, gregEaster.day, -7);
        addHoliday(palmSun.month, palmSun.day, true, "Ծաղկազարդ", "Palm Sunday", "Вербное воскресенье");
        addHoliday(gregEaster.month, gregEaster.day, true, "Սուրբ Զատիկ", "Holy Easter", "Святая Пасха");
        var easterMerelots = offsetDate(year, gregEaster.month, gregEaster.day, 1);
        addHoliday(easterMerelots.month, easterMerelots.day, true, "Զատկի Մեռելոց", "Easter Memorial Day", "Пасхальный Мерелоц");
        var ascension = offsetDate(year, gregEaster.month, gregEaster.day, 39);
        addHoliday(ascension.month, ascension.day, true, "Համբարձում", "Ascension Day", "Вознесение");
        var pentecost = offsetDate(year, gregEaster.month, gregEaster.day, 49);
        addHoliday(pentecost.month, pentecost.day, true, "Հոգեգալուստ", "Pentecost", "Пятидесятница");
        var vardavar = offsetDate(year, gregEaster.month, gregEaster.day, 98);
        addHoliday(vardavar.month, vardavar.day, true, "Վարդավառ", "Vardavar (Transfiguration)", "Вардавар");
        var assumption = getNearestSunday(year, 7, 15);
        addHoliday(assumption.month, assumption.day, true, "Խաղողօրհնեք (Վերափոխում)", "Assumption of Mary", "Успение Богородицы");
        var khachverats = getNearestSunday(year, 8, 14);
        addHoliday(khachverats.month, khachverats.day, true, "Խաչվերաց", "Exaltation of the Cross", "Воздвижение Креста");
    } else if (country === "RU") {
        addHoliday(0, 1, false, "Ամանոր", "New Year", "Новый год");
        addHoliday(0, 2, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(0, 3, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(0, 4, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(0, 5, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(0, 6, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(0, 7, false, "Սուրբ Ծնունդ", "Orthodox Christmas", "Рождество Христово");
        addHoliday(0, 8, false, "Ամանորյա տոներ", "New Year Holiday", "Новогодние каникулы");
        addHoliday(1, 23, false, "Հայրենիքի պաշտպանի օր", "Defender of the Fatherland", "День защитника Отечества");
        addHoliday(2, 8, false, "Կանանց միջազգային օր", "Women's Day", "Международный женский день");
        addHoliday(4, 1, false, "Գարնան եւ աշխատանքի տոն", "Spring and Labor Day", "Праздник Весны и Труда");
        addHoliday(4, 9, false, "Հաղթանակի օր", "Victory Day", "День Победы");
        addHoliday(5, 12, false, "Ռուսաստանի օր", "Russia Day", "День России");
        addHoliday(10, 4, false, "Ժողովրդական միասնության օր", "Unity Day", "День народного единства");

        var maslenitsa = offsetDate(year, orthEaster.month, orthEaster.day, -49);
        addHoliday(maslenitsa.month, maslenitsa.day, true, "Մասլենիցա", "Maslenitsa", "Масленица");
        var orthPalm = offsetDate(year, orthEaster.month, orthEaster.day, -7);
        addHoliday(orthPalm.month, orthPalm.day, true, "Ծաղկազարդ", "Palm Sunday", "Вербное воскресенье");
        addHoliday(orthEaster.month, orthEaster.day, true, "Ուղղափառ Զատիկ", "Orthodox Easter", "Святая Пасха");
        var radonitsa = offsetDate(year, orthEaster.month, orthEaster.day, 9);
        addHoliday(radonitsa.month, radonitsa.day, true, "Ռադոնիցա", "Radonitsa", "Радоница");
        var troitsa = offsetDate(year, orthEaster.month, orthEaster.day, 49);
        addHoliday(troitsa.month, troitsa.day, true, "Սուրբ Երրորդություն", "Holy Trinity", "День Святой Троицы");
    } else if (country === "US") {
        addHoliday(0, 1, false, "Ամանոր", "New Year's Day", "Новый год");
        addHoliday(1, 14, false, "Սբ. Վալենտինի օր", "Valentine's Day", "День Св. Валентина");
        addHoliday(5, 19, false, "Ջունթինթ", "Juneteenth", "День освобождения");
        addHoliday(6, 4, false, "Անկախության օր", "Independence Day", "День Независимости");
        addHoliday(9, 31, false, "Հելոուին", "Halloween", "Хэллоуин");
        addHoliday(10, 11, false, "Վետերանների օր", "Veterans Day", "День ветеранов");
        addHoliday(11, 25, false, "Սուրբ Ծնունդ", "Christmas Day", "Рождество");

        var mlk = getNthWeekdayOfMonth(year, 0, 1, 3);
        addHoliday(mlk.month, mlk.day, true, "Մարտին Լյութեր Քինգի օր", "MLK Jr. Day", "День Мартина Лютера Кинга");
        var pres = getNthWeekdayOfMonth(year, 1, 1, 3);
        addHoliday(pres.month, pres.day, true, "Նախագահների օր", "Presidents' Day", "Президентский день");
        var goodFri = offsetDate(year, gregEaster.month, gregEaster.day, -2);
        addHoliday(goodFri.month, goodFri.day, true, "Ավագ Ուրբաթ", "Good Friday", "Страстная пятница");
        addHoliday(gregEaster.month, gregEaster.day, true, "Սուրբ Զատիկ", "Easter Sunday", "Пасха");
        var mothers = getNthWeekdayOfMonth(year, 4, 0, 2);
        addHoliday(mothers.month, mothers.day, true, "Մայրերի օր", "Mother's Day", "День матери");
        var memorial = getNthWeekdayOfMonth(year, 4, 1, -1);
        addHoliday(memorial.month, memorial.day, true, "Հիշատակի օր", "Memorial Day", "День поминовения");
        var fathers = getNthWeekdayOfMonth(year, 5, 0, 3);
        addHoliday(fathers.month, fathers.day, true, "Հայրերի օր", "Father's Day", "День отца");
        var laborUs = getNthWeekdayOfMonth(year, 8, 1, 1);
        addHoliday(laborUs.month, laborUs.day, true, "Աշխատանքի օր", "Labor Day", "День труда");
        var columbus = getNthWeekdayOfMonth(year, 9, 1, 2);
        addHoliday(columbus.month, columbus.day, true, "Կոլումբոսի օր", "Columbus Day", "День Колумба");
        var thanks = getNthWeekdayOfMonth(year, 10, 4, 4);
        addHoliday(thanks.month, thanks.day, true, "Գոհաբանության օր", "Thanksgiving Day", "День благодарения");
    } else if (country === "FR") {
        addHoliday(0, 1, false, "Ամանոր", "Jour de l'An", "Новый год");
        addHoliday(4, 1, false, "Աշխատանքի տոն", "Fête du Travail", "День труда");
        addHoliday(4, 8, false, "Հաղթանակի օր (1945)", "Victoire 1945", "День Победы 1945");
        addHoliday(6, 14, false, "Բաստիլի օր", "Fête Nationale", "День взятия Бастилии");
        addHoliday(7, 15, false, "Վերափոխում", "Assomption", "Успение");
        addHoliday(10, 1, false, "Բոլոր Սրբերի օր", "Toussaint", "День всех святых");
        addHoliday(10, 11, false, "Զինադադարի օր", "Armistice 1918", "День перемирия");
        addHoliday(11, 25, false, "Սուրբ Ծնունդ", "Noël", "Рождество");

        addHoliday(gregEaster.month, gregEaster.day, true, "Սուրբ Զատիկ", "Pâques", "Пасха");
        var frEasterMon = offsetDate(year, gregEaster.month, gregEaster.day, 1);
        addHoliday(frEasterMon.month, frEasterMon.day, true, "Զատկի Երկուշաբթի", "Lundi de Pâques", "Пасхальный понедельник");
        var frAsc = offsetDate(year, gregEaster.month, gregEaster.day, 39);
        addHoliday(frAsc.month, frAsc.day, true, "Համբարձում", "Ascension", "Вознесение");
        var frPentMon = offsetDate(year, gregEaster.month, gregEaster.day, 50);
        addHoliday(frPentMon.month, frPentMon.day, true, "Հոգեգալստյան Երկուշաբթի", "Lundi de Pentecôte", "День Святого Духа");
    } else if (country === "DE") {
        addHoliday(0, 1, false, "Ամանոր", "Neujahr", "Новый год");
        addHoliday(4, 1, false, "Աշխատանքի օր", "Tag der Arbeit", "День труда");
        addHoliday(9, 3, false, "Գերմանական միասնության օր", "Tag der Deutschen Einheit", "День немецкого единства");
        addHoliday(11, 25, false, "Սուրբ Ծնունդ (1-ին օր)", "1. Weihnachtstag", "Рождество");
        addHoliday(11, 26, false, "Սուրբ Ծնունդ (2-րդ օր)", "2. Weihnachtstag", "Второй день Рождества");

        var deGoodFri = offsetDate(year, gregEaster.month, gregEaster.day, -2);
        addHoliday(deGoodFri.month, deGoodFri.day, true, "Ավագ Ուրբաթ", "Karfreitag", "Страстная пятница");
        addHoliday(gregEaster.month, gregEaster.day, true, "Սուրբ Զատիկ", "Ostersonntag", "Пасха");
        var deEasterMon = offsetDate(year, gregEaster.month, gregEaster.day, 1);
        addHoliday(deEasterMon.month, deEasterMon.day, true, "Զատկի Երկուշաբթի", "Ostermontag", "Пасхальный понедельник");
        var deAsc = offsetDate(year, gregEaster.month, gregEaster.day, 39);
        addHoliday(deAsc.month, deAsc.day, true, "Համբարձում", "Christi Himmelfahrt", "Вознесение");
        var dePentMon = offsetDate(year, gregEaster.month, gregEaster.day, 50);
        addHoliday(dePentMon.month, dePentMon.day, true, "Հոգեգալստյան Երկուշաբթի", "Pfingstmontag", "День Святого Духа");
    } else if (country === "GE") {
        addHoliday(0, 1, false, "Ամանոր", "New Year", "Новый год");
        addHoliday(0, 2, false, "Բեդոբա", "Bedoba", "Бедоба");
        addHoliday(0, 7, false, "Սուրբ Ծնունդ", "Orthodox Christmas", "Рождество");
        addHoliday(0, 19, false, "Մկրտության տոն", "Epiphany", "Крещение");
        addHoliday(2, 3, false, "Մայրերի օր", "Mother's Day", "День матери");
        addHoliday(2, 8, false, "Կանանց օր", "Women's Day", "Женский день");
        addHoliday(3, 9, false, "Ազգային միասնության օր", "National Unity Day", "День национального единства");
        addHoliday(4, 9, false, "Հաղթանակի օր", "Victory Day", "День Победы");
        addHoliday(4, 26, false, "Անկախության օր", "Independence Day", "День независимости");
        addHoliday(7, 28, false, "Մարիամոբա", "Mariamoba", "Успение");
        addHoliday(9, 14, false, "Սվետիցխովլոբա", "Svetitskhovloba", "Светицховлоба");
        addHoliday(10, 23, false, "Գիորգոբա", "St. George's Day", "Гиоргоба");

        var geGoodFri = offsetDate(year, orthEaster.month, orthEaster.day, -2);
        addHoliday(geGoodFri.month, geGoodFri.day, true, "Ավագ Ուրբաթ", "Good Friday", "Страстная пятница");
        addHoliday(orthEaster.month, orthEaster.day, true, "Սուրբ Զատիկ", "Orthodox Easter", "Пасха");
        var geEasterMon = offsetDate(year, orthEaster.month, orthEaster.day, 1);
        addHoliday(geEasterMon.month, geEasterMon.day, true, "Զատկի Երկուշաբթի", "Easter Monday", "Пасхальный понедельник");
    } else {
        addHoliday(0, 1, false, "Ամանոր", "New Year's Day", "Новый год");
        addHoliday(2, 8, false, "Կանանց օր", "Women's Day", "Женский день");
        addHoliday(4, 1, false, "Աշխատանքի օր", "Labor Day", "День труда");
        addHoliday(4, 9, false, "Եվրոպայի օր", "Europe Day", "День Европы");
        addHoliday(11, 24, false, "Սբ. Ծննդյան Ճրագալույց", "Christmas Eve", "Сочельник");
        addHoliday(11, 25, false, "Սուրբ Ծնունդ", "Christmas Day", "Рождество");
        addHoliday(11, 26, false, "Սբ. Ստեփանոսի օր", "Boxing Day", "День Св. Стефана");

        var euGoodFri = offsetDate(year, gregEaster.month, gregEaster.day, -2);
        addHoliday(euGoodFri.month, euGoodFri.day, true, "Ավագ Ուրբաթ", "Good Friday", "Страстная пятница");
        addHoliday(gregEaster.month, gregEaster.day, true, "Սուրբ Զատիկ", "Easter Sunday", "Пасха");
        var euEasterMon = offsetDate(year, gregEaster.month, gregEaster.day, 1);
        addHoliday(euEasterMon.month, euEasterMon.day, true, "Զատկի Երկուշաբթի", "Easter Monday", "Пасхальный понедельник");
        var euAscension = offsetDate(year, gregEaster.month, gregEaster.day, 39);
        addHoliday(euAscension.month, euAscension.day, true, "Համբարձում", "Ascension Day", "Вознесение");
        var euPentecost = offsetDate(year, gregEaster.month, gregEaster.day, 49);
        addHoliday(euPentecost.month, euPentecost.day, true, "Հոգեգալուստ", "Pentecost", "Пятидесятница");
    }

    return map;
}

function getOrCreateCalendarLayer(doc) {
    var layerName = "Calendar_Generator";
    var layer = doc.layers.itemByName(layerName);
    if (!layer || !layer.isValid) {
        layer = doc.layers.add({ name: layerName });
    }
    return layer;
}

function isCalendarFrame(tf) {
    if (!tf || !tf.isValid) {
        return false;
    }
    try {
        if (tf.label === "CALENDAR_GENERATOR_FRAME" || tf.label === "CALENDAR_SKELETON_FRAME") {
            return true;
        }
    } catch (e1) {}
    try {
        if (tf.itemLayer && tf.itemLayer.name === "Calendar_Generator") {
            return true;
        }
    } catch (e2) {}
    try {
        if (tf.tables && tf.tables.length > 0 && tf.tables.item(0).columnCount === 7) {
            return true;
        }
    } catch (e3) {}
    return false;
}

function clearDocumentCalendarFrames(doc, calLayer) {
    try {
        for (var p = 0; p < doc.pages.length; p++) {
            clearPageCalendarFrames(doc.pages.item(p));
        }
    } catch (eP) {}
    try {
        for (var i = doc.textFrames.length - 1; i >= 0; i--) {
            var tf = doc.textFrames.item(i);
            if (isCalendarFrame(tf)) {
                tf.remove();
            }
        }
    } catch (e) {}
    try {
        if (calLayer && calLayer.isValid) {
            while (calLayer.pageItems.length > 0) {
                calLayer.pageItems.item(0).remove();
            }
        }
    } catch (e2) {}
}

function clearPageCalendarFrames(page) {
    if (!page || !page.isValid) return;
    try {
        for (var i = page.textFrames.length - 1; i >= 0; i--) {
            var tf = page.textFrames.item(i);
            if (isCalendarFrame(tf)) {
                tf.remove();
            }
        }
    } catch (e1) {}
    try {
        for (var j = page.pageItems.length - 1; j >= 0; j--) {
            var pi = page.pageItems.item(j);
            if (isCalendarFrame(pi)) {
                pi.remove();
            }
        }
    } catch (e2) {}
}

function getInstalledFontFamilies() {
    var list = [
        "Calibri",
        "Arial",
        "Sylfaen",
        "Noto Sans Armenian",
        "GHEA Grapalat",
        "GHEA Mariam",
        "Tahoma",
        "Segoe UI",
        "Times New Roman",
        "Myriad Pro",
        "Minion Pro"
    ];
    if (typeof JSON !== "undefined" && JSON.stringify) {
        return JSON.stringify(list);
    }
    return '["' + list.join('","') + '"]';
}

function resolveFontName(hostApp, doc, requestedFont) {
    if (requestedFont) {
        var str = String(requestedFont).trim();
        if (str) {
            return str;
        }
    }
    return "Calibri";
}

function applySafeFont(textObj, fontName) {
    if (!textObj) {
        return;
    }
    var req = String(fontName || "Calibri").trim();
    if (!req) {
        req = "Calibri";
    }

    var candidates = [
        req + "\tRegular",
        req + "\tRoman",
        req + "\tBook",
        req + "\tNormal",
        req,
        "Calibri\tRegular",
        "Calibri",
        "Arial\tRegular",
        "Arial",
        "Sylfaen\tRegular",
        "Sylfaen"
    ];

    for (var i = 0; i < candidates.length; i++) {
        try {
            textObj.appliedFont = candidates[i];
            return;
        } catch (e) {}
    }
}

function getHorizontalJustificationEnum(ctx, alignCode) {
    if (!ctx.Justification) {
        return null;
    }
    if (alignCode === "LEFT" && ctx.Justification.LEFT_ALIGN) {
        return ctx.Justification.LEFT_ALIGN;
    }
    if (alignCode === "RIGHT" && ctx.Justification.RIGHT_ALIGN) {
        return ctx.Justification.RIGHT_ALIGN;
    }
    return ctx.Justification.CENTER_ALIGN;
}

function getVerticalJustificationEnum(ctx, alignCode) {
    if (!ctx.VerticalJustification) {
        return null;
    }
    if (alignCode === "TOP" && ctx.VerticalJustification.TOP_ALIGN) {
        return ctx.VerticalJustification.TOP_ALIGN;
    }
    if (alignCode === "BOTTOM" && ctx.VerticalJustification.BOTTOM_ALIGN) {
        return ctx.VerticalJustification.BOTTOM_ALIGN;
    }
    return ctx.VerticalJustification.CENTER_ALIGN;
}

function applyTableBatchCellStyle(table, vJustEnum, padXStr, padYStr, strokeWeightStr) {
    // Fast path via everyItem() if supported, otherwise per-column/cell fallback
    var appliedBatch = false;
    try {
        var allCells = table.cells.everyItem();
        if (vJustEnum) {
            allCells.verticalJustification = vJustEnum;
        }
        allCells.leftInset = padXStr;
        allCells.rightInset = padXStr;
        allCells.topInset = padYStr;
        allCells.bottomInset = padYStr;
        allCells.topEdgeStrokeWeight = strokeWeightStr;
        allCells.bottomEdgeStrokeWeight = strokeWeightStr;
        allCells.leftEdgeStrokeWeight = strokeWeightStr;
        allCells.rightEdgeStrokeWeight = strokeWeightStr;
        appliedBatch = true;
    } catch (eBatch) {
        appliedBatch = false;
    }

    if (!appliedBatch) {
        var rLen = table.rows.length;
        for (var r = 0; r < rLen; r++) {
            var row = table.rows.item(r);
            var cLen = row.cells.length;
            for (var c = 0; c < cLen; c++) {
                var cell = row.cells.item(c);
                try {
                    if (vJustEnum) {
                        cell.verticalJustification = vJustEnum;
                    }
                    cell.leftInset = padXStr;
                    cell.rightInset = padXStr;
                    cell.topInset = padYStr;
                    cell.bottomInset = padYStr;
                    cell.topEdgeStrokeWeight = strokeWeightStr;
                    cell.bottomEdgeStrokeWeight = strokeWeightStr;
                    cell.leftEdgeStrokeWeight = strokeWeightStr;
                    cell.rightEdgeStrokeWeight = strokeWeightStr;
                } catch (eCell) {}
            }
        }
    }
}

function resolvePageFrameBox(doc, page, unitSuffix, ctx, cfg) {
    var pageBox = getPageMarginBox(doc, page, unitSuffix, ctx);
    var useAutoMargins = (cfg.usePageMargins === true);

    if (useAutoMargins) {
        return {
            pageBox: pageBox,
            top: pageBox.y,
            left: pageBox.x,
            width: pageBox.w,
            height: pageBox.h
        };
    }

    var frameTop = parseFloat(cfg.tableTop);
    var frameLeft = parseFloat(cfg.tableLeft);
    var frameWidth = parseFloat(cfg.tableWidth);
    var frameHeight = parseFloat(cfg.tableHeight);

    if (isNaN(frameTop) || frameTop < 0) frameTop = pageBox.y;
    if (isNaN(frameLeft) || frameLeft < 0) frameLeft = pageBox.x;
    if (isNaN(frameWidth) || frameWidth <= 10) frameWidth = pageBox.w;
    if (isNaN(frameHeight) || frameHeight <= 10) frameHeight = pageBox.h;

    if (frameLeft >= pageBox.pageW - 10) frameLeft = Math.max(0, pageBox.pageW - 10);
    if (frameTop >= pageBox.pageH - 10) frameTop = Math.max(0, pageBox.pageH - 10);
    if (frameLeft + frameWidth > pageBox.pageW) {
        frameWidth = Math.max(10, pageBox.pageW - frameLeft);
    }
    if (frameTop + frameHeight > pageBox.pageH) {
        frameHeight = Math.max(10, pageBox.pageH - frameTop);
    }

    return {
        pageBox: pageBox,
        top: Math.round(frameTop * 100) / 100,
        left: Math.round(frameLeft * 100) / 100,
        width: Math.round(frameWidth * 100) / 100,
        height: Math.round(frameHeight * 100) / 100
    };
}

function findExistingSkeletonFrameOnPage(page) {
    try {
        for (var i = 0; i < page.textFrames.length; i++) {
            var tf = page.textFrames.item(i);
            if (tf && tf.isValid && tf.label === "CALENDAR_SKELETON_FRAME") {
                return tf;
            }
        }
    } catch (e) {}
    return null;
}

function renderSkeletonShimmerInDesign(configInput, shimmerStep) {
    var ctx = getInDesignContext();
    if (!ctx || !ctx.app) {
        return "ERROR";
    }
    var hostApp = ctx.app;
    try {
        var cfg = parseConfigString(configInput);
        var doc = (hostApp.documents.length > 0) ? hostApp.activeDocument : hostApp.documents.add();
        var unitSuffix = cfg.unit || "mm";
        applyUnitToDoc(doc, ctx, unitSuffix);

        if (doc.viewPreferences && ctx.RulerOrigin && ctx.RulerOrigin.PAGE_ORIGIN) {
            doc.viewPreferences.rulerOrigin = ctx.RulerOrigin.PAGE_ORIGIN;
        }

        var calLayer = getOrCreateCalendarLayer(doc);
        var activePage = (hostApp.activeWindow && hostApp.activeWindow.activePage)
            ? hostApp.activeWindow.activePage
            : doc.pages.item(0);

        var sh1 = getOrCreateHexColor(doc, ctx, "#D8E2EE");
        var sh2 = getOrCreateHexColor(doc, ctx, "#E5EDF7");
        var sh3 = getOrCreateHexColor(doc, ctx, "#F3F7FC");
        var sh4 = getOrCreateHexColor(doc, ctx, "#FFFFFF");
        var sh5 = getOrCreateHexColor(doc, ctx, "#E5EDF7");
        var shimmerPalette = [sh1, sh2, sh3, sh4, sh5];
        var stepOffset = parseInt(shimmerStep, 10) || 0;

        var showTitle = (cfg.showTitle !== false);
        var showWeekdays = (cfg.showWeekdays !== false);
        var showFooter = (cfg.enableHolidays !== false) && (cfg.showFooterCaption !== false);
        var skelYear = parseInt(cfg.year, 10) || 2026;
        var skelMonth = parseInt(cfg.month, 10);
        if (isNaN(skelMonth) || skelMonth < 0 || skelMonth > 11) skelMonth = 0;
        var skelIsMon = (cfg.startDay === "mon");
        var skelFirstDay = new Date(skelYear, skelMonth, 1).getDay();
        var skelOffset = skelIsMon ? ((skelFirstDay + 6) % 7) : skelFirstDay;
        var skelDaysInMonth = getDaysInMonth(skelYear, skelMonth);
        var weekRows = Math.ceil((skelOffset + skelDaysInMonth) / 7);
        if (isNaN(weekRows) || weekRows < 5) {
            weekRows = 5;
        }
        var totalRows = weekRows + (showTitle ? 1 : 0) + (showWeekdays ? 1 : 0) + (showFooter ? 1 : 0);

        var frameBox = resolvePageFrameBox(doc, activePage, unitSuffix, ctx, cfg);
        var frameTop = frameBox.top;
        var frameLeft = frameBox.left;
        var frameWidth = frameBox.width;
        var frameHeight = frameBox.height;

        var textFrame = (stepOffset > 0) ? findExistingSkeletonFrameOnPage(activePage) : null;
        var table = null;

        if (textFrame && textFrame.tables && textFrame.tables.length > 0) {
            table = textFrame.tables.item(0);
            if (table.rows.length !== totalRows) {
                textFrame = null;
                table = null;
            }
        } else {
            textFrame = null;
        }

        if (!textFrame || !table) {
            clearPageCalendarFrames(activePage);

            textFrame = activePage.textFrames.add();
            try {
                textFrame.itemLayer = calLayer;
            } catch (eL) {}
            try {
                textFrame.label = "CALENDAR_SKELETON_FRAME";
            } catch (eLb) {}

            textFrame.geometricBounds = [
                frameTop + unitSuffix,
                frameLeft + unitSuffix,
                (frameTop + frameHeight) + unitSuffix,
                (frameLeft + frameWidth) + unitSuffix
            ];

            table = textFrame.insertionPoints.item(0).tables.add({
                bodyRowCount: totalRows,
                columnCount: 7
            });

            var colWidthVal = Math.floor(((frameWidth * 0.985) / 7) * 100) / 100;
            for (var colW = 0; colW < 7; colW++) {
                table.columns.item(colW).width = colWidthVal + unitSuffix;
            }

            var rowH = Math.floor(((frameHeight * 0.97) / totalRows) * 100) / 100;
            for (var rInit = 0; rInit < totalRows; rInit++) {
                var rObj = table.rows.item(rInit);
                try {
                    rObj.autoGrow = false;
                } catch (eAg) {}
                rObj.height = rowH + unitSuffix;
            }

            if (showTitle) {
                try {
                    table.rows.item(0).cells.item(0).merge(table.rows.item(0).cells.item(6));
                } catch (eMt) {}
            }
            if (showFooter) {
                try {
                    var lastR = totalRows - 1;
                    table.rows.item(lastR).cells.item(0).merge(table.rows.item(lastR).cells.item(6));
                } catch (eMf) {}
            }
        }

        var rowCount = table.rows.length;
        for (var rIdx = 0; rIdx < rowCount; rIdx++) {
            var rowObj = table.rows.item(rIdx);
            var cellCount = rowObj.cells.length;
            for (var cIdx = 0; cIdx < cellCount; cIdx++) {
                var cell = rowObj.cells.item(cIdx);
                var waveIdx = (rIdx + cIdx + stepOffset * 2) % shimmerPalette.length;
                cell.fillColor = shimmerPalette[waveIdx];
            }
        }

        try {
            if (hostApp.scriptPreferences) {
                hostApp.scriptPreferences.enableRedraw = true;
            }
        } catch (eR) {}

        return "SKELETON_OK";
    } catch (err) {
        return "SKELETON_ERR: " + err.message;
    }
}

function buildMonthTableOnPage(doc, hostApp, ctx, page, layer, cfg, monthIndex, yearHolidays, colors, fonts) {
    var numYear = parseInt(cfg.year, 10) || 2026;
    var mIdx = parseInt(monthIndex, 10);
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) {
        mIdx = 0;
    }
    var isMondayStart = (cfg.startDay === "mon");
    var usePadding = Boolean(cfg.showPadding);
    var showTitle = (cfg.showTitle !== false);
    var showWeekdays = (cfg.showWeekdays !== false);
    var enableHolidays = (cfg.enableHolidays !== false);
    var showInCellHoliday = enableHolidays && (cfg.showInCellHoliday !== false);
    var showFooterCaption = enableHolidays && (cfg.showFooterCaption !== false);
    var unitSuffix = cfg.unit || "mm";

    var locale = getLocaleData(cfg.lang);
    var monthName = locale.months[mIdx] || locale.months[0];
    var dayHeaders = isMondayStart ? locale.daysMon : locale.daysSun;

    var firstDayOfMonth = new Date(numYear, mIdx, 1).getDay();
    var startOffset = isMondayStart ? ((firstDayOfMonth + 6) % 7) : firstDayOfMonth;
    var daysInCurrentMonth = getDaysInMonth(numYear, mIdx);
    var daysInPrevMonth = getDaysInMonth(numYear, mIdx - 1);

    var weekRows = Math.ceil((startOffset + daysInCurrentMonth) / 7);
    if (isNaN(weekRows) || weekRows < 5) {
        weekRows = 5;
    }

    var monthHolidayEntries = [];
    if (enableHolidays) {
        for (var dCheck = 1; dCheck <= daysInCurrentMonth; dCheck++) {
            var hKey = mIdx + "-" + dCheck;
            if (yearHolidays[hKey]) {
                monthHolidayEntries.push(yearHolidays[hKey]);
            }
        }
    }

    var hasFooterRow = showFooterCaption && (monthHolidayEntries.length > 0);
    var headerRowsCount = (showTitle ? 1 : 0) + (showWeekdays ? 1 : 0);
    var totalRows = weekRows + headerRowsCount + (hasFooterRow ? 1 : 0);

    var frameBox = resolvePageFrameBox(doc, page, unitSuffix, ctx, cfg);
    var frameTop = frameBox.top;
    var frameLeft = frameBox.left;
    var frameWidth = frameBox.width;
    var frameHeight = frameBox.height;

    var padXVal = parseFloat(cfg.cellPadX);
    var padYVal = parseFloat(cfg.cellPadY);
    var cellMarginPt = parseFloat(cfg.cellMargin);
    if (isNaN(padXVal) || padXVal < 0) {
        padXVal = 1.5;
    }
    if (isNaN(padYVal) || padYVal < 0) {
        padYVal = 1.5;
    }
    if (isNaN(cellMarginPt) || cellMarginPt < 0) {
        cellMarginPt = 0.75;
    }

    var strokeInUnit = ptToUnit(cellMarginPt, unitSuffix);
    var safetyHeightAllowance = strokeInUnit + ptToUnit(1.5, unitSuffix);

    var summaryParts = [];
    if (hasFooterRow) {
        for (var hIdx = 0; hIdx < monthHolidayEntries.length; hIdx++) {
            var hItem = monthHolidayEntries[hIdx];
            var tag = hItem.isMovable ? (" (" + locale.movableTag + ")") : "";
            summaryParts.push(hItem.day + " " + monthName + " — " + hItem.name + tag);
        }
    }
    var footerContentStr = summaryParts.join("   |   ");
    var estFooterLines = hasFooterRow ? Math.max(1, Math.min(3, Math.ceil(footerContentStr.length / 60))) : 0;

    var minTitleH = showTitle ? (ptToUnit((parseFloat(cfg.titleSize) || 18) * 1.35, unitSuffix) + strokeInUnit * 2 + ptToUnit(3, unitSuffix)) : 0;
    var minHeaderH = showWeekdays ? (ptToUnit((parseFloat(cfg.headerSize) || 11) * 1.35, unitSuffix) + strokeInUnit * 2 + ptToUnit(2, unitSuffix)) : 0;
    var minFooterH = hasFooterRow ? (ptToUnit(8.5 * 1.35 * estFooterLines, unitSuffix) + strokeInUnit * 2 + ptToUnit(2, unitSuffix)) : 0;

    var titleRowH = showTitle ? Math.max(Math.round(frameHeight * 0.08 * 100) / 100, Math.ceil(minTitleH * 100) / 100) : 0;
    var headerRowH = showWeekdays ? Math.max(Math.round(frameHeight * 0.055 * 100) / 100, Math.ceil(minHeaderH * 100) / 100) : 0;
    var footerRowH = hasFooterRow ? Math.max(Math.round(frameHeight * 0.065 * 100) / 100, Math.ceil(minFooterH * 100) / 100) : 0;

    // Ensure non-day rows leave room for weekRows
    var nonDayTotal = titleRowH + headerRowH + footerRowH;
    var maxNonDayAllowed = Math.max(0, frameHeight - (weekRows * ptToUnit(10, unitSuffix)));
    if (nonDayTotal > maxNonDayAllowed && maxNonDayAllowed > 0) {
        var scaleNonDay = maxNonDayAllowed / nonDayTotal;
        titleRowH = Math.floor(titleRowH * scaleNonDay * 100) / 100;
        headerRowH = Math.floor(headerRowH * scaleNonDay * 100) / 100;
        footerRowH = Math.floor(footerRowH * scaleNonDay * 100) / 100;
        nonDayTotal = titleRowH + headerRowH + footerRowH;
    }

    var remainingH = Math.max(weekRows * ptToUnit(12, unitSuffix), frameHeight - nonDayTotal - safetyHeightAllowance);
    var dayRowH = Math.floor((remainingH / weekRows) * 100) / 100;

    // Clamp cell vertical inset so padding never exceeds 20% of dayRowH
    var safePadYVal = Math.min(padYVal, Math.max(0, Math.floor((dayRowH * 0.18) * 100) / 100));
    var safePadXVal = Math.min(padXVal, Math.max(0, Math.floor(((frameWidth / 7) * 0.18) * 100) / 100));
    var compactPadYStr = Math.min(safePadYVal, ptToUnit(1.5, unitSuffix)) + unitSuffix;

    var padXStr = safePadXVal + unitSuffix;
    var padYStr = safePadYVal + unitSuffix;
    var strokeWeightStr = cellMarginPt + "pt";

    var bTop = frameTop;
    var bLeft = frameLeft;
    var bBottom = bTop + frameHeight;
    var bRight = bLeft + frameWidth;

    var textFrame = page.textFrames.add();
    try {
        textFrame.itemLayer = layer;
    } catch (eLayer) {}
    try {
        textFrame.label = "CALENDAR_GENERATOR_FRAME";
    } catch (eLabel) {}
    textFrame.geometricBounds = [
        bTop + unitSuffix,
        bLeft + unitSuffix,
        bBottom + unitSuffix,
        bRight + unitSuffix
    ];
    try {
        if (textFrame.textFramePreferences) {
            textFrame.textFramePreferences.insetSpacing = [0, 0, 0, 0];
        }
    } catch (eTfp) {}

    var table = textFrame.insertionPoints.item(0).tables.add({
        bodyRowCount: totalRows,
        columnCount: 7
    });

    var safeTableW = Math.max(10, frameWidth - strokeInUnit - ptToUnit(0.5, unitSuffix));
    var colWidthVal = Math.floor((safeTableW / 7) * 100) / 100;
    for (var colW = 0; colW < 7; colW++) {
        table.columns.item(colW).width = colWidthVal + unitSuffix;
    }

    var vJustEnum = getVerticalJustificationEnum(ctx, cfg.cellAlignV);
    var hJustEnum = getHorizontalJustificationEnum(ctx, cfg.cellAlignH);
    var centerHJust = getHorizontalJustificationEnum(ctx, "CENTER");
    var centerVJust = getVerticalJustificationEnum(ctx, "CENTER");

    var currentRowCursor = 0;
    var titleRowIdx = -1;
    var weekdayRowIdx = -1;

    if (showTitle) {
        titleRowIdx = currentRowCursor;
        currentRowCursor++;
    }
    if (showWeekdays) {
        weekdayRowIdx = currentRowCursor;
        currentRowCursor++;
    }

    var dayStartRow = currentRowCursor;
    var footerRowIndex = hasFooterRow ? (dayStartRow + weekRows) : -1;
    var totalDayCells = weekRows * 7;

    // Assign exact row heights and disable autoGrow so no row can ever push the table into overset
    for (var rIdx = 0; rIdx < totalRows; rIdx++) {
        var rowItem = table.rows.item(rIdx);
        try {
            rowItem.autoGrow = false;
        } catch (eAutoGrow) {}
        if (rIdx === titleRowIdx) {
            rowItem.height = titleRowH + unitSuffix;
        } else if (rIdx === weekdayRowIdx) {
            rowItem.height = headerRowH + unitSuffix;
        } else if (rIdx === footerRowIndex) {
            rowItem.height = footerRowH + unitSuffix;
        } else {
            rowItem.height = dayRowH + unitSuffix;
        }
    }

    // Batch apply cell insets (padding), stroke weight (margin), and vertical alignment
    applyTableBatchCellStyle(table, vJustEnum, padXStr, padYStr, strokeWeightStr);

    // Populate weekday headers and apply their font, size, color, and alignment
    if (showWeekdays && weekdayRowIdx >= 0) {
        var wRow = table.rows.item(weekdayRowIdx);
        for (var wCol = 0; wCol < 7; wCol++) {
            var wCell = wRow.cells.item(wCol);
            try {
                wCell.topInset = compactPadYStr;
                wCell.bottomInset = compactPadYStr;
            } catch (eWPad) {}
            wCell.contents = dayHeaders[wCol];
            wCell.fillColor = colors.headerBg;
            if (centerVJust) {
                wCell.verticalJustification = centerVJust;
            }
            try {
                var wText = wCell.texts.item(0);
                try { wText.autoLeading = true; } catch (eAl1) {}
                applySafeFont(wText, fonts.header);
                wText.pointSize = parseFloat(cfg.headerSize) || 11;
                if (centerHJust) {
                    wText.justification = centerHJust;
                }
                wText.fillColor = colors.headerText;
            } catch (eWStyle) {}
        }
    }

    // Style Title Row
    if (showTitle && titleRowIdx >= 0) {
        var titleCell = table.rows.item(titleRowIdx).cells.item(0).merge(table.rows.item(titleRowIdx).cells.item(6));
        try {
            titleCell.topInset = compactPadYStr;
            titleCell.bottomInset = compactPadYStr;
        } catch (eTPad) {}
        table.rows.item(titleRowIdx).height = titleRowH + unitSuffix;
        titleCell.fillColor = colors.titleBg;
        if (centerVJust) {
            titleCell.verticalJustification = centerVJust;
        }
        titleCell.contents = monthName + " " + numYear;
        try {
            var titleText = titleCell.texts.item(0);
            try { titleText.autoLeading = true; } catch (eAl2) {}
            applySafeFont(titleText, fonts.title);
            titleText.pointSize = parseFloat(cfg.titleSize) || 18;
            if (centerHJust) {
                titleText.justification = centerHJust;
            }
            titleText.fillColor = colors.titleText;
        } catch (eTitleStyle) {}
    }

    // Style Footer Row before day cells
    if (hasFooterRow && footerRowIndex >= 0) {
        var footerCell = table.rows.item(footerRowIndex).cells.item(0).merge(table.rows.item(footerRowIndex).cells.item(6));
        try {
            footerCell.topInset = compactPadYStr;
            footerCell.bottomInset = compactPadYStr;
        } catch (eFPad) {}
        table.rows.item(footerRowIndex).height = footerRowH + unitSuffix;
        footerCell.fillColor = colors.headerBg;
        if (centerVJust) {
            footerCell.verticalJustification = centerVJust;
        }
        footerCell.contents = footerContentStr;
        try {
            var fText = footerCell.texts.item(0);
            try { fText.autoLeading = true; } catch (eAl3) {}
            applySafeFont(fText, fonts.header);
            fText.pointSize = 8.5;
            if (centerHJust) {
                fText.justification = centerHJust;
            }
            fText.fillColor = colors.headerText;
        } catch (eFooterStyle) {}
    }

    // Populate and style all day cells (Padding, Regular, Weekend, Holiday) directly on cell.texts.item(0)
    var dayPt = parseFloat(cfg.daySize) || 12;
    var wkndPt = parseFloat(cfg.weekendSize) || dayPt;
    var padPt = parseFloat(cfg.paddingSize) || 10;
    var holidayCaptionPt = Math.min(10, Math.max(5, Math.round(dayPt * 0.52)));

    for (var i = 0; i < totalDayCells; i++) {
        var r = Math.floor(i / 7) + dayStartRow;
        var c = i % 7;
        var dayCell = table.rows.item(r).cells.item(c);
        var isWeekendCol = isMondayStart ? (c === 5 || c === 6) : (c === 0 || c === 6);

        if (i < startOffset || i >= startOffset + daysInCurrentMonth) {
            if (usePadding) {
                var padDayNum = (i < startOffset)
                    ? (daysInPrevMonth - startOffset + 1 + i)
                    : (i - (startOffset + daysInCurrentMonth) + 1);
                dayCell.contents = String(padDayNum);
                dayCell.fillColor = colors.paddingBg;
                try {
                    var pText = dayCell.texts.item(0);
                    try { pText.autoLeading = true; } catch (eAl4) {}
                    applySafeFont(pText, fonts.day);
                    pText.pointSize = padPt;
                    if (hJustEnum) {
                        pText.justification = hJustEnum;
                    }
                    pText.fillColor = colors.paddingText;
                } catch (ePadStyle) {}
            } else {
                dayCell.contents = "";
                try {
                    dayCell.fillColor = doc.swatches.itemByName("None");
                } catch (eNone) {
                    dayCell.fillColor = colors.dayBg;
                }
            }
        } else {
            var currentDay = i - startOffset + 1;
            var holidayInfo = enableHolidays ? yearHolidays[mIdx + "-" + currentDay] : null;
            if (holidayInfo && showInCellHoliday) {
                dayCell.contents = String(currentDay) + "\r" + holidayInfo.name;
            } else {
                dayCell.contents = String(currentDay);
            }

            if (holidayInfo) {
                dayCell.fillColor = holidayInfo.isMovable ? colors.movableBg : colors.holidayBg;
            } else if (isWeekendCol) {
                dayCell.fillColor = colors.weekendBg;
            } else {
                dayCell.fillColor = colors.dayBg;
            }

            try {
                var dText = dayCell.texts.item(0);
                try { dText.autoLeading = true; } catch (eAl5) {}
                applySafeFont(dText, fonts.day);
                if (hJustEnum) {
                    dText.justification = hJustEnum;
                }
                if (holidayInfo) {
                    dText.fillColor = holidayInfo.isMovable ? colors.movableText : colors.holidayText;
                    if (dayCell.paragraphs && dayCell.paragraphs.length > 1) {
                        dayCell.paragraphs.item(0).pointSize = isWeekendCol ? wkndPt : dayPt;
                        dayCell.paragraphs.item(1).pointSize = holidayCaptionPt;
                    } else {
                        dText.pointSize = isWeekendCol ? wkndPt : dayPt;
                    }
                } else if (isWeekendCol) {
                    dText.pointSize = wkndPt;
                    dText.fillColor = colors.weekendText;
                } else {
                    dText.pointSize = dayPt;
                    dText.fillColor = colors.dayText;
                }
            } catch (eDayStyle) {}
        }
    }

    // Final overflow guard: if the frame still overflows for any reason, scale row heights down slightly
    try {
        if (textFrame.recompose) {
            textFrame.recompose();
        }
        var guardAttempt = 0;
        while (textFrame.overflows && guardAttempt < 4) {
            guardAttempt++;
            dayRowH = Math.floor(dayRowH * 0.92 * 100) / 100;
            for (var rFix = dayStartRow; rFix < dayStartRow + weekRows; rFix++) {
                table.rows.item(rFix).height = dayRowH + unitSuffix;
            }
            if (textFrame.recompose) {
                textFrame.recompose();
            }
        }
    } catch (eGuard) {}
}

function parseConfigString(rawStr) {
    if (typeof rawStr === "object" && rawStr !== null) {
        return rawStr;
    }
    if (typeof rawStr !== "string") {
        return {};
    }
    var cleanStr = rawStr.replace(/^\s+|\s+$/g, "");
    if (typeof JSON !== "undefined" && JSON && typeof JSON.parse === "function") {
        try {
            return JSON.parse(cleanStr);
        } catch (eJson) {}
    }
    try {
        return eval("(" + cleanStr + ")");
    } catch (eEval) {
        try {
            var fn = new Function("return (" + cleanStr + ");");
            return fn();
        } catch (eFn) {
            return {};
        }
    }
}

function generateCalendarFromConfig(configInput) {
    var ctx = getInDesignContext();
    if (!ctx || !ctx.app) {
        return "ERROR: InDesign host is not available.";
    }
    var hostApp = ctx.app;

    try {
        try {
            if (hostApp.scriptPreferences) {
                hostApp.scriptPreferences.enableRedraw = false;
            }
        } catch (eRedrawOff) {}

        var cfg = parseConfigString(configInput);
        var doc = (hostApp.documents.length > 0) ? hostApp.activeDocument : hostApp.documents.add();

        applyUnitToDoc(doc, ctx, cfg.unit || "mm");

        if (doc.viewPreferences && ctx.RulerOrigin && ctx.RulerOrigin.PAGE_ORIGIN) {
            doc.viewPreferences.rulerOrigin = ctx.RulerOrigin.PAGE_ORIGIN;
        }

        var calLayer = getOrCreateCalendarLayer(doc);

        var colors = {
            titleText: getOrCreateHexColor(doc, ctx, cfg.titleTextColor),
            titleBg: getOrCreateHexColor(doc, ctx, cfg.titleBgColor),
            headerText: getOrCreateHexColor(doc, ctx, cfg.headerTextColor),
            headerBg: getOrCreateHexColor(doc, ctx, cfg.headerBgColor),
            dayText: getOrCreateHexColor(doc, ctx, cfg.dayTextColor),
            dayBg: getOrCreateHexColor(doc, ctx, cfg.dayBgColor),
            weekendText: getOrCreateHexColor(doc, ctx, cfg.weekendTextColor),
            weekendBg: getOrCreateHexColor(doc, ctx, cfg.weekendBgColor),
            paddingText: getOrCreateHexColor(doc, ctx, cfg.paddingTextColor),
            paddingBg: getOrCreateHexColor(doc, ctx, cfg.paddingBgColor),
            holidayText: getOrCreateHexColor(doc, ctx, cfg.holidayTextColor),
            holidayBg: getOrCreateHexColor(doc, ctx, cfg.holidayBgColor),
            movableText: getOrCreateHexColor(doc, ctx, cfg.movableTextColor),
            movableBg: getOrCreateHexColor(doc, ctx, cfg.movableBgColor)
        };

        var fonts = {
            title: resolveFontName(hostApp, doc, cfg.titleFont || "Calibri"),
            header: resolveFontName(hostApp, doc, cfg.headerFont || "Calibri"),
            day: resolveFontName(hostApp, doc, cfg.dayFont || "Calibri")
        };

        var yearHolidays = (cfg.enableHolidays !== false)
            ? getYearHolidays(cfg.year, cfg.country, cfg.lang)
            : {};

        if (cfg.mode === "all") {
            clearDocumentCalendarFrames(doc, calLayer);
            while (doc.pages.length < 12) {
                doc.pages.add();
            }
            for (var m = 0; m < 12; m++) {
                var targetPage = doc.pages.item(m);
                buildMonthTableOnPage(doc, hostApp, ctx, targetPage, calLayer, cfg, m, yearHolidays, colors, fonts);
            }
            try {
                if (hostApp.scriptPreferences) {
                    hostApp.scriptPreferences.enableRedraw = true;
                }
            } catch (eRedrawOn1) {}
            return "SUCCESS:12";
        } else {
            var activePage = (hostApp.activeWindow && hostApp.activeWindow.activePage)
                ? hostApp.activeWindow.activePage
                : doc.pages.item(0);
            clearPageCalendarFrames(activePage);
            buildMonthTableOnPage(doc, hostApp, ctx, activePage, calLayer, cfg, cfg.month, yearHolidays, colors, fonts);
            try {
                if (hostApp.scriptPreferences) {
                    hostApp.scriptPreferences.enableRedraw = true;
                }
            } catch (eRedrawOn2) {}
            return "SUCCESS:1";
        }
    } catch (err) {
        try {
            if (hostApp.scriptPreferences) {
                hostApp.scriptPreferences.enableRedraw = true;
            }
        } catch (eRedrawErr) {}
        return "ERROR: " + err.message;
    }
}

function generateCalendar(year, monthIndex, lang, startDay, showPadding) {
    if (typeof year === "string" && (year.charAt(0) === "{" || year.indexOf("{") !== -1)) {
        return generateCalendarFromConfig(year);
    }
    var defaultCfg = {
        mode: "all",
        year: parseInt(year, 10) || 2026,
        month: parseInt(monthIndex, 10) || 0,
        lang: lang || "hy",
        startDay: startDay || "mon",
        showTitle: true,
        showWeekdays: true,
        enableHolidays: true,
        showInCellHoliday: true,
        showFooterCaption: true,
        showPadding: (showPadding === true || showPadding === "true"),
        country: "AM",
        unit: "mm",
        usePageMargins: true,
        tableWidth: 184.6,
        tableHeight: 271.6,
        tableLeft: 12.7,
        tableTop: 12.7,
        cellPadX: 1.5,
        cellPadY: 1.5,
        cellMargin: 0.75,
        cellAlignH: "CENTER",
        cellAlignV: "CENTER",
        titleFont: "Calibri",
        titleSize: 18,
        headerFont: "Calibri",
        headerSize: 11,
        dayFont: "Calibri",
        daySize: 12,
        weekendSize: 12,
        paddingSize: 10,
        titleTextColor: "#FFFFFF",
        titleBgColor: "#1B365D",
        headerTextColor: "#1B365D",
        headerBgColor: "#DCE6F2",
        dayTextColor: "#1F1F1F",
        dayBgColor: "#FFFFFF",
        weekendTextColor: "#C62828",
        weekendBgColor: "#FFF5F5",
        paddingTextColor: "#9E9E9E",
        paddingBgColor: "#F4F4F4",
        holidayTextColor: "#FFFFFF",
        holidayBgColor: "#D32F2F",
        movableTextColor: "#0D47A1",
        movableBgColor: "#BBDEFB"
    };
    return generateCalendarFromConfig(defaultCfg);
}

if (typeof window !== "undefined") {
    window.generateCalendar = generateCalendar;
    window.generateCalendarFromConfig = generateCalendarFromConfig;
    window.renderSkeletonShimmerInDesign = renderSkeletonShimmerInDesign;
    window.getYearHolidays = getYearHolidays;
    window.getDocumentUnitAndSize = getDocumentUnitAndSize;
    window.getHostThemeInfo = getHostThemeInfo;
    window.getInstalledFontFamilies = getInstalledFontFamilies;
    window.getDaysInMonth = getDaysInMonth;
    window.getLocaleData = getLocaleData;
}
