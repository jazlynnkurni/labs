// Password gate for the case studies. Every request needs a session cookie; without it the visitor gets the sign-in
// page. The password lives only in the CASE_PW environment variable, and the cookie holds a salted hash of it.
// /gate/ holds the sign-in page's own flip phone and photos, so it is open to everyone
export const config = { matcher: ['/((?!favicon.ico|gate/).*)'] };

const enc = new TextEncoder();
async function token(pw) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode('jaz-case-studies:' + pw));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const cookieOf = (req, name) => (req.headers.get('cookie') || '').split(/;\s*/).map(c => c.split('=')).find(([k]) => k === name)?.[1];

function page(err) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Case Studies · Jazlynn Kurniandra</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/gate/flip.css?v=1">
<style>
:root{--ink:#14171B;--paper:#FFFFFF;--ink2:rgba(20,23,27,.62);--ink3:rgba(20,23,27,.4);--hair:rgba(20,23,27,.12);--jak:"Plus Jakarta Sans",sans-serif;--hel:"Helvetica Neue",Helvetica,Arial,sans-serif}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff}
body{min-height:100vh;display:grid;grid-template-columns:1.15fr 1fr;align-items:center;color:var(--ink);font:300 16px/1.5 var(--hel);-webkit-font-smoothing:antialiased;overflow-x:hidden}
/* left: the flip phone from the About page, scaled up to hold the half */
.left{display:grid;place-items:center;min-height:100vh}
.left .flip-stage{width:min(560px,48vw);transform:scale(1.45);transform-origin:50% 45%}
/* right: thin, editorial, on a grey-white plate */
.right{padding:0 clamp(24px,7vw,110px) 0 16px}
.card{width:min(420px,100%);padding:44px 40px 40px;border-radius:24px;background:#F6F6F4;box-shadow:inset 0 0 0 1px rgba(20,23,27,.05)}
h1{margin:0 0 28px;font:200 clamp(28px,2.6vw,36px)/1.1 var(--jak);letter-spacing:-.035em;color:var(--ink)}
label{display:block;font:400 11px/1.4 var(--jak);letter-spacing:.16em;text-transform:uppercase;color:var(--ink3);margin-bottom:12px}
input{width:100%;font:300 17px var(--hel);padding:14px 16px;border-radius:12px;border:0;outline:0;background:#fff;color:var(--ink);
  box-shadow:inset 0 0 0 1px var(--hair);transition:box-shadow .2s ease;-webkit-tap-highlight-color:transparent}
input:focus,input:focus-visible{outline:0;box-shadow:inset 0 0 0 1px rgba(20,23,27,.32)}
button{margin-top:14px;width:100%;font:400 15px var(--jak);letter-spacing:.01em;padding:14px 18px;border:0;border-radius:999px;color:#fff;cursor:pointer;background:var(--ink);transition:opacity .2s ease}
button:hover{opacity:.86}
.e{margin:14px 0 0;font:italic 300 14px/1.4 var(--hel);color:var(--ink2)}
@media(max-width:860px){body{grid-template-columns:1fr}.left{min-height:auto;padding-top:96px}.left .flip-stage{width:min(340px,80vw);transform:none}.right{padding:24px 16px 56px;display:grid;place-items:center}}
</style></head><body>
<div class="left">
  <div class="flip-stage" id="stage" aria-label="A flip phone open on six photographs; the keys change the photo."><div class="phone" id="phone">
    <div class="base"><div class="slab"></div><div class="shell"></div><div class="hinge"></div>
      <div class="keys"><div class="nav">
        <div class="soft" id="prev" title="Previous"><svg viewBox="0 0 26 18"><path d="M11.5 2.6 3.4 9l8.1 6.4V2.6ZM22.6 2.6 14.5 9l8.1 6.4V2.6Z"/></svg></div>
        <div class="ring"><i></i><i></i><i></i><i></i><b id="play" title="Pause"></b></div>
        <div class="soft" id="next" title="Next"><svg viewBox="0 0 26 18"><path d="M3.4 2.6 11.5 9l-8.1 6.4V2.6ZM14.5 2.6 22.6 9l-8.1 6.4V2.6Z"/></svg></div>
      </div><div class="pad"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>*</span><span>0</span><span>#</span></div></div>
    </div>
    <div class="lid" id="lid">
      <div class="face in shell"><div class="screen" id="screen"><img id="fallback" src="/gate/photos/camera.jpg" alt=""><div class="glare"></div></div><div class="brand">JAZLYNN</div></div>
      <div class="face out shell"><div class="ext" id="ext">--:--</div><div class="cam"></div></div>
    </div>
  </div></div>
</div>
<div class="right"><form class="card" method="post" action="/login">
<h1>Case Studies</h1>
<label for="pw">Password</label><input id="pw" name="pw" type="password" autocomplete="current-password" autofocus required>
<button type="submit">Enter</button>${err ? '<p class="e">That password is not right. Try again.</p>' : ''}
</form></div>
<script src="/gate/flip.js?v=1"></script>
</body></html>`;
}
const html = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

export default async function middleware(req) {
  const url = new URL(req.url);
  const want = process.env.CASE_PW ? await token(process.env.CASE_PW) : null;
  if (!want) return html('Not configured.', 503);
  if (url.pathname === '/login' && req.method === 'POST') {
    const form = await req.formData();
    if (await token(String(form.get('pw') || '')) === want) {
      return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `cs=${want}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` } });
    }
    return html(page(true), 401);
  }
  if (cookieOf(req, 'cs') === want) return;               // signed in: serve the page as normal
  return html(page(false), 401);
}
