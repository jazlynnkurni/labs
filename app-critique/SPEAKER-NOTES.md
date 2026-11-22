# App Critique · Depop · speaker notes

Slides are added here one at a time, as each is approved.

## Cover

Depop. The cover tile is a crop of Depop's own loading screen (IMG_5048) for now.

## Slide 1 · Context

**Headline:** Business Context, Problem Space, & Use Case

**Depop (from my notes).** Founded in 2011, Depop is a London-based, peer-to-peer fashion resale marketplace connecting individuals buying and selling secondhand clothing.

**The business (from my notes).** Acquired by Etsy for $1.625 billion in 2021, Depop grew to 55.6 million registered users, generating $1.07 billion in gross merchandise sales (GMS) in 2025. Depop has become a significant player in the circular fashion economy, particularly among Gen Z consumers, by turning secondhand shopping into a socially driven experience where people can both buy and sell clothing. *(Check these figures against a source before presenting.)*

**Why the buying flow (from my notes).** There are two flows: buying and selling. I focus on buying, partly because I'm a consumerist queen, and mostly because Depop has more than twice as many active buyers as active sellers, 7.0M to 3.2M by its latest full-year figures. Most of its revenue runs through the buying flow, so it's the biggest touchpoint, and the more seamless it is, the more revenue it brings.

**Abigail (from my notes).** In her early 20s, living in the city, always going to events and needing cheap thrift finds. She loves fashion and loves supporting local businesses.

**User journey.** Browse, then filter, then make an offer, then checkout. It follows the screens: Home, the product page, the filters, Make an offer, the bag, the loading screen and checkout.

## Slide 2 · Home and the product page

**Screens, left to right.** Home (IMG_5038, 9:05), then the product page for the St. John's Bay striped tank (IMG_5051, 9:08). Both are part of Browse.

**UX principle.** Visual hierarchy and consistency: one type scale, one icon size, and colour that matches meaning.

**1 · Sizes that don't match.** *What's visible:* the camera icon sits inside the search bar, while the heart and bag are larger in their own pill. "Your active offers" and "See all" differ in weight and size. *From my notes:* "Icons aren't the same size, and the camera is too far to the right." "Not the same length, no fixed text padding, alignment or size. Why is one thicker and one thinner?"

**2 · Too much to read first.** *What's visible:* the Special offer card stacks a sparkles icon, a title, a username, a timer, a sale price and an original price. *From my notes:* "Overwhelming, I don't know where to read first." "Maybe not the stars icon, because it could mean AI. More responsive SVG icons." "Not a huge fan of the font, it's not accessible."

**3 · An odd image shape.** *What's visible:* the watch thumbnail is cut into a custom notched shape. *From my notes:* "Why is it shaped like that?"

**4 · Urgency in the wrong colour.** *What's visible:* "Expires in 8d 3hr" is in green, and the struck-out "$14" is plain grey. *From my notes:* "Why is it in green? Shouldn't it be red? Not accessible." "Crossing the text could be in red." *Why it matters:* green usually reads as success or "go", so a deadline in green sends a mixed signal.

**5 · Organisation that works (done well).** *What's visible:* active offers first, then Suggested for you with quick filter chips (All, Under $10, Dresses, Coats & Jackets) and a two-column grid. *From my notes:* "But overall, the organisation makes sense." "Love this organisation."

**6 · A red badge.** *What's visible:* the bag icon at the top right carries a red "1". *From my notes:* "Why in red? Red usually connotes bad. An interesting colour choice for branding. It's going to make colour psychology harder, because what if it's a good thing and they use their brand colour? But red is historically understood as incorrect. I wonder how."

**7 · Heavy outlined buttons.** *What's visible:* the more, scissors, save and like buttons down the photo's right side each have a thick ring. *From my notes:* "Why thick outlines? Could be made more responsive and SwiftUI friendly." *Careful:* SwiftUI is my suggestion for lighter, native controls. The screen doesn't tell us their stack.

