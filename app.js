/* ============================================================
   KREOVYA — moteur partagé
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = window.matchMedia('(hover:none), (pointer:coarse)').matches;
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mnpqqykg';

/* ---------------- Smooth scroll (Lenis) ---------------- */
let lenis = null;
function initSmoothScroll(){
  if (REDUCED || TOUCH || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (window.gsap && window.gsap.ticker) {
    gsap.ticker.add((time) => { lenis && lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
}

/* ---------------- Curseur premium ---------------- */
function initCursor(){
  if (TOUCH) return;
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  ring.innerHTML = '<span class="label">Voir</span>';
  document.body.append(dot, ring);
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop(){
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .cursor-hover').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
  document.querySelectorAll('[data-cursor-label]').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.querySelector('.label').textContent = el.dataset.cursorLabel; });
  });
}

/* ---------------- Intro cinématique (canvas signal trail) ---------------- */
function initIntro(){
  const intro = document.getElementById('intro');
  if (!intro) return;

  if (sessionStorage.getItem('kv_intro_seen')) { intro.remove(); return; }

  function hideIntro(){
    intro.classList.add('is-hidden');
    sessionStorage.setItem('kv_intro_seen', '1');
    setTimeout(() => intro.remove(), 950);
  }
  document.getElementById('introSkip')?.addEventListener('click', hideIntro);

  const wordmark = intro.querySelector('.intro-wordmark');
  const canvas = intro.querySelector('canvas');

  if (REDUCED || !canvas) {
    if (wordmark) wordmark.style.opacity = 1;
    setTimeout(hideIntro, REDUCED ? 400 : 2400);
    return;
  }

  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  size();
  window.addEventListener('resize', size);

  const cx = () => w / 2, cy = () => h / 2;
  const scale = () => Math.min(w, h) * 0.16;

  // Path tracing an abstract "K" signal — point travels, leaves a violet->cyan trail.
  const path = [
    [-0.6, -1], [-0.6, -0.15], [0.35, -1], [0.9, -0.62],
    [-0.15, 0.05], [0.9, 0.75], [0.35, 1], [-0.6, 0.18], [-0.6, 1]
  ];
  let trail = [];
  let t0 = performance.now();
  const DURATION = 2000;

  function pointAt(progress){
    const segs = path.length - 1;
    const f = Math.min(progress * segs, segs - 0.0001);
    const i = Math.floor(f);
    const localT = f - i;
    const [ax, ay] = path[i];
    const [bx, by] = path[i + 1];
    return [ax + (bx - ax) * localT, ay + (by - ay) * localT];
  }

  function draw(now){
    const elapsed = now - t0;
    const progress = Math.min(elapsed / DURATION, 1);
    ctx.clearRect(0, 0, w, h);

    const [px, py] = pointAt(progress);
    const X = cx() + px * scale(), Y = cy() + py * scale();
    trail.push([X, Y]);
    if (trail.length > 70) trail.shift();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length;
      const g = ctx.createLinearGradient(trail[i-1][0], trail[i-1][1], trail[i][0], trail[i][1]);
      g.addColorStop(0, `rgba(124,44,255,${a*0.9})`);
      g.addColorStop(1, `rgba(36,199,255,${a*0.9})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2 * dpr * a + 0.6 * dpr;
      ctx.beginPath();
      ctx.moveTo(trail[i-1][0], trail[i-1][1]);
      ctx.lineTo(trail[i][0], trail[i][1]);
      ctx.stroke();
    }

    // Leading point glow
    const glow = ctx.createRadialGradient(X, Y, 0, X, Y, 22 * dpr);
    glow.addColorStop(0, 'rgba(124,44,255,0.9)');
    glow.addColorStop(1, 'rgba(124,44,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(X, Y, 22 * dpr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F7F8FC';
    ctx.beginPath(); ctx.arc(X, Y, 3 * dpr, 0, Math.PI * 2); ctx.fill();

    if (progress < 1) {
      requestAnimationFrame(draw);
    } else {
      if (wordmark) {
        wordmark.style.transition = 'opacity .7s ease';
        wordmark.style.opacity = 1;
      }
      fadeTrail();
      setTimeout(hideIntro, 1500);
    }
  }

  function fadeTrail(){
    let op = 1;
    (function step(){
      op -= 0.04;
      ctx.globalAlpha = Math.max(op, 0);
      if (op <= 0) { ctx.clearRect(0,0,w,h); return; }
      requestAnimationFrame(step);
    })();
  }

  requestAnimationFrame(draw);
}

/* ---------------- Header au scroll ---------------- */
function initHeaderScroll(){
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------------- Menu mobile ---------------- */
function initMobileMenu(){
  const burger = document.querySelector('.nav-burger');
  const menu = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => menu.classList.add('is-open'));
  menu.querySelectorAll('a, .close-btn').forEach(el => el.addEventListener('click', () => menu.classList.remove('is-open')));
}

/* ---------------- Reveal on scroll ---------------- */
function initReveal(){
  const targets = document.querySelectorAll('.reveal, .reveal-scale, .stagger, .biz-flow');
  if (!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(t => io.observe(t));
}

/* ---------------- Page transition sweep (liens internes) ---------------- */
function initPageTransitions(){
  const sweep = document.createElement('div');
  sweep.className = 'page-sweep';
  document.body.appendChild(sweep);
  document.querySelectorAll('a[href^="/"]:not([target])').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('/#')) return;
      e.preventDefault();
      sweep.classList.add('is-active');
      setTimeout(() => { window.location.href = href; }, 420);
    });
  });
}

/* ---------------- Parcours: DE L'IDÉE À L'IMPACT ---------------- */
function initJourney(){
  const section = document.querySelector('.journey-pin');
  if (!section || REDUCED || typeof gsap === 'undefined' || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const steps = gsap.utils.toArray('.journey-step');
  const dots = gsap.utils.toArray('.journey-progress span');
  const canvas = document.querySelector('.journey-canvas');
  const ctx = canvas?.getContext('2d');

  function resize(){
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px';
  }
  resize(); window.addEventListener('resize', resize);

  function drawStage(index, sub){
    if (!ctx) return;
    const w = canvas.width, h = canvas.height, cx = w/2, cy = h/2;
    ctx.clearRect(0,0,w,h);
    const n = index + 1;
    const R = Math.min(w,h) * 0.16;
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < n; i++) {
      const a1 = (i / 6) * Math.PI * 2 - Math.PI/2;
      const a2 = ((i+1) / 6) * Math.PI * 2 - Math.PI/2;
      const grad = ctx.createLinearGradient(cx + Math.cos(a1)*R, cy + Math.sin(a1)*R, cx + Math.cos(a2)*R, cy + Math.sin(a2)*R);
      grad.addColorStop(0, '#7C2CFF'); grad.addColorStop(1, '#24C7FF');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4 * (window.devicePixelRatio||1);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1)*R, cy + Math.sin(a1)*R);
      ctx.lineTo(cx + Math.cos(a2)*R, cy + Math.sin(a2)*R);
      ctx.stroke();
    }
    for (let i = 0; i <= n; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(a)*R, y = cy + Math.sin(a)*R;
      ctx.fillStyle = i === n ? '#24C7FF' : 'rgba(167,172,186,.5)';
      ctx.beginPath(); ctx.arc(x, y, (i===n?4:2.4)*(window.devicePixelRatio||1), 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  drawStage(0);

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: section,
      start: () => `${(i/steps.length)*100}% top`,
      end: () => `${((i+1)/steps.length)*100}% top`,
      onEnter: () => { setActive(i); },
      onEnterBack: () => { setActive(i); },
    });
  });

  function setActive(i){
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));
    drawStage(i);
  }
}

/* ---------------- Portfolio cinématique (scroll horizontal) ---------------- */
function initPortfolioRail(){
  const pin = document.querySelector('.portfolio-pin');
  const track = document.querySelector('.portfolio-track');
  if (!pin || !track) return;
  const slides = gsap.utils.toArray('.portfolio-slide');
  const dots = gsap.utils.toArray('.portfolio-progress span');

  if (REDUCED || TOUCH || typeof gsap === 'undefined' || !window.ScrollTrigger || innerWidth < 760) return;
  gsap.registerPlugin(ScrollTrigger);

  const totalScroll = () => track.scrollWidth - innerWidth;

  gsap.to(track, {
    x: () => -totalScroll(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${pin.offsetHeight - innerHeight}`,
      scrub: 0.6,
      pin: false,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (slides.length - 1));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
      }
    }
  });
}

