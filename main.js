/* =========================================================================
   LANDING PAGE: "Press Enter to continue" cinematic slide navigation.
   Purely additive — normal mouse-wheel/trackpad scrolling still works
   exactly like a regular page. Enter/Space just smooth-scrolls to the
   next full-screen section with a brief fade transition.
   ========================================================================= */
function advanceSlide() {
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  if (slides.length === 0) return;

  const scrollPos = window.scrollY + 10;
  let currentIndex = 0;
  slides.forEach((s, i) => { if (s.offsetTop <= scrollPos) currentIndex = i; });

  const next = slides[currentIndex + 1];
  if (!next) return; // already at the last slide — let normal scroll take over

  const overlay = document.getElementById('slideTransitionOverlay');
  if (overlay) {
    overlay.classList.add('active');
    setTimeout(() => {
      next.scrollIntoView({ behavior: 'auto', block: 'start' });
      requestAnimationFrame(() => overlay.classList.remove('active'));
    }, 220);
  } else {
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('[data-slide]')) {
    if (!document.getElementById('slideTransitionOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'slideTransitionOverlay';
      overlay.className = 'slide-transition-overlay';
      document.body.appendChild(overlay);
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceSlide();
      }
    });
  }
});
function toggleNav(){
  document.querySelector('.nav-links').classList.toggle('open');
}

/* ============== Scroll reveal ============== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach(el => revealObserver.observe(el));
});

/* ============== 3D tilt on hover ============== */
function addTilt(card) {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-card, .dl-card').forEach(addTilt);
});

/* ============== Modal helpers ============== */
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
  });
});

/* ============== FAQ accordion ============== */
function toggleFaq(item){ item.classList.toggle('open'); }

/* =========================================================================
   REAL LICENSE VERIFICATION — same RSA public key / SHA256withRSA scheme
   as the desktop app's LicenseValidator. A license issued by the
   admin-only LicenseGenerator tool verifies correctly here too.
   ========================================================================= */
const PUBLIC_KEY_BASE64 =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqiUu38YBMoOuei7//PRKLaMTwPogTbFtKWSu9tUy0PHV7gKu1aFEx9PN2TzTcW6kA/R2h+e9fgk7UHBMgHjCf4serzkusBueNodIjE9ScpjGrPj0CXY1kBitXCRpX/9auaRqNYAc/N+7WSpEpugB9S0/Waf8JikAC3Amp6yNFusy/WKWVp0YY9Mqqtt5USorCOOyTXlWX7HDMUml0Wel4m9spCqEMNd0ALlM4hiciZeP+Qjkz2RHoLmDZDx9k/5Gn3Mzc55HjqjbizUZ7V6bZv1gd15cc8uPF60B46v7D27UCNQxFM1PzOnwEyA5c0f/iMZP7z64rVThjy5WLgQUAwIDAQAB";

let pendingDownloadUrl = null;

function base64UrlToBytes(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function importPublicKey() {
  const bin = atob(PUBLIC_KEY_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return crypto.subtle.importKey('spki', bytes.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}
async function validateLicense(licenseKey) {
  const parts = licenseKey.trim().split('.');
  if (parts.length !== 2) return { valid: false, reason: 'Malformed license key.' };
  try {
    const payloadBytes = base64UrlToBytes(parts[0]);
    const signatureBytes = base64UrlToBytes(parts[1]);
    const payloadText = new TextDecoder().decode(payloadBytes);
    const publicKey = await importPublicKey();
    const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, publicKey, signatureBytes, payloadBytes);
    if (!ok) return { valid: false, reason: 'Signature invalid — this key was not issued by TECH-World.' };
    const fields = payloadText.split('|');
    if (fields.length !== 4) return { valid: false, reason: 'Malformed license payload.' };
    const [customerName, expiryEpochDay, licenseId, machineId] = fields;
    const expiryDate = new Date(parseInt(expiryEpochDay, 10) * 86400000);
    const expired = new Date() > expiryDate;
    return { valid: true, expired, customerName, expiryDate, licenseId, machineId };
  } catch (e) {
    return { valid: false, reason: 'Could not parse license: ' + e.message };
  }
}
async function verifyAndDownload() {
  const input = document.getElementById('licenseKeyInput').value;
  const statusEl = document.getElementById('licenseStatus');
  statusEl.textContent = 'Verifying...';
  statusEl.className = 'license-status';
  const result = await validateLicense(input);
  if (!result.valid) { statusEl.textContent = result.reason; statusEl.className = 'license-status err'; return; }
  if (result.expired) {
    statusEl.textContent = 'This license expired on ' + result.expiryDate.toDateString() + '.';
    statusEl.className = 'license-status err'; return;
  }
  statusEl.textContent = 'Valid license for ' + result.customerName + '. Starting download...';
  statusEl.className = 'license-status ok';
  setTimeout(() => { if (pendingDownloadUrl) window.location.href = pendingDownloadUrl; closeModal('licenseModal'); }, 900);
}

/* =========================================================================
   FULL-PAGE NEURAL PARTICLE BACKGROUND — shared on every page
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = document.documentElement.scrollHeight; }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(document.body);
  resize();

  const COUNT = Math.min(130, Math.floor((window.innerWidth * window.innerHeight) / 16000));
  const particles = [];
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 1 + Math.random() * 1.8, vy: 0.08 + Math.random() * 0.18,
      a: 0.15 + Math.random() * 0.35,
      color: Math.random() < 0.55 ? '56,189,248' : '124,58,237'
    });
  }
  let mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY + window.scrollY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  const CONNECT_RADIUS = 160;

  function tick(){
    ctx.clearRect(0, 0, W, H);
    const scrollY = window.scrollY;
    const viewTop = scrollY, viewBottom = scrollY + window.innerHeight;
    for (const p of particles) {
      p.y -= p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.y < viewTop - 100 || p.y > viewBottom + 100) continue;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < CONNECT_RADIUS) {
        const alpha = (1 - dist / CONNECT_RADIUS) * 0.45;
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, `rgba(${p.color},${p.a})`);
      grad.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
});
