/* NAKDIZ landing template - shared behavior
   Each page defines (before this script):
     window.LEAD_WEBHOOK_URL  – Make webhook that receives form submissions ("" = not wired yet)
     window.TRAINER_SLUG      – trainer identifier sent with every lead
*/

(function () {
  'use strict';

  /* ---------- Rising counters (section 4) ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(el) {
    var target = parseFloat(el.dataset.target || '0');
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var duration = 1600;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('.counter .num[data-target]');
  if ('IntersectionObserver' in window && counters.length) {
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen.has(e.target)) {
          seen.add(e.target);
          animateCounter(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Lead forms ---------- */
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var required = form.querySelectorAll('[required]');
      for (var i = 0; i < required.length; i++) {
        if (!required[i].checkValidity()) { required[i].reportValidity(); return; }
      }

      var payload = {
        trainer: window.TRAINER_SLUG || '',
        form_id: form.dataset.formId || '',
        name: (form.querySelector('[name="fullname"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        mailing_consent: !!(form.querySelector('[name="mailing"]') || {}).checked,
        privacy_consent: !!(form.querySelector('[name="privacy"]') || {}).checked,
        page: location.pathname,
        submitted_at: new Date().toISOString()
      };

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'שולח...'; }

      function go() { location.href = './thanks.html'; }

      if (window.LEAD_WEBHOOK_URL) {
        fetch(window.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(go).catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
          alert('משהו השתבש בשליחה, נסו שוב או פנו אלינו ישירות');
        });
      } else {
        /* Webhook not wired yet - behave as if submitted so the flow can be tested */
        go();
      }
    });
  });
})();
