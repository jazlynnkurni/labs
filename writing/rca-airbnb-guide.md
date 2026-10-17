# Root cause analysis question, verbatim, by stage
Example used throughout: "Airbnb bookings went down by 30%. What happened?"
Speaker's words only, split by thought. Headings are the stages of his framework, in the order he gives them.

## What the question is, and the common mistake (0:17)
- "Root cause analysis questions will ask you to identify why a problem happened to your product."
- "Like most PM interview questions, the root cause analysis question will ask you to take something ambiguous, find the most logical product explanation and communicate it clearly."
- "In interviews, they sound something like this. The daily active users dropped after launch. Why? There's been an increase in churn customers. Explain that. App downloads have gone down. Why is that?"
- "The most common mistake is that candidates come into the interview with the laundry list of potential root causes and then start going down the list and grilling the interviewer to see if one of those items on the list is the actual root cause. I know PMs wear multiple hats, but being an interrogator is not one of them."

## Stage 1: clarifying questions (1:02)
- "First, we want to ask clarifying questions. The goal of this section is to get on the same page with the interviewer about the question's problem space."
- "I'm going to break down clarifying questions into three different categories."

The metric itself
- "Number one, we have questions about the metric itself. How is the metric being calculated? And what are the levers impacting this change?"
- "For example, I'd like to clarify how bookings are defined. Is a booking a reservation request submitted, a booking that's been confirmed by the host, or a stay that's actually been completed."

The time frame
- "Next, we want to clarify the time frame in which the metric dropped. Was it a sudden change, or was it a gradual drop over a couple of months?"

The scope of impact
- "And lastly, we want to assess the scope of the impact. How much of an impact did the metric actually make? Who did it affect? Did the drop impact specific customer segments?"
- "Are we seeing a drop more in urban stays, long-term rentals, specific geographies like New York or Paris? and is a drop happening across the entire product or just one product area. Is this only applicable to mobile bookings or all platforms?"
- "Now that we're aligned with the interviewer about the actual problem, we want to now go into figure out what the root cause could be."

## Stage 2: the five categories of root cause (1:58)
- "For educational purposes, I want to lay out an exhaustive list of potential root causes and see how it actually apply to the Airbnb example. In an actual interview, you wouldn't go through every single item on the list to figure out what the root cause is. You focus on exploring and narrowing down the most likely causes efficiently."
- "There are five different categories of root causes."

Category 1: data instrumentation errors (2:18)
- "First, we have data instrumentation errors. This category is about confirming that the problem is real and not just a result of a data or tracking error."
- "This can include things like tracking or analytics misfires, broken event schemas, reporting pipeline misconfigurations, and incorrect queries on reporting dashboards."
- "I'll say 95% of the time though, the root cause isn't actually in this step, or else the interview would be over in 5 minutes. But skipping this part is a mistake because strong PMs always validate the problem in the data before jumping into a diagnosis. So be sure to mention it."

Category 2: internal factors (2:50)
- "Okay, great. So let's say there aren't any data instrumentation errors. Now we want to jump into the internal factors. These are root causes that stem from the product, the tech, or the company itself."
- User workflow: "We want to first start by mapping the user workflow and checking the drop offs at each step. If there's a drop off at a certain stage, it can uncover a clear direction on where to investigate next."
- "Let's say there weren't any specific drop offs in the user workflow. We can zoom back out. Maybe there were changes in the product itself, like product cannibalization."
- Cannibalisation example: "For example, when Airbnb rooms launched, many guests who previously booked entire homes shifted to cheaper shared stays. The new feature drew demand away from higher value listings as budget conscious travelers opted for rooms instead of booking larger stays."
- UI changes example: "Or there could have been UI changes. For example, when Airbnb redesigned its search to focus on curated categories instead of the traditional map view, users who prefer searching by location found it harder to browse specific neighborhoods. As a result, many may have left before completing a booking."
- A/B tests and pricing: "Another one could be, were there any AB tests running at the time of the drop or potentially pricing changes made? For example, Airbnb switched to a new host only fee model where hosts now pay for the full 15.5% service fee instead of the fee being split between guests and hosts. To keep earnings the same, many hosts raise their prices, resulting in listings looking more expensive to guests, which could have potentially led to fewer bookings."
- Company-wide changes: "If none of these tech changes explain the drop in users, then we can move on to another internal factor, which is companywide changes."
- Reorg example: "One of these potentially could have been a reorg. For example, Airbnb reconstructed its regional operational teams, merging host support with community management. During this transition, hosts waited longer to get help resolving issues like calendar sync, double booking, or payout delays, leading to more inactive listings, and fewer available stays for guests."
- Acquisition example: "Was there an acquisition that potentially caused this drop in users? For example, Airbnb acquired a small AI startup to improve search personalization called gameplanner.ai. While integrating, there could have been a delay in algorithm improvements, and search relevance could have dropped, making it harder for guests to find the right listings for them to book."
- Traffic and marketing channels: "And lastly, we want to consider shifts in traffic or marketing channels. For example, if a major partnership or referral program was cancelled, this could have resulted in a drop of users or maybe a marketing change from predominantly running Google ads and now they want to shift to UGC or social media. This could have been a potential root cause."

