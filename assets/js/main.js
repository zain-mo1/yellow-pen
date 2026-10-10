/* Yellow Pen Center — homepage interactions (no dependencies) */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA_NUMBER = '966505393575';
  var dict = window.YP_I18N || { en: {}, ar: {} };
  var page = root.getAttribute('data-page') || 'home';

  root.classList.add('js');

  /* ---------------- i18n ----------------
     Arabic is authored in the HTML. Capture it once so we can switch back. */
  var arText = {};
  var arAttr = [];

  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    arText[el.getAttribute('data-i18n')] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var p = pair.split(':');
      arAttr.push({ el: el, attr: p[0], key: p[1], value: el.getAttribute(p[0]) });
    });
  });
  var arTitle = document.title;

  function t(key, lang) {
    lang = lang || root.lang;
    if (lang === 'en') return dict.en[key];
    return dict.ar[key] !== undefined ? dict.ar[key] : arText[key];
  }

  function applyLang(lang) {
    var en = lang === 'en';
    root.lang = lang;
    root.dir = en ? 'ltr' : 'rtl';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = en ? dict.en[key] : arText[key];
      if (val !== undefined) el.innerHTML = val;
    });
    arAttr.forEach(function (a) {
      var val = en ? dict.en[a.key] : a.value;
      if (val !== undefined && val !== null) a.el.setAttribute(a.attr, val);
    });
    document.title = en ? (dict.en['meta.title.' + page] || dict.en['meta.title']) : arTitle;

    var sw = document.getElementById('langSwitch');
    if (sw) sw.setAttribute('aria-label', t('lang.switch', lang));

    try { localStorage.setItem('yp-lang', lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      if (en) url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}

    // re-run things that depend on direction
    fillRibbon();
    updateProgress();
  }

  var langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', function () {
      var next = root.lang === 'en' ? 'ar' : 'en';
      if (reduceMotion) return applyLang(next);
      body.classList.add('is-switching');
      setTimeout(function () {
        applyLang(next);
        body.classList.remove('is-switching');
      }, 180);
    });
  }

  /* ---------------- Ribbon: duplicate list for a seamless loop ---------------- */
  function fillRibbon() {
    var lists = document.querySelectorAll('.ribbon__list');
    if (lists.length === 2) lists[1].innerHTML = lists[0].innerHTML;
  }

  /* ---------------- Header state + pencil progress ---------------- */
  var header = document.querySelector('.header');
  var bar = document.querySelector('.progress__bar');
  var actionBar = document.querySelector('.action-bar');
  var hero = document.querySelector('.hero, .page-hero');
  var ticking = false;

  function updateProgress() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (actionBar && hero) actionBar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);

  /* ---------------- Mobile menu ---------------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('menuToggle');
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var revealTargets = document.querySelectorAll('.reveal, .pencils, .scribble, .marker');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- Muted loops: play only while visible ---------------- */
  var loops = document.querySelectorAll('video.js-loop');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    loops.forEach(function (v) { vio.observe(v); });
  }

  /* ---------------- Lightbox (videos + photos) ---------------- */
  var lb = document.getElementById('lightbox');
  var lbVideo = lb && lb.querySelector('video');
  var lbImg = lb && lb.querySelector('.lightbox__img');
  function closeLightbox() {
    if (lb && lb.open) lb.close();
  }
  function openLightbox(kind, src, extra) {
    if (!lb || typeof lb.showModal !== 'function') { window.open(src, '_blank', 'noopener'); return; }
    var isVideo = kind === 'video';
    lbVideo.hidden = !isVideo;
    if (lbImg) lbImg.hidden = isVideo;
    if (isVideo) {
      lbVideo.poster = extra || '';
      lbVideo.src = src;
    } else if (lbImg) {
      lbImg.src = src;
      lbImg.alt = extra || '';
    }
    lb.showModal();
    if (isVideo) {
      var p = lbVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }
  document.querySelectorAll('[data-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openLightbox('video', btn.getAttribute('data-video'), btn.getAttribute('data-poster'));
    });
  });
  document.querySelectorAll('[data-image]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var img = btn.querySelector('img');
      openLightbox('image', btn.getAttribute('data-image'), img ? img.alt : '');
    });
  });
  if (lb) {
    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    lb.addEventListener('close', function () {
      lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load();
      if (lbImg) lbImg.removeAttribute('src');
    });
  }

  /* ---------------- Gallery filter ---------------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  if (filterBtns.length) {
    var tiles = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        filterBtns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        tiles.forEach(function (tile) {
          tile.hidden = !(f === 'all' || tile.getAttribute('data-cat') === f);
        });
      });
    });
  }

  /* ---------------- Moments strip: arrows + drag ---------------- */
  var strip = document.getElementById('strip');
  if (strip) {
    document.querySelectorAll('.moments__nav [data-dir]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = Number(b.getAttribute('data-dir'));
        // "next" moves toward the end of the reading direction
        var sign = root.dir === 'rtl' ? -1 : 1;
        strip.scrollBy({ left: dir * sign * strip.clientWidth * 0.7, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    var down = false, startX = 0, startLeft = 0, moved = false;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
      strip.style.scrollSnapType = 'none';
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      strip.style.scrollSnapType = '';
    });
    strip.addEventListener('click', function (e) { if (moved) e.preventDefault(); }, true);
    strip.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  /* ---------------- Visit form → WhatsApp ---------------- */
  var form = document.getElementById('visitForm');
  var formError = document.getElementById('formError');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var parent = form.parent.value.trim();
      var ageInput = form.querySelector('input[name="age"]:checked');
      if (!parent || !ageInput) {
        formError.hidden = false;
        (parent ? form.querySelector('input[name="age"]') : form.parent).focus();
        return;
      }
      formError.hidden = true;
      var ageLabel = ageInput.nextElementSibling.textContent.trim();
      var note = form.note.value.trim();
      var msg = t('form.msg')
        .replace('{parent}', parent)
        .replace('{age}', ageLabel)
        .replace('{note}', note ? t('form.msgNote').replace('{note}', note) : '');
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
    form.addEventListener('input', function () { if (!formError.hidden && form.parent.value.trim() && form.querySelector('input[name="age"]:checked')) formError.hidden = true; });
  }

  /* ---------------- Misc ---------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Initial language (the head script already set dir/lang to avoid a flash)
  if (root.lang === 'en') applyLang('en');
  else { fillRibbon(); updateProgress(); }
})();
