/* data.js: a stand-in for everything the search would read. Each item has
   a source (doc, mail, meeting, file, tab), a title, people, a date, and
   text. The text is what the search matches on and what the snippet is cut
   from. Replace this with real connectors later; the page does not care
   where items come from. Dates are relative to "today" so the time words
   (yesterday, last week) keep working. */
const DAY = 86400000, NOW = Date.now();
const ago = (d, h = 10) => new Date(NOW - d * DAY - (24 - h) * 3600000 + 12 * 3600000);
window.ITEMS = [
  // docs
  { source: 'doc', app: 'Google Docs', title: 'WDL landing: white ground, one accent', people: ['Anthony Fox'], date: ago(2), text: 'Decisions locked: white ground, periwinkle #4c5be4 the only accent, Montserrat headings at 400, Inter Tight body. To do: trusted brands grid, kill the dot lattice, restore the rail slide.' },
  { source: 'doc', app: 'Google Docs', title: 'Research compendium: ring, Island, voice wearables', people: [], date: ago(21), text: 'Everything on ring input, Dynamic Island, Wispr Flow and voice wearables compiled in one doc so nobody reruns the research. Verdict: no ring, not for a physio.' },
  { source: 'doc', app: 'Notion', title: 'Fostr fundraise: five concepts', people: ['Abraham'], date: ago(40), text: 'Social Bricks landing, roots downward vision, #5DA1A1 with Plus Jakarta Sans. Five concept directions for the research phase, two to carry forward.' },
  { source: 'doc', app: 'Google Docs', title: 'Manus AI case study, write-up', people: [], date: ago(3), text: 'Problem: the more powerful Manus got, the more people struggled to use it. The founder believed discoverability would fix it. The redesign made the agent explain itself first.' },
  { source: 'doc', app: 'Pages', title: 'Usability test kit: three concepts', people: ['Priya'], date: ago(12), text: 'The make-or-break study for the beta app. Retention is the goal, the three concepts are Home, Chat and Widgets, method fixes from round one.' },
  // mail
  { source: 'mail', app: 'Gmail', title: 'Re: the landing, trusted brands row', people: ['Anthony Fox'], date: ago(1, 9), text: 'Anthony: loved the white version. Can we do the Ramp-style logo grid next, six columns with hairlines, and the featured card on the right? Also the dots under the hero, can those go.' },
  { source: 'mail', app: 'Gmail', title: 'Return offer', people: ['Manus recruiting'], date: ago(6), text: 'Attached is your return offer letter. Please confirm by the 24th. We are excited about the design engineering work this summer.' },
  { source: 'mail', app: 'Gmail', title: 'PSYC 2270 problem set 4 feedback', people: ['Prof. Shadlen TA'], date: ago(4), text: 'Your drift diffusion write-up was strong. Cite Kiani and Shadlen 2009 directly on the confidence point, and the Mark 2005 paper for the attention claim.' },
  { source: 'mail', app: 'Gmail', title: 'Fostr: push access and the case ledger', people: ['Abraham'], date: ago(9), text: 'Gave you push on the Fostr repo. Local run is make dev, CORS on 3001 is a known gotcha. The case ledger prototypes are in prototypes/.' },
  { source: 'mail', app: 'Gmail', title: 'Invite: review the Manus deck', people: ['Anthony Fox'], date: ago(0, 11), text: 'You have been added as a collaborator on jazlynnkurni/manus-doordash-deck. Make edits on a branch and open a pull request.' },
  // meetings
  { source: 'meeting', app: 'Zoom', title: 'WDL weekly with Anthony', people: ['Anthony Fox'], date: ago(1, 15), text: 'Transcript: Anthony asked about the footer and the trusted brands grid. Agreed the rail gets a small slide back for feel, not clearance. He will send the client logos as SVG by Thursday.' },
  { source: 'meeting', app: 'Zoom', title: 'Clover HUD review', people: ['Charlie', 'Alice'], date: ago(5, 14), text: 'Transcript: the six frames every scenario is built from, twelve scenarios, three dictation timers. Decision: home by default, resume earned by a running task, 40 second window.' },
  { source: 'meeting', app: 'Google Meet', title: 'Senior seminar check-in', people: ['Prof. Marcus'], date: ago(8), text: 'Transcript: the essay should foreground the interface argument. Written register is not the spoken one. Due the week after next.' },
  { source: 'meeting', app: 'Zoom', title: 'Fostr caseworker interview 3', people: ['Dana (caseworker)'], date: ago(16), text: 'Transcript: she keeps candid notes she would never sign and a second set she would. The AI should route, not author. Honest filed and staged receipts.' },
  // files
  { source: 'file', app: 'Finder', title: 'Manus-case-study.pdf', people: [], date: ago(3), text: 'The deck exported as PDF, 14 slides, speaker notes separate. In Desktop/doordash-case.' },
  { source: 'file', app: 'Finder', title: 'Return_Offer_Jazlynn_Kurniandra.pdf', people: ['Manus recruiting'], date: ago(6), text: 'Offer letter PDF on the Desktop.' },
  { source: 'file', app: 'Figma', title: 'Clover liquid glass lab', people: [], date: ago(30), text: 'Five glass vibes and a font switcher. Onest decided from the X inspo reel, supersedes Inter and Ginto for the redesign.' },
  { source: 'file', app: 'Finder', title: 'seethis.JPG', people: [], date: ago(2), text: 'The rednote May calendar: a lidded pot of chestnuts drawn as frosted porcelain on cream. Reference for the porcelain lab.' },
  { source: 'file', app: 'Blender', title: 'porcelain-lab/scenes/01_pot.py', people: [], date: ago(2), text: 'The bowl, the floating lid, the black curled handle. Transmission 0.92 at high roughness, emissive contents, three area lights.' },
  // tabs
  { source: 'tab', app: 'Dia', title: 'portfolio-experiments.vercel.app/sandbox', people: [], date: ago(0, 13), text: 'The sandbox: Porcelain, Out of Office, Billiards, Tin toggle, Bubbles, Soft, Mahjong run, Track record and the rest.' },
  { source: 'tab', app: 'Dia', title: 'github.com/jazlynnkurni/labs', people: [], date: ago(0, 12), text: 'Personal prototypes: bubbles, ink lab, cloth clock, vellum discs, rosette, walk lab, tp lab, porcelain lab, menu lab.' },
  { source: 'tab', app: 'Dia', title: 'Winter, Biomechanics and Motor Control of Human Movement', people: [], date: ago(2), text: 'Gait curves: hip, knee and ankle angles over the cycle, heel strike to toe off, the data under the walking man.' },
  { source: 'tab', app: 'Dia', title: 'Valmet: micro embossing and nested two-ply', people: [], date: ago(2), text: 'Thirty to eighty emboss elements per square centimetre on bath tissue, nested embossing for the quilted look.' },
];
/* who is who, so a first name finds the person */
window.PEOPLE = { anthony: 'Anthony Fox', abraham: 'Abraham', priya: 'Priya', charlie: 'Charlie', alice: 'Alice', dana: 'Dana (caseworker)', marcus: 'Prof. Marcus', shadlen: 'Prof. Shadlen TA' };
