Discovery

# What are new users actually failing at?

I ran 13 user interviews and a competitive audit to get a better understanding of how newcomers and power users experienced the community page and what Manus could do for them. This research offered insights into what we should consider in our initial designs, and it later explained why our first one failed.

---

☞ New users... **cannot tell what Manus can do for them, so they do not know where to begin.**

- Non-technical newcomers could not identify what Manus could do for them. The six products appeared only as names in the footer, with nothing showing what any of them does. *Newcomer interviews, 5 of 13, ages 22 to 35*
- "I've been using Manus for weeks, but sometimes I can't keep up with the constant upgrades like its 1.5 Max series. The community doesn't help with that at all, it's just a list of past events." *Manus user interviewee*
- "I opened the community page and just didn't know what I was supposed to do. There's no indication of where to start or what counts as participating." *Manus community member*

---

☞ Power users... **want to contribute but have no pathway and no signal that their work is seen.**

- They have no structured way to share what they build and want visibility and credibility for it. Without a route in, they stay passive. *Power user interviews, 8 of 13, ages 25 to 40+*
- "I want to contribute and share what I've built, but I have no idea if anyone will see it or if it even matters. There's no feedback, no signal that my work is visible." *Manus community member*

---

☞ Across the market, no community... **is both fast to update and built for lasting contribution.**

- Forums and docs are searchable but slow and quiet. Chat communities are fast but scattered. Gamified platforms reward activity over impact. *Competitive audit*
- That gap became our two design questions. How might we make AI capabilities legible to everyday users? How might we turn passive members into active contributors? *Design questions*

---
---

Iteration one

# Would rewards get people to engage?

Before the interviews were complete, we had already built the wrong thing. Our first assumption was that the community had a motivation problem, so the first prototype borrowed the shape of the Claude Code community: points, levels, quests and role progression. I built it in Lovable so we could put it in front of users within days.

*[image: the gamified prototype]*

---

☞ We assumed new users... **would engage if the community rewarded activity.**

- The hypothesis: if we add points, levels and quests, then people will engage with the community. *Design hypothesis, attempt one*
- Testers reported confusion about getting around the page, about what the mechanics were for, and about how role progression worked. *Usability testing, round one, gamified prototype*
- They described the experience as cognitively overwhelming. Rewards had added a second thing to understand on top of the product itself. *Usability testing, round one, gamified prototype*

---

☞ What changed... **motivation was the wrong problem. Understanding was the problem.**

- The interview findings explained the failure. Users were not failing to engage. They were failing to understand. We dropped the game and designed for clarity instead. *Pivot one*

---
---

Iteration two

# Would a clearer, calmer page be enough?

The second assumption was that a clean static community, with the products made legible on arrival and clear calls to action, would hold people. From four low-fidelity prototypes I specced a static version at six breakpoints, with an AI search bar, explore and event buttons, and a role selector. Event uploads stayed manual through Luma so engineering could launch reliably. We launched it internally and ran a third round of usability testing.

*[image: the static community page, with the heat map overlay]*

---

☞ We assumed new users... **needed a clearer page. Seven of ten still left.**

- Seven out of ten users disengaged quickly. The failure was not the surprise. Where they lingered was. *Usability testing, round three, static version*
- They spent little time on the role selector and the three feature cards, the elements we had designed most carefully. *Usability testing, round three, static version*
- They spent far more time on the hackathon countdown and the global distribution map, the only two elements on the page that moved. They were scanning for evidence the place was alive. *Usability testing, round three, static version*

---

☞ What changed... **the structure had to change, and the interactions had to feel alive and personally relevant.**

- The information architecture needed realignment, and users were drawn to interactivity that felt current and about them. That finding set the goal for the AI-guided path, which went on to win on click-through. *Pivot two*
