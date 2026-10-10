/* Yellow Pen Center — "book a visit" popup.
   Self-contained: builds its own markup, carries its own AR/EN strings, and
   follows the language set on <html lang>. Shown by time, scroll depth or
   exit intent, at most once per session, and never nags after a dismissal. */
(function () {
  'use strict';

  var root = document.documentElement;
  var WA_NUMBER = '966505393575';
  var PHONE = '+966505393575';
  var page = root.getAttribute('data-page') || 'home';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof HTMLDialogElement === 'undefined') return;

  /* ---- timing rules ---- */
  var DELAY_MS = 14000;          // time on page before it may appear
  var SCROLL_DEPTH = 0.5;        // or after half the page
  var SNOOZE_DAYS = 3;           // after closing it
  var DONE_DAYS = 30;            // after sending a request
  var KEY = 'yp-popup';

  var T = {
    ar: {
      kicker: 'احجز زيارة',
      title: 'زوروا المركز وشاهدوه <mark>بأنفسكم</mark>',
      sub: 'خطوتان فقط، وسنرتب معكم موعد الزيارة عبر واتساب.',
      step: 'الخطوة {n} من ٢',
      q1: 'كم عمر طفلكم؟',
      ages: ['سنتان', '٣ سنوات', '٤ سنوات', '٥ سنوات', '٦ سنوات'],
      q2: 'اسم ولي الأمر',
      ph: 'اكتبوا الاسم هنا',
      back: 'رجوع',
      send: 'أرسل الطلب عبر واتساب',
      err: 'فضلًا اكتبوا الاسم.',
      call: 'أو اتصلوا بنا',
      privacy: 'لا نحفظ بياناتكم على الموقع؛ تُرسل مباشرة في محادثة واتساب.',
      okTitle: 'فتحنا لكم واتساب',
      okText: 'اضغطوا «إرسال» في المحادثة ليصلنا طلبكم، وسنرد عليكم لترتيب الموعد.',
      okRetry: 'لم يُفتح واتساب؟ اضغطوا هنا',
      okClose: 'تم',
      close: 'إغلاق',
      hand: 'أهلًا وسهلًا ✏️',
      facts: ['من سنتين إلى ٦ سنوات', 'عربي + English', 'جدة – الحمدانية'],
      fab: 'احجز زيارة',
      alt: 'أطفال مركز القلم الأصفر في أول أيام العام الدراسي',
      msg: 'السلام عليكم مركز القلم الأصفر 👋\nأرغب في حجز زيارة للمركز.\nاسم ولي الأمر: {parent}\nعمر الطفل: {age}'
    },
    en: {
      kicker: 'Book a visit',
      title: 'Come and see the center <mark>for yourself</mark>',
      sub: 'Just two steps, and we\'ll arrange your visit on WhatsApp.',
      step: 'Step {n} of 2',
      q1: 'How old is your child?',
      ages: ['2 years', '3 years', '4 years', '5 years', '6 years'],
      q2: 'Parent\'s name',
      ph: 'Type your name here',
      back: 'Back',
      send: 'Send request on WhatsApp',
      err: 'Please add your name.',
      call: 'Or call us',
      privacy: 'We don\'t store your details on this site; they go straight into a WhatsApp chat.',
      okTitle: 'WhatsApp is open',
      okText: 'Press “Send” in the chat so your request reaches us, and we\'ll reply to arrange a time.',
      okRetry: 'WhatsApp didn\'t open? Tap here',
      okClose: 'Done',
      close: 'Close',
      hand: 'See you soon ✏️',
      facts: ['Ages 2 to 6', 'عربي + English', 'Jeddah – Al Hamdaniyah'],
      fab: 'Book a visit',
      alt: 'Yellow Pen children on the first days of the school year',
      msg: 'Hello Yellow Pen Center 👋\nI\'d like to book a visit.\nParent\'s name: {parent}\nChild\'s age: {age}'
    }
  };
  function L() { return root.lang === 'en' ? T.en : T.ar; }

  /* ---- storage helpers (the popup must work even when storage is blocked) ---- */
  function readState() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function writeState(patch) {
    try {
      var s = readState();
      for (var k in patch) s[k] = patch[k];
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  }
  function seenThisSession() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  function daysSince(ts) { return ts ? (Date.now() - ts) / 864e5 : Infinity; }

  /* ---- markup ---- */
  var WA_ICON = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 3.3 17.1L2 22l5-1.3A11 11 0 0 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3 .8.8-2.9-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.6a.5.5 0 0 0 0-.5l-.9-2.1c-.2-.6-.5-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z"/></svg>';
  var CAL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="m9 15 2 2 4-4"/></svg>';

  var dlg = document.createElement('dialog');
  dlg.className = 'popup';
  dlg.id = 'visitPopup';
  dlg.setAttribute('aria-labelledby', 'popupTitle');
  dlg.innerHTML =
    '<button class="popup__close" type="button" data-close>×</button>' +
    '<div class="popup__art" aria-hidden="true">' +
      '<img class="popup__sun" src="assets/img/sunburst.svg" alt="">' +
      '<figure class="popup__arch"><img src="assets/img/group-760.webp" width="760" height="570" alt="" data-t-alt></figure>' +
      '<span class="popup__sticker"><img src="assets/img/emblem.webp" width="96" height="91" alt=""></span>' +
      '<span class="popup__hand hand" data-t="hand"></span>' +
      '<ul class="popup__facts" data-t-facts></ul>' +
    '</div>' +
    '<div class="popup__body">' +
      '<form class="popup__form" novalidate>' +
        '<p class="kicker" data-t="kicker"></p>' +
        '<h2 class="popup__title" id="popupTitle" data-t-html="title"></h2>' +
        '<p class="popup__sub" data-t="sub"></p>' +
        '<div class="popup__progress" aria-hidden="true"><i></i><i></i></div>' +
        '<fieldset class="popup__step" data-step="1">' +
          '<legend><small data-t-step="1"></small><span data-t="q1"></span></legend>' +
          '<div class="popup__ages" data-t-ages></div>' +
        '</fieldset>' +
        '<div class="popup__step" data-step="2" hidden>' +
          '<label for="popupName"><small data-t-step="2"></small><span data-t="q2"></span></label>' +
          '<input id="popupName" name="parent" type="text" autocomplete="name" enterkeyhint="send" required>' +
          '<p class="popup__err" role="alert" hidden data-t="err"></p>' +
          '<button class="btn btn--primary btn--lg btn--block" type="submit">' + WA_ICON + '<span data-t="send"></span></button>' +
          '<button class="popup__back" type="button" data-back><span data-t="back"></span></button>' +
        '</div>' +
        '<p class="popup__foot"><span data-t="call"></span> <a class="num" dir="ltr" href="tel:' + PHONE + '">050 539 3575</a></p>' +
        '<p class="popup__privacy" data-t="privacy"></p>' +
      '</form>' +
      '<div class="popup__ok" hidden>' +
        '<span class="popup__check" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="m13 25 8 8 15-17"/></svg></span>' +
        '<h2 class="popup__title" data-t="okTitle" tabindex="-1"></h2>' +
        '<p class="popup__sub" data-t="okText"></p>' +
        '<button class="btn btn--primary btn--lg" type="button" data-close><span data-t="okClose"></span></button>' +
        '<p class="popup__foot"><a href="#" target="_blank" rel="noopener" data-retry data-t="okRetry"></a></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(dlg);

  // Desktop floating button (phones already have the sticky action bar)
  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'visit-fab';
  fab.innerHTML = CAL_ICON + '<span data-t="fab"></span>';
  if (page !== 'contact') document.body.appendChild(fab);

  var form = dlg.querySelector('form');
  var okPanel = dlg.querySelector('.popup__ok');
  var steps = dlg.querySelectorAll('.popup__step');
  var nameInput = dlg.querySelector('#popupName');
  var errEl = dlg.querySelector('.popup__err');
  var retry = dlg.querySelector('[data-retry]');
  var chosenAge = null; // index into ages[]

  /* ---- text rendering (re-run on language change) ---- */
  function render() {
    var t = L();
    [dlg, fab].forEach(function (scope) {
      scope.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t[el.getAttribute('data-t')]; });
    });
    dlg.querySelectorAll('[data-t-html]').forEach(function (el) { el.innerHTML = t[el.getAttribute('data-t-html')]; });
    dlg.querySelectorAll('[data-t-step]').forEach(function (el) { el.textContent = t.step.replace('{n}', root.lang === 'en' ? el.getAttribute('data-t-step') : (el.getAttribute('data-t-step') === '1' ? '١' : '٢')); });
    dlg.querySelector('[data-t-alt]').alt = t.alt;
    dlg.querySelector('[data-t-facts]').innerHTML = t.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    dlg.querySelector('[data-t-ages]').innerHTML = t.ages.map(function (a, i) {
      return '<label><input type="radio" name="age" value="' + i + '"' + (i === chosenAge ? ' checked' : '') + '><span>' + a + '</span></label>';
    }).join('');
    nameInput.placeholder = t.ph;
    dlg.querySelector('.popup__close').setAttribute('aria-label', t.close);
  }
  render();
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });

  /* ---- steps ---- */
  function goStep(n) {
    steps.forEach(function (s) { s.hidden = s.getAttribute('data-step') !== String(n); });
    dlg.setAttribute('data-at', n);
    if (n === 2) setTimeout(function () { nameInput.focus(); }, reduceMotion ? 0 : 250);
  }
  dlg.addEventListener('change', function (e) {
    if (e.target.name !== 'age') return;
    chosenAge = Number(e.target.value);
    setTimeout(function () { goStep(2); }, reduceMotion ? 0 : 220); // let the chip light up first
  });
  dlg.querySelector('[data-back]').addEventListener('click', function () { goStep(1); });
  nameInput.addEventListener('input', function () { errEl.hidden = true; });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (chosenAge === null) { goStep(1); return; }
    var parent = nameInput.value.trim();
    if (!parent) { errEl.hidden = false; nameInput.focus(); return; }
    var t = L();
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(t.msg.replace('{parent}', parent).replace('{age}', t.ages[chosenAge]));
    window.open(url, '_blank', 'noopener');
    retry.href = url;
    form.hidden = true;
    okPanel.hidden = false;
    dlg.setAttribute('data-at', 'ok');
    okPanel.querySelector('.popup__title').focus();
    writeState({ done: Date.now() });
  });

  /* ---- open / close ---- */
  function busy() {
    var other = document.querySelector('dialog[open]');
    var menu = document.querySelector('.nav.is-open');
    return !!(other || menu);
  }
  function open(manual) {
    if (dlg.open) return;
    if (!manual && busy()) return false;
    form.hidden = false;
    okPanel.hidden = true;
    goStep(chosenAge === null ? 1 : 2);
    dlg.showModal();
    markSeen();
    fab.classList.remove('is-visible');
    return true;
  }
  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () {
    if (!readState().done || daysSince(readState().done) > DONE_DAYS) writeState({ dismissed: Date.now() });
    updateFab();
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-close]')) close();
  });

  // The "Book a visit" button in the phone action bar opens the popup on every page
  document.querySelectorAll('.action-bar__btn--wa').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(true); });
  });

  // "Book a visit" buttons open the popup instead of jumping away
  if (page !== 'contact') {
    document.querySelectorAll('.header__cta, .nav__cta-mobile, .ages .btn--sun').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(true); });
    });
  }
  fab.addEventListener('click', function () { open(true); });

  function updateFab() {
    var hero = document.querySelector('.hero, .page-hero');
    var past = window.scrollY > (hero ? hero.offsetHeight * 0.6 : 400);
    // step aside at the footer so it never covers the links there
    var footer = document.querySelector('.footer');
    var atFooter = footer && footer.getBoundingClientRect().top < window.innerHeight - 20;
    fab.classList.toggle('is-visible', past && !atFooter && !dlg.open);
  }
  window.addEventListener('scroll', updateFab, { passive: true });
  updateFab();

  /* ---- automatic triggers ---- */
  var forced = false;
  try { forced = new URLSearchParams(location.search).get('popup') === '1'; } catch (e) {}
  if (forced) { open(true); return; }

  var st = readState();
  var allowed = page !== 'contact' && !seenThisSession() &&
    daysSince(st.dismissed) > SNOOZE_DAYS && daysSince(st.done) > DONE_DAYS;
  if (!allowed) return;

  var armed = true;
  function fire() {
    if (!armed) return;
    if (open(false) === false) { setTimeout(fire, 4000); return; } // something else is open: try again shortly
    armed = false;
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('mouseout', onExit);
  }
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max >= SCROLL_DEPTH) fire();
  }
  function onExit(e) {
    if (!e.relatedTarget && e.clientY <= 0) fire(); // pointer left through the top of the window
  }
  var timer = setTimeout(fire, DELAY_MS);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('mouseout', onExit);
  document.addEventListener('visibilitychange', function () {
    // don't burn the delay while the tab is in the background
    if (document.hidden) clearTimeout(timer);
    else if (armed) timer = setTimeout(fire, DELAY_MS / 2);
  });
})();
