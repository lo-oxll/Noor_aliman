(function () {
  var home = document.getElementById('home'), lib = document.getElementById('lib');
  var cache = {};
  var MONTHS = window.__months;

  function norm(s) {
    return String(s).replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ک/g, 'ك').replace(/ی/g, 'ي').replace(/\s+/g, ' ').trim();
  }
  function load(url) {
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[url];
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function link(href, cls, txt) { var a = el('a', cls, txt); a.href = href; return a; }
  function clear() { lib.textContent = ''; }
  function fail() {
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', ''));
    lib.appendChild(el('p', 'msg', 'تعذّر تحميل المحتوى. تحقق من الاتصال ثم أعد المحاولة.'));
  }
  function topbar(backHref, backText, title) {
    var b = el('div', 'libbar');
    b.appendChild(link(backHref, 'back', '‹ ' + backText));
    if (title) b.appendChild(el('h2', 'libtitle', title));
    return b;
  }
  function searchBox(ph, onInput) {
    var i = el('input', 'search');
    i.type = 'search'; i.placeholder = ph; i.setAttribute('aria-label', ph); i.autocomplete = 'off';
    var t;
    i.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { onInput(norm(i.value)); }, 120); });
    return i;
  }

  /* حجم الخط */
  var fs = 1.45;
  try { var sv = parseFloat(localStorage.getItem('fs')); if (sv >= 1 && sv <= 2.6) fs = sv; } catch (e) {}
  function applyFs() { lib.style.setProperty('--fs', fs + 'rem'); }
  function fontTools() {
    var w = el('div', 'fonttools');
    [['أ−', -0.15, 'تصغير الخط'], ['أ+', 0.15, 'تكبير الخط']].forEach(function (x) {
      var b = el('button', null, x[0]); b.type = 'button'; b.setAttribute('aria-label', x[2]);
      b.addEventListener('click', function () {
        fs = Math.max(1, Math.min(2.6, +(fs + x[1]).toFixed(2))); applyFs();
        try { localStorage.setItem('fs', fs); } catch (e) {}
      });
      w.appendChild(b);
    });
    return w;
  }

  /* قائمة قابلة للتصفية: items [{href,title,sub,key}] */
  function listView(items, container) {
    var wrap = el('div', 'list');
    items.forEach(function (it) {
      var a = link(it.href, 'row');
      a.appendChild(el('span', 'rt', it.title));
      if (it.sub) a.appendChild(el('small', 'rs', it.sub));
      it.node = a; wrap.appendChild(a);
    });
    container.appendChild(wrap);
    var empty = el('p', 'msg', 'لا نتائج.'); empty.hidden = true; container.appendChild(empty);
    return function (q) {
      var n = 0;
      items.forEach(function (it) { var ok = !q || norm(it.title + ' ' + (it.sub || '')).indexOf(q) > -1; it.node.hidden = !ok; if (ok) n++; });
      empty.hidden = n > 0;
    };
  }

  /* عرض نص متدرّج (لقوائم طويلة) */
  function chunked(rows, render, container, step) {
    var pos = 0, more = el('button', 'more', 'عرض المزيد'); more.type = 'button';
    function next() {
      var end = Math.min(rows.length, pos + step), f = document.createDocumentFragment();
      for (; pos < end; pos++) f.appendChild(render(rows[pos]));
      container.insertBefore(f, more);
      more.hidden = pos >= rows.length;
    }
    more.addEventListener('click', next);
    container.appendChild(more); next();
  }

  /* ---------- الأدعية والزيارات ---------- */
  function duaIndex(kind) {
    load('duas/index.json').then(function (idx) {
      clear();
      var isZ = kind === 'ziyarat';
      lib.appendChild(topbar('#/', 'الرئيسية', isZ ? 'الزيارات' : 'الأدعية'));
      var box = el('div');
      var groups = isZ ? [['الزيارات', 'z']] : [['الأدعية المشهورة', 'd'], ['الصحيفة السجادية', 's']];
      var filters = [];
      var sb = searchBox('ابحث…', function (q) { filters.forEach(function (f) { f(q); }); });
      lib.appendChild(sb); lib.appendChild(box);
      groups.forEach(function (g) {
        var items = idx.filter(function (x) { return x.c === g[1]; }).map(function (x) {
          return { href: '#/' + kind + '/' + x.id, title: x.t };
        });
        if (!items.length) return;
        var sec = el('div'); sec.appendChild(el('h3', 'grp', g[0])); box.appendChild(sec);
        filters.push(listView(items, sec));
      });
      if (isZ) lib.appendChild(el('p', 'note', 'الزيارات المتوفرة حالياً: عاشوراء، الأربعين، وارث، الجامعة الكبيرة، آل ياسين.'));
    }).catch(fail);
  }
  function duaRead(kind, id) {
    Promise.all([load('duas/index.json'), load('duas/' + id + '.json')]).then(function (r) {
      var meta = r[0].filter(function (x) { return x.id === id; })[0];
      if (!meta) return fail();
      clear();
      lib.appendChild(topbar('#/' + kind, kind === 'ziyarat' ? 'الزيارات' : 'الأدعية', ''));
      lib.appendChild(el('h2', 'rtitle', meta.t));
      lib.appendChild(fontTools());
      var body = el('article', 'reader');
      r[1].forEach(function (l) { body.appendChild(el('p', null, l)); });
      lib.appendChild(body);
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  /* ---------- نهج البلاغة ---------- */
  var NAHJ = { khutab: 'الخطب', kutub: 'الكتب والرسائل', hikam: 'الحِكَم وقصار الكلمات' };
  function nahjTabs(cur) {
    var t = el('div', 'tabs');
    Object.keys(NAHJ).forEach(function (k) { var a = link('#/nahj/' + k, k === cur ? 'on' : '', NAHJ[k]); t.appendChild(a); });
    return t;
  }
  function nahjHome() {
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'نهج البلاغة'));
    lib.appendChild(el('p', 'note', 'جمع الشريف الرضي (رحمه الله) من كلام أمير المؤمنين الإمام علي (عليه السلام).'));
    lib.appendChild(nahjTabs(''));
  }
  function nahjList(part) {
    load('nahj/' + part + '.json').then(function (rows) {
      clear();
      lib.appendChild(topbar('#/nahj', 'نهج البلاغة', NAHJ[part]));
      lib.appendChild(nahjTabs(part));
      var holder = el('div');
      if (part === 'hikam') {
        var cards = [];
        var sb = searchBox('ابحث في الحِكَم…', function (q) {
          holder.textContent = '';
          var res = rows.filter(function (r) { return !q || norm(r[1]).indexOf(q) > -1; });
          if (!res.length) { holder.appendChild(el('p', 'msg', 'لا نتائج.')); return; }
          chunked(res, function (r) {
            var c = el('div', 'saying'); c.appendChild(el('b', 'num', String(r[0]))); c.appendChild(el('p', 'ar', r[1])); return c;
          }, holder, 30);
        });
        lib.appendChild(sb); lib.appendChild(holder); sb.dispatchEvent(new Event('input'));
      } else {
        var items = rows.map(function (r) { return { href: '#/nahj/' + part + '/' + r[0], title: (part === 'khutab' ? 'الخطبة ' : 'الكتاب ') + r[0], sub: r[1] }; });
        var f = listView(items, holder);
        lib.appendChild(searchBox('ابحث بالعنوان أو الرقم…', function (q) {
          var n = q.replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; });
          items.forEach(function (it, i) { var ok = !n || norm(it.title + ' ' + it.sub).indexOf(n) > -1; it.node.hidden = !ok; });
        }));
        lib.appendChild(holder);
      }
    }).catch(fail);
  }
  function nahjRead(part, n) {
    load('nahj/' + part + '.json').then(function (rows) {
      var i = rows.findIndex(function (r) { return String(r[0]) === n; });
      if (i < 0) return fail();
      var r = rows[i]; clear();
      lib.appendChild(topbar('#/nahj/' + part, NAHJ[part], ''));
      lib.appendChild(el('h2', 'rtitle', (part === 'khutab' ? 'الخطبة ' : 'الكتاب ') + r[0]));
      lib.appendChild(el('p', 'subtitle', r[1]));
      lib.appendChild(fontTools());
      var body = el('article', 'reader pre');
      body.appendChild(el('p', null, r[2]));
      lib.appendChild(body);
      var nav = el('div', 'pager');
      if (i > 0) nav.appendChild(link('#/nahj/' + part + '/' + rows[i - 1][0], 'pg', '‹ السابق'));
      if (i < rows.length - 1) nav.appendChild(link('#/nahj/' + part + '/' + rows[i + 1][0], 'pg', 'التالي ›'));
      lib.appendChild(nav);
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  /* ---------- غرر الحكم ---------- */
  function ghurarHome() {
    load('ghurar/index.json').then(function (idx) {
      clear();
      lib.appendChild(topbar('#/', 'الرئيسية', 'غرر الحكم ودرر الكلم'));
      lib.appendChild(el('p', 'note', 'للآمدي — مرتّب حسب الموضوعات (تصنيف مصطفى درايتي).'));
      var res = el('div');
      var sb = searchBox('ابحث في كل الكتاب…', function (q) {
        res.textContent = '';
        if (q.length < 2) { box.hidden = false; return; }
        box.hidden = true;
        res.appendChild(el('p', 'msg', 'جارٍ البحث…'));
        Promise.all(idx.map(function (b) { return load('ghurar/' + b.id + '.json'); })).then(function (all) {
          res.textContent = '';
          var out = [];
          all.forEach(function (d, bi) { d.groups.forEach(function (g) { g.i.forEach(function (it) { if (norm(it[1]).indexOf(q) > -1) out.push([it, bi]); }); }); });
          res.appendChild(el('p', 'note', out.length + ' نتيجة'));
          if (!out.length) return;
          chunked(out, function (o) {
            var c = el('div', 'saying'); c.appendChild(el('b', 'num', String(o[0][0])));
            c.appendChild(el('p', 'ar', o[0][1]));
            c.appendChild(link('#/ghurar/' + idx[o[1]].id, 'src', idx[o[1]].title)); return c;
          }, res, 30);
        }).catch(function () { res.textContent = ''; res.appendChild(el('p', 'msg', 'تعذّر تحميل البيانات.')); });
      });
      lib.appendChild(sb); lib.appendChild(res);
      var box = el('div'); lib.appendChild(box);
      var last = '';
      idx.forEach(function (b) {
        if (b.sec !== last) { box.appendChild(el('h3', 'grp', b.sec)); last = b.sec; }
        var a = link('#/ghurar/' + b.id, 'row'); a.appendChild(el('span', 'rt', b.title)); a.appendChild(el('small', 'rs', b.count + ' حكمة')); box.appendChild(a);
      });
    }).catch(fail);
  }
  function ghurarBab(id) {
    Promise.all([load('ghurar/index.json'), load('ghurar/' + id + '.json')]).then(function (r) {
      var meta = r[0].filter(function (x) { return String(x.id) === id; })[0];
      if (!meta) return fail();
      clear();
      lib.appendChild(topbar('#/ghurar', 'غرر الحكم', ''));
      lib.appendChild(el('h2', 'rtitle', meta.title));
      lib.appendChild(el('p', 'subtitle', meta.sec));
      var holder = el('div');
      var sb = searchBox('ابحث في هذا الباب…', function (q) {
        holder.textContent = '';
        r[1].groups.forEach(function (g) {
          var rows = g.i.filter(function (it) { return !q || norm(it[1]).indexOf(q) > -1; });
          if (!rows.length) return;
          var sec = el('div'); sec.appendChild(el('h3', 'grp', g.t)); holder.appendChild(sec);
          chunked(rows, function (it) { var c = el('div', 'saying'); c.appendChild(el('b', 'num', String(it[0]))); c.appendChild(el('p', 'ar', it[1])); return c; }, sec, 40);
        });
        if (!holder.firstChild) holder.appendChild(el('p', 'msg', 'لا نتائج.'));
      });
      lib.appendChild(sb); lib.appendChild(fontTools()); lib.appendChild(holder);
      sb.dispatchEvent(new Event('input'));
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  /* ---------- توقع الأهلة ---------- */
  var ZONE = { A: 'ممكنة الرؤية بالعين المجردة', B: 'ممكنة بالعين المجردة أو بالمنظار — وقد لا تثبت', C: 'ممكنة بالمنظار فقط', D: 'غير ممكنة الرؤية' };
  var fmtD = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtT = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  var DAY = 86400000;
  function hilalView(year) {
    Hilal.extendTo(Date.UTC(2135, 0, 1));
    Hilal.fillEve();
    var L = Hilal.months(), nowTs = Date.now();
    var cur = window.__hijri(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 12));
    year = year || cur.year;
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'توقع الأهلة'));
    lib.appendChild(hilalTabs('moon'));
    lib.appendChild(el('p', 'note', 'حساب فلكي تلقائي لإمكان رؤية هلال كل شهر مساء التاسع والعشرين (النجف الأشرف، معيار Odeh). هو تقدير فقط؛ الثابت شرعاً ما ثبت بالرؤية وإعلان المرجعية.'));
    var sel = el('select', 'yearsel'); sel.setAttribute('aria-label', 'السنة الهجرية');
    for (var y = cur.year; y <= 1550; y++) { var o = el('option', null, y + ' هـ'); o.value = y; if (y === year) o.selected = true; sel.appendChild(o); }
    sel.addEventListener('change', function () { hilalView(parseInt(sel.value, 10)); });
    lib.appendChild(sel);
    var any = false;
    L.forEach(function (m, i) {
      if (m.year !== year) return;
      any = true;
      var prev = L[i - 1], card = el('div', 'hcard');
      card.appendChild(el('h3', null, 'غرة ' + MONTHS[m.month - 1] + ' ' + m.year));
      card.appendChild(el('p', 'hstart', fmtD.format(new Date(m.ts)) + (m.official ? ' — ثابت رسمياً' : ' — تقدير فلكي')));
      if (prev && prev.eve) {
        var e = prev.eve, d = el('dl', 'hdet');
        function row(k, v) { d.appendChild(el('dt', null, k)); d.appendChild(el('dd', null, v)); }
        row('ليلة الرصد', fmtD.format(new Date(prev.evDate)));
        row('غروب الشمس', fmtT.format(new Date(e.sunset)));
        row('الاقتران', fmtD.format(new Date(Math.floor((e.conj + 3 * 3600000) / DAY) * DAY + 12 * 3600000)) + ' ' + fmtT.format(new Date(e.conj)));
        row('عمر الهلال عند الغروب', e.age > 0 && e.age < 24 * 28 ? e.age.toFixed(1) + ' ساعة' : 'لم يحدث الاقتران بعد');
        row('ارتفاع القمر', e.alt.toFixed(1) + '°');
        row('البعد الزاوي عن الشمس', e.elong.toFixed(1) + '°');
        card.appendChild(d);
        card.appendChild(el('p', 'hzone z' + e.zone, ZONE[e.zone] + (e.visible ? ' ← الشهر السابق 29 يوماً' : ' ← الشهر السابق 30 يوماً')));
      }
      lib.appendChild(card);
    });
    if (!any) lib.appendChild(el('p', 'msg', 'لا بيانات لهذه السنة.'));
  }


  /* ---------- أقسام الأهلة الفرعية ---------- */
  function hilalTabs(cur) {
    var t = el('div', 'tabs');
    [['moon', 'الأهلة', '#/hilal'], ['scorpio', 'القمر في العقرب', '#/hilal/scorpio'], ['adab', 'الحلاقة والأظافر', '#/hilal/adab']].forEach(function (x) {
      t.appendChild(link(x[2], x[0] === cur ? 'on' : '', x[1]));
    });
    return t;
  }
  var fmtDT = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function durText(ms) {
    var h = Math.round(ms / 3600000), d = Math.floor(h / 24), r = h % 24;
    return (d ? d + ' يوم و' : '') + r + ' ساعة';
  }
  function scorpioNow() {
    var now = Date.now(), p = Hilal.scorpioPeriods(now, now + 35 * DAY).filter(function (x) { return x.exit > now; })[0];
    if (!p) return null;
    var box = el('div', 'scnow');
    if (p.enter <= now) { box.appendChild(el('b', null, 'القمر الآن في العقرب')); box.appendChild(el('span', null, 'يخرج منه ' + fmtDT.format(new Date(p.exit)))); box.classList.add('inside'); }
    else { box.appendChild(el('b', null, 'القمر لم يدخل العقرب بعد')); box.appendChild(el('span', null, 'يدخل ' + fmtDT.format(new Date(p.enter)) + ' ويخرج ' + fmtDT.format(new Date(p.exit)))); }
    return box;
  }
  function scorpioView(year) {
    Hilal.extendTo(Date.UTC(2135, 0, 1));
    Hilal.fillEve();
    var L = Hilal.months(), d0 = new Date();
    var cur = window.__hijri(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate(), 12));
    year = year || cur.year;
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'توقع الأهلة'));
    lib.appendChild(hilalTabs('scorpio'));
    var nb = scorpioNow(); if (nb) lib.appendChild(nb);
    lib.appendChild(el('p', 'note', 'دخول القمر في برج العقرب وخروجه منه (البروج المدارية: العقرب من ٢١٠° إلى ٢٤٠° من خط طول القمر)، بتوقيت بغداد والنجف. حساب فلكي بدقة تقارب دقائق، وتُعدّ الأشهر هنا حسب أيامها المدنية. ما يترتب على ذلك من أحكام يُرجع فيه إلى المصادر والمرجعية.'));
    var sel = el('select', 'yearsel'); sel.setAttribute('aria-label', 'السنة الهجرية');
    for (var y = cur.year; y <= 1550; y++) { var o = el('option', null, y + ' هـ'); o.value = y; if (y === year) o.selected = true; sel.appendChild(o); }
    sel.addEventListener('change', function () { scorpioView(parseInt(sel.value, 10)); });
    lib.appendChild(sel);
    var any = false;
    L.forEach(function (m, i) {
      var nx = L[i + 1];
      if (m.year !== year || !nx) return;
      any = true;
      var from = m.ts - 15 * 3600000, to = nx.ts - 15 * 3600000;     // منتصف ليل بغداد لأول يوم وللشهر التالي
      var card = el('div', 'hcard');
      card.appendChild(el('h3', null, MONTHS[m.month - 1] + ' ' + m.year));
      var ps = Hilal.scorpioPeriods(from, to);
      if (!ps.length) card.appendChild(el('p', 'msg', 'لا يمر القمر بالعقرب في هذا الشهر.'));
      ps.forEach(function (p) {
        var dl = el('dl', 'hdet');
        dl.appendChild(el('dt', null, 'يدخل العقرب')); dl.appendChild(el('dd', null, fmtDT.format(new Date(p.enter))));
        dl.appendChild(el('dt', null, 'يخرج منه')); dl.appendChild(el('dd', null, fmtDT.format(new Date(p.exit))));
        dl.appendChild(el('dt', null, 'المدة')); dl.appendChild(el('dd', null, durText(p.exit - p.enter)));
        card.appendChild(dl);
      });
      lib.appendChild(card);
    });
    if (!any) lib.appendChild(el('p', 'msg', 'لا بيانات لهذه السنة.'));
  }

  /* ---------- آداب الحلاقة وقص الأظافر ---------- */
  var ADAB = { haircut: 'الحلاقة', nails: 'قص الأظافر' };
  var WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WD_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  function todayAr() {
    return WD_AR[WD_EN.indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Baghdad', weekday: 'long' }).format(new Date()))];
  }
  function adabHome() {
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'توقع الأهلة'));
    lib.appendChild(hilalTabs('adab'));
    lib.appendChild(el('p', 'note', 'متى يُستحب ومتى يُكره، وفائدة كل يوم، كما وردت في الروايات. المحتوى ملخّص ويحتاج مراجعة على المصادر.'));
    Object.keys(ADAB).forEach(function (k) {
      var a = link('#/hilal/adab/' + k, 'row'); a.appendChild(el('span', 'rt', ADAB[k])); lib.appendChild(a);
    });
  }
  function adabSection(title, rows, mk) {
    lib.appendChild(el('h3', 'grp', title));
    if (!rows || !rows.length) { lib.appendChild(el('p', 'msg', 'لم تُضف نصوص هذا القسم بعد.')); return; }
    rows.forEach(function (r) { lib.appendChild(mk(r)); });
  }
  function adabRead(kind) {
    load('adab/' + kind + '.json').then(function (d) {
      clear();
      lib.appendChild(topbar('#/hilal/adab', 'الحلاقة والأظافر', ''));
      lib.appendChild(el('h2', 'rtitle', d.title));
      if (d.note) lib.appendChild(el('p', 'note', d.note));
      var today = todayAr();
      adabSection('أيام الأسبوع', d.weekdays, function (r) {
        var c = el('div', 'adab ' + (r.kind || '') + (r.day === today ? ' today' : ''));
        c.appendChild(el('b', 'ad-day', 'يوم ' + r.day + (r.day === today ? ' (اليوم)' : '')));
        c.appendChild(el('p', 'ad-text', r.text));
        if (r.src) c.appendChild(el('small', 'ad-src', r.src));
        return c;
      });
      adabSection('أيام الشهر', d.monthDays, function (r) {
        var c = el('div', 'adab ' + (r.kind || ''));
        c.appendChild(el('b', 'ad-day', r.d));
        c.appendChild(el('p', 'ad-text', r.text));
        if (r.src) c.appendChild(el('small', 'ad-src', r.src));
        return c;
      });
      adabSection('روايات عامة', d.general, function (r) {
        var c = el('div', 'adab');
        c.appendChild(el('p', 'ad-text', r.text));
        if (r.src) c.appendChild(el('small', 'ad-src', r.src));
        return c;
      });
      window.scrollTo(0, 0);
    }).catch(fail);
  }

  /* ---------- الموجّه ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    applyFs();
    if (!h.length) { lib.hidden = true; home.hidden = false; document.title = 'نور الإيمان'; window.scrollTo(0, 0); return; }
    home.hidden = true; lib.hidden = false;
    var s = h[0];
    if (s === 'duas' || s === 'ziyarat') h[1] ? duaRead(s, h[1]) : duaIndex(s);
    else if (s === 'nahj') { if (!h[1]) nahjHome(); else if (!NAHJ[h[1]]) nahjHome(); else h[2] ? nahjRead(h[1], h[2]) : nahjList(h[1]); }
    else if (s === 'ghurar') h[1] ? ghurarBab(h[1]) : ghurarHome();
    else if (s === 'hilal') {
      if (h[1] === 'scorpio') scorpioView();
      else if (h[1] === 'adab') (ADAB[h[2]] ? adabRead(h[2]) : adabHome());
      else hilalView();
    }
    else { location.hash = '#/'; }
  }
  window.addEventListener('hashchange', route);
  route();
})();
