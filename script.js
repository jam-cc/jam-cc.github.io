const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 18);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});

navLinks.forEach((link) => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('open');
}));

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-35% 0px -55%', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
}

const canvas = document.querySelector('[data-anomaly-field]');
const stage = document.querySelector('[data-field-stage]');
const reticle = document.querySelector('[data-reticle]');

if (canvas && stage) {
  const ctx = canvas.getContext('2d');
  const points = [];
  const anomaly = { x: .7, y: .61 };
  let pointer = { x: anomaly.x, y: anomaly.y };
  let frame;

  const buildPoints = () => {
    points.length = 0;
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const x = .10 + col * .115 + Math.sin(row * 2.4 + col) * .012;
        const y = .10 + row * .101 + Math.cos(col * 1.7 + row) * .014;
        if (Math.hypot(x - anomaly.x, y - anomaly.y) > .09) points.push({ x, y });
      }
    }
  };

  const draw = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    ctx.clearRect(0, 0, width, height);

    points.forEach((point) => {
      const x = point.x * width;
      const y = point.y * height;
      const proximity = Math.max(0, 1 - Math.hypot(pointer.x - point.x, pointer.y - point.y) / .28);
      ctx.beginPath();
      ctx.arc(x, y, 2.2 + proximity * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(123, 197, 195, ' + (.42 + proximity * .45) + ')';
      ctx.fill();
    });

    const ax = anomaly.x * width;
    const ay = anomaly.y * height;
    const glow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 34);
    glow.addColorStop(0, 'rgba(242, 107, 56, .62)');
    glow.addColorStop(1, 'rgba(242, 107, 56, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ax, ay, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f26b38';
    ctx.beginPath();
    ctx.arc(ax, ay, 6, 0, Math.PI * 2);
    ctx.fill();

    if (reticle) {
      reticle.style.left = pointer.x * 100 + '%';
      reticle.style.top = pointer.y * 100 + '%';
    }
  };

  const sizeCanvas = () => {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
    draw();
  };

  stage.addEventListener('pointermove', (event) => {
    const rect = stage.getBoundingClientRect();
    pointer = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
    };
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  });

  stage.addEventListener('pointerleave', () => {
    pointer = { x: anomaly.x, y: anomaly.y };
    draw();
  });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(sizeCanvas);
    resizeObserver.observe(stage);
  } else {
    window.addEventListener('resize', sizeCanvas);
    sizeCanvas();
  }
}
