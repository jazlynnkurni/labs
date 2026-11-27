import html as _h
import re as _re
# The Eden CPT deck: every word on the slides and every speaker note lives in this file.
# Text is verbatim from the writer (eden-cpt-deck-text.md). Lines in [square brackets] are placeholders for
# Jaz's own words; they show on the slide exactly as bracketed, in a muted ink, until she sends them.
# Exec'd by build.py after its helpers. Edit here, then run: python3 build.py
#
# Layout forms are the Clover deck's own (clover-doordash-deck/deck/slides_v6.py):
#   cover      Clover slide 1 (the cover)
#   ea3        Clover slide 3 "What Eden asked." (media left, bullets right, hairlines between)
#   ea3 ed4c   Clover slide 4 "What I discovered." (two photos)
#   ea3 ed5    Clover slide 5 "How I answered." (stacked 3:2 photos)
#   ph31       Clover slides 31 to 33 "Round 1/2/3" (iPhone left, title and bullets right)
#   pr38       Clover slide 38's photo pile, here in the ea3 media column
#   sh60       Clover chapter divider (arrives on the disc roll)
#   ea3 solo   Clover's ea3 bullet list without the media column (text only slides)

CHAPTERS[:] = [('Eden', 2), ('The work', 5), ('Readings', 7), ('Takeaways', 9)]
FOOT_T = ''

def t(x):
    """escape the writer's text as is (apostrophes and quotation marks kept), and mute [placeholders]"""
    return _re.sub(r'\[[^\]]*\]', lambda m: f'<span class="phd">{m.group(0)}</span>', _h.escape(x, quote=False))

def ul(items, cls='ea3t'):
    return f'<ul class="{cls}">' + ''.join(f'<li>{t(x)}</li>' for x in items) + '</ul>'

def vid(name, cls='', alt=''):
    return (f'<video class="{cls}" muted loop autoplay playsinline poster="vid/{name}.jpg" aria-label="{alt}">'
            f'<source src="vid/{name}.webm" type="video/webm"><source src="vid/{name}.mp4" type="video/mp4"></video>')

def shot(k, src, alt, extra=''):
    return f'<div class="shot4 {k}{extra}"><img src="img/{src}" alt="{alt}"></div>'

def phone(name, ar, alt):
    return (f'<div class="ip31" style="--ar:{ar}"><i class="bt31 a1"></i><i class="bt31 a2"></i><i class="bt31 a3"></i><i class="bt31 pw"></i>'
            f'<div class="scr31">{vid(name, alt=alt)}</div></div>')

S = []

# 1. Cover (Clover cover: the HUD over a real window, the iPhone garden)
S.append(slide(1, '', f'''<div class="cover">
<p class="c-brand"><img class="c-mark" src="img/clover-mark.png" alt="">Eden</p>
<div class="cv-l">
<h1>Building a quiet assistant <em class="hl">at Eden</em></h1>
<p class="cv-by">{t("My internship at Eden, June to October 2026")}</p></div>
<div class="cv-r cv2"><div class="frame">{vid("hudwindow", alt="The Clover HUD tested over a real window view")}</div><div class="cph">{vid("garden", alt="The Clover iPhone app")}</div></div>
</div>''', cover=True,
    notes=t("I spent June to October 2026 at Eden, a smart glasses startup, working between San Francisco and New York. This is the story of building an assistant that had to learn when to stay quiet.")))

# 2. About me (pans right into 3 along the green rule, as Clover 3 to 4)
S.append(slide(2, hl('A little', 'about me'), f'''<div class="ea3 ed4 ed5">
<div class="ea3i ed4i bagel"><div class="ph2" data-src="img/bagels.jpg" data-w="348" data-h="348" role="img" aria-label="Me eating a bagel" style="width:340px;height:340px;flex:none;--r:-2deg"></div></div>
{ul(["I am from Jakarta, Indonesia, and a senior at Columbia",
     "I study how people think and how they use technology",
     "I am in the US on a student visa",
     "The founders reached out to me for this internship"])}
</div>''',
    notes=t("My degree is Cognitive Science, with a focus on how people use technology.")))

# 3. What Eden is (CPT deck: discovered-0069)
S.append(slide(3, hl('Eden makes glasses', 'with a tiny screen inside'), f'''<div class="ea3 ed4 ed4c">
<div class="ea3i ed4i">{shot("s1", "discovered-0069.jpg", "The HUD seen through the Eden glasses")}{shot("s2", "discovered-0076.jpg", "The Eden glasses in hand")}</div>
{ul(["A small green screen floats in front of one eye",
     "You speak to it, and it answers in one short line",
     "The glasses have no camera",
     "The assistant, Clover, lives in the glasses and an iPhone app"])}
</div>''',
    notes=t("The idea behind Eden is help that arrives before you ask for it. Each answer is one short line, so a glance is enough to read it.")))

# 4. Joined at 0 (Clover's "What Eden asked." app icon)
S.append(slide(4, hl('I joined when', 'nothing existed yet'), f'''<div class="ea3">
<div class="ea3i"><div class="appic"><span class="sq"><img class="s43m" src="img/clover-mark.png" alt=""></span><span class="nm">Clover</span></div></div>
{ul(["I named the company and built the Eden and Clover brand",
     "I explored 36 logo designs before one was chosen",
     "I designed the iPhone app and the rules for the screen",
     "I built working test versions for the engineers and the manufacturer"])}
</div>''',
    notes=t("My title was founding design engineer, or a designer who also writes the code for what she designs. The screen rules decided what Clover shows and, just as much, when it stays quiet.")))

