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
            RulerOrigin: (typeof RulerOrigin !== "undefined") ? RulerOrigin : null
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
                RulerOrigin: id.RulerOrigin
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

function getDocumentUnitAndSize() {
    try {
        var ctx = getInDesignContext();
        if (!ctx || !ctx.app || ctx.app.documents.length === 0) {
            return '{"hasDoc":false,"unit":"mm","pageW":210,"pageH":297,"w":174,"h":250,"x":18,"y":18}';
        }
        var doc = ctx.app.activeDocument;
        var unitCode = detectUnitCodeFromDoc(doc);
        var page = doc.pages.item(0);
        var pb = page.bounds;
        var pH = Math.abs(parseFloat(pb[2]) - parseFloat(pb[0]));
        var pW = Math.abs(parseFloat(pb[3]) - parseFloat(pb[1]));
        if (isNaN(pW) || pW <= 0) {
            pW = 210;
        }
        if (isNaN(pH) || pH <= 0) {
            pH = 297;
        }
        var marginX = Math.round(pW * 0.085 * 10) / 10;
        var marginY = Math.round(pH * 0.07 * 10) / 10;
        var recW = Math.round((pW - marginX * 2) * 10) / 10;
        var recH = Math.round((pH - marginY * 2) * 10) / 10;

        return '{"hasDoc":true,"unit":"' + unitCode + '"' +
            ',"pageW":' + pW +
            ',"pageH":' + pH +
            ',"w":' + recW +
            ',"h":' + recH +
            ',"x":' + marginX +
            ',"y":' + marginY + '}';
    } catch (err) {
        return '{"hasDoc":false,"unit":"mm","pageW":210,"pageH":297,"w":174,"h":250,"x":18,"y":18}';
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
    var color = doc.colors.itemByName(swatchName);
    if (!color || !color.isValid) {
        var props = {
            name: swatchName,
            colorValue: rgb
        };
        if (ctx.ColorModel && ctx.ColorModel.PROCESS) {
            props.model = ctx.ColorModel.PROCESS;
        }
        if (ctx.ColorSpace && ctx.ColorSpace.RGB) {
            props.space = ctx.ColorSpace.RGB;
        }
        try {
            color = doc.colors.add(props);
        } catch (e) {
            color = doc.swatches.itemByName("Black");
        }
    }
    return color;
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
        var lastDate = new Date(year, month + 1, 0);
        var lastDayNum = lastDate.getDate();
        var lastWday = lastDate.getDay();
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
        addHoliday(3, 7, false, "Մայրության և գեղեցկության տոն", "Motherhood & Beauty Day", "День материнства и красоты");
        addHoliday(3, 24, false, "Ցեղասպանության զոհերի հիշատակի օր", "Genocide Remembrance Day", "День памяти жертв Геноцида");
        addHoliday(4, 1, false, "Աշխատանքի օր", "Labor Day", "День труда");
        addHoliday(4, 9, false, "Հաղթանակի և խաղաղության տոն", "Victory & Peace Day", "День Победы и мира");
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
        addHoliday(4, 1, false, "Գարնան և աշխատանքի տոն", "Spring and Labor Day", "Праздник Весны и Труда");
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
        for (var i = doc.textFrames.length - 1; i >= 0; i--) {
            var tf = doc.textFrames.item(i);
            if (isCalendarFrame(tf)) {
                tf.remove();
            }
        }
    } catch (e) {}
    try {
        while (calLayer.pageItems.length > 0) {
            calLayer.pageItems.item(0).remove();
        }
    } catch (e2) {}
}

function clearPageCalendarFrames(page) {
    try {
        for (var i = page.textFrames.length - 1; i >= 0; i--) {
            var tf = page.textFrames.item(i);
            if (isCalendarFrame(tf)) {
                tf.remove();
            }
        }
    } catch (e) {}
}

function resolveFontName(hostApp, doc, requestedFont) {
    var candidates = [];
    if (requestedFont) {
        candidates.push(String(requestedFont));
    }
    candidates.push("Calibri");
    candidates.push("Arial");
    candidates.push("Sylfaen");

    for (var i = 0; i < candidates.length; i++) {
        var name = candidates[i];
        try {
            var fDoc = doc.fonts.itemByName(name);
            if (fDoc && fDoc.isValid) {
                return name;
            }
        } catch (e1) {}
        try {
            var fApp = hostApp.fonts.itemByName(name);
            if (fApp && fApp.isValid) {
                return name;
            }
        } catch (e2) {}
    }
    return "Arial";
}