**8 · Dots everywhere.** *What's visible:* "ST. JOHN'S BAY • VESTS-TANKS-CAMIS", "Women • Size M • Good condition" and another dot between the two chips. *From my notes:* "Too many dots, like the dots between texts. Not accessible, screams AI. Too visually dense."

**9 · Offer and Buy look alike.** *What's visible:* "Offer $15" is an outlined button and "Buy" a filled light one, side by side at the bottom. *From my notes:* "This is fine, but I would colour-code Offer vs Buy."

## Slide 3 · Product details and You might also like

**Screens, left to right.** The product page scrolled to its details (IMG_5052, 9:08), then "You might also like" (IMG_5053, 9:08). Both are part of Browse.

**1 · Descriptors that make sense (done well).** *What's visible:* "St. John's Bay green, yellow, and white striped tank top with built in shelf bra #stripes #summer", the MULTI and GREEN colour tags, and "1 DAY AGO". *From my notes:* "Good descriptors, they made sense."

**2 · Klarna in the wrong place.** *What's visible:* "4 payments at 0% interest with Klarna, Learn more" sits between the seller card and Visit seller's shop. *From my notes:* "Klarna shouldn't be put here though. Why put it here? Just put it on the payment page." I say the same on checkout: "This page is great, just add the Klarna stuff here."

**3 · Lightning for hot items.** *What's visible:* small lightning badges on some cards in the grid. *From my notes:* "This is good, but the lightning icon could maybe be replaced. I understand it's communicating urgency, like it's in high demand, it's hot. Maybe use fire to show it's hot instead of lightning?" *Careful:* I can't see from the screen what the lightning means exactly. It may mark fast shipping or a boosted listing. Check before presenting, since boosted listings come up in the research.

**4 · Four across is too many.** *What's visible:* four columns of tops, the fourth cut off at the right edge, in a grid that scrolls sideways. *From my notes:* "Display is great, but showing 4 is too much. There's a rule for this, I think by 3? Especially when it's horizontally scrolled." *What the guidance actually says:* there's no single famous "rule of 3" for grids. The defensible version is that two to three columns read best on a phone, and a horizontally scrolling row should show a partial next item, a peek, so people know it scrolls. The cut-off fourth column is that peek. So the fix is three columns plus a peek, not four plus a peek. *The principles to name:* Hick's Law says decision time grows with the number of options in view, so four tops per row means more to process at every glance. Fitts's Law says bigger targets are faster and easier to hit, so three wider columns make each item easier to tap and see. Don't call it the rule of thirds, which is a photo-composition rule.

## Slide 4 · More from this seller

**Screens, left to right.** More from this seller (IMG_5054, 9:08), then the same row scrolled to its end (IMG_5055, 9:08). Both are part of Browse.

**UX principle.** Consistency and standards, and avoiding dead space that reads as broken.

**1 · Rows that change count.** *What's visible:* More from this seller shows two rows of items, while You might also like directly above showed four. *From my notes:* "Inconsistent, because now this is by two. It should always be consistent in how the outfits scroll. Say the previous one is 4, this should be 4 too." *Why it matters:* when every section uses its own grid, people re-learn the layout as they scroll, and it stops feeling like one system.

**2 · A cramped buy bar.** *What's visible:* the bottom bar with "$20", "Offer $15" and "Buy". Measured on the screenshot, there's about 8px of space above the buttons and about 25px below them, so the controls crowd the top edge. The same bar sits on every product screen. *From me:* the bottom row isn't nice, the padding is off. *What I'd explore:* even vertical padding, with the home indicator area added below rather than borrowed from the bar.

**3 · A shortcut to the shop (done well).** *What's visible:* "See all" sits on the same line as "More from this seller". *Why it works:* one tap to the seller's whole shop, right where interest peaks.

**4 · Save in one tap (done well).** *What's visible:* every product photo carries a heart in its top-right corner. *Why it works:* saving doesn't need another screen, so browsing keeps its momentum.

