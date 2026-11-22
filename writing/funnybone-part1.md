# Semester Project Part 1: Funnybone

Drafted 30 Oct 2026 after Esha's written approval. Updated 17 Nov 2026 for the revised brief, which now asks for the persona and the Vercel URL by name. Paste the block below as the submission.

---

Semester Project Part 1: Funnybone

Repository. Funnybone, the Next.js application behind the consumer-facing front end of crackd.ai. I chose it because I am more interested in B2C products, and because it is the one repository where the person using the screen is also the person the product is for. I ran it locally with the course package and the anonymised teaching data, and explored the upload to results flow, which is the workflow I propose to improve.

User persona. Maya, a first-time user on her phone. She has one photo from the weekend, wants a caption she can post to Instagram within a minute, and has no patience for a product that makes her wait without telling her why. She judges the whole app on the first results screen; if it loses her there, she does not come back.

The user problem. After Maya uploads a photo there is a wait, then a list of captions to choose from. This flow works against her in three ways. Firstly, the wait is blank, with no loading state, so she cannot tell whether the product is working, whether the request is still running, or how long it will take. Secondly, the results arrive as a flat list, which is cognitively overwhelming and gives no way to judge which caption suits the photo. Thirdly, copying a chosen caption into Instagram or a message takes more steps than it should, and asking for a different take sends her back to the start. The screen she came for is also the screen most likely to lose her.

Who benefits. Every user, on every upload, since the results screen is the one screen each of them reaches. It is also the screen with the most activity and referrals, because captions are what get shared. An improvement here reaches new users like Maya as well as existing power users.

The improvement. A redesign of the results screen from end to end, built in three rounds across the feedback rounds. Round one covers the wait and the layout: a loading state that says what is happening and roughly how long it will take, and a results layout that shows each caption on the photo as it will actually appear, so captions can be compared rather than only read. Round two covers picking and sharing: one-tap copy and share for the chosen caption. Round three covers the regenerate loop: a "more like this" action that keeps the photo and the tone the user liked instead of restarting from scratch. The final video will show one photo uploaded before and after the change.

Services. Caption generation needs AI provider credentials that are not bundled with the ZIP. Since the improvement concerns what surrounds the captions rather than the model, I will build against the captions already in the teaching data, as agreed with my PM.

Vercel URL. https://funnybone-jazkurnz06-7083s-projects.vercel.app/demo/results (no sign-in needed; this shows the results screen the project is about).

PM approval. My PM, Esha, approved this proposal in writing before implementation began: "This is great! Thanks. I think the captions against the teaching data is fine."
