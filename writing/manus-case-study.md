# Manus AI community redesign

*Case study text in the structure of Bella Rinne's New York Times onboarding case study. Section labels, headlines and body follow her moves one for one. Image slots name the file in the deck repo (assets/manus) where one exists.*

---

Summary

## Redesigning the Manus AI community so new users stay.

The community redesign gave the Manus community a front door. New users had been landing on an archive of past events and leaving within seconds, with the products listed only as names in the footer. Users arrive during high-traffic moments, a hackathon or a product launch, and they stay because of **an AI-guided path ranked by fit**, **a reason attached to every recommendation**, and **one dashboard that holds their role, events and contributions**.

I conceptualised, researched, designed and shipped the community dashboard and its AI-guided paths as the sole designer, through 13 interviews, three rounds of usability testing and two research-led pivots. **Retention rose from 30% to 65 to 70%** among internal testers once the AI-guided architecture was rolled out to them, time on site rose 2.1 times, and 80% reported more clarity on where to start and how to contribute. The redesign is approved and in production ahead of public launch.

*INSERT HERO VIDEO HERE: manus-hero.mp4, the shipped community page in a laptop frame*

---

Context

## Manus was shipping capabilities faster than its users could learn them, and the only teaching channel was a notification badge.

During the 1.5 Max launch, which brought a Figma MCP connector and personalised GenAI customisation, the founder's bet was that user-generated video would spread education. The videos drew views and downloads. The share of users who went on to use the capability a video demonstrated stayed low.

Through the winter, people were messaging me on LinkedIn two or three times a week asking how to get involved with Manus. The community page was where they landed, and it was converting almost none of them. That was where I found my task.

*INSERT IMAGE HERE: a cropped grid of the LinkedIn messages, names blurred*

---

Opportunity

## Capitalising on high traffic from the 1.5 Max launch and the Meta acquisition to capture a new user's interest in capabilities, roles and ways to contribute, and continuously serving them the next step that suits their needs.

Engagement does not signal learning, so in November 2025 I measured the gap directly.

Featured-Capability Activation Rate = users who used the capability the video demonstrated ÷ users who downloaded after watching that video

Three sources fed it: UGC platform data with each video tagged by the capability it featured, attribution data tying each download to the video that drove it, and in-app events showing whether that user then used the capability and how soon.

High views, **low activation**. UGC was spreading awareness rather than understanding, so I went looking for the surface at Manus that already had real engagement. The community page had it: high discoverability, low conversion.

We anticipated an influx of curious users registering and reaching out in the weeks around the launch and the acquisition news, and planned to meet these new users where they were, by both positioning the community page as the place to see what Manus can do, while also exposing them to roles and events they could join to sustain engagement. We will collect signals about **what each user does and wants to build** so we can act beyond this launch cycle without appearing to miss this unique moment.

*INSERT IMAGE HERE: old-community.png, the community page before the redesign, with the three funnel callouts: click-through high, retention low, conversion flat*

---

Discovery

## What are new users actually failing at?

I ran 13 user interviews and a competitive audit to get a better understanding of how newcomers and power users experienced the community page and what Manus could do for them. This research offered insights into what we should consider in our initial designs.

☞ New users... **cannot tell what Manus can do for them, so they do not know where to begin.**

- Non-technical newcomers could not identify what Manus could do for them. The six products appeared only as names in the footer, with nothing showing what any of them does. *Newcomer interviews, 5 of 13, ages 22 to 35*
- "I've been using Manus for weeks, but sometimes I can't keep up with the constant upgrades like its 1.5 Max series. The community doesn't help with that at all, it's just a list of past events." *Manus user interviewee*
- "I opened the community page and just didn't know what I was supposed to do. There's no indication of where to start or what counts as participating." *Manus community member*

☞ Power users... **want to contribute but have no pathway and no signal that their work is seen.**

- They have no structured way to share what they build and want visibility and credibility for it. Without a route in, they stay passive. *Power user interviews, 8 of 13, ages 25 to 40+*
- "I want to contribute and share what I've built, but I have no idea if anyone will see it or if it even matters. There's no feedback, no signal that my work is visible." *Manus community member*