**5 · One card spec (done well).** *What's visible:* every card reads brand, size, then price in bold (Morning Sun, M, $20; Ashworth, L, $20). *Why it works:* a predictable card lets people compare at a glance, the same strength I praised on ClassPass's cards.

**6 · Negative space at the end.** *What's visible:* scrolled to the end, the second row stops after DAZY, leaving an empty slot where the next item would be. *From my notes:* "Because you want to avoid negative space like this." *What I'd explore:* fill the final row, or end the row with a See all tile so it never stops on a gap.

## Slide 5 · Filters: Brand and Size

**Screens, left to right.** The Brand filter (IMG_5041, 9:06), then the Size filter (IMG_5042, 9:06). Both are part of Filter, opened from the Brand, Size, Color and Price chips under "You might also like".

**1 · Search that saves time (done well).** *What's visible:* a "Search brands" bar above the list. *From my notes:* "This is a good option."

**2 · Symbols before letters.** *What's visible:* the list opens on !M?ERFECT, "33,000ft", "BABY,THE STARS SHINE BRIGHT", #FR2, & Other Stories and &merci, so punctuation sorts ahead of the alphabet. *From my notes:* "I would organise it alphabetically, in order, and have the option to sort by letter as well." *What I'd explore:* an A to Z index down the side, like Contacts, with symbol-led brands grouped at the end.

**3 · A page just to start sizing.** *What's visible:* the Size filter is a whole screen with only Men, Women and Kids, each opening another screen before you see a single size. *From my notes:* "It should be asked from the very beginning, with the numbers or sizing already displayed from the get-go, so you don't need to press through pages. Refer to a famous UX rule about not having to press through too many pages." *The rule, stated honestly:* the famous one is the "three-click rule", but Nielsen Norman Group's testing found it's a myth, since people don't give up at three clicks if each step feels like progress. The defensible principle is **interaction cost**: every extra tap and screen is effort the user pays. *What I'd explore:* ask for my sizes once, in onboarding or my profile, and pre-apply them, so the Size filter opens straight onto sizes.

## Slide 6 · Filters: Color and Price

**Screens, left to right.** The Color filter (IMG_5043, 9:06), then the Price filter (IMG_5044, 9:06). Both are part of Filter.

**UX principle.** Recognition over recall, and visibility of system status: show people what they've picked and what a control means, rather than making them remember or guess.

**1 · Colours one at a time.** *What's visible:* ten colours (Black to Multi), each a swatch with a checkbox, with no search and no summary of what's selected. *From my notes:* "Have an interactive search option, as well as mixing colour options, like one colour plus another colour, so it can match colourways. Show it interactively with another card component above, instead of just pressing, because when you press and scroll you might already forget." *What I'd explore:* a "Your colours" card pinned at the top that fills with chosen swatches, and the ability to pair colours into a colourway.

**2 · Min and Max, but no numbers.** *What's visible:* a slider labelled only "Min" and "Max", with no prices on either end, on an otherwise empty screen. *From my notes:* "Min? Max? What is the min, what is the max? Set actual numbers, or this would be useless." *What I'd explore:* show the live price range on both handles, plus quick presets like Under $10, the same chips Home already uses.

## Slide 7 · Make an offer and the bag

**Screens, left to right.** Make an offer on the burgundy dress (IMG_5047, 9:07), then the bag with two sellers' items (IMG_5056, 9:09). Offer, then the start of Checkout.

**1 · Price should lead.** *What's visible:* the size "M" sits above "Current price: $7.00". *From my notes:* "M should be under the current price, because it's not high in urgency. The highest priority here is the price, because this is the checkout flow."

**2 · Icons and type off-system.** *What's visible:* the "$" in the offer field and the "%" in the Seller likely to accept pill don't line up, and "Seller likely to accept $5" is smaller and thinner than the text around it. *From my notes:* "Not aligned. They should have a fixed design system." "Why is the font suddenly smaller and thinner? It also doesn't seem to have good placement within the pill, with fixed padding and margins."

