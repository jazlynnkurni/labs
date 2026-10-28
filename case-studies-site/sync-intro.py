#!/usr/bin/env python3
"""Copy the intro deck (labs/intro-lab/slides.html) into the site as clover/intro, the opening of the Eden story.
Run from anywhere: python3 sync-intro.py. Then `vercel deploy --prod --yes` from case-studies-site."""
import os, subprocess, pathlib
SRC=pathlib.Path.home()/'Desktop/labs/intro-lab'; DST=pathlib.Path(__file__).parent/'clover/intro'
DST.mkdir(parents=True, exist_ok=True)
s=(SRC/'slides.html').read_text()
s=s.replace('<title>intro · slides</title>','<meta name="next-deck" content="../deck.html?intro=1"><link rel="prefetch" href="../deck.html">\n<title>Eden · Jazlynn Kurniandra</title>',1)
s=s.replace('<div class="top"><a href="./">intro lab</a><span>/</span><b>slides</b></div>','<div class="top" style="display:none"></div>',1)   # no crumb over the slides on the site
s=s.replace('<div class="hint">','<div class="hint" style="display:none">',1)
s='<base href="/clover/intro/">\n'+s          # first thing in the file, so every relative URL after it resolves to this folder
(DST/'index.html').write_text(s)
(DST/'common.css').write_text((SRC/'common.css').read_text())
UNUSED=['about/','pics/art4.jpg','pics/c1.jpg','pics/c2.jpg','pics/c3.jpg','pics/c5.jpg','pics/case-eden*.png','pics/lab-*.png','pics/portrait.jpg','pics/slide3.jpg',
        'marks/conduit-mark.png','marks/halodoc-mark.png','marks/manus-mark.svg','marks/second-self.svg','marks/somiacx-mark.png','.DS_Store','/flip.css','/flip.html','/flip.js']
cmd=['rsync','-a','--delete']+sum([['--exclude',u] for u in UNUSED],[])+[str(SRC/'aster')+'/',str(DST/'aster')+'/']
subprocess.run(cmd,check=True)
for must in ('aster/flip/flip.css','aster/flip/flip.js','aster/riso-gl.js','aster/sheets-gl.js','common.css'):
    assert (DST/must).exists(), must
print('synced', sum(1 for _ in DST.rglob('*') if _.is_file()), 'files into', DST)
