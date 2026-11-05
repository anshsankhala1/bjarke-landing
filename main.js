/* =========================================================
   Bjärke — page behavior
   ========================================================= */

// Google Apps Script web app that appends each reservation to the
// "Bjärke Reservations" Google Sheet.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyboNL1cvxpFTJMJHG9c3QE-K99-q0Os-e5LPens4GAcMT4-VU8eQYCoOqGyY0939Oqdg/exec';

const SHELLS = {
  'Signal Red': '#7A2A2E',
  'Sunlit Yellow': '#C8A84E',
  'Blue': '#7E97B0',
  'Lilac': '#9A88A8',
  'Teal': '#6E9C90',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------- Pendant SVG ---------- */
let uid = 0;
function pendantSVG() {
  const id = 'p' + (++uid);
  return `
<svg viewBox="0 0 200 300" role="presentation" focusable="false">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E6CF9C"/><stop offset=".45" stop-color="#B8975F"/><stop offset="1" stop-color="#8A6C3F"/>
    </linearGradient>
    <radialGradient id="${id}h" cx=".35" cy=".25" r=".7">
      <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}l" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#FF6A5C" stop-opacity=".9"/><stop offset="1" stop-color="#FF6A5C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle class="p-ring p-ring--1" cx="100" cy="180" r="70" fill="none" stroke="#6B2A2A" stroke-width="1"/>
  <circle class="p-ring p-ring--2" cx="100" cy="180" r="70" fill="none" stroke="#6B2A2A" stroke-width="1"/>
  <path d="M42 0 L96 86 M158 0 L104 86" stroke="url(#${id}g)" stroke-width="1.6" stroke-dasharray="3 1.6" fill="none"/>
  <rect x="93" y="80" width="14" height="22" rx="7" fill="none" stroke="url(#${id}g)" stroke-width="3"/>
  <ellipse cx="100" cy="182" rx="60" ry="82" fill="url(#${id}g)"/>
  <ellipse class="p-shell" cx="100" cy="182" rx="54.5" ry="76.5"/>
  <ellipse cx="100" cy="182" rx="54.5" ry="76.5" fill="url(#${id}h)"/>
  <circle cx="100" cy="148" r="15.5" fill="url(#${id}g)"/>
  <circle cx="100" cy="148" r="11.5" fill="#15120F"/>
  <circle cx="96" cy="144" r="3" fill="#fff" opacity=".35"/>
  <circle class="p-glow" cx="100" cy="226" r="20" fill="url(#${id}l)"/>
  <circle cx="100" cy="226" r="7.5" fill="url(#${id}g)"/>
  <circle class="p-light" cx="100" cy="226" r="4.8" fill="#3B2B29"/>
</svg>`;
}
$$('[data-pendant]').forEach((el) => { el.innerHTML = pendantSVG(); });

function setShell(name, scope = document) {
  const color = SHELLS[name];
  if (!color) return;
  $$('[data-pendant]', scope).forEach((el) => el.style.setProperty('--shell', color));
}

/* ---------- Interactive pendant (hero) ---------- */
(function pendantDemo() {
  const btn = $('[data-pendant-demo]');
  if (!btn) return;
  const pendant = $('[data-pendant]', btn);
  const card = $('.alert-card');
  const caption = $('[data-try-caption]');
  if (window.matchMedia('(pointer: coarse)').matches && caption) {
    caption.textContent = 'Try it: double-tap the pendant.';
    btn.setAttribute('aria-label', 'Try the pendant demo: double-tap to send an alert');
  }
  let timer = null;
  let lastUp = 0;

  function fire() {
    clearTimeout(timer);
    pendant.classList.remove('is-alert');
    void pendant.offsetWidth; // restart ring animation
    pendant.classList.add('is-alert');
    card.classList.add('is-on');
    timer = setTimeout(() => {
      pendant.classList.remove('is-alert');
      card.classList.remove('is-on');
    }, 4000);
  }

  // Double click / double tap (one handler for mouse + touch)
  btn.addEventListener('pointerup', (e) => {
    const now = e.timeStamp;
    if (now - lastUp < 400) { fire(); lastUp = 0; } else { lastUp = now; }
  });
  // Keyboard: Enter or Space triggers it directly
  btn.addEventListener('click', (e) => { if (e.detail === 0) fire(); });
  btn.addEventListener('dblclick', (e) => e.preventDefault());
})();

/* ---------- Section 05 swatches ---------- */
(function shellPreview() {
  const group = $('#shells .swatches');
  if (!group) return;
  const name = $('[data-shell-name]');
  const btns = $$('.swatch', group);
  function select(b, focus) {
    btns.forEach((x) => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
    name.textContent = b.dataset.shell;
    setShell(b.dataset.shell, document.querySelector('.hero'));
    setShell(b.dataset.shell, document.querySelector('#shells'));
    if (focus) b.focus();
  }
  btns.forEach((b, i) => {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      select(btns[(i + d + btns.length) % btns.length], true);
    });
  });
})();