**3 · One clear action (done well).** *What's visible:* one field, one hint and one Send offer button. *From my notes:* "Pros: this page is not too much. It makes sense and isn't cognitively overwhelming."

**4 · The rule comes last.** *What's visible:* "An offer is not a payment. If the seller accepts you'll have 24 hours to buy the item at your offer price." sits under the Send offer button. *From my notes:* "This should be like a notification badge on top, because you'd want to read this first, it's the most important. Not on the bottom. You want to let users know the mechanisms before they go deep into it. Also, there should be two fonts: a signature one, and one for readability, like SF Pro or Inter, for text like this." *From the research:* offers don't commit either side until the buyer pays. Depop tested a binding "Lock it in" offer and rolled it back in May 2025, so this rule is a real source of confusion (DEPOP-RESEARCH.md).

**5 · Protection up front (done well).** *What's visible:* "All purchases are covered by Depop Protection" with a shield, at the top of the bag. *From my notes:* "This is great."

**6 · Size on the photo (done well).** *What's visible:* each bag item shows its price and "M" right on the photo. *From my notes:* "Love the M disclosure, because sizing is always the thing people double-check, and all the info is already there."

**7 · Bundle slots take space.** *What's visible:* two large dashed boxes per seller, "Add more items to make a bundle". *From my notes:* "Add more items to make a bundle? I feel like this is unnecessary, and it takes a lot of empty space. Just add a + button or something, to make it less cognitively overwhelming without extra negative space." *From the research:* bundles only work within one seller's shop.

**8 · Checkout per seller.** *What's visible:* each seller has its own Checkout button and "+ $1.99 shipping". *From my notes:* "Is there any way to check out at the same time instead of separately? It would be a cool feature, so users don't always have to pay an extra $2 every time." *From the research:* buying from several sellers adds shipping and fees per order, a recurring Trustpilot complaint.

## Slide 8 · Loading and Checkout

**Screens, left to right.** The bag loading with Depop's "d" (IMG_5048, 9:07), then Checkout for the striped tank (IMG_5057, 9:09). The end of Checkout.

**1 · Joy while it loads (done well).** *What's visible:* a single red "d" in the middle of an otherwise empty Bag screen. *From my notes:* "Love the loading screen, amazing. Love adding friction to the process, and micro-joy." *Why it works:* a branded pause before paying makes the moment feel deliberate rather than broken.

**2 · A calm checkout (done well).** *What's visible:* the item card (photo, title, M, $20.00), Ship to, and Payment type with Apple Pay, Visa and Add new card. *From my notes:* "This page is great."

**3 · Klarna belongs here.** *What's visible:* Payment type lists Apple Pay, Visa and Add new card, with no Klarna, while the product page shows Klarna (Slide 3). *From my notes:* "Just add the Klarna stuff here."

**4 · A floating field.** *What's visible:* "Enter security code" is an indented, outlined field under the Visa row, not aligned with the radio rows above and below. *From my notes:* "I would make Enter security code aligned, not floating."

**5 · Pay now, cramped.** *What's visible:* the grey Pay now button sits tight under the top edge of its bottom panel, with "This payment will be processed by Stripe" in small grey text above the card logos. *From my notes:* "The padding doesn't make sense, the top is too tight with the container on top. 'Processed by Stripe', maybe add Stripe's logo or its signature feature and make it more prominent, or not. It's not readable and doesn't make sense. That way users will know immediately." *From the research:* a buyer "Marketplace Fee" was added at checkout in 2024 and Trustpilot reviewers say it varies without explanation, so checkout transparency is a known pain point.

## Slides 9 to 11 · Opportunities, as lo-fi prototypes

**Framing.** "Depop makes secondhand feel social, but buying asks too much: four screens to filter, rules you only learn at the bottom, and a checkout per seller. Here are three revisions, most valuable first." The prototypes are greyscale lo-fi on purpose. Only the colour swatches use colour, because colour is the feature. Bracketed values like [fee] and [total] mark numbers I don't know, so nothing invents Depop's pricing. For DoorDash, I make the marketplace parallels out loud rather than on the slides: multi-store orders, fee transparency, sponsored placement, and reordering what you like.

