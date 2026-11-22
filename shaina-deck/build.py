import pathlib, base64
D = pathlib.Path(__file__).parent
def b64(name):
    p = D/"img"/name; mime = "jpeg" if p.suffix==".jpg" else "png"
    return f"data:image/{mime};base64," + base64.b64encode(p.read_bytes()).decode()
V1, V2, V2BIG, AI = b64("v1.png"), b64("v2.png"), b64("v2-big.png"), b64("ai.jpg")
SK = "filter:grayscale(1) brightness(1.2) contrast(1.28)"

CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:13.333in 7.5in;margin:0}
html,body{background:#fff}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",sans-serif;color:#111;font-size:12px;line-height:1.5;-webkit-font-smoothing:antialiased}
.slide{width:13.333in;height:7.5in;padding:46px 54px;display:flex;flex-direction:column;page-break-after:always;break-after:page;position:relative;overflow:hidden;background:#fff}
.slide:last-child{page-break-after:auto;break-after:auto}
.mt{font-family:Montserrat,sans-serif;font-weight:100}
.mb{font-family:Montserrat,sans-serif;font-weight:800}
h1{font-family:Montserrat,sans-serif;font-size:37px;line-height:1.08;letter-spacing:-.018em;color:#000}
h1 .mt{font-weight:200}
h2{font-family:Montserrat,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em;color:#000;margin-bottom:12px}
.sub{font-size:13.5px;color:#6b6b6b;margin-top:9px;max-width:980px;line-height:1.46;font-weight:300}
.lbl{font-family:Montserrat,sans-serif;font-weight:700;font-size:8px;letter-spacing:.17em;text-transform:uppercase;color:#000}
.ink{background:#000;color:#fff}
.ink *{color:#fff}
.soft{background:#f4f4f4;border:.5px solid #e4e4e4}
.hair{background:#fff;border:.5px solid #cfcfcf}
.chip{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;font-family:Montserrat,sans-serif;font-weight:800;font-size:9.5px;background:#000;color:#fff}
.pill{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:5px 13px}
.card{background:#fff;border:.5px solid #e4e4e4;border-radius:11px;padding:17px 19px}
ul{list-style:none}
li{padding-left:14px;text-indent:-14px;font-size:11.5px;line-height:1.42;color:#2a2a2a;margin-bottom:5px}
li:last-child{margin-bottom:0}
li::before{content:"\00b7\00a0\00a0";color:#b4b4b4;font-weight:700}
.req li{font-size:12.5px;line-height:1.45;color:#1a1a1a;margin:0;padding:9px 0 9px 15px;text-indent:-15px;border-bottom:.5px solid #ededed}
.req li:last-child{border-bottom:none}
.logo{font-family:Montserrat,sans-serif;line-height:.92}
.logo .a{font-weight:800;letter-spacing:.06em;display:block}
.logo .b{font-weight:100;letter-spacing:.52em;display:block}
.band{border-radius:999px;padding:11px 26px;text-align:center}
.frame{border-radius:12px;padding:10px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.frame img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;display:block}
table{border-collapse:collapse;width:100%}
th{font-family:Montserrat,sans-serif;font-weight:700;font-size:13px;text-align:left;padding:10px 14px;border-bottom:1px solid #000;color:#000}
td{font-size:12px;line-height:1.48;color:#1a1a1a;vertical-align:top;padding:11px 14px;border-bottom:.5px solid #e4e4e4}
td.q{font-family:Montserrat,sans-serif;font-weight:700;font-size:11px;line-height:1.35;color:#000}
.step{display:flex;align-items:center;gap:9px}
"""
def chip(n): return f'<span class="chip">{n}</span>'
def pill(t): return f'<div class="hair pill"><span class="lbl">{t}</span></div>'

# 1 · COVER
cover = f"""<div class="slide" style="justify-content:center;align-items:center;text-align:center">
  <div class="hair pill" style="padding:7px 20px;margin-bottom:34px"><span class="lbl">Design Studio &nbsp;·&nbsp; Shoe Redesign</span></div>
  <div class="logo" style="font-size:78px;color:#000"><span class="a">SHAINA</span><span class="b" style="font-size:25px;margin-top:11px">N Y C</span></div>
  <p class="sub" style="margin-top:34px;max-width:640px;text-align:center;font-size:14px">A ballet flat that survives winter. Designed by me, designed by an AI, chosen and corrected by Shaina.</p>
  <div style="margin-top:46px;display:flex;gap:11px;flex-wrap:wrap;justify-content:center">{pill("1 &nbsp;Interview")}{pill("2 &nbsp;My design")}{pill("3 &nbsp;AI design")}{pill("4 &nbsp;Her choice")}{pill("5 &nbsp;Co-creation")}{pill("6 &nbsp;Annotation")}</div>
  <p style="position:absolute;bottom:40px;font-size:10px;color:#9a9a9a;letter-spacing:.09em">JAZLYNN KURNIANDRA &nbsp;·&nbsp; DESIGNED WITH SHAINA SAHU</p>
</div>"""

# 2 · PERSONA
F = [("Comfort, for her, is economic.","She said comfort over style without hesitating, but the reason was repeat use. Shoes that hurt get worn here and there."),
     ("She has already resolved comfort versus style.","&ldquo;Most of the shoes I have at this point, they do have both.&rdquo; A new pair cannot reintroduce the trade-off."),
     ("Ballet flats are what she reaches for, and winter takes them away.","She wears sneakers or flats, says she wears flats a lot, then adds she cannot wear them as much in winter."),
     ("Looseness bothers her, fastening does not.","Tying laces does not take long, she said, yet she asks for an adjustable tie and shoes that stay fitted."),
     ("Her benchmark is a shoe that stops being a decision.","The plain black-and-white Samba she wears with everything. Her word for it was dependable.")]
fh = "".join(f'<p style="font-size:12px;line-height:1.55;margin-bottom:13px;color:#2a2a2a"><b style="color:#000">{i+1}&nbsp; {t}</b> {b}</p>' for i,(t,b) in enumerate(F))
persona = f"""<div class="slide">
  <h1><span class="mt">1 &nbsp;Getting to know</span> <span class="mb">Shaina</span></h1>
  <p class="sub">Senior at Columbia Engineering, 21, building a startup. She has solved comfort versus style for herself. What she has not solved is the weather.</p>
  <div style="display:grid;grid-template-columns:1fr 300px;gap:30px;margin-top:26px;flex:1;min-height:0">
    <div><h2>What the interview told me</h2>{fh}
      <div class="ink" style="border-radius:12px;padding:16px 18px;margin-top:6px">
        <p class="lbl" style="margin-bottom:6px;color:#9a9a9a">The design problem</p>
        <p class="mb" style="font-size:14px;line-height:1.28">She does not need another comfortable shoe. She needs the one she already loves to survive November.</p></div></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><div class="step" style="margin-bottom:9px">{chip("01")}<span class="lbl">Must-haves</span></div>
        <ul><li>Cushioned supportive insole</li><li>Reinforced toe and heel</li><li>Wide feet inside a slim design</li><li>Water-resistant, higher coverage</li><li>Breathable, sockless-friendly</li><li>Firm heel counter</li><li>Adjustable tie, stays fitted</li></ul></div>
      <div class="card"><div class="step" style="margin-bottom:9px">{chip("02")}<span class="lbl">Preferences</span></div>
        <ul><li>Lightweight, flexible build</li><li>Solid colours, subtle accent</li><li>Low-profile, works with any outfit</li><li>Subtle lift from a higher sole</li></ul></div>
      <div class="card"><div class="step" style="margin-bottom:9px">{chip("03")}<span class="lbl">Aspirations</span></div>
        <ul><li>Elegant ballet-flat look, but practical</li><li>Timeless</li><li>Comfortable enough to jog in</li><li>Non-wasteful material</li></ul></div>
    </div>
  </div>
</div>"""

# 3 · MY ORIGINAL DESIGN
mine = f"""<div class="slide">
  <h1><span class="mt">2 &nbsp;My</span> <span class="mb">original design</span></h1>
  <p class="sub">Drawn from the interview before any AI was involved. A ballet flat with the structure of a sneaker.</p>
  <div style="display:grid;grid-template-columns:1fr 340px;gap:28px;margin-top:22px;flex:1;min-height:0">
    <div class="hair frame"><img src="{V1}" style="{SK}" alt="Version 1 sketch"></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><p class="lbl" style="margin-bottom:8px">What it is</p>
        <ul><li>Cross-over elastic straps, so it slips on and stays fitted</li><li>Breathable mesh upper with suede overlays</li><li>Padded heel collar and cushioned midsole</li><li>Rubber outsole with a little height</li><li>Beige, bone and burnt-orange, with a worn-in finish</li></ul></div>
      <div class="card"><p class="lbl" style="margin-bottom:8px">Functional value</p>
        <p style="font-size:11.5px;line-height:1.5;color:#2a2a2a">Lift, grip and coverage so the flat she already loves can be worn in wet weather. Elastic instead of laces because she wants fit without fuss.</p></div>
      <div class="card"><p class="lbl" style="margin-bottom:8px">Emotional value</p>
        <p style="font-size:11.5px;line-height:1.5;color:#2a2a2a">She keeps things that show time passing, fifteen pairs going back to middle school, and she wants to move fast enough to feel like flying. So I built the character in at the factory.</p></div>
    </div>
  </div>
</div>"""

# 4 · AI DESIGN
ai = f"""<div class="slide">
  <h1><span class="mt">3 &nbsp;The</span> <span class="mb">AI design</span></h1>
  <p class="sub">I uploaded the interview transcript and asked the AI to design a shoe for my partner. This is what it returned, unedited.</p>
  <div style="display:grid;grid-template-columns:1fr 340px;gap:28px;margin-top:22px;flex:1;min-height:0">
    <div class="hair frame"><img src="{AI}" alt="AI design: The Everyday Classic loafer"></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><p class="lbl" style="margin-bottom:8px">What it proposed</p>
        <ul><li>&ldquo;The Everyday Classic&rdquo;, a dark brown suede penny loafer</li><li>Cushioned insole and padded collar</li><li>Durable rubber outsole, slight heel lift</li><li>Four classic neutrals, suede and leather lining</li><li>Pitched for work, travel, dates and everyday comfort</li></ul></div>
      <div class="card"><p class="lbl" style="margin-bottom:8px">What it got right</p>
        <p style="font-size:11.5px;line-height:1.5;color:#2a2a2a">It heard the must-haves. Cushioning, a reinforced durable build, a subtle height boost and all-season wear are all on her list.</p></div>
      <div class="card" style="border-color:#000"><p class="lbl" style="margin-bottom:8px">What it missed</p>
        <p style="font-size:11.5px;line-height:1.5;color:#2a2a2a">It designed for &ldquo;him&rdquo;. It never read who Shaina is: it dropped the ballet flat she actually wears, chose brown over the quiet neutrals she asked for, and added a loafer she never mentioned. Generic comfort, no person in it.</p></div>
    </div>
  </div>
</div>"""

# 5 · HER CHOICE
rows = [("&ldquo;i don&rsquo;t really like how they look&rdquo;","A penny loafer in dark brown suede, written for &ldquo;his next chapter&rdquo;. She never named loafers.","A ballet flat with sneaker structure, the shoe she already reaches for most."),
        ("&ldquo;idt ill get much use out of them&rdquo;","Pitched for work, travel and dates. Suede does not like rain, so it would sit out the winter too.","Coverage, grip and a water-resistant sole, so the flat stays in rotation all year."),
        ("&ldquo;versatility and height boost that i don&rsquo;t really care about&rdquo;","Leads with all-season versatility and a confidence-giving heel lift.","Leads with cushioning, fit and a sockless-friendly upper. Lift is subtle and only there for wet ground."),
        ("&ldquo;focused on comfort which i care the most about&rdquo;","Comfort is one of five equal icons.","Comfort is the brief. Cushioned midsole, padded collar, elastic that keeps it fitted.")]
tr = "".join(f'<tr><td class="q">{a}</td><td>{b}</td><td>{c}</td></tr>' for a,b,c in rows)
choice = f"""<div class="slide">
  <h1><span class="mt">4 &nbsp;Shaina chose</span> <span class="mb">the original</span></h1>
  <p class="sub">I sent her the AI design on 3 October and asked what she thought. Her reply, unedited, and what each line of it points to.</p>
  <div style="display:grid;grid-template-columns:230px 1fr;gap:28px;margin-top:22px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="soft frame" style="padding:6px"><img src="{AI}" alt="AI design"></div>
      <p class="lbl" style="text-align:center;color:#9a9a9a">AI design</p>
      <div class="hair frame" style="padding:6px"><img src="{V1}" style="{SK}" alt="Original"></div>
      <p class="lbl" style="text-align:center">Original, her pick</p>
    </div>
    <div>
      <div class="card" style="padding:20px 24px;border-color:#000">
        <p class="mb" style="font-size:17px;line-height:1.38;color:#000">&ldquo;nooo i don&rsquo;t really like how they look, idt ill get much use out of them. they&rsquo;re prioritising things like versatility and height boost that i don&rsquo;t really care about. the ones you designed were visually appealing and focused on comfort which i care the most about&rdquo;</p>
        <p style="font-size:11px;color:#6b6b6b;margin-top:10px">Shaina, iMessage, 3 October. Her first question on seeing it was &ldquo;did u specify to make shoes for shaina just so it knows&rdquo;: the AI had written the shoe for &ldquo;him&rdquo;.</p>
      </div>
      <table style="margin-top:16px"><tr><th style="width:150px">Her words</th><th>AI design</th><th>My original design</th></tr>{tr}</table>
    </div>
  </div>
  <div class="ink band" style="margin-top:22px"><span class="mb" style="font-size:13px">The AI optimised for versatility and height. Shaina optimises for comfort and use. She chose the one with her in it.</span></div>
</div>"""

# 6 · CO-CREATION
FB = [("the only thing i would change is i don&rsquo;t love the sporty look, like id want it too look more sleek/feminine/polished",
       "The sneaker upper came off. Version 2 is a true ballet-flat last with a bow at the toe. The sporty language is cut to one tonal panel line."),
      ("also tbh i do like a worn in look but i do like how new shoes look neat and clean hahaha",
       "The worn-in finish is gone. I had read her kept old shoes as wanting the wear printed in. She would rather the shoe start clean and earn it."),
      ("i don&rsquo;t really have one but you can do a cream/off white so it goes w many things",
       "Beige, bone and burnt-orange out. Cream and off-white in. One quiet colour does more work than a two-tone scheme.")]
fbc = "".join(f'<div class="card" style="padding:17px 19px;margin-bottom:13px"><p class="mb" style="font-size:13.5px;line-height:1.38;color:#000;margin-bottom:9px">&ldquo;{q}&rdquo;</p><div style="display:grid;grid-template-columns:58px 1fr;gap:8px"><span class="lbl" style="font-size:7px;color:#9a9a9a;padding-top:2px">Changed</span><p style="font-size:12px;line-height:1.5;color:#3a3a3a">{a}</p></div></div>' for q,a in FB)
def ver(tag,label,src,cap):
    return (f'<div style="display:flex;flex-direction:column;gap:10px"><div class="step">{chip(tag)}<span class="lbl">{label}</span></div>'
            f'<div class="hair frame" style="padding:8px"><img src="{src}" style="width:100%;{SK}" alt="{label}"></div>'
            f'<p style="font-size:11.5px;line-height:1.5;color:#6b6b6b">{cap}</p></div>')
cocreate = f"""<div class="slide">
  <h1><span class="mt">5 &nbsp;What Shaina</span> <span class="mb">changed</span></h1>
  <p class="sub">Her feedback on the original, quoted from her messages, and what each note changed in the redesign.</p>
  <div style="display:grid;grid-template-columns:330px 1fr 330px;gap:28px;margin-top:22px;flex:1;min-height:0">
    {ver("V1","Original",V1,"Ballet-flat and sneaker hybrid. Elastic straps, mesh and suede, padded collar, worn-in finish, beige and burnt-orange.")}
    <div><h2>What she told me to change</h2>{fbc}</div>
    {ver("V2","Co-created redesign",V2,"A true ballet flat. Bow at the toe, gathered topline, one reduced panel, a stacked water-resistant sole, and her name on the footbed where only she sees it.")}
  </div>
  <div class="ink band" style="margin-top:12px"><span class="mb" style="font-size:12.5px">Version 1 was my reading of Shaina. Version 2 is the part she corrected</span></div>
</div>"""

# 7 · ANNOTATION
def row(lab,txt,dark=False):
    return (f'<div style="display:grid;grid-template-columns:54px 1fr;gap:7px;margin-bottom:5px"><span class="lbl" style="font-size:6.6px;color:{"#000" if dark else "#9a9a9a"};padding-top:1px">{lab}</span>'
            f'<p style="font-size:9.6px;line-height:1.4;color:#3a3a3a">{txt}</p></div>')
def co(n,t,f,e,b):
    return (f'<div class="card" style="padding:11px 13px;flex:1"><div class="step" style="margin-bottom:7px">{chip(n)}<span class="mb" style="font-size:10.8px;line-height:1.2;color:#000">{t}</span></div>'
            + row("Function",f) + row("Emotion",f"<i>{e}</i>") + row("Why better",b,True) + "</div>")
L = (co("1","Ballet-flat last, bow at the toe","Slips on without laces, in a flat silhouette rather than a sneaker shell.","Put together rather than sporty, which is how she said she wants to look.","Version 1 was a hybrid trainer. She asked for sleek and feminine, so the sneaker shell came off.")
   + co("2","Cream and off-white colourway","One tonal colour across upper, panel and sole.","A shoe she never has to think about in the morning.","Burnt-orange was my guess. She named cream herself, so the colour is her decision now.")
   + co("3","Reduced quarter panel","Reinforcement across the flex zone, where a flat creases first.","Reads as structure, not branding.","Cut to one tonal line. Closest to the sporty note she flagged, so it is first to test with her."))
R = (co("4","Stacked, water-resistant sole","Subtle lift off wet ground, with grip for city walking.","Ends the half of the year her favourite shoe sits in the cupboard.","The one problem she could not solve herself. Her flats are summer-only; this makes them February shoes.")
   + co("5","Gathered elastic topline","Adjustable hold so the flat does not loosen with wear.","Fits without fuss, which matters to someone optimising her day.","Slimmer than Version 1's padded collar, so the polished line she asked for survives.")
   + co("6","Her name on the footbed","The mark sits inside the shoe, hidden once it is on.","A private reminder, not an announcement.","Version 1 put a symbol on the heel. She does not want distractions, so it moved inside."))
annot = f"""<div class="slide">
  <h1><span class="mt">6 &nbsp;The co-created design,</span> <span class="mb">annotated</span></h1>
  <p class="sub">Function, emotional value, and why each part is better for Shaina than the version she sent back</p>
  <div style="display:grid;grid-template-columns:292px 1fr 292px;gap:16px;margin-top:18px;flex:1;min-height:0">
    <div style="display:flex;flex-direction:column;gap:10px">{L}</div>
    <div class="hair frame"><img src="{V2BIG}" style="{SK}" alt="Shaina NYC ballet flat"></div>
    <div style="display:flex;flex-direction:column;gap:10px">{R}</div>
  </div>
  <div class="ink band" style="margin-top:14px"><span class="mb" style="font-size:12.5px">The shoe must let Shaina stay polished and stay out, in the same pair, in February</span></div>
</div>"""

html = f"<!doctype html><html><head><meta charset='utf-8'><title>Shaina Shoe Redesign</title><style>{CSS}</style></head><body>{cover}{persona}{mine}{ai}{choice}{cocreate}{annot}</body></html>"
assert "mdash" not in html and "—" not in html, "em dash leaked"
assert "gradient" not in html and "box-shadow" not in html
(D/"deck.html").write_text(html, encoding="utf-8")
print("deck.html", len(html)//1024, "KB, 7 slides")