☞ Across the market, no community... **is both fast to update and built for lasting contribution.**

- Forums and docs are searchable but slow and quiet. Chat communities are fast but scattered. Gamified platforms reward activity over impact. *Competitive audit*
- That gap became our two design questions. How might we make AI capabilities legible to everyday users? How might we turn passive members into active contributors? *Design questions*

*INSERT DIAGRAM HERE: the competitive audit 2x2, slow to fast on one axis, fleeting to lasting on the other, with the Manus gap marked*

---

Deliverables

## So, how do we create a community that shows new users what Manus can do and gives them a way in?

We proposed a new **community dashboard** that holds a user's role, active path, upcoming events and pending contributions in one place. That role is reflected in an **AI-guided path**, a continuous guidance layer that infers each user's role, focus area and mode from what they do and recommends a next step with a reason.

The path also houses **role-agnostic recommendations** ranked by fit, so hackathons, ambassador programmes and campus leadership surface at login without a redesign each time a role is added. There is a clear connection between the dashboard and the events calendar, encouraging users to make a first contribution rather than browse an archive.

*INSERT DIAGRAM HERE: journey-flow.png, the user flow from login through role inference to first contribution*

I mapped the journey with the product manager and the engineers so that every opportunity the AI surfaces has an owner and an API behind it. All paths lead back to a first meaningful contribution.

---

Community Solution

## Anticipating user behaviours and designing to meet their needs.

Based on our research of anticipated user behaviour, I organised my designs according to three core pillars of an effective community: Legibility on Arrival, Guidance over Game Mechanics, and A Reason on Every Pick.

**Legibility on Arrival**
Non-technical users could not identify what Manus could do for them from a list of names. Let us show each capability doing something on the first screen, before asking the user for anything.

**Guidance over Game Mechanics**
While our users wanted a way in, they did not want a second system to decode. Points and levels add cognitive load on top of the product. A guided next step removes it.

**A Reason on Every Pick**
An unexplained AI suggestion is a guess with confidence. Every recommendation carries a "why this matters" so users can see the fit and trust the ranking, and so they can tell us when it is wrong.

---

Community Solution // Design Iterations

## A home page that tells new users what Manus can do and where to begin.

There were plenty of design routes to take for this page. After my exploration, I realised there was not a clear solution; we could either motivate people to engage through rewards and progression, or simplify the page down to a clear static overview of the products and the ways to take part.

*INSERT IMAGE HERE: gamified-prototype.png*

Very first iteration, built in Lovable for rapid feedback. I explored engagement through points, levels, quests and role progression, modelled on the Claude Code community.

*INSERT IMAGE HERE: whiteboard-crop.png, the four low-fidelity sketches*

My early iterations then moved to a static structure: an AI search bar to promote the product, explore and event calls to action, a role status page after login, and manual event uploads through Luma so engineering could launch reliably. Four sketches on a whiteboard became the second direction.

---

Community // User Research

## Testing two extreme designs, and finding the answer somewhere in the middle.

Our interviews were not enough to be confident about a design direction, **so we ran usability testing on both extremes** to explore our options, with qualitative data to support our final decision.

The goal of this testing was to compare two strategies for holding a new user. Participants reacted to two prototypes, one that motivated through game mechanics and one that clarified through a clean static structure, with the static version launched internally and tested at six breakpoints.

*INSERT IMAGE HERE: gamified-prototype.png*

**Gamified Community:**
This is the motivation extreme. Points, levels, quests and role progression reward activity, and the page is organised around what a user has earned rather than what Manus can do.

*INSERT IMAGE HERE: static-page-full.png*

**Static Community:**
This is the clarity extreme. The products are made legible on arrival, with a role selector, three feature cards, an AI search bar, a hackathon countdown and a global distribution map. Nothing is personalised.

---

Community // Research Findings

## Participants rejected both extremes, for opposite reasons.

The conclusion of our research was that users found the gamified version overwhelming and could not say what any of it was for, while the static version was clear at first glance and still lost seven of ten users within minutes.

Explore the drop-downs below for some key findings:

**Finding 1: Gamification is Overwhelming**
Testers of the gamified prototype reported confusion about getting around the page and described the experience as cognitively overwhelming. Rewards had added a second thing to understand on top of the product itself.

**Finding 2: Mechanics Had No Visible Purpose**
Testers were unclear what the game mechanics were for and how role progression worked. Motivation turned out to be the wrong problem. Understanding was the problem.

**Finding 3: Static is Clear but Inert**
Seven out of ten users disengaged quickly from the static version. They spent little time on the role selector and the three feature cards, the elements we had designed most carefully.

**Finding 4: Motion Reads as Life**
Users lingered on the hackathon countdown and the global distribution map, the only two elements on the page that moved. They were scanning for evidence the place was alive.

**Finding 5: Relevance Holds Attention**
When we put an AI-guided path in front of the same users, it won on click-through against the static page. Users were drawn to interactivity that felt current and personally about them.

---

Community // More Explorations

## Based on this feedback, I needed to explore a guided approach to the community.

**I needed to find a design that felt alive and personally relevant on arrival, but still gave users a clear, low-effort way to take part.** My first line of thinking was to keep the roles visible, but let the AI pick the path for each user so people do not have to decode nine roles before they start.

I explored the recommendation cards in three rounds, each one answering a problem the previous round created.

*INSERT IMAGE HERE: the Choose Your Path role grid from slide 15, nine roles*

**Iteration 1: Choose Your Path**

Pros:
- Shows every way in at once
- Names the roles explicitly, so power users can find theirs
- Keeps role selection as a visible, deliberate step

Cons:
- Nine choices on arrival, the same overload we had just removed
- Users must already know what a role means to pick it
- In testing, the role selector was where users spent the least time

*INSERT IMAGE HERE: hackathon-card-before.png, the fixed three-card layout*

**Iteration 2: Fixed Three-Card Recommendations**

Pros:
- Won on click-through against the static version
- One card per opportunity is easy to scan
- Each card carries a reason, which users cited as why they stayed

Cons:
- One new role breaks the layout
- Every added role needs a manual design update
- My PM mentioned more roles were coming, which made this a maintenance cost disguised as a design

*INSERT IMAGE HERE: hackathon-card-after.png, the role-agnostic template with Open Builder, Ambassador, Campus Leader and Regional Hub*

**Iteration 3: Role-Agnostic Template**

Pros:
- New roles slot in without a redesign
- The same card works for Open Builder, Ambassador, Campus Leader and Regional Hub
- Every card keeps its "why this matters" line

Cons:
- I gave up precise control of a layout that had already tested well
- The cards depend on the inference layer getting the role right
- Only the hackathon card shipped; the other three are illustrative

---

Community // Final Design

## The final design was a single dashboard with an AI-guided path and role-agnostic recommendations.

I was able to find a solution that satisfied the wants of our users: the final design holds a user's role, active path, upcoming events and pending contributions in one place, with reminders surfacing when something needs attention. Each path is ranked by fit to the user, and every pick says why.

The recommendations also follow a role-agnostic template, so the AI can surface hackathons, ambassador programmes and campus leadership at login, including roles that do not exist yet. This pushes guidance across the community rather than into one feature, and unites the dashboard, the paths and the events under one home.

In sum, this design is legible and alive, and gives the user a clear next step toward contributing without asking them to decode a system first.

*INSERT VIDEO HERE: manus-solution-1-dashboard.mp4, the dashboard in a laptop frame*

**Final Community Dashboard**
- Role, path, events and contributions sit in one place, with reminders when something needs attention
- "Recommended this week" is prioritised by fit, not engagement, with a reason on every pick
- New roles appear through the same card without a redesign

---

Your Path Solution

## Creating a guided path where users see their role reflected back to them.

While the dashboard is invaluable for giving users one home, it is just as important for us to continuously serve them the right next step, meaning a newcomer should always see one thing worth doing, and a power user should always see where their work goes. The next step, then, was to facilitate stakeholder sessions involving engineering, the community and go-to-market team, and the product managers. There, we mapped what each team wanted and what worried them.