/* ---------- Nav ---------- */
(function nav() {
  const nav = $('#nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('.nav__menu');
  const menu = $('#mobile-menu');
  if (toggle && menu) {
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      nav.classList.toggle('is-scrolled', open || window.scrollY > 40);
    };
    toggle.addEventListener('click', () => set(menu.hidden));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); toggle.focus(); } });
  }
})();

/* ---------- How it works: step states ---------- */
(function steps() {
  const map = $('.map');
  const items = $$('.step');
  if (!map || !items.length) return;
  const heads = ['Your circle', 'Alert in progress', 'Location sharing is on'];
  const headEl = $('[data-head-text]');
  function activate(i) {
    items.forEach((s, j) => s.classList.toggle('is-active', j === i));
    map.dataset.state = String(i);
    if (headEl) headEl.textContent = heads[i];
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) activate(Number(en.target.dataset.step)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  items.forEach((s) => io.observe(s));
})();

/* ---------- Smooth scroll + motion ---------- */
let lenis = null;
function scrollToTarget(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const offset = -($('#nav')?.offsetHeight || 0) - 8;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else {
    const y = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href.length < 2) return;
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    scrollToTarget(el);
    history.replaceState(null, '', href);
    if (href === '#reserve') setTimeout(() => $('#f-name')?.focus({ preventScroll: true }), reduceMotion ? 0 : 1300);
  });
});