/* ---------------- Modal DÉMARRER MON PROJET (multi-étapes) ---------------- */
function initStarter(){
  const modal = document.getElementById('starter');
  if (!modal) return;
  const openers = document.querySelectorAll('[data-open-starter]');
  const closeBtn = modal.querySelector('.starter-close');
  const backdrop = modal.querySelector('.starter-backdrop');
  const steps = Array.from(modal.querySelectorAll('.starter-step'));
  const progressEls = Array.from(modal.querySelectorAll('.starter-progress span'));
  let current = 0;
  const answers = {};

  function open(){ modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; goTo(0); }
  function close(){ modal.classList.remove('is-open'); document.body.style.overflow = ''; }
  openers.forEach(b => b.addEventListener('click', open));
  closeBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);

  function goTo(i){
    current = i;
    steps.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    progressEls.forEach((p, idx) => { p.classList.toggle('is-done', idx < i); p.classList.toggle('is-active', idx === i); });
  }

  modal.querySelectorAll('.starter-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const step = opt.closest('.starter-step');
      step.querySelectorAll('.starter-option').forEach(o => o.classList.remove('is-selected'));
      opt.classList.add('is-selected');
      answers[step.dataset.field] = opt.dataset.value;
      setTimeout(() => goTo(current + 1), 260);
    });
  });

  modal.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.closest('.starter-step');
      step.querySelectorAll('input, textarea').forEach(f => { answers[f.name] = f.value; });
      goTo(current + 1);
    });
  });
  modal.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => goTo(current - 1));
  });
  modal.querySelectorAll('[data-submit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const step = btn.closest('.starter-step');
      step.querySelectorAll('input, textarea').forEach(f => { answers[f.name] = f.value; });

      const originalLabel = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>Envoi…</span>';

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: JSON.stringify({ _subject: 'KREOVYA — Nouvelle demande de projet', ...answers }),
        });
        if (!res.ok) throw new Error('Formspree error');
        trackEvent('form_submit', answers);
        goTo(steps.length - 1);
      } catch (err) {
        showToast("Erreur d'envoi — réessayez ou écrivez-nous à info@kreovya.com");
        btn.disabled = false;
        btn.innerHTML = originalLabel;
      }
    });
  });
}