Due to launch timing, we ideated across surfaces we could ship reliably. We eliminated ideas that depended on scraping events from third parties or on fragile automation.

This led us to the AI-guided path as the surface where we could test our guidance hypothesis.

*INSERT IMAGE HERE: the stakeholder map from slide 17, redrawn: Engineering, Community and GTM, Product Manager, each with Wanted and Concerns*

---

Your Path // Design Decisions

## Why an AI-guided path?

- ✓ Won on click-through against the static page in our third round of usability testing.
- ✓ Every recommendation has an owner and an API, so the community team can ship it without scraping Luma or any third party.

And in the third round, our static page...

1. Lost seven out of ten users quickly
   - They spent little time on the role selector and the three feature cards
2. Held users on exactly two elements
   - The live countdown and the pulsing map, the only two things on the page that moved

The original static design organised the page around products and roles, as well as entry points for events through Luma.

We gauged user feedback on different versions of the path, and learned that users consistently went to whatever felt current and about them. We needed every element on the page to be one of those two things.

> "I opened the community page and just didn't know what I was supposed to do. There's no indication of where to start or what counts as participating."
> Manus community member

> "I want to contribute and share what I've built, but I have no idea if anyone will see it or if it even matters. There's no feedback, no signal that my work is visible."
> Manus community member

**What we decided**
- Event hosting: an explicit "Host an Event" button and a manual submission flow. Consent is clear and nothing is scraped from third parties.
- Role architecture: modular components let roles be added or removed without a redesign.

*INSERT VIDEO HERE: ship-paths.png or pivot-walkthrough.mp4, the Your Path screen in a laptop frame*

**Final Your Path Design**
- The AI infers each user's role, focus area and mode from what they do
- "Recommended this week" is ranked by fit, with "why this matters" on every pick
- Users can move between Dashboard, Your Path and Recommendations with tabs

---

Strategy Execution

## Gathering signals on what each user does at login, and using them to route newcomers to a first step and power users to a place to be seen.

With the public launch of this new community architecture, we hope to learn the following:

1. What impact does inferring role, focus and mode from behaviour, rather than asking users to pick a role, have on retention?
2. Does attaching a reason to every recommendation improve clarity on where to start and how to contribute?
3. Does a role-agnostic template hold up as the community adds roles that did not exist at launch?

*INSERT VIDEO HERE: manus-interaction-walkthrough.mp4*

Final flow of login, role inference and the corresponding recommendations appearing in Your Path.

---

Success Metrics

## We hypothesised this work would increase clarity and drive retention.

Users will have a clearer picture of what Manus can do for them while also being shown a next step that matches what they have already done. Here is how we will know if our hypothesis is correct:

**Success Metrics for Newcomers:**
We will see an increase in...
- Retention (primary metric)
- Time on site
- Paths started in the first session
- Self-reported clarity on where to start

**Success Metrics for Power Users:**
We will also see an increase in...
- Contributions submitted
- Events hosted through "Host an Event"
- Return visits
- Self-reported relevance of recommendations

**What we saw in internal testing**
- Retention rose from 30% to 65 to 70%
- Time on site rose 2.1 times
- 80% reported more clarity on where to start and how to contribute
- 75% described it as more personally relevant than the static version

*Live data from internal testing users at Manus after the AI-guided architecture was rolled out to them. The redesign is approved and in production, and has not yet launched publicly.*

---

Future of the Community

## How can we scale this work across Manus?

Once the redesign ships publicly and we learn from real traffic, we can invest more in expanding the guidance layer. A few examples of additional concepts we could explore validation for include but are not limited to...

- Lightweight feedback on every pick, a thumbs up or down, so the AI's decisions become more transparent and correctable
- Tracking days from joining to first meaningful action, a better measure of real contribution than time on site
- Surfacing roles at login that do not exist yet, so the community can grow without a redesign
- Finishing development and public launch, including the illustrative cards beyond the hackathon

*INSERT IMAGE HERE: the concept mockups from slide 23, the "Useful pick?" control and the time-to-first-action chart*

---

## Thanks for reading!
## Any questions? Email me.

Back to Case Studies