### Opportunity 1 · One bag, one checkout (the revised bag)
1. **Pay once across sellers.** One checkout for the whole bag, while shipping still shows per seller, so nothing hides. Fixes Slide 7: checkout per seller. *Buyer:* fewer steps to pay. *Business:* higher conversion from bag to purchase. *Seller:* sales stop dropping off between separate checkouts.
2. **Add from this seller.** A small pill instead of two big empty bundle boxes, framed around saving shipping. Fixes Slide 7: bundle slots take space. Bundles only work within one shop, per the research. *Business:* larger orders per seller.
3. **Fees before you pay.** Items, shipping and the buyer fee itemised above the button, with [fee] and [total] as placeholders. *From the research:* a buyer "Marketplace Fee" was added in 2024, and Trustpilot reviewers say it varies without explanation.
4. **Klarna with the payments.** Pay-in-4 sits beside Apple Pay and Visa. Fixes Slides 3 and 8: Klarna in the wrong place.
5. **A badge you can read.** Even padding around Pay, and a recognisable Stripe mark instead of tiny grey text. Fixes Slide 8: Pay now cramped. The security code also lines up with its row (Slide 8: a floating field).
6. **Kept: Depop Protection and the d.** Both are things I praised, so the redesign keeps them.
*Measures to propose out loud (not results):* bag-to-purchase conversion, multi-seller order rate, average order value, checkout drop-off.

### Opportunity 2 · A product page you can decide on (the revised product page, offer sheet open)
1. **A clean, readable title.** Line breaks instead of bullet dots, in a readable body font next to Depop's signature display font. Fixes Slide 2: dots everywhere, and my note on fonts.
2. **Honest badges.** A flame for "In demand", and a clear label wherever a listing is boosted, since boosted listings rank first by default (from the research). Fixes Slide 3: lightning for hot items.
3. **Lighter, native controls.** Thin rings instead of heavy outlines on the photo. Fixes Slide 2: heavy outlined buttons.
4. **A neutral cart badge.** Red is kept for warnings, like an offer about to expire. Fixes Slide 2: a red badge, and urgency in the wrong colour.
5. **Offer rules first.** "An offer isn't a payment. If the seller accepts, you have 24 hours to buy." at the top of the sheet. Fixes Slide 7: the rule comes last. Depop tested binding offers and rolled them back in 2025, so the rule needs to be clear.
6. **Price leads, actions told apart.** Price above size, the $ and % in one aligned column with the same type, and Offer styled differently from Buy. Fixes Slides 2 and 7: price should lead, icons and type off-system, Offer and Buy look alike.
*Measures (proposed):* offer-to-purchase rate, offers sent per view, time on product page before purchase.

### Opportunity 3 · Shop by fit and colour (one filter sheet)
1. **Filters you can see.** Every choice as a removable chip at the top. Fixes Slides 5 and 6: picks that vanish, four separate screens.
2. **Fit memory.** Sizes saved once (in onboarding or the profile) and pre-applied. Fixes Slide 5: a page just to start sizing (interaction cost).
3. **Colour mixer.** My idea: tap up to three swatches to build a colourway, for example green, gold and cream like the tank, kept in view with a Find button. Fixes Slide 6: colours one at a time, and picks vanishing as you scroll.
4. **Snap a colourway.** The AI-first extension: point the camera at a photo or an outfit and find items that match its colours. Depop already has a camera icon in search, so this grows something that exists. It's a proposal, not something I built.
5. **Price with real numbers.** Live prices on both handles, plus the same presets Home uses. Fixes Slide 6: Min and Max, but no numbers.
6. **Brands A to Z.** Alphabetical, with a letter scrubber and symbol-led brands grouped last. Fixes Slide 5: symbols before letters.
*Measures (proposed):* filter use, time to first relevant result, saves and purchases from filtered results.