/* ---------------- Carrousel de témoignages ---------------- */
function initTestimonials(){
  const viewport = document.getElementById('testiViewport');
  if (!viewport) return;
  const track = viewport.querySelector('.testi-track-v2');
  const cards = Array.from(track.children);
  const carousel = viewport.closest('.testi-carousel-v2');
  if (!cards.length) return;

  function cardStep(){
    const card = cards[0];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 24;
    return card.getBoundingClientRect().width + gap;
  }

  function next(){
    const atEnd = viewport.scrollLeft + viewport.clientWidth >= track.scrollWidth - 4;
    viewport.scrollTo({ left: atEnd ? 0 : viewport.scrollLeft + cardStep(), behavior: 'smooth' });
  }
  function prev(){
    const atStart = viewport.scrollLeft <= 4;
    const maxScroll = track.scrollWidth - viewport.clientWidth;
    viewport.scrollTo({ left: atStart ? maxScroll : viewport.scrollLeft - cardStep(), behavior: 'smooth' });
  }

  carousel?.querySelector('.testi-nav-btn.next')?.addEventListener('click', () => { next(); restart(); });
  carousel?.querySelector('.testi-nav-btn.prev')?.addEventListener('click', () => { prev(); restart(); });

  let timer = null;
  function restart(){
    clearInterval(timer);
    if (!REDUCED) timer = setInterval(next, 7000);
  }
  viewport.addEventListener('mouseenter', () => clearInterval(timer));
  viewport.addEventListener('mouseleave', restart);
  viewport.addEventListener('touchstart', () => clearInterval(timer), { passive: true });

  restart();
}

/* ---------------- FAQ accordéon ---------------- */
function initFaq(){
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach(other => {
        if (other !== item) { other.classList.remove('is-open'); other.querySelector('.faq-a').style.maxHeight = null; }
      });
      if (isOpen) { item.classList.remove('is-open'); a.style.maxHeight = null; }
      else { item.classList.add('is-open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
}

/* ---------------- Analytics — événements configurables ---------------- */
function trackEvent(name, data){
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...data });
}
function initAnalyticsHooks(){
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => trackEvent(el.dataset.track, { label: el.dataset.trackLabel || '' }));
  });
}

/* ---------------- Formulaire contact simple ---------------- */
function initContactForm(){
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn?.innerHTML;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span>Envoi…</span>'; }

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error('Formspree error');
      form.reset();
      form.hidden = true;
      const confirmMsg = document.createElement('p');
      confirmMsg.className = 'lede';
      confirmMsg.textContent = 'Merci ! Votre message a bien été envoyé — nous vous répondrons rapidement.';
      form.insertAdjacentElement('afterend', confirmMsg);
      trackEvent('form_submit', { form: 'contact' });
    } catch (err) {
      showToast("Erreur d'envoi — réessayez ou écrivez-nous à info@kreovya.com");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
    }
  });
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function showToast(msg){
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2800);
}

/* ---------------- Init global ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  initIntro();
  initSmoothScroll();
  initCursor();
  initHeaderScroll();
  initMobileMenu();
  initReveal();
  initPageTransitions();
  initJourney();
  initPortfolioRail();
  initStarter();
  initTestimonials();
  initFaq();
  initAnalyticsHooks();
  initContactForm();
  if (window.initHeroScene) window.initHeroScene();
});