Category 3: external factors (5:07)
- "Okay, great. So, let's say internal factors wasn't the root cause for this question. Now, we want to move on to external factors. These are factors that the company itself and the product itself doesn't have control over."
- Law and politics: "The first one is changes in government law and politics. Was there a shift in government regulation or law that impacts Airbnb? For example, cities like New York and Barcelona recently tightened short-term rental laws banning entire home listings under 30 days."
- Seasonality: "Next, were there any seasonality factors like holidays, travel periods, or academic calendars that could have explained the change?"
- Competitors: "Next, we want to look at competitors. Were there any significant moves from external competitors? For example, Booking.com launched a major global campaign promoting transparent pricing. At the same time, Airbnb was facing lots of social media backlash over high fees, a combination that could have driven users away from Airbnb. Were there any new incumbents in the space that could have disrupted the market?"
- External dependencies: "Next, we want to look at any impact from external dependencies. For example, Airbnb depends on external services like AWS. So, when AWS had an outage even for a couple of hours, this could resulted in thousands of bookings failing. This is exactly what happened a few weeks ago to half the internet."
- Marketing and press: "And lastly, we can talk about marketing and press. Was there any bad publicity that could have potentially ruined Airbnb's reputation?"

Category 4: consumer behaviour (6:21)
- "Okay, great. So, let's say there are no internal or external factors that could have been the root cause. Now, we want to talk about consumer behaviors and evaluate this to see if it could be the root cause."
- User preferences: "Was there a change in user preferences? For example, if hosts are constantly dealing with disputes and damaged properties and Airbnb isn't doing anything to address these problems, they may choose to leave the platform."
- Experience fatigue: "Another factor to consider is user experience fatigue. For example, guests may gradually start to feel frustrated because of the inconsistent experience booking on Airbnb, including response times, check-in processes, amenities, and they may feel like the process to actually book something on Airbnb is more cumbersome than just booking a hotel."
- Too much variety: "Another example is that Airbnb is really trying to display the variety that it has in listings. And at one point, this was definitely a superpower, but now users who may want a more straightforward booking experience can find this too overwhelming and may want to book via hotels instead because it's a very straightforward experience."

Category 5: combinations (7:16)
- "Those are the top four root cause categories to consider. And lastly, root causes don't need to be one-dimensional. They can also be a combination of internal, external, and consumer factors."
- "A single change like a new UI change might not explain a 30% drop on its own, but when you overlap it with another factor, the impact can compound."

## Stage 3: narrowing down, hypothesis then test then repeat (7:34)
- "Now that we're familiar with the different types of root causes, I want to now show you how you can comb through the different root causes to figure out which one is your final solution."
- "There's a very simple framework that we can use. Number one, we form a hypothesis, then test it and repeat."
- Order: "First, we want to start off with data instrumentation to confirm whether the problem is real. Then move to internal factors, then external changes, and then consumer behaviors. We want to skip categories and different factors within the categories as we rule them out."
- Start wide: "For your hypothesis, you want to start wide and knock out as many drivers as possible. It's like playing guess who. You wouldn't ask if your opponent's character has like freckles or a double chin. Rather, you would want to ask if they have dark hair because that could cancel out half the board."
- Applied: "For the same Airbnb question, if you want to gauge if there were any technical issues, you wouldn't ask a very specific question like, 'Was there a bug in the booking workflow?' since that only cancels out one possibility. Rather, you want to ask a more open-ended question like, 'Has the traffic to the site been stable?'"
- "Once you formed your hypothesis, you want to validate it with the interviewer and then use the insight that you've gained from the interviewer's response to formulate your next hypothesis."

Keep it conversational, not an interrogation (8:42)
- "Once again, a common pitfall is that the interview turns into interrogation instead of a natural conversation. Strong PMs know how to capture your attention well. They draw you in, they make you think, and they leave you seeing the problem in a new light. The root cause analysis is the perfect opportunity to demonstrate this."
- Non-conversational: "Was this change impacting other parts of the product? Yes. Was it affecting iOS only? Yes."
- Conversational: "Was this issue affecting other parts of the product? Yes, got it. It makes me think that the root cause is something that affected the shared system or recent release that touched multiple parts of the product."

## Stage 4: validate the final root cause, then solutions (9:20)
- "Lastly, once you arrive at your final root cause, you want to validate if this hypothesis is true by listing other metrics you'd check. And then, if time permits, also providing solutions to prevent this from happening again."
- Worked example: "Let's say that the root cause that you landed on was the fact that there was a new ban put on short-term rentals in cities like New York City."
- Validation metrics: "You'd validate that by checking metrics like the number of active listings before and after the law change, the booking conversion rate by city, and changes in average nightly prices in affected regions compared to unaffected ones."
- Solutions: "And as a solution, Airbnb could encourage longer stays in regulated cities or tweak search results to promote listings in nearby suburbs."
