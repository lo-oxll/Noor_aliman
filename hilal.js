/* محرك توقع الأهلة — حساب فلكي لرؤية هلال كل شهر (معيار عودة Odeh) */
(function (root) {
  var R = Math.PI / 180, DAY = 86400000;
  var SITE = { lat: 31.9961, lon: 44.3317, tz: 3 };   // النجف الأشرف
  var DELTA_T = 69;                                    // ثانية (TT-UT)
  var CFG = { MIN_V: 5.65 };                           // 5.65 = ممكن بالعين المجردة، 2 = ممكن بالعين أو بالمنظار

  function jd(ts) { return ts / DAY + 2440587.5; }
  function norm(x) { x %= 360; return x < 0 ? x + 360 : x; }
  function wrap(x) { x = norm(x); return x > 180 ? x - 360 : x; }

  /* ---- الشمس (Meeus ف.25) ---- */
  function sun(T) {
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * R) + (0.019993 - 0.000101 * T) * Math.sin(2 * M * R) + 0.000289 * Math.sin(3 * M * R);
    var tl = L0 + C, e = 0.016708634 - 0.000042037 * T, v = M + C;
    var Om = 125.04 - 1934.136 * T;
    return { lon: norm(tl - 0.00569 - 0.00478 * Math.sin(Om * R)), dist: 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v * R)) * 149597870.7 };
  }

  /* ---- القمر (Meeus ف.47 مختصر) ---- */
  var LR = [[0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884]];
  var BR = [[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],[0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833]];
  function moon(T) {
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    var F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T, i, t, e, a, sl = 0, sr = 0, sb = 0;
    for (i = 0; i < LR.length; i++) {
      t = LR[i]; e = t[1] ? (Math.abs(t[1]) === 1 ? E : E * E) : 1;
      a = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * R;
      sl += t[4] * e * Math.sin(a); sr += t[5] * e * Math.cos(a);
    }
    for (i = 0; i < BR.length; i++) {
      t = BR[i]; e = t[1] ? (Math.abs(t[1]) === 1 ? E : E * E) : 1;
      a = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * R;
      sb += t[4] * e * Math.sin(a);
    }
    var A1 = (119.75 + 131.849 * T) * R, A2 = (53.09 + 479264.29 * T) * R, A3 = (313.45 + 481266.484 * T) * R, Lr = Lp * R, Fr = F * R, Mr = Mp * R;
    sl += 3958 * Math.sin(A1) + 1962 * Math.sin(Lr - Fr) + 318 * Math.sin(A2);
    sb += -2235 * Math.sin(Lr) + 382 * Math.sin(A3) + 175 * Math.sin(A1 - Fr) + 175 * Math.sin(A1 + Fr) + 127 * Math.sin(Lr - Mr) - 115 * Math.sin(Lr + Mr);
    return { lon: norm(Lp + sl / 1e6), lat: sb / 1e6, dist: 385000.56 + sr / 1000 };
  }

  function nutation(T) {
    var Om = (125.04452 - 1934.136261 * T) * R, L = (280.4665 + 36000.7698 * T) * R, Lm = (218.3165 + 481267.8813 * T) * R;
    return { dpsi: (-17.2 * Math.sin(Om) - 1.32 * Math.sin(2 * L) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * Om)) / 3600,
             deps: (9.2 * Math.cos(Om) + 0.57 * Math.cos(2 * L) + 0.1 * Math.cos(2 * Lm) - 0.09 * Math.cos(2 * Om)) / 3600 };
  }

  function Tof(ts) { return (jd(ts + DELTA_T * 1000) - 2451545) / 36525; }
  function state(ts) {
    var T = Tof(ts), s = sun(T), m = moon(T), n = nutation(T);
    return { T: T, s: s, m: m, n: n, eps: 23.439291 - 0.0130042 * T + n.deps };
  }
  function eqFromEcl(lon, lat, eps) {
    var l = lon * R, b = lat * R, e = eps * R;
    var ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
    var de = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
    return { ra: norm(ra / R), dec: de / R };
  }
  function gmst(ts) { var d = jd(ts) - 2451545, T = d / 36525; return norm(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T); }
  function altitude(eq, ts, site) {
    site = site || SITE;
    var H = (gmst(ts) + site.lon - eq.ra) * R, p = site.lat * R, d = eq.dec * R;
    return Math.asin(Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H)) / R;
  }
  function sunAlt(ts, site) {
    var st = state(ts), l = st.s.lon + st.n.dpsi;
    return altitude(eqFromEcl(l, 0, st.eps), ts, site);
  }
  /* مواقيت الصلاة (المذهب الجعفري — معهد ليفا/قم: الفجر 16°، المغرب 4° تحت الأفق، العشاء 14°)
     dayUtcNoon = 12:00 UTC لليوم الميلادي المطلوب. تُرجع أزمنة UTC (ms) أو null إن لم يتحقق الحدث (عروض عالية). */
  function transit(dayUtcNoon, site) {
    var t = dayUtcNoon - site.lon / 15 * 3600000, i, st, eq, H;
    for (i = 0; i < 4; i++) {
      st = state(t); eq = eqFromEcl(st.s.lon + st.n.dpsi, 0, st.eps);
      H = wrap(gmst(t) + site.lon - eq.ra);
      t -= H / 360.98564736629 * DAY;
    }
    return t;
  }
  function crossing(t0, t1, angle, site, rising) {
    var a = sunAlt(t0, site) - angle, b = sunAlt(t1, site) - angle, i, m;
    if ((a < 0) === (b < 0)) return null;
    for (i = 0; i < 40; i++) { m = (t0 + t1) / 2; if ((sunAlt(m, site) - angle < 0) === (a < 0)) t0 = m; else t1 = m; }
    return (t0 + t1) / 2;
  }
  function prayerTimes(dayUtcNoon, site, angles) {
    angles = angles || { fajr: -16, maghrib: -4, isha: -14 };
    var tr = transit(dayUtcNoon, site), lo = tr - 12 * 3600000, hi = tr + 12 * 3600000;
    var fajr = crossing(lo, tr, angles.fajr, site), sunrise = crossing(lo, tr, -0.833, site),
        sunset = crossing(tr, hi, -0.833, site), maghrib = crossing(tr, hi, angles.maghrib, site), isha = crossing(tr, hi, angles.isha, site);
    var mid = (sunset !== null && fajr !== null) ? sunset + ((fajr + DAY) - sunset) / 2 : null;   // منتصف الليل الشرعي: بين الغروب والفجر
    return { fajr: fajr, sunrise: sunrise, dhuhr: tr, sunset: sunset, maghrib: maghrib, isha: isha, midnight: mid };
  }
  function qibla(lat, lon) {
    var k = { lat: 21.422487 * R, lon: 39.826206 * R }, p = lat * R, dl = lon * R - k.lon;
    // اتجاه من الموقع إلى الكعبة (من الشمال باتجاه عقارب الساعة)
    var y = Math.sin(k.lon - lon * R), x = Math.cos(p) * Math.tan(k.lat) - Math.sin(p) * Math.cos(k.lon - lon * R);
    return norm(Math.atan2(y, x) / R);
  }
  function moonAlt(ts, st) {
    st = st || state(ts);
    var eq = eqFromEcl(st.m.lon + st.n.dpsi, st.m.lat, st.eps), h = altitude(eq, ts);
    var par = Math.asin(6378.14 / st.m.dist) / R;
    return h - par * Math.cos(h * R);
  }

  /* غروب الشمس (مركز القرص عند -0.833°) بتوقيت UTC لليوم المدني (ts عند الظهر المحلي) */
  function sunset(civilNoonUtc) {
    var lo = civilNoonUtc - 3 * 3600000 + 0, hi = civilNoonUtc + 8 * 3600000, i, mid;   // الظهر المحلي ± ...
    // civilNoonUtc = 12:00 UTC لليوم؛ الظهر المحلي ≈ 09:00 UTC (+3). نبحث بين 12:00 و 21:00 محلياً
    lo = civilNoonUtc - 3 * 3600000; hi = civilNoonUtc + 6 * 3600000;
    for (i = 0; i < 40; i++) { mid = (lo + hi) / 2; if (sunAlt(mid) > -0.833) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* آخر اقتران سابق للزمن ts (UTC ms) */
  function conjunctionBefore(ts) {
    var st = state(ts), d = wrap(st.m.lon + st.n.dpsi - (st.s.lon + st.n.dpsi)), t = ts, i, f;
    t -= (d >= 0 ? d / 12.19 : (d + 360) / 12.19) * DAY;
    for (i = 0; i < 8; i++) {
      st = state(t); f = wrap(st.m.lon - st.s.lon);
      t -= f / 12.19 * DAY;
    }
    return t;
  }

  /* تقدير رؤية هلال مساء اليوم المدني (civilNoonUtc = 12:00 UTC لذلك اليوم) */
  function evening(civilNoonUtc) {
    var ss = sunset(civilNoonUtc), st = state(ss);
    var conj = conjunctionBefore(ss), age = (ss - conj) / 3600000;
    var alt = moonAlt(ss, st), salt = sunAlt(ss), arcv = alt - salt;
    var l1 = (st.m.lon) * R, b1 = st.m.lat * R, l2 = st.s.lon * R;
    var arcl = Math.acos(Math.cos(b1) * Math.cos(l1 - l2)) / R;
    var par = Math.asin(6378.14 / st.m.dist) / R * 60;              // دقيقة قوسية
    var sd = 0.272481 * par;                                         // نصف القطر الظاهري (دقيقة)
    var W = sd * (1 - Math.cos(arcl * R));
    var V = arcv - (-0.1018 * W * W * W + 0.7319 * W * W - 6.3226 * W + 7.1651);
    var zone = age <= 0 || alt <= 0 ? 'D' : V >= 5.65 ? 'A' : V >= CFG.MIN_V ? 'B' : V >= -0.96 ? 'C' : 'D';
    return { sunset: ss, conj: conj, age: age, alt: alt, elong: arcl, V: V, zone: zone, visible: alt > 0 && age > 0 && age < 24 * 28 && V >= CFG.MIN_V };
  }

  /* ---- توليد بدايات الأشهر ---- */
  var list = [], anchorsSaved = [];
  function init(anchors, minV) {
    if (typeof minV === 'number') CFG.MIN_V = minV;
    anchorsSaved = anchors;
    list = anchors.slice().sort(function (a, b) { return a[0] < b[0] ? -1 : 1; }).map(function (e) {
      return { ts: Date.parse(e[0] + 'T12:00:00Z'), year: e[1], month: e[2], official: true };
    });
  }
  function setMinV(v) { init(anchorsSaved, v); }
  /* بداية الشهر التالي: تُحسب من اقتران ذلك الشهر القمري نفسه (أول مساء ممكن الرؤية بعد الاقتران)،
     ثم تُقيَّد بقاعدة أن الشهر ٢٩ أو ٣٠ يوماً. فلا ينتقل خطأ شهر إلى ما بعده إلا إن كان البدء نفسه خاطئاً. */
  function nextStart(prevTs) {
    var c = conjunctionBefore(prevTs + 29.5 * DAY);
    var dayNoon = Math.floor((c + SITE.tz * 3600000) / DAY) * DAY + 12 * 3600000, d, direct = null, eve29;
    for (d = 0; d <= 3; d++) { if (evening(dayNoon + d * DAY).visible) { direct = dayNoon + (d + 1) * DAY; break; } }
    if (direct === null) direct = dayNoon + 5 * DAY;
    var lo = prevTs + 29 * DAY, hi = prevTs + 30 * DAY;
    return { ts: Math.min(Math.max(direct, lo), hi), conj: c };
  }
  function extendTo(ts) {
    if (!list.length) return;
    var last = list[list.length - 1], guard = 0;
    while (last.ts <= ts && guard++ < 2000) {
      var n = nextStart(last.ts);
      last.len = Math.round((n.ts - last.ts) / DAY);
      last.evDate = last.ts + 28 * DAY; last.eve = evening(last.evDate);   // مساء التاسع والعشرين: للعرض
      var y = last.month === 12 ? last.year + 1 : last.year, m = last.month === 12 ? 1 : last.month + 1;
      last = { ts: n.ts, year: y, month: m, official: false };
      list.push(last);
    }
  }
  function fillEve() {
    for (var i = 0; i < list.length - 1; i++) if (!list[i].eve) {
      list[i].len = Math.round((list[i + 1].ts - list[i].ts) / DAY);
      list[i].evDate = list[i].ts + 28 * DAY; list[i].eve = evening(list[i].evDate);
    }
  }
  root.Hilal = { prayerTimes: prayerTimes, qibla: qibla, init: init, setMinV: setMinV, extendTo: extendTo, fillEve: fillEve, evening: evening, sunset: sunset, state: state, moonAlt: moonAlt,
                 conjunctionBefore: conjunctionBefore, months: function () { return list; }, cfg: CFG, site: SITE };
  if (typeof module !== 'undefined') module.exports = root.Hilal;
})(typeof window !== 'undefined' ? window : globalThis);