# 5. How the work ran (CPT deck: answered-1740; the whiteboard from CPT slide 3)
S.append(slide(5, hl('Seven stages and', 'two changes of direction'), f'''<div class="ea3 ed4 ed5">
<div class="ea3i ed4i">{shot("s1", "answered-1740.jpg", "The Eden team at work")}{shot("s2", "sketch-whiteboard.jpg", "The whiteboard where the HUD flows were first worked out")}</div>
{ul(["I studied five other smart glasses already out there",
     "I ran 8 test sessions with tech and non-tech people",
     "52 people at the company wore the glasses while I watched",
     "Every week I met engineers, hardware designers, our AI researcher and the founders"])}
</div>''',
    notes=t("Both changes of direction came from testing, which is why testing sits at the centre of this story. The other glasses I studied were Rokid, RayNeo, Even Realities, Google Glass and Meta Ray-Ban.")))

# 6. What shipped (Clover's iPhone form; the garden, the app as it shipped)
S.append(slide(6, hl('What the work', 'left behind'), f'''<div class="ph31"><div class="cover hud6"><div class="cv-r cv2"><div class="frame">{vid("hudwindow", alt="The Clover HUD tested over a real window view")}</div><div class="cph">{vid("garden", alt="The Clover iPhone app")}</div></div></div>
{ul(["Requests went from 6 steps down to 2",
     "67% fewer needless glances at the screen",
     "Screen rules for 69 situations, including when things go wrong",
     "The iPhone app, and the Eden and Clover brand"], "pt31")}</div>''',
    notes=t("This work is now running on the glasses with our manufacturer. The iPhone app can also pass a task to the small bar at the top of the phone's screen.")))

# 7. The two readings (text only)
S.append(slide(7, hl('Two readings about', 'attention and help'), f'''<div class="ea3 solo">
{ul(["2005: researchers watched 24 office workers through their day",
     "57% of their work got interrupted along the way",
     "2024: researchers trained AI to offer help before anyone asks",
     "That paper treats more unasked help as the goal"])}
</div>''',
    fn=t('Mark, Gloria, Victor M. Gonzalez and Justin Harris. "No Task Left Behind? Examining the Nature of Fragmented Work." CHI 2005.') + '<br>'
       + t('Lu, Yaxi, et al. "Proactive Agent: Shifting LLM Agents from Reactive Responses to Active Assistance." arXiv 2410.12361, 2024.'),
    notes=t("Mark, Gonzalez and Harris found that most interrupted work was picked up again the same day, but only after more than two other things. Lu and colleagues, on the other hand, treat help that nobody asked for as something to maximise.")))

# 8. Between the readings (text only)
S.append(slide(8, hl('My work sat between', 'the two readings'), f'''<div class="ea3 solo">
{ul(["Clover is the kind of assistant the 2024 paper wants",
     "My testers were the people the 2005 paper describes",
     "I counted fewer interruptions as success",
     "So my question became how often it should speak up"])}
</div>''',
    notes=t("The 2024 paper counts more offers of help as progress, whereas I counted fewer interruptions. Hence, my question is less whether an assistant can interrupt usefully, and more how often it should.")))

# 9. What I learned (Clover slide 38's photo pile)
S.append(slide(9, hl('What I', 'learned'), f'''<div class="ea3">
<div class="ea3i"><div class="pr pr38">{shot("k1", "answered-1740.jpg", "The Eden team at work")}{shot("k2", "answered-1741.jpg", "The Eden team in the office")}{shot("k3", "answered-1744.jpg", "The Eden team at the Golden Gate Bridge")}{shot("k4", "team-polaroids-3x2.jpg", "Polaroids signed by the Eden team")}</div></div>
{ul(["Staying quiet is a feature in its own right",
     "Testing is noisy, so pick one main number to judge by",
     "Changes of direction were the best part of the work",
     "Share work early, since everyone moves faster seeing the same thing"])}
</div>''',
    notes=t("Each change of direction tested an idea for real, and the best idea was rarely the first one. I also learned to measure what a design costs in attention, as well as whether the task got done.")))

# 10. Internships as an international student (placeholders until Jaz answers; text only)
S.append(slide(10, hl('How Eden changed', 'how I see internships here'), f'''<div class="ea3 solo">
{ul(["Before Eden, I believed companies were lethargic and full of office politics",
     "As an international student, I felt helpless",
     "At Eden, I found that there are kind people out there",
     "Now I have a broader understanding of what it means to be an early career product designer"])}
</div>''',
    notes=t("Coming from Jakarta on a student visa, I still face racism first-hand, and I questioned why I should look for work in a country that does not want me here. Working at Eden showed me that there are kind people out there, so I would tell another international student that if you truly pour passion into what you believe in and the products you craft, your talent will not go unnoticed.")))

# 11. Thank you (Clover chapter divider, arrives on the disc roll)
S.append(slide(11, '', '''<div class="sh60"><span class="no ghost">06</span><h1>Thank you</h1></div>''', cover=True))
