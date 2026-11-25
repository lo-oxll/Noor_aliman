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

  /* تخزين محلي آمن */
  function sget(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function sset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var showTashkeel = sget('tsk', true);
  function T(t) { return showTashkeel ? t : String(t).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, ''); }

  /* المفضلة وموضع القراءة */
  function favs() { return sget('fav', []); }
  function isFav(h) { return favs().some(function (f) { return f.h === h; }); }
  function favBtn(title) {
    var h = location.hash, b = el('button', 'favbtn'); b.type = 'button';
    function paint() { var on = isFav(h); b.className = 'favbtn' + (on ? ' on' : ''); b.textContent = on ? '★ في المفضلة' : '☆ أضف للمفضلة'; b.setAttribute('aria-pressed', on); }
    b.addEventListener('click', function () {
      var l = favs();
      if (isFav(h)) l = l.filter(function (f) { return f.h !== h; }); else l.unshift({ h: h, t: title });
      sset('fav', l.slice(0, 100)); paint();
    });
    paint(); return b;
  }
  var readerHash = null, saveT;
  function afterRender(title) {
    readerHash = location.hash;
    sset('last', { h: readerHash, t: title });
    var pos = sget('pos', {}), y = pos[readerHash] || 0;
    setTimeout(function () { window.scrollTo(0, y); }, 0);
  }
  window.addEventListener('scroll', function () {
    if (!readerHash || readerHash !== location.hash) return;
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      var pos = sget('pos', {}); pos[readerHash] = Math.round(window.scrollY);
      var ks = Object.keys(pos); if (ks.length > 40) delete pos[ks[0]];
      sset('pos', pos);
    }, 400);
  }, { passive: true });
  function renderHome() {
    var last = sget('last', null), r = document.getElementById('resume'), f = document.getElementById('favs');
    r.textContent = ''; f.textContent = '';
    if (last && last.h && last.t) {
      r.hidden = false; r.appendChild(el('h2', null, 'تابع القراءة'));
      var a = link(last.h, 'item'); a.appendChild(el('span', 't', last.t)); r.appendChild(a);
    } else r.hidden = true;
    var l = favs();
    if (l.length) {
      f.hidden = false; f.appendChild(el('h2', null, 'المفضلة'));
      l.slice(0, 12).forEach(function (x) { var a2 = link(x.h, 'item'); a2.appendChild(el('span', 't', x.t)); f.appendChild(a2); });
    } else f.hidden = true;
  }

  /* قراءة ليلية وتمرير تلقائي */
  var reading = sget('rd', false), spd = sget('spd', 3), autoRAF = null, autoBtn = null;
  function applyReading() { document.body.classList.toggle('reading', !!reading); }
  applyReading();
  function stopAuto() {
    if (autoRAF) { cancelAnimationFrame(autoRAF); autoRAF = null; }
    window.removeEventListener('wheel', stopAuto); window.removeEventListener('touchstart', stopAuto); window.removeEventListener('keydown', stopAuto);
    if (autoBtn) autoBtn.textContent = 'تمرير تلقائي';
  }
  function startAuto() {
    stopAuto();
    var last = 0, acc = 0;
    function step(t) {
      if (!last) last = t;
      acc += (t - last) / 1000 * spd * 15; last = t;
      var d = Math.floor(acc);
      if (d > 0) { window.scrollBy(0, d); acc -= d; }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) { stopAuto(); return; }
      autoRAF = requestAnimationFrame(step);
    }
    autoRAF = requestAnimationFrame(step);
    window.addEventListener('wheel', stopAuto, { passive: true }); window.addEventListener('touchstart', stopAuto, { passive: true }); window.addEventListener('keydown', stopAuto);
    if (autoBtn) autoBtn.textContent = 'إيقاف التمرير';
  }
  var hs = document.getElementById('homeSearch');
  hs.addEventListener('keydown', function (e) { if (e.key === 'Enter' && hs.value.trim()) location.hash = '#/search/' + encodeURIComponent(hs.value.trim()); });

  /* حجم الخط */
  var fs = 1.45;
  try { var sv = parseFloat(localStorage.getItem('fs')); if (sv >= 1 && sv <= 2.6) fs = sv; } catch (e) {}
  function applyFs() { lib.style.setProperty('--fs', fs + 'rem'); }
  function fontTools(noTsk) {
    var w = el('div', 'fonttools');
    [['أ−', -0.15, 'تصغير الخط'], ['أ+', 0.15, 'تكبير الخط']].forEach(function (x) {
      var b = el('button', null, x[0]); b.type = 'button'; b.setAttribute('aria-label', x[2]);
      b.addEventListener('click', function () {
        fs = Math.max(1, Math.min(2.6, +(fs + x[1]).toFixed(2))); applyFs();
        try { localStorage.setItem('fs', fs); } catch (e) {}
      });
      w.appendChild(b);
    });
    var tb = el('button', null, showTashkeel ? 'إخفاء التشكيل' : 'إظهار التشكيل'); tb.type = 'button';
    tb.addEventListener('click', function () { showTashkeel = !showTashkeel; sset('tsk', showTashkeel); route(); });
    if (!noTsk) w.appendChild(tb);
    var rb = el('button', null, reading ? 'إنهاء القراءة الليلية' : 'قراءة ليلية'); rb.type = 'button';
    rb.addEventListener('click', function () { reading = !reading; sset('rd', reading); applyReading(); rb.textContent = reading ? 'إنهاء القراءة الليلية' : 'قراءة ليلية'; });
    w.appendChild(rb);
    var ab = el('button', null, 'تمرير تلقائي'); ab.type = 'button'; autoBtn = ab;
    ab.addEventListener('click', function () { if (autoRAF) stopAuto(); else startAuto(); });
    var sl = el('button', null, '−'), sf = el('button', null, '+'); sl.type = sf.type = 'button';
    sl.setAttribute('aria-label', 'أبطأ'); sf.setAttribute('aria-label', 'أسرع');
    sl.addEventListener('click', function () { spd = Math.max(1, spd - 1); sset('spd', spd); });
    sf.addEventListener('click', function () { spd = Math.min(12, spd + 1); sset('spd', spd); });
    w.appendChild(ab); w.appendChild(sl); w.appendChild(sf);
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
      if (isZ) lib.appendChild(el('p', 'note', 'زيارات النبي والزهراء والأئمة (ع) وغيرهم؛ نصوص بعضها مأخوذة من المزار الكبير ومصباح المتهجد وتبدأ أحياناً بإسناد الرواية.'));
    }).catch(fail);
  }
  function duaRead(kind, id) {
    Promise.all([load('duas/index.json'), load('duas/' + id + '.json')]).then(function (r) {
      var meta = r[0].filter(function (x) { return x.id === id; })[0];
      if (!meta) return fail();
      clear();
      lib.appendChild(topbar('#/' + kind, kind === 'ziyarat' ? 'الزيارات' : 'الأدعية', ''));
      lib.appendChild(el('h2', 'rtitle', meta.t));
      if (meta.s) lib.appendChild(el('p', 'subtitle', 'المصدر: ' + meta.s));
      lib.appendChild(favBtn(meta.t));
      lib.appendChild(fontTools());
      var body = el('article', 'reader');
      r[1].forEach(function (l) { body.appendChild(el('p', null, T(l))); });
      lib.appendChild(body);
      afterRender(meta.t);
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
            var c = el('div', 'saying'); c.appendChild(el('b', 'num', String(r[0]))); c.appendChild(el('p', 'ar', T(r[1]))); return c;
          }, holder, 30);
        });
        lib.appendChild(sb); lib.appendChild(fontTools()); lib.appendChild(holder); sb.dispatchEvent(new Event('input'));
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
      var ntitle = (part === 'khutab' ? 'الخطبة ' : 'الكتاب ') + r[0] + ' — نهج البلاغة';
      lib.appendChild(el('h2', 'rtitle', (part === 'khutab' ? 'الخطبة ' : 'الكتاب ') + r[0]));
      lib.appendChild(el('p', 'subtitle', T(r[1])));
      lib.appendChild(favBtn(ntitle));
      lib.appendChild(fontTools());
      var body = el('article', 'reader pre');
      body.appendChild(el('p', null, T(r[2])));
      lib.appendChild(body);
      var nav = el('div', 'pager');
      if (i > 0) nav.appendChild(link('#/nahj/' + part + '/' + rows[i - 1][0], 'pg', '‹ السابق'));
      if (i < rows.length - 1) nav.appendChild(link('#/nahj/' + part + '/' + rows[i + 1][0], 'pg', 'التالي ›'));
      lib.appendChild(nav);
      afterRender(ntitle);
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
      lib.appendChild(favBtn('غرر الحكم — ' + meta.title));
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
      afterRender('غرر الحكم — ' + meta.title);
    }).catch(fail);
  }


  /* ---------- مفاتيح الجنان ---------- */
  function mafatihHome() {
    load('mafatih/index.json').then(function (idx) {
      clear();
      lib.appendChild(topbar('#/', 'الرئيسية', 'مفاتيح الجنان'));
      lib.appendChild(el('p', 'note', 'للشيخ عباس القمي (رحمه الله)، ويليه «الباقيات الصالحات».'));
      var last = '';
      idx.forEach(function (sx) {
        if (sx.g !== last) { lib.appendChild(el('h3', 'grp', sx.g)); last = sx.g; }
        var a = link('#/mafatih/' + sx.id, 'row'); a.appendChild(el('span', 'rt', sx.t));
        a.appendChild(el('small', 'rs', sx.h.length + ' فصل')); lib.appendChild(a);
      });
    }).catch(fail);
  }
  function mafatihSec(sid) {
    load('mafatih/index.json').then(function (idx) {
      var sx = idx.filter(function (x) { return String(x.id) === sid; })[0];
      if (!sx) return fail();
      clear();
      lib.appendChild(topbar('#/mafatih', 'مفاتيح الجنان', ''));
      lib.appendChild(el('h2', 'rtitle', sx.t));
      var holder = el('div');
      var items = sx.h.map(function (h) { return { href: '#/mafatih/' + sx.id + '/' + h[0], title: h[1] }; });
      var f = listView(items, holder);
      lib.appendChild(searchBox('ابحث في العناوين…', f)); lib.appendChild(holder);
    }).catch(fail);
  }
  function mafatihRead(sid, hid) {
    Promise.all([load('mafatih/index.json'), load('mafatih/' + sid + '.json')]).then(function (r) {
      var sx = r[0].filter(function (x) { return String(x.id) === sid; })[0];
      var heads = r[1], i = heads.findIndex(function (h) { return String(h.id) === hid; });
      if (!sx || i < 0) return fail();
      var h = heads[i]; clear();
      lib.appendChild(topbar('#/mafatih/' + sid, sx.t, ''));
      var mtitle = 'مفاتيح الجنان — ' + h.t;
      lib.appendChild(el('h2', 'rtitle', h.t));
      lib.appendChild(favBtn(mtitle));
      lib.appendChild(fontTools());
      var body = el('article', 'reader');
      h.x.forEach(function (it) {
        var t = it[1].replace(/^\(\(|\)\)$/g, '').trim();
        if (t && t !== h.t && t.length < 160) body.appendChild(el('h3', 'sub', T(t)));
        it[2].forEach(function (p) { body.appendChild(el('p', it[0] === 'رواية' ? 'rw' : null, T(p))); });
      });
      lib.appendChild(body);
      var nav = el('div', 'pager');
      if (i > 0) nav.appendChild(link('#/mafatih/' + sid + '/' + heads[i - 1].id, 'pg', '‹ السابق'));
      if (i < heads.length - 1) nav.appendChild(link('#/mafatih/' + sid + '/' + heads[i + 1].id, 'pg', 'التالي ›'));
      lib.appendChild(nav);
      afterRender(mtitle);
    }).catch(fail);
  }

  /* ---------- المصادر والتراخيص + العمل دون إنترنت ---------- */
  function cacheAll(btn, prog) {
    var urls = [];
    btn.disabled = true;
    Promise.all([load('duas/index.json'), load('ghurar/index.json'), load('mafatih/index.json')]).then(function (r) {
      for (var qn = 1; qn <= 114; qn++) urls.push('quran/' + qn + '.json');
      urls.push('quran/index.json', 'search.json');
      r[0].forEach(function (x) { urls.push('duas/' + x.id + '.json'); });
      r[1].forEach(function (x) { urls.push('ghurar/' + x.id + '.json'); });
      r[2].forEach(function (x) { urls.push('mafatih/' + x.id + '.json'); });
      ['khutab', 'kutub', 'hikam'].forEach(function (k) { urls.push('nahj/' + k + '.json'); });
      urls.push('duas/index.json', 'ghurar/index.json', 'mafatih/index.json');
      var done = 0, fails = 0, i = 0;
      function next() {
        if (i >= urls.length) { prog.textContent = fails ? 'اكتمل مع ' + fails + ' ملفاً تعذّر تنزيله.' : 'تم التنزيل. المحتوى متاح الآن دون إنترنت.'; btn.disabled = false; return; }
        var u = urls[i++];
        fetch(u).then(function (x) { if (!x.ok) fails++; }, function () { fails++; }).then(function () { done++; prog.textContent = done + ' / ' + urls.length; next(); });
      }
      next();
    }).catch(function () { prog.textContent = 'تعذّر التنزيل.'; btn.disabled = false; });
  }
  function aboutView() {
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'المصادر والتراخيص'));
    lib.appendChild(el('h3', 'grp', 'العمل دون إنترنت'));
    lib.appendChild(el('p', 'note', 'يمكن تنزيل كل النصوص (نحو ٥ ميغابايت مضغوطة) لقراءتها دون اتصال. يعمل هذا بعد فتح الموقع عبر رابط https.'));
    var b = el('button', 'more', 'تنزيل كل المحتوى'); b.type = 'button';
    var pr = el('p', 'prog', '');
    b.addEventListener('click', function () { cacheAll(b, pr); });
    lib.appendChild(b); lib.appendChild(pr);
    lib.appendChild(el('h3', 'grp', 'المصادر'));
    var ul = el('ul', 'src-list');
    [
      'القرآن الكريم: مشروع Tanzil (tanzil.net) — Uthmani Minimal v1.1 — ترخيص CC BY 3.0، والنص غير معدَّل. تحققتُ من ٦٢٣٦ آية وعدد آيات كل سورة بمقارنته بمصدر ثانٍ مستقل.',
      'الأدعية والصحيفة السجادية والزيارات الخمس الأولى: ThaqalaynData (ترخيص CC0).',
      'أدعية وزيارات إضافية: «المزار الكبير» لابن المشهدي و«مصباح المتهجد» للشيخ الطوسي، من مجموعة OpenITI.',
      'مفاتيح الجنان والباقيات الصالحات: قاعدة بيانات WWGTX/mafatih على GitHub (دون ترخيص معلن).',
      'نهج البلاغة: مستودع WWGTX/NahjulBalaghah على GitHub (دون ترخيص معلن).',
      'غرر الحكم: OpenITI، طبعة مصطفى درايتي (مكتبة مساحة).',
      'توقع الأهلة: حساب فلكي بمعادلات Meeus ومعيار Odeh، في هذا الموقع.'
    ].forEach(function (t) { ul.appendChild(el('li', null, t)); });
    lib.appendChild(ul);
    lib.appendChild(el('h3', 'grp', 'تنبيهات'));
    var ul2 = el('ul', 'src-list');
    [
      'النصوص المأخوذة آلياً لم تُراجَع لغوياً بشرياً؛ إن وجدت خطأً فاعتمد النسخة المطبوعة الموثوقة.',
      'توقع الأهلة تقدير فلكي فقط؛ الثابت شرعاً ما ثبت بالرؤية وأعلنته المرجعية.',
      'حقوق النصوص لأصحابها؛ المواقع التي لم تحدد ترخيصاً لا يعني ذلك إباحة الاستخدام التجاري.'
    ].forEach(function (t) { ul2.appendChild(el('li', null, t)); });
    lib.appendChild(ul2);
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
    lib.appendChild(el('p', 'note', 'حساب فلكي تلقائي لإمكان رؤية هلال كل شهر مساء التاسع والعشرين (النجف الأشرف، معيار Odeh). هو تقدير فقط؛ الثابت شرعاً ما ثبت بالرؤية وإعلان المرجعية.'));
    var crit = el('select', 'yearsel'); crit.setAttribute('aria-label', 'معيار الرؤية');
    [['5.65', 'معيار الرؤية: بالعين المجردة (الأشد، الافتراضي)'], ['2', 'معيار الرؤية: بالعين أو بالمنظار (الأوسع)']].forEach(function (o) {
      var op = el('option', null, o[1]); op.value = o[0]; if (parseFloat(o[0]) === Hilal.cfg.MIN_V) op.selected = true; crit.appendChild(op);
    });
    crit.addEventListener('change', function () { try { localStorage.setItem('hv', crit.value); } catch (e) {} location.reload(); });
    lib.appendChild(crit);
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
        card.appendChild(el('p', 'hzone z' + e.zone, ZONE[e.zone] + ' — الشهر السابق ' + prev.len + ' يوماً'));
      }
      lib.appendChild(card);
    });
    if (!any) lib.appendChild(el('p', 'msg', 'لا بيانات لهذه السنة.'));
  }

  /* ---------- القرآن الكريم (نص Tanzil، لا يُعدَّل) ---------- */
  var AR_DIG = '٠١٢٣٤٥٦٧٨٩';
  function arNum(n) { return String(n).replace(/\d/g, function (d) { return AR_DIG[d]; }); }
  function quranHome() {
    load('quran/index.json').then(function (idx) {
      clear();
      lib.appendChild(topbar('#/', 'الرئيسية', 'القرآن الكريم'));
      lib.appendChild(el('p', 'note', 'برواية حفص عن عاصم. النص من مشروع Tanzil دون تعديل.'));
      var holder = el('div');
      var items = idx.map(function (x) { return { href: '#/quran/' + x.n, title: x.n + '. سورة ' + x.t, sub: x.m + ' — ' + x.c + ' آية' }; });
      var f = listView(items, holder);
      lib.appendChild(searchBox('ابحث باسم السورة أو رقمها…', function (q) {
        var n = q.replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; });
        items.forEach(function (it) { it.node.hidden = !!n && norm(it.title).indexOf(n) < 0; });
      }));
      lib.appendChild(holder);
    }).catch(fail);
  }
  function quranRead(n) {
    Promise.all([load('quran/index.json'), load('quran/' + n + '.json')]).then(function (r) {
      var i = r[0].findIndex(function (x) { return String(x.n) === n; });
      if (i < 0) return fail();
      var m = r[0][i], d = r[1], qtitle = 'سورة ' + m.t + ' — القرآن الكريم';
      clear();
      lib.appendChild(topbar('#/quran', 'القرآن الكريم', ''));
      lib.appendChild(el('h2', 'rtitle', 'سورة ' + m.t));
      lib.appendChild(el('p', 'subtitle', m.m + ' — ' + arNum(m.c) + ' آية — الجزء ' + arNum(m.j)));
      lib.appendChild(favBtn(qtitle));
      lib.appendChild(fontTools(true));
      var body = el('article', 'reader quran');
      if (m.n !== 1 && m.n !== 9) body.appendChild(el('p', 'bsm', 'بِسمِ اللَّهِ الرَّحمٰنِ الرَّحيمِ'));
      var txt = '';
      d.a.forEach(function (a, k) { txt += a + ' ﴿' + arNum(k + 1) + '﴾' + (d.s.indexOf(k + 1) > -1 ? ' ۩' : '') + ' '; });
      body.appendChild(el('p', null, txt.trim()));
      lib.appendChild(body);
      if (d.s.length) lib.appendChild(el('p', 'note', '۩ موضع سجدة. السجدة الواجبة عند الإمامية في أربع سور: السجدة وفصلت والنجم والعلق.'));
      lib.appendChild(el('p', 'note', 'المصدر: Tanzil Project (tanzil.net) — Creative Commons Attribution 3.0 — النص غير معدَّل.'));
      var nav = el('div', 'pager');
      if (i > 0) nav.appendChild(link('#/quran/' + r[0][i - 1].n, 'pg', '‹ ' + r[0][i - 1].t));
      if (i < r[0].length - 1) nav.appendChild(link('#/quran/' + r[0][i + 1].n, 'pg', r[0][i + 1].t + ' ›'));
      lib.appendChild(nav);
      afterRender(qtitle);
    }).catch(fail);
  }

  /* ---------- أعمال اليوم ---------- */
  var DAYNAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var MONTH_HEAD = { 1: 21, 2: 22, 3: 23, 4: 24, 5: 24, 6: 24, 7: 12, 8: 13, 9: 14, 10: 18, 11: 19, 12: 20 };
  function renderToday() {
    var box = document.getElementById('today'), t = window.__today;
    box.textContent = '';
    if (!t) { box.hidden = true; return; }
    var wd = new Date(t.ts).getUTCDay(), mh = t.h.month;
    box.hidden = false;
    box.appendChild(el('h2', null, (t.afterMaghrib ? 'أعمال هذه الليلة' : 'أعمال اليوم')));
    function it(href, title, sub) { var a = link(href, 'item'); var s = el('span', 't', title); s.appendChild(el('small', null, sub)); a.appendChild(s); box.appendChild(a); }
    it('#/mafatih/2/6', 'دعاء يوم ' + DAYNAMES[wd], 'من دعوات أيام الأسبوع (مفاتيح الجنان)');
    if (wd === 5) it('#/mafatih/2/7', 'أعمال ليلة الجمعة ونهارها', 'مفاتيح الجنان');
    it('#/mafatih/3/' + MONTH_HEAD[mh], 'أعمال شهر ' + window.__months[mh - 1], 'مفاتيح الجنان');
    if (mh === 9) it('#/mafatih/3/16', 'أعمال ليالي وأيام شهر رمضان', 'مفاتيح الجنان');
  }

  /* ---------- مواقيت الصلاة والقبلة ---------- */
  var CITIES = [
    ['النجف الأشرف', 31.9961, 44.3317, 'Asia/Baghdad'], ['كربلاء المقدسة', 32.616, 44.0249, 'Asia/Baghdad'], ['بغداد', 33.3152, 44.3661, 'Asia/Baghdad'],
    ['الكاظمية', 33.3797, 44.3438, 'Asia/Baghdad'], ['سامراء', 34.198, 43.8739, 'Asia/Baghdad'], ['الحلة', 32.4637, 44.4196, 'Asia/Baghdad'],
    ['البصرة', 30.5085, 47.7804, 'Asia/Baghdad'], ['الموصل', 36.34, 43.13, 'Asia/Baghdad'], ['أربيل', 36.1912, 44.0092, 'Asia/Baghdad'],
    ['السيدة زينب (دمشق)', 33.4435, 36.3367, 'Asia/Damascus'], ['بيروت', 33.8938, 35.5018, 'Asia/Beirut'], ['الكويت', 29.3759, 47.9774, 'Asia/Kuwait'],
    ['المنامة', 26.2285, 50.586, 'Asia/Bahrain'], ['القطيف', 26.5652, 49.9964, 'Asia/Riyadh'], ['المدينة المنورة', 24.4686, 39.6142, 'Asia/Riyadh'],
    ['مكة المكرمة', 21.4225, 39.8262, 'Asia/Riyadh'], ['قم', 34.6416, 50.8746, 'Asia/Tehran'], ['مشهد', 36.2972, 59.6067, 'Asia/Tehran'],
    ['طهران', 35.6892, 51.389, 'Asia/Tehran'], ['لندن', 51.5074, -0.1278, 'Europe/London'], ['ديترويت', 42.3314, -83.0458, 'America/Detroit']
  ];
  function ymdIn(tz, ts) {
    var p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(ts)).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
    return Date.UTC(p.year, p.month - 1, p.day, 12);
  }
  function prayerView(dayOff) {
    dayOff = dayOff || 0;
    var loc = sget('loc', null), ci = sget('city', 0);
    var site;
    if (loc && ci === -1) site = { name: loc.name, lat: loc.lat, lon: loc.lon, tz: loc.tz };
    else { var c = CITIES[ci] || CITIES[0]; site = { name: c[0], lat: c[1], lon: c[2], tz: c[3] }; }
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'مواقيت الصلاة والقبلة'));
    var sel = el('select', 'yearsel'); sel.setAttribute('aria-label', 'المدينة');
    CITIES.forEach(function (c, i) { var o = el('option', null, c[0]); o.value = i; if (i === ci) o.selected = true; sel.appendChild(o); });
    if (loc) { var o2 = el('option', null, 'موقعي: ' + loc.name); o2.value = -1; if (ci === -1) o2.selected = true; sel.appendChild(o2); }
    sel.addEventListener('change', function () { sset('city', parseInt(sel.value, 10)); prayerView(0); });
    lib.appendChild(sel);
    if (navigator.geolocation) {
      var gb = el('button', 'more', 'استخدام موقعي الحالي'); gb.type = 'button';
      gb.addEventListener('click', function () {
        gb.disabled = true; gb.textContent = 'جارٍ تحديد الموقع…';
        navigator.geolocation.getCurrentPosition(function (p) {
          var tz = 'UTC'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
          sset('loc', { name: p.coords.latitude.toFixed(2) + '، ' + p.coords.longitude.toFixed(2), lat: p.coords.latitude, lon: p.coords.longitude, tz: tz });
          sset('city', -1); prayerView(0);
        }, function () { gb.disabled = false; gb.textContent = 'تعذّر تحديد الموقع — اختر مدينة من القائمة'; }, { timeout: 10000, maximumAge: 600000 });
      });
      lib.appendChild(gb);
    }
    var base = ymdIn(site.tz, Date.now()) + dayOff * 86400000;
    var P = Hilal.prayerTimes(base, { lat: site.lat, lon: site.lon });
    var fT = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: site.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    var fD = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var nav = el('div', 'pager');
    var pb = el('button', 'pg', '‹ اليوم السابق'); pb.type = 'button'; pb.addEventListener('click', function () { prayerView(dayOff - 1); });
    var nb = el('button', 'pg', 'اليوم التالي ›'); nb.type = 'button'; nb.addEventListener('click', function () { prayerView(dayOff + 1); });
    nav.appendChild(pb); nav.appendChild(nb);
    lib.appendChild(el('h3', 'grp', site.name + ' — ' + fD.format(new Date(base))));
    var rows = [['الفجر', P.fajr], ['الشروق', P.sunrise], ['الظهر', P.dhuhr], ['الغروب', P.sunset], ['المغرب', P.maghrib], ['منتصف الليل الشرعي', P.midnight]];
    var now = Date.now(), nextIdx = dayOff === 0 ? rows.findIndex(function (r) { return r[1] !== null && r[1] > now; }) : -1;
    var dl = el('dl', 'ptimes');
    rows.forEach(function (r, i) {
      var dt = el('dt', i === nextIdx ? 'next' : null, r[0]), dd = el('dd', i === nextIdx ? 'next' : null, r[1] === null ? '—' : fT.format(new Date(r[1])));
      dl.appendChild(dt); dl.appendChild(dd);
    });
    lib.appendChild(dl); lib.appendChild(nav);
    if (rows.some(function (r) { return r[1] === null; })) lib.appendChild(el('p', 'note', 'في هذا الموقع والتاريخ لا يبلغ الفجر أو المغرب الزاوية المحددة (ليالٍ بيضاء)؛ ارجع إلى مرجعك لحكم هذه الحالة.'));
    lib.appendChild(el('p', 'note', 'حساب فلكي تقريبي على طريقة معهد ليفا بقم (الفجر عند ١٦° تحت الأفق، والمغرب عند ذهاب الحمرة المشرقية تقريباً ٤°). منتصف الليل الشرعي: منتصف المدة بين الغروب والفجر. يُستحسن الاحتياط بدقائق، وراجع تقويم مرجعك.'));
    var q = Hilal.qibla(site.lat, site.lon);
    lib.appendChild(el('h3', 'grp', 'اتجاه القبلة'));
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'compass'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'اتجاه القبلة ' + Math.round(q) + ' درجة من الشمال');
    var circ = document.createElementNS(NS, 'circle'); circ.setAttribute('cx', 50); circ.setAttribute('cy', 50); circ.setAttribute('r', 46); circ.setAttribute('class', 'cring'); svg.appendChild(circ);
    var n = document.createElementNS(NS, 'text'); n.setAttribute('x', 50); n.setAttribute('y', 14); n.setAttribute('text-anchor', 'middle'); n.setAttribute('class', 'cn'); n.textContent = 'ش'; svg.appendChild(n);
    var g = document.createElementNS(NS, 'g'); g.setAttribute('transform', 'rotate(' + q.toFixed(1) + ' 50 50)');
    var ar = document.createElementNS(NS, 'path'); ar.setAttribute('d', 'M50 20 L58 52 L50 46 L42 52 Z'); ar.setAttribute('class', 'carrow'); g.appendChild(ar); svg.appendChild(g);
    lib.appendChild(svg);
    lib.appendChild(el('p', 'note', 'القبلة: ' + q.toFixed(1) + '° من الشمال الحقيقي باتجاه عقارب الساعة. ضع الجوال أفقياً واستعن ببوصلة جهازك؛ السهم يبيّن الاتجاه بالنسبة للشمال.'));
  }

  /* ---------- المناسبات + ملف التقويم ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function icsEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function upcoming(days) {
    var t = window.__today, out = [], DAY = 86400000;
    for (var i = 0; i <= days; i++) {
      var ts = t.civilTs + i * DAY, k = window.__occFor(ts);
      if (k) out.push({ ts: ts, h: k.h, list: k.list });
    }
    return out;
  }
  function eventsView() {
    var ev = upcoming(365), fD = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'المناسبات القادمة'));
    lib.appendChild(el('p', 'note', 'مناسبات السنة القادمة. التواريخ بعد آخر شهر ثابت رسمياً تقديرية وقد تتغير بيوم بحسب ثبوت الهلال.'));
    var b = el('button', 'more', 'إضافة الكل إلى تقويم الجوال (.ics)'); b.type = 'button';
    b.addEventListener('click', function () {
      var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Noor Aliman//AR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:نور الإيمان', 'X-WR-TIMEZONE:Asia/Baghdad'];
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      ev.forEach(function (e, i) {
        var d = new Date(e.ts), ymd = d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
        var d2 = new Date(e.ts + 86400000), ymd2 = d2.getUTCFullYear() + pad(d2.getUTCMonth() + 1) + pad(d2.getUTCDate());
        var desc = e.h.day + ' ' + window.__months[e.h.month - 1] + ' ' + e.h.year + ' هـ' + (e.h.official === false ? ' (تقدير فلكي، قد يختلف بيوم)' : '');
        L.push('BEGIN:VEVENT', 'UID:' + ymd + '-' + i + '@nooralimaan', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd, 'DTEND;VALUE=DATE:' + ymd2,
          'SUMMARY:' + icsEsc(e.list.join(' • ')), 'DESCRIPTION:' + icsEsc(desc), 'TRANSP:TRANSPARENT',
          'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.list[0]), 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
      });
      L.push('END:VCALENDAR');
      var blob = new Blob([L.join('\r\n')], { type: 'text/calendar;charset=utf-8' }), u = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = u; a.download = 'nooralimaan-events.ics'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    });
    lib.appendChild(b);
    ev.forEach(function (e) {
      var r = el('div', 'saying'); r.appendChild(el('b', 'num', e.h.day + '/' + e.h.month));
      var p = el('div', 'ar2'); p.appendChild(el('strong', null, e.list.join(' • '))); p.appendChild(el('small', 'rs', fD.format(new Date(e.ts)) + ' — ' + e.h.day + ' ' + window.__months[e.h.month - 1] + ' ' + e.h.year + (e.h.official === false ? ' (تقدير)' : '')));
      r.appendChild(p); lib.appendChild(r);
    });
    if (!ev.length) lib.appendChild(el('p', 'msg', 'لا مناسبات.'));
  }

  /* ---------- البحث الشامل ---------- */
  function normMap(s) {
    var n = [], map = [], i, c, lastSp = true;
    for (i = 0; i < s.length; i++) {
      c = s[i];
      if (/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED\u200c-\u200f]/.test(c)) continue;
      if (/\s/.test(c)) { if (lastSp) continue; n.push(' '); map.push(i); lastSp = true; continue; }
      lastSp = false;
      c = c.replace(/[أإآٱ]/, 'ا').replace('ى', 'ي').replace('ة', 'ه').replace('ک', 'ك').replace('ی', 'ي');
      n.push(c); map.push(i);
    }
    return { n: n.join(''), map: map };
  }
  function snippet(p, q) {
    var m = normMap(p), at = m.n.indexOf(q);
    if (at < 0) return T(p.slice(0, 160));
    var a = Math.max(0, at - 50), b = Math.min(m.n.length - 1, at + q.length + 70);
    var oa = m.map[a], ob = m.map[b] + 1;
    return (oa > 0 ? '… ' : '') + T(p.slice(oa, ob)) + (ob < p.length ? ' …' : '');
  }
  function fullScan(q, onProgress) {
    var out = [], MAX = 80;
    function add(kind, href, title, p) { if (out.length < MAX) out.push({ kind: kind, href: href, title: title, p: p }); }
    function has(p) { return norm(p).indexOf(q) > -1; }
    return Promise.all([load('duas/index.json'), load('ghurar/index.json'), load('mafatih/index.json')]).then(function (r) {
      var jobs = [];
      r[0].forEach(function (x) { jobs.push(['d', x]); });
      ['khutab', 'kutub', 'hikam'].forEach(function (k) { jobs.push(['n', k]); });
      r[1].forEach(function (x) { jobs.push(['g', x]); });
      r[2].forEach(function (x) { jobs.push(['m', x]); });
      for (var qn = 1; qn <= 114; qn++) jobs.push(['q', qn]);
      var done = 0, idx = 0;
      function runOne() {
        if (idx >= jobs.length) return Promise.resolve();
        var j = jobs[idx++], url, p;
        if (j[0] === 'd') p = load('duas/' + j[1].id + '.json').then(function (d) {
          var hit = d.filter(has)[0]; if (hit) add(j[1].c === 'z' ? 'زيارة' : 'دعاء', (j[1].c === 'z' ? '#/ziyarat/' : '#/duas/') + j[1].id, j[1].t, hit);
        });
        else if (j[0] === 'n') p = load('nahj/' + j[1] + '.json').then(function (d) {
          d.forEach(function (row) {
            var txt = j[1] === 'hikam' ? row[1] : row[2];
            if (has(txt)) add('نهج البلاغة', j[1] === 'hikam' ? '#/nahj/hikam' : '#/nahj/' + j[1] + '/' + row[0], (j[1] === 'khutab' ? 'خطبة ' : j[1] === 'kutub' ? 'كتاب ' : 'حكمة ') + row[0], txt);
          });
        });
        else if (j[0] === 'g') p = load('ghurar/' + j[1].id + '.json').then(function (d) {
          var c = 0; d.groups.forEach(function (g) { g.i.forEach(function (it) { if (c < 3 && has(it[1])) { c++; add('غرر الحكم', '#/ghurar/' + j[1].id, j[1].title + ' (' + it[0] + ')', it[1]); } }); });
        });
        else if (j[0] === 'q') p = load('quran/' + j[1] + '.json').then(function (d) {
          var c = 0; d.a.forEach(function (a, k) { if (c < 3 && has(a)) { c++; add('القرآن الكريم', '#/quran/' + j[1], 'سورة (' + j[1] + ') آية ' + (k + 1), a); } });
        });
        else p = load('mafatih/' + j[1].id + '.json').then(function (d) {
          d.forEach(function (h) { var c = 0; h.x.forEach(function (it) { it[2].forEach(function (pp) { if (c < 2 && has(pp)) { c++; add('مفاتيح الجنان', '#/mafatih/' + j[1].id + '/' + h.id, h.t, pp); } }); }); });
        });
        return p.catch(function () {}).then(function () { done++; onProgress(done, jobs.length); return runOne(); });
      }
      var workers = []; for (var w = 0; w < 6; w++) workers.push(runOne());
      return Promise.all(workers).then(function () { return out; });
    });
  }
  function searchView(raw) {
    var q = norm(raw || '');
    clear();
    lib.appendChild(topbar('#/', 'الرئيسية', 'بحث'));
    var inp = el('input', 'search'); inp.type = 'search'; inp.value = raw || ''; inp.placeholder = 'ابحث…'; inp.setAttribute('aria-label', 'بحث');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && inp.value.trim()) location.hash = '#/search/' + encodeURIComponent(inp.value.trim()); });
    lib.appendChild(inp);
    var res = el('div'); lib.appendChild(res);
    if (q.length < 2) { res.appendChild(el('p', 'msg', 'اكتب كلمتين على الأقل واضغط Enter.')); return; }
    load('search.json').then(function (idx) {
      var hit = idx.filter(function (r) { return norm(r[2] + ' ' + r[3]).indexOf(q) > -1; }).slice(0, 40);
      res.appendChild(el('h3', 'grp', 'في العناوين (' + hit.length + ')'));
      hit.forEach(function (r) { var a = link(r[1], 'row'); a.appendChild(el('span', 'rt', r[2])); a.appendChild(el('small', 'rs', r[0] + (r[3] ? ' — ' + r[3] : ''))); res.appendChild(a); });
      if (!hit.length) res.appendChild(el('p', 'msg', 'لا نتائج في العناوين.'));
      var btn = el('button', 'more', 'ابحث في النصوص كاملة (يحمّل النصوص مرة واحدة، نحو ٤ ميغابايت)'); btn.type = 'button';
      var prog = el('p', 'prog', ''), full = el('div');
      res.appendChild(btn); res.appendChild(prog); res.appendChild(full);
      btn.addEventListener('click', function () {
        btn.disabled = true; full.textContent = '';
        fullScan(q, function (d, n) { prog.textContent = 'جارٍ البحث… ' + d + ' / ' + n; }).then(function (out) {
          prog.textContent = ''; btn.disabled = false; btn.textContent = 'أعد البحث في النصوص';
          full.appendChild(el('h3', 'grp', 'في النصوص (' + out.length + (out.length >= 80 ? '+' : '') + ')'));
          if (!out.length) full.appendChild(el('p', 'msg', 'لا نتائج في النصوص.'));
          out.forEach(function (o) { var a = link(o.href, 'row'); a.appendChild(el('span', 'rt', o.title)); a.appendChild(el('small', 'rs', o.kind)); a.appendChild(el('span', 'snip', snippet(o.p, q))); full.appendChild(a); });
        }).catch(function () { prog.textContent = 'تعذّر البحث.'; btn.disabled = false; });
      });
    }).catch(fail);
  }

  /* ---------- الموجّه ---------- */
  function route() {
    stopAuto();
    var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    applyFs();
    if (!h.length) { readerHash = null; renderHome(); renderToday(); lib.hidden = true; home.hidden = false; document.title = 'نور الإيمان'; window.scrollTo(0, 0); return; }
    home.hidden = true; lib.hidden = false;
    var s = h[0];
    if (s === 'duas' || s === 'ziyarat') h[1] ? duaRead(s, h[1]) : duaIndex(s);
    else if (s === 'nahj') { if (!h[1]) nahjHome(); else if (!NAHJ[h[1]]) nahjHome(); else h[2] ? nahjRead(h[1], h[2]) : nahjList(h[1]); }
    else if (s === 'ghurar') h[1] ? ghurarBab(h[1]) : ghurarHome();
    else if (s === 'mafatih') h[2] ? mafatihRead(h[1], h[2]) : h[1] ? mafatihSec(h[1]) : mafatihHome();
    else if (s === 'quran') h[1] ? quranRead(h[1]) : quranHome();
    else if (s === 'about') aboutView();
    else if (s === 'prayer') prayerView(0);
    else if (s === 'events') eventsView();
    else if (s === 'search') searchView(h[1] ? decodeURIComponent(h[1]) : '');
    else if (s === 'hilal') hilalView();
    else { location.hash = '#/'; }
  }
  window.addEventListener('hashchange', route);
  route();
})();