function applySafeFont(textObj, resolvedFontName) {
    if (!resolvedFontName) {
        return;
    }
    try {
        textObj.appliedFont = String(resolvedFontName);
    } catch (e) {
        try {
            textObj.appliedFont = "Arial";
        } catch (e2) {}
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

        clearPageCalendarFrames(activePage);

        var sh1 = getOrCreateHexColor(doc, ctx, "#DCE3EC");
        var sh2 = getOrCreateHexColor(doc, ctx, "#EEF3F8");
        var sh3 = getOrCreateHexColor(doc, ctx, "#C5D1E0");
        var shBarColor = getOrCreateHexColor(doc, ctx, "#9AA8B8");
        var shimmerPalette = [sh1, sh2, sh3];
        var stepOffset = parseInt(shimmerStep, 10) || 0;

        var showTitle = (cfg.showTitle !== false);
        var showWeekdays = (cfg.showWeekdays !== false);
        var showFooter = (cfg.enableHolidays !== false) && (cfg.showFooterCaption !== false);
        var weekRows = 5;
        var totalRows = weekRows + (showTitle ? 1 : 0) + (showWeekdays ? 1 : 0) + (showFooter ? 1 : 0);

        var frameTop = parseFloat(cfg.tableTop) || 18;
        var frameLeft = parseFloat(cfg.tableLeft) || 18;
        var frameWidth = parseFloat(cfg.tableWidth) || 174;
        var frameHeight = parseFloat(cfg.tableHeight) || 250;

        var textFrame = activePage.textFrames.add();
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

        var table = textFrame.insertionPoints.item(0).tables.add({
            bodyRowCount: totalRows,
            columnCount: 7
        });

        var colWidthVal = Math.floor(((frameWidth * 0.99) / 7) * 100) / 100;
        for (var colW = 0; colW < 7; colW++) {
            table.columns.item(colW).width = colWidthVal + unitSuffix;
        }

        var rowH = Math.floor((frameHeight / totalRows) * 10) / 10;
        for (var rIdx = 0; rIdx < totalRows; rIdx++) {
            var rowObj = table.rows.item(rIdx);
            rowObj.height = rowH + unitSuffix;
            for (var cIdx = 0; cIdx < 7; cIdx++) {
                var cell = rowObj.cells.item(cIdx);
                var shColor = shimmerPalette[(rIdx + cIdx + stepOffset) % 3];
                cell.fillColor = shColor;
                cell.contents = "▬▬";
            }
        }

        var allText = textFrame.texts.item(0);
        allText.pointSize = cfg.daySize || 12;
        allText.fillColor = shBarColor;
        var hJust = getHorizontalJustificationEnum(ctx, cfg.cellAlignH);
        if (hJust) {
            allText.justification = hJust;
        }

        if (showTitle) {
            var tCell = table.rows.item(0).cells.item(0).merge(table.rows.item(0).cells.item(6));
            tCell.fillColor = shimmerPalette[stepOffset % 3];
            tCell.contents = "▬▬▬▬▬▬▬▬▬▬▬▬";
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
    var numYear = cfg.year;
    var isMondayStart = (cfg.startDay === "mon");
    var usePadding = Boolean(cfg.showPadding);
    var showTitle = (cfg.showTitle !== false);
    var showWeekdays = (cfg.showWeekdays !== false);
    var enableHolidays = (cfg.enableHolidays !== false);
    var showInCellHoliday = enableHolidays && (cfg.showInCellHoliday !== false);
    var showFooterCaption = enableHolidays && (cfg.showFooterCaption !== false);
    var unitSuffix = cfg.unit || "mm";

    var locale = getLocaleData(cfg.lang);
    var monthName = locale.months[monthIndex];
    var dayHeaders = isMondayStart ? locale.daysMon : locale.daysSun;

    var firstDayOfMonth = new Date(numYear, monthIndex, 1).getDay();
    var startOffset = isMondayStart ? ((firstDayOfMonth + 6) % 7) : firstDayOfMonth;
    var daysInCurrentMonth = new Date(numYear, monthIndex + 1, 0).getDate();
    var daysInPrevMonth = new Date(numYear, monthIndex, 0).getDate();

    var weekRows = Math.ceil((startOffset + daysInCurrentMonth) / 7);

    var monthHolidayEntries = [];
    if (enableHolidays) {
        for (var dCheck = 1; dCheck <= daysInCurrentMonth; dCheck++) {
            var hKey = monthIndex + "-" + dCheck;
            if (yearHolidays[hKey]) {
                monthHolidayEntries.push(yearHolidays[hKey]);
            }
        }
    }

    var hasFooterRow = showFooterCaption && (monthHolidayEntries.length > 0);
    var headerRowsCount = (showTitle ? 1 : 0) + (showWeekdays ? 1 : 0);
    var totalRows = weekRows + headerRowsCount + (hasFooterRow ? 1 : 0);

    var frameTop = parseFloat(cfg.tableTop);
    var frameLeft = parseFloat(cfg.tableLeft);
    var frameWidth = parseFloat(cfg.tableWidth);
    var frameHeight = parseFloat(cfg.tableHeight);

    if (isNaN(frameTop) || frameTop < 0) {
        frameTop = 18;
    }
    if (isNaN(frameLeft) || frameLeft < 0) {
        frameLeft = 18;
    }
    if (isNaN(frameWidth) || frameWidth <= 10) {
        frameWidth = 174;
    }
    if (isNaN(frameHeight) || frameHeight <= 10) {
        frameHeight = 250;
    }

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

    var padXStr = padXVal + unitSuffix;
    var padYStr = padYVal + unitSuffix;
    var strokeWeightStr = cellMarginPt + "pt";

    var frameBottom = frameTop + frameHeight;
    var frameRight = frameLeft + frameWidth;

    var textFrame = page.textFrames.add();
    try {
        textFrame.itemLayer = layer;
    } catch (eLayer) {}
    try {
        textFrame.label = "CALENDAR_GENERATOR_FRAME";
    } catch (eLabel) {}
    textFrame.geometricBounds = [
        frameTop + unitSuffix,
        frameLeft + unitSuffix,
        frameBottom + unitSuffix,
        frameRight + unitSuffix
    ];

    var table = textFrame.insertionPoints.item(0).tables.add({
        bodyRowCount: totalRows,
        columnCount: 7
    });

    var colWidthVal = Math.floor(((frameWidth * 0.99) / 7) * 100) / 100;
    for (var colW = 0; colW < 7; colW++) {
        table.columns.item(colW).width = colWidthVal + unitSuffix;
    }

    var titleRowH = showTitle ? Math.round(frameHeight * 0.08 * 10) / 10 : 0;
    var headerRowH = showWeekdays ? Math.round(frameHeight * 0.055 * 10) / 10 : 0;
    var footerRowH = hasFooterRow ? Math.round(frameHeight * 0.065 * 10) / 10 : 0;
    var remainingH = Math.max(weekRows * (frameHeight * 0.08), frameHeight - titleRowH - headerRowH - footerRowH - (frameHeight * 0.02));
    var dayRowH = Math.floor((remainingH / weekRows) * 100) / 100;

    var vJustEnum = getVerticalJustificationEnum(ctx, cfg.cellAlignV);
    var hJustEnum = getHorizontalJustificationEnum(ctx, cfg.cellAlignH);
    var centerHJust = getHorizontalJustificationEnum(ctx, "CENTER");
    var centerVJust = getVerticalJustificationEnum(ctx, "CENTER");

    for (var rIdx = 0; rIdx < totalRows; rIdx++) {
        table.rows.item(rIdx).height = dayRowH + unitSuffix;
    }

    // Batch apply cell insets (padding), stroke weight (margin), and vertical alignment
    applyTableBatchCellStyle(table, vJustEnum, padXStr, padYStr, strokeWeightStr);

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
    var totalDayCells = weekRows * 7;

    // Step 1: Fast content population first, then batch-apply base typography on textFrame.texts.item(0)
    if (showWeekdays) {
        var wRow = table.rows.item(weekdayRowIdx);
        wRow.height = headerRowH + unitSuffix;
        for (var wCol = 0; wCol < 7; wCol++) {
            var wCell = wRow.cells.item(wCol);
            wCell.contents = dayHeaders[wCol];
            wCell.fillColor = colors.headerBg;
            if (centerVJust) {
                wCell.verticalJustification = centerVJust;
            }
        }
    }

    for (var i = 0; i < totalDayCells; i++) {
        var r = Math.floor(i / 7) + dayStartRow;
        var c = i % 7;
        var dayCell = table.rows.item(r).cells.item(c);
        var isWeekendCol = isMondayStart ? (c === 5 || c === 6) : (c === 0 || c === 6);

        if (i < startOffset) {
            if (usePadding) {
                var prevDay = daysInPrevMonth - startOffset + 1 + i;
                dayCell.contents = String(prevDay);
                dayCell.fillColor = colors.paddingBg;
            } else {
                dayCell.contents = "";
                dayCell.fillColor = colors.dayBg;
            }
        } else if (i < startOffset + daysInCurrentMonth) {
            var currentDay = i - startOffset + 1;
            var holidayInfo = enableHolidays ? yearHolidays[monthIndex + "-" + currentDay] : null;
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
        } else {
            if (usePadding) {
                var nextDay = i - (startOffset + daysInCurrentMonth) + 1;
                dayCell.contents = String(nextDay);
                dayCell.fillColor = colors.paddingBg;
            } else {
                dayCell.contents = "";
                dayCell.fillColor = colors.dayBg;
            }
        }
    }

    // Batch-apply default day font, size, color, and alignment to the entire story in 4 calls!
    var storyText = textFrame.texts.item(0);
    applySafeFont(storyText, fonts.day);
    storyText.pointSize = cfg.daySize;
    if (hJustEnum) {
        storyText.justification = hJustEnum;
    }
    storyText.fillColor = colors.dayText;

    // Now style only the special cells (Title, Weekdays, Padding, Weekends, Holidays, Footer)
    if (showTitle) {
        var titleCell = table.rows.item(titleRowIdx).cells.item(0).merge(table.rows.item(titleRowIdx).cells.item(6));
        titleCell.height = titleRowH + unitSuffix;
        titleCell.fillColor = colors.titleBg;
        if (centerVJust) {
            titleCell.verticalJustification = centerVJust;
        }
        titleCell.contents = monthName + " " + numYear;
        var titleText = titleCell.texts.item(0);
        applySafeFont(titleText, fonts.title);
        titleText.pointSize = cfg.titleSize;
        if (centerHJust) {
            titleText.justification = centerHJust;
        }
        titleText.fillColor = colors.titleText;
    }

    if (showWeekdays) {
        var wkRow = table.rows.item(weekdayRowIdx);
        for (var col = 0; col < 7; col++) {
            var wText = wkRow.cells.item(col).texts.item(0);
            if (fonts.header !== fonts.day) {
                applySafeFont(wText, fonts.header);
            }
            wText.pointSize = cfg.headerSize;
            if (centerHJust) {
                wText.justification = centerHJust;
            }
            wText.fillColor = colors.headerText;
        }
    }

    for (var idx = 0; idx < totalDayCells; idx++) {
        var rDay = Math.floor(idx / 7) + dayStartRow;
        var cDay = idx % 7;
        var isWknd = isMondayStart ? (cDay === 5 || cDay === 6) : (cDay === 0 || cDay === 6);

        if (idx < startOffset || idx >= startOffset + daysInCurrentMonth) {
            if (usePadding) {
                var pCellText = table.rows.item(rDay).cells.item(cDay).texts.item(0);
                pCellText.pointSize = cfg.paddingSize;
                pCellText.fillColor = colors.paddingText;
            }
        } else {
            var curDayNum = idx - startOffset + 1;
            var hObj = enableHolidays ? yearHolidays[monthIndex + "-" + curDayNum] : null;
            if (hObj) {
                var hCell = table.rows.item(rDay).cells.item(cDay);
                var hText = hCell.texts.item(0);
                hText.fillColor = hObj.isMovable ? colors.movableText : colors.holidayText;
                if (hCell.paragraphs.length > 1) {
                    hCell.paragraphs.item(0).pointSize = isWknd ? cfg.weekendSize : cfg.daySize;
                    hCell.paragraphs.item(1).pointSize = 7;
                } else if (isWknd && cfg.weekendSize !== cfg.daySize) {
                    hText.pointSize = cfg.weekendSize;
                }
            } else if (isWknd) {
                var wkText = table.rows.item(rDay).cells.item(cDay).texts.item(0);
                if (cfg.weekendSize !== cfg.daySize) {
                    wkText.pointSize = cfg.weekendSize;
                }
                wkText.fillColor = colors.weekendText;
            }
        }
    }

    if (hasFooterRow) {
        var footerRowIndex = dayStartRow + weekRows;
        var footerCell = table.rows.item(footerRowIndex).cells.item(0).merge(table.rows.item(footerRowIndex).cells.item(6));
        footerCell.height = footerRowH + unitSuffix;
        footerCell.fillColor = colors.headerBg;
        if (centerVJust) {
            footerCell.verticalJustification = centerVJust;
        }

        var summaryParts = [];
        for (var hIdx = 0; hIdx < monthHolidayEntries.length; hIdx++) {
            var hItem = monthHolidayEntries[hIdx];
            var tag = hItem.isMovable ? (" (" + locale.movableTag + ")") : "";
            summaryParts.push(hItem.day + " " + monthName + " — " + hItem.name + tag);
        }
        footerCell.contents = summaryParts.join("   |   ");
        var fText = footerCell.texts.item(0);
        if (fonts.header !== fonts.day) {
            applySafeFont(fText, fonts.header);
        }
        fText.pointSize = 8.5;
        if (centerHJust) {
            fText.justification = centerHJust;
        }
        fText.fillColor = colors.headerText;
    }
}

function parseConfigString(rawStr) {
    if (typeof rawStr === "object" && rawStr !== null) {
        return rawStr;
    }
    if (typeof JSON !== "undefined" && JSON.parse) {
        return JSON.parse(rawStr);
    }
    var fn = new Function("return (" + rawStr + ");");
    return fn();
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
        tableWidth: 174,
        tableHeight: 250,
        tableLeft: 18,
        tableTop: 18,
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
    window.getLocaleData = getLocaleData;
}
