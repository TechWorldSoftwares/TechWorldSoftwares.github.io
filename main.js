
function toggleNav(){
  const nav=document.querySelector('.nav-links');
  if(nav) nav.classList.toggle('open');
}
document.addEventListener('click',e=>{
  const nav=document.querySelector('.nav-links');
  if(nav && nav.classList.contains('open') && !e.target.closest('nav')) nav.classList.remove('open');
});
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')});
},{threshold:.12});
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>revealObserver.observe(el));
  document.querySelectorAll('.product-card,.skill-card,.service-card,.dl-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      if(window.matchMedia('(pointer:coarse)').matches)return;
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateX(${-y*5}deg) rotateY(${x*5}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave',()=>card.style.transform='');
  });
});
function toggleFaq(item){item.classList.toggle('open')}

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



/* Interactive neural field: mouse -> nearby nodes -> living threads */
document.addEventListener('DOMContentLoaded',()=>{
  const canvas=document.getElementById('neuralCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W=0,H=0,dpr=1;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile=window.matchMedia('(max-width: 700px)').matches;
  let count=isMobile?48:Math.min(105,Math.floor(innerWidth*innerHeight/15000));
  const pts=[];
  const mouse={x:-9999,y:-9999,active:false};
  function resize(){
    dpr=Math.min(devicePixelRatio||1,1.7); W=innerWidth; H=innerHeight;
    canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize(); addEventListener('resize',resize,{passive:true});
  for(let i=0;i<count;i++)pts.push({
    x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.16,vy:(Math.random()-.5)*.16,
    r:.7+Math.random()*1.4,p:Math.random(),phase:Math.random()*Math.PI*2
  });
  addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true},{passive:true});
  addEventListener('mouseleave',()=>mouse.active=false);
  function frame(t){
    ctx.clearRect(0,0,W,H);
    for(const p of pts){
      p.phase+=.008;
      p.x+=p.vx+Math.cos(p.phase)*.05;p.y+=p.vy+Math.sin(p.phase*.8)*.05;
      if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
      if(mouse.active && !reduced){
        const dx=p.x-mouse.x,dy=p.y-mouse.y,d=Math.hypot(dx,dy);
        if(d<150){const f=(1-d/150)*.035;p.x+=dx*f;p.y+=dy*f}
      }
    }
    const radius=isMobile?105:145;
    for(let i=0;i<pts.length;i++){
      const a=pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<radius){
          const alpha=(1-d/radius)*.14;
          ctx.strokeStyle=`rgba(139,92,246,${alpha})`;ctx.lineWidth=.65;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
      if(mouse.active && !reduced){
        const d=Math.hypot(a.x-mouse.x,a.y-mouse.y);
        if(d<radius){
          const alpha=(1-d/radius)*.5;
          ctx.strokeStyle=`rgba(98,217,255,${alpha})`;ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke();
        }
      }
      const glow=ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,a.r*4);
      glow.addColorStop(0,`rgba(98,217,255,.6)`);glow.addColorStop(1,'rgba(98,217,255,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(a.x,a.y,a.r*4,0,Math.PI*2);ctx.fill();
    }
    if(!reduced)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});

/* CINEMATIC FLUID THREADS — hero-only visual layer */
document.addEventListener('DOMContentLoaded',()=>{
  const canvas=document.getElementById('ribbonCanvas');
  const hero=document.querySelector('.cin-hero');
  if(!canvas||!hero||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d');
  let w=0,h=0,dpr=1,t=0;
  const mouse={x:.5,y:.5,active:false};
  function resize(){dpr=Math.min(devicePixelRatio||1,1.6);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  resize();addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',e=>{mouse.x=e.clientX/w;mouse.y=e.clientY/h;mouse.active=true},{passive:true});
  const streams=Array.from({length:22},(_,i)=>({seed:i*1.73,side:i%2?1:-1,width:.55+Math.random()*1.5,phase:Math.random()*6.28}));
  function curve(s,off){
    const points=[];const cx=w*.69+(mouse.x-.5)*20;const cy=h*.48+(mouse.y-.5)*18;
    for(let k=0;k<=34;k++){
      const u=k/34;
      const ang=(u-.5)*Math.PI*(1.05+s.side*.035)+s.phase;
      const rx=w*(.12+.045*Math.sin(s.seed));
      const ry=h*(.08+.025*Math.cos(s.seed));
      const sweep=Math.sin(u*Math.PI)*(.08*w)*(s.side);
      let x=cx + Math.cos(ang)*rx + sweep;
      let y=cy + Math.sin(ang)*ry + (u-.5)*h*.12;
      const wave=Math.sin(t*.0008+s.seed+u*8)*16*(1-u*.7);
      x+=wave*s.side;y+=Math.cos(t*.00065+s.seed+u*6)*10;
      const pull=Math.max(0,1-Math.hypot(x-mouse.x*w,y-mouse.y*h)/(w*.35));
      x+=(mouse.x*w-x)*pull*.045;y+=(mouse.y*h-y)*pull*.035;
      points.push([x,y]);
    }
    return points;
  }
  function frame(ms){
    t=ms;ctx.clearRect(0,0,w,h);
    streams.forEach((s,i)=>{
      const pts=curve(s,i);
      ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      const grad=ctx.createLinearGradient(0,0,w,h);
      if(i%3===0){grad.addColorStop(0,'rgba(72,216,255,0)');grad.addColorStop(.45,'rgba(72,216,255,.22)');grad.addColorStop(1,'rgba(155,98,255,0)')}
      else{grad.addColorStop(0,'rgba(155,98,255,0)');grad.addColorStop(.5,'rgba(155,98,255,.15)');grad.addColorStop(1,'rgba(72,216,255,0)')}
      ctx.strokeStyle=grad;ctx.lineWidth=s.width;ctx.stroke();
    });
    if(mouse.active){
      const x=mouse.x*w,y=mouse.y*h;
      const g=ctx.createRadialGradient(x,y,0,x,y,90);
      g.addColorStop(0,'rgba(72,216,255,.12)');g.addColorStop(1,'rgba(72,216,255,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,90,0,Math.PI*2);ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
