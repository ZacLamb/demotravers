(function () {
  // Mobile nav
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Header quick-contact dialog: preserve focus and close on Escape/backdrop.
  var contactDialog = document.getElementById('header-contact-dialog');
  if (contactDialog) {
    var contactPanel = contactDialog.querySelector('.contact-modal__panel');
    var lastContactTrigger = null;
    var contactOpen = false;
    function closeContact() {
      if (!contactOpen) return;
      contactOpen = false;
      contactDialog.hidden = true;
      contactDialog.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('contact-modal-open');
      if (lastContactTrigger) lastContactTrigger.focus();
    }
    document.querySelectorAll('[data-open-contact]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        lastContactTrigger = trigger;
        if (nav && nav.classList.contains('open')) {
          nav.classList.remove('open');
          if (burger) burger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
        contactOpen = true;
        contactDialog.hidden = false;
        contactDialog.setAttribute('aria-hidden', 'false');
        document.body.classList.add('contact-modal-open');
        var firstInput = contactDialog.querySelector('input[name=name]');
        (firstInput || contactPanel).focus();
      });
    });
    contactDialog.querySelectorAll('[data-close-contact]').forEach(function (btn) {
      btn.addEventListener('click', closeContact);
    });
    document.addEventListener('keydown', function (event) {
      if (!contactOpen) return;
      if (event.key === 'Escape') { event.preventDefault(); closeContact(); return; }
      if (event.key === 'Tab') {
        var focusables = Array.prototype.slice.call(contactDialog.querySelectorAll('button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), a[href]')).filter(function (el) { return el.getClientRects().length > 0; });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  // Scroll reveal
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Estimate form -> /api/lead -> GoHighLevel
  document.querySelectorAll('.leadform').forEach(function (f) {
    var shell = f.parentNode, done = shell.querySelector('.leadform__done');
    if (f.id === 'estimate' && /[?&]sent=1/.test(location.search) && done) { f.hidden = true; done.hidden = false; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = f.querySelector('.leadform__msg'), btn = f.querySelector('button[type=submit]');
      msg.className = 'leadform__msg'; msg.textContent = '';
      if (!f.querySelector('[name=name]').value.trim() || f.querySelector('[name=phone]').value.replace(/\D/g, '').length < 10) {
        msg.textContent = 'Please enter your name and a 10-digit phone number.'; msg.classList.add('err'); return;
      }
      btn.disabled = true; btn.textContent = 'Sending…';
      var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
      fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (r) {
          if (!r.ok || !r.j.ok) throw new Error(r.j.error || 'Error');
          if (window.gtag) gtag('event', 'generate_lead', { service: data.service || 'unknown' });
          f.hidden = true; if (done) { done.hidden = false; done.scrollIntoView({ block: 'center' }); }
        })
        .catch(function (err) {
          msg.textContent = err.message || 'Something went wrong. Please call us.'; msg.classList.add('err');
          btn.disabled = false; btn.textContent = 'Get my free estimate';
        });
    });
  });

  // Lightbox
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg = lb.querySelector('img');
  var current = [], idx = 0;
  function show(i) { idx = (i + current.length) % current.length; lbImg.src = current[idx].getAttribute('data-full'); lbImg.alt = current[idx].querySelector('img').alt; }
  function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var btns = Array.prototype.slice.call(g.querySelectorAll('button'));
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { current = btns; show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; });
    });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
