# Columbia Laughs, video iteration 1

Deployment shown in the video (latest commit on main, 46b9812):
https://humor-hello-world-8vaufbu7l-jazkurnz06-7083s-projects.vercel.app
(pinned alias: https://columbia-laughs-week8.vercel.app)

Before recording: restore the Supabase project (dashboard, project pqymmnllzqgctiitzgwz, Restore). Until then /write is a 500 and sign-in fails.

## Submission block (paste as is)

**Video:** [unlisted YouTube URL]

**Vercel:** https://humor-hello-world-8vaufbu7l-jazkurnz06-7083s-projects.vercel.app

**Persona and goal:** Sam, a Columbia junior new to the city, has a setup that made their friends laugh in the dining hall and wants a punchline good enough to post to the group chat tonight. Generic AI jokes do not land, because they are not about Columbia.

**Questions for my PM and group:**
1. Is it clear within the first 30 seconds what Sam wants and why the app, rather than ChatGPT, is the place to get it?
2. Does the before-and-after at [timestamp] actually show that the multi-step chain produces better punchlines, or does it just show that there are two settings?
3. Is the "lol?" voting step readable as rating the media, or does it look like a like button? Should the narration say more there?
4. Pacing: is the sign-in and write section too slow, and should I cut the "write your own joke" part to stay under four minutes?

## Shot list and narration (target 3:45 to 4:15)

Record the desktop browser at 1280 wide, zoom 125 percent so text is readable on YouTube. QuickTime, New Screen Recording, microphone on. Speak as yourself describing Sam, and switch to Sam's voice when you act. Do one clean take, rough edges are allowed.

### 0:00 to 0:35, who Sam is (home page, signed out)

Screen: the home page with the stamp and riso sheets. Do not click yet.

> This is Columbia Laughs, a small app where Columbia students get punchlines for the week's setups and rate each other's jokes. I am going to walk through it as Sam. Sam is a junior, new to New York, lives in the dorms, and spends weekends exploring. Tonight Sam has a setup that got a laugh at dinner, something about the 116th Street gates at 3am, and wants a punchline good enough to post to the group chat. Sam has tried ChatGPT for this, and the jokes come back generic. They are about college, not about Columbia. That is the problem the app is for.

### 0:35 to 1:00, sign in (the venn)

Screen: click Sign in. Drag the sage circle into the plum one, the overlap becomes the Google button, sign in.

> Sign in is a Google account. The login is a venn diagram, you drag one circle into the other and the overlap is the button. Sign-ups are limited to Columbia and Barnard addresses, which keeps the jokes in the room. Gmail is open while the class tests it.

### 1:00 to 2:00, create: the daily setup and Sam's own setup (Write page)

Screen: the Write page. Today's setup is the big heading. Read it out. Click Generate. Wait for the three punchlines. Then click "Use your own setup", type "The 116th Street gates at 3am", Generate again.

> Every day the site gives everyone the same setup, so there is a reason to come back. Today's is [read the heading]. Sam asks for punchlines. The model gets the setup plus a list of Columbia flavour terms, Low Steps, Koronet, the 1 train, and a list of banned ones, so the jokes stay local and stay clean. Three punchlines come back. [Read the best one.] Sam also has their own setup from dinner, so they switch to "your own" and type it. [Read the three.] That one is going in the group chat.

Limitation to say out loud if it happens: the Gemini models rate-limit in the evening. If generation fails, say "the model is overloaded right now, this is a known limit on the free tier" and use the punchlines already on the page.

### 2:00 to 2:30, rate: lol? (same page)

Screen: press "lol?" on one punchline, it becomes "lol" and the count goes up. Press it again to undo, press it once more.

> Rating is one button. "lol?" asks the question, "lol" is the answer, and the count under the card says "3 lols" in words, not just a number. Pressing again takes it back. Everyone signed in can rate, and that is what decides which punchlines rise on the Jokes page.

### 2:30 to 3:30, the improvement: single prompt, then a chain

This is the before-and-after. Two options, pick one when you record.

Option A, live (needs the admin tab open at humor-admin, Prompts):
Screen: switch to the admin Prompts page, show the mix: "Straight to three" at 100 and "Draft, then edit" at 0. Set the mix to 100 on "Draft, then edit". Back on Write, generate once more on the same setup. Put the two sets side by side by scrolling.

> The improvement I want to show is how the punchlines are made. In week four the app sent one prompt to Gemini and showed whatever came back. In week seven I moved generation into the database as prompt chains. A chain is a list of steps, each one a model call, and an admin can change the steps, the flavour terms and the examples without a redeploy. The first chain is the old behaviour, one call, three punchlines. The second drafts six and then a second call keeps the three sharpest and tightens them. Here is the same setup through the second chain. [Read them.] [Say honestly which set is better and why, in one sentence.] Every reply is logged, so when a joke is bad I can see the exact step that produced it.

Option B, no admin tab: say the same thing, and show the "before" as an early-October generation on the Jokes page, next to today's.

### 3:30 to 3:50, PM feedback

> [FILL WITH WHAT ESHA ACTUALLY SAID ABOUT THIS APP. Do not use the admin-dashboard feedback here unless it changed something Sam sees. If the only feedback was on the admin overview, say so: "Esha's feedback so far has been on the admin side, that a number without a word next to it means nothing, and that colour cannot carry the signal alone. That is why the count reads '3 lols' and the button changes its word, not only its colour."]

Only keep that last sentence if it is true for you. If the "lol?" copy predates her feedback, cut it and say what did change.

### 3:50 to 4:10, end

Screen: Jokes page, scroll once.

> So Sam came in with a setup and left with a punchline for the group chat, and rated two others on the way. What is still rough: the models time out at busy hours, and the sign-up gate means the reviewers need a Columbia, Barnard or Gmail address to try it. Next I want to show the chain's effect on quality with more than one example. Thanks.

## Feedback notes and revision plan (add after the session)

Main feedback:
- [who said it, what, timestamp]
- [who said it, what, timestamp]

Two changes for the next video:
1. [change] because [the feedback it answers]. App change needed: [yes/no, what].
2. [change] because [the feedback it answers]. App change needed: [yes/no, what].

## Cue sheet for the recorded take (~/Desktop/columbia-laughs-walkthrough.mp4, 4:06, silent)

0:00 home page, slow scroll and back
0:33 sign-in page, the green disc is dragged into the plum one, "Continue with Google" appears
0:51 Write page, today's setup "Koronet pizza after midnight"
1:00 "Write me three punchlines" pressed, three cards arrive by 1:06, scroll, hold
1:22 "Write my own setup", typing "The 116th Street gates at 3am", generate, three cards by 1:36, hold
1:55 lol? pressed on the first 116th Street card (1 lol), undone, pressed again, hold
2:15 admin Prompts page: the mix (Straight to three 100, Draft then edit 0) and the two chains' steps, scroll
2:42 back on Write, generate once more on the same setup, three new cards by 3:20, scroll, hold
3:51 Jokes page, scroll and back
4:06 end

Honest note for the narration: the mix was NOT switched before the third run in this take, so all three
runs used "Straight to three". Say the admin page is where the mix is switched and that the next video
will run "Draft, then edit" side by side. Do not say the third set came from the second chain.