(function motion() {
  const html = document.documentElement;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return; // content stays fully visible
  window.addEventListener('load', () => window.ScrollTrigger.refresh());
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const EASE = 'expo.out'; // closest GSAP match to cubic-bezier(0.22, 1, 0.36, 1)
  gsap.defaults({ ease: EASE });

  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  html.classList.add('js-ready');

  // Hero load sequence
  gsap.set('.hero__title .line > span', { y: 0, yPercent: 110 });
  gsap.timeline({ delay: 0.15 })
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0)
    .fromTo('.hero [data-fade]', { opacity: 0, y: 24, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.08, clearProps: 'filter' }, 0.55);

  // Text reveals, grouped per section so lines stagger by 80ms
  $$('section').forEach((sec) => {
    if (sec.classList.contains('hero')) return;
    const els = $$('[data-reveal]', sec);
    if (!els.length) return;
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.fromTo(batch,
        { opacity: 0, y: 24, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.08, clearProps: 'filter,transform' }),
    });
  });

  // Hairlines draw left to right
  $$('.rule').forEach((r) => {
    gsap.to(r, { scaleX: 1, duration: 1, scrollTrigger: { trigger: r, start: 'top 90%', once: true } });
  });

  // Image wipes
  $$('[data-media]').forEach((m, i) => {
    const img = $('img', m);
    const isMoment = m.classList.contains('moment__media');
    const delay = isMoment ? ($$('.moment__media').indexOf(m) * 0.15) : 0;
    const t = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 85%', once: true }, delay });
    t.to(m, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: EASE });
    if (img && !m.classList.contains('media--parallax')) t.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.2, clearProps: 'transform' }, 0);
  });

  // Campaign parallax (~8% slower than scroll)
  const par = $('.media--parallax img');
  if (par) {
    gsap.set(par, { scale: 1.16 });
    gsap.fromTo(par, { yPercent: -4 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: '.piece__frame', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  // Steps animate in on mobile
  if (window.matchMedia('(max-width: 1023px)').matches) {
    $$('.step').forEach((s) => gsap.from(s.querySelectorAll('.num, .h3, .body'), {
      opacity: 0, y: 24, duration: 0.9, stagger: 0.08, scrollTrigger: { trigger: s, start: 'top 88%', once: true },
    }));
  }

  ScrollTrigger.refresh();
})();

/* ---------- Reservation form ---------- */
(function reservation() {
  const form = $('#reserve-form');
  if (!form) return;
  const submit = $('[data-submit]', form);
  const label = $('[data-submit-label]', form);
  const formError = $('[data-form-error]', form);
  const shellName = $('[data-form-shell-name]', form);
  const previewName = $('[data-preview-name]');
  const preview = $('.reserve__preview');

  $$('input[name="shell"]', form).forEach((r) => r.addEventListener('change', () => {
    shellName.textContent = r.value;
    if (previewName) previewName.textContent = r.value;
    setShell(r.value); // recolor every pendant on the page
    $$('#shells .swatch').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.shell === r.value)));
    const n = $('[data-shell-name]'); if (n) n.textContent = r.value;
    clearError('shell');
  }));
  if (preview) setShell('Signal Red', preview);

  const fieldOf = (name) => form.elements[name] && (form.elements[name].length ? form.elements[name][0] : form.elements[name]).closest('.field');
  const errIds = { name: 'e-name', email: 'e-email', phone: 'e-phone', shell: 'e-shell', getting_home: 'e-home', batch_option: 'e-batch' };

  function setError(name, msg) {
    const f = fieldOf(name);
    if (f) f.classList.add('has-error');
    $('#' + errIds[name]).textContent = msg;
    const inp = form.elements[name];
    if (inp && !inp.length) inp.setAttribute('aria-invalid', 'true');
  }
  function clearError(name) {
    const f = fieldOf(name);
    if (f) f.classList.remove('has-error');
    $('#' + errIds[name]).textContent = '';
    const inp = form.elements[name];
    if (inp && !inp.length) inp.removeAttribute('aria-invalid');
  }

  function validate() {
    const v = Object.fromEntries(new FormData(form));
    const errors = {};
    if (!v.name || v.name.trim().length < 2) errors.name = 'Please enter your full name.';
    if (!v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errors.email = 'Please enter a valid email address.';
    if (v.phone && v.phone.replace(/\D/g, '').length < 7) errors.phone = 'Please check the number, or leave it blank.';
    if (!v.shell) errors.shell = 'Please choose a shell color.';
    if (!v.getting_home) errors.getting_home = 'Please choose how you usually get home.';
    if (!v.batch_option) errors.batch_option = 'Please choose a Batch 1 option.';
    Object.keys(errIds).forEach((k) => (errors[k] ? setError(k, errors[k]) : clearError(k)));
    return { ok: !Object.keys(errors).length, first: Object.keys(errIds).find((k) => errors[k]), v };
  }

  ['name', 'email', 'phone'].forEach((n) => form.elements[n].addEventListener('blur', () => {
    if (form.dataset.tried) validate();
  }));
  $$('input[type="radio"]', form).forEach((r) => r.addEventListener('change', () => { if (form.dataset.tried) validate(); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.dataset.tried = '1';
    formError.textContent = '';
    const { ok, first, v } = validate();
    if (!ok) {
      const el = form.elements[first];
      (el.length ? el[0] : el).focus();
      return;
    }
    if (v.company) return; // honeypot

    if (!APPS_SCRIPT_URL) {
      formError.textContent = 'Reservations are not connected yet. Please try again soon.';
      return;
    }

    submit.disabled = true;
    label.textContent = 'Reserving…';

    const body = new URLSearchParams({
      name: v.name.trim(),
      email: v.email.trim(),
      phone: (v.phone || '').trim(),
      shell: v.shell,
      getting_home: v.getting_home,
      batch_option: v.batch_option,
    });

    try {
      // Form-encoded + no-cors avoids the CORS preflight Apps Script can't answer.
      await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body });
      label.textContent = 'You’re on the list ✓';
      submit.classList.add('is-success');
      const option = v.batch_option.startsWith('Founder') ? 'founders' : 'standard';
      const q = new URLSearchParams({ shell: v.shell, option });
      setTimeout(() => { window.location.href = '/priority-confirmed.html?' + q.toString(); }, reduceMotion ? 300 : 1100);
    } catch (err) {
      submit.disabled = false;
      label.textContent = 'Reserve my place';
      formError.textContent = 'Something went wrong sending your reservation. Please check your connection and try again.';
    }
  });
})();

/* ---------- Confirmation page ---------- */
(function confirmation() {
  const page = $('[data-confirm]');
  if (!page) return;
  const p = new URLSearchParams(location.search);
  const shell = SHELLS[p.get('shell')] ? p.get('shell') : null;
  const options = {
    founders: 'Founder’s Edition in Batch 1 · $70',
    standard: 'Standard release · $125',
  };
  if (shell) { $('[data-c-shell]').textContent = shell; setShell(shell); }
  if (options[p.get('option')]) $('[data-c-option]').textContent = options[p.get('option')];
})();
