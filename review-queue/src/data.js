// Made-up cases for a food delivery support lead. Times are in minutes.
export const TOTAL_TODAY = 1000;

export const STATES = {
  approval: { label: "Needs approval" },
  input: { label: "Needs input" },
  failed: { label: "Failed" },
};

export const cases = [
  {
    id: "FD-48213",
    order: "20481",
    decision: "Refund Maya the full $38.40?",
    state: "approval",
    title: "Cold food, 38 minutes late",
    who: "Maya Roberts",
    restaurant: "Nasi Kita",
    total: 38.4,
    age: 42,
    sla: 9,
    why: "Refund is over the $30 the agent can approve alone",
    summary:
      "Maya says her dinner arrived cold after a long wait. The courier sat at the restaurant for 22 minutes and the drop off was 38 minutes past the estimate. Her photo shows a lukewarm bowl, which fits the delay.",
    facts: [
      ["Delivery", "38 min late"],
      ["Courier wait", "22 min at the restaurant"],
      ["Photo", "Attached, matches the order"],
      ["History", "14 orders, no refunds yet"],
    ],
    approval: {
      summary: "Full refund for the order",
      amount: 38.4,
      to: "Card ending 4421",
      audience: "Message to customer",
      message:
        "Hi Maya, I am sorry your dinner arrived cold. I have refunded the full $38.40 to your card ending 4421. It should show within 3 days.",
    },
  },
  {
    id: "FD-48220",
    order: "20493",
    decision: "Refund Jordan and pause the dish?",
    state: "approval",
    title: "Allergy report, peanuts in a nut free dish",
    who: "Jordan Ellis",
    restaurant: "Green Fork Kitchen",
    total: 52.1,
    age: 18,
    sla: 6,
    why: "Health and safety reports always need a person",
    summary:
      "Jordan had a mild reaction after eating the pad see ew, which is listed as nut free. They are fine and did not need a doctor. The restaurant has not replied. There were two earlier reports on this dish in the last 90 days.",
    facts: [
      ["Report", "Mild reaction, no medical care"],
      ["Dish", "Pad see ew, tagged nut free"],
      ["Earlier reports", "2 in the last 90 days"],
      ["Restaurant reply", "None after 25 min"],
    ],
    approval: {
      summary: "Full refund, pause the dish and notify the restaurant",
      amount: 52.1,
      to: "Card ending 9082",
      audience: "Message to customer",
      message:
        "Hi Jordan, I am very sorry, and I am glad you are okay. We have refunded $52.10 and paused this dish while we review it with the restaurant. Please tell us if you need anything else.",
    },
  },
  {
    id: "FD-48226",
    order: "20455",
    decision: "Refund Priya $24.90 and flag the courier?",
    state: "approval",
    title: "Marked delivered, never arrived",
    who: "Priya Nair",
    restaurant: "Burger Lab",
    total: 24.9,
    age: 55,
    sla: 31,
    why: "Courier location does not match the drop off address",
    summary:
      "Priya says nothing arrived. The courier marked it delivered 140 meters from her building and the proof photo shows a door that is not hers. She has never made a claim before.",
    facts: [
      ["Drop off", "140 m from the address"],
      ["Proof photo", "Different door"],
      ["Courier", "2 similar flags this month"],
      ["History", "31 orders, first claim"],
    ],
    approval: {
      summary: "Full refund and flag the courier for review",
      amount: 24.9,
      to: "Card ending 1175",
      audience: "Message to customer",
      message:
        "Hi Priya, thank you for telling us. I have refunded $24.90 to your card ending 1175 and passed the delivery to our courier team to look into.",
    },
  },
  {
    id: "FD-48236",
    order: "20502",
    decision: "Refund Nora $14.80 for the missing entree?",
    state: "approval",
    title: "Missing entree, refund requested",
    who: "Nora Castillo",
    restaurant: "Trattoria Fiore",
    total: 36.2,
    age: 27,
    sla: 33,
    why: "Any refund over $10 needs a person to check the receipt",
    summary:
      "Nora reports the chicken parmigiana was not in the bag. The receipt lists it as packed, but the courier photo shows only two of three containers.",
    receipt: [
      { name: "Chicken parmigiana", price: 14.8, missing: true },
      { name: "Spaghetti pomodoro", price: 11.2 },
      { name: "Caesar salad", price: 6.2 },
      { name: "Delivery fee", price: 2.5 },
      { name: "Service and tax", price: 1.5 },
    ],
    facts: [
      ["Courier photo", "2 of 3 containers"],
      ["History", "8 orders, 1 earlier claim"],
    ],
    approval: {
      summary: "Refund the missing entree",
      amount: 14.8,
      to: "Card ending 3306",
      audience: "Message to customer",
      message:
        "Hi Nora, I am sorry the chicken parmigiana was left out of your order. I have refunded $14.80 to your card ending 3306. It should show within 3 days.",
    },
  },
  {
    id: "FD-48202",
    order: "20437 +5",
    decision: "Should Kopi Hijau go live?",
    state: "input",
    title: "Can this restaurant go live again",
    who: "Kopi Hijau",
    restaurant: null,
    total: null,
    age: 64,
    sla: 40,
    why: "Needs the call you had with the owner this morning",
    summary:
      "Kopi Hijau was paused on Monday after a failed hygiene check. The owner uploaded a passing re inspection report dated today. The agent cannot tell whether it is the official report, or whether you agreed conditions on the phone.",
    facts: [
      ["Paused for", "Failed hygiene check on Monday"],
      ["Document", "Re inspection pass, uploaded 09:12"],
      ["Waiting", "6 orders held in the queue"],
    ],
    input: {
      options: [
        "Yes, go live now",
        "Yes, but hold new orders for 1 hour",
        "No, keep it paused until verified",
      ],
      placeholder: "Anything the agent should tell the owner",
    },
  },
  {
    id: "FD-48210",
    order: "20468",
    decision: "How far should the agent go with Dana?",
    state: "input",
    title: "Customer says they will post about it",
    who: "Dana Whitfield",
    restaurant: "Taco Norte",
    total: 41.2,
    age: 30,
    sla: 12,
    why: "Goodwill above the cap is your call",
    summary:
      "Two of five items were missing and the first reply was a standard refund. Dana says they write for a local paper and will post the thread today. The agent can offer up to $15 in credit on its own.",
    facts: [
      ["Order", "2 of 5 items missing"],
      ["Reply so far", "Standard refund sent"],
      ["Public risk", "Says they will post today"],
    ],
    input: {
      options: [
        "Refund plus $15 credit",
        "Refund plus $30 credit",
        "Hand to communications",
      ],
      placeholder: "Tone or limits for the reply",
    },
  },
  {
    id: "FD-48215",
    order: "20479",
    decision: "Has the safety team reached Samir?",
    state: "input",
    title: "Courier reported a bike crash",
    who: "Samir Aziz",
    restaurant: "Pho 88",
    total: 33,
    age: 15,
    sla: 20,
    why: "Only your team can confirm the safety follow up",
    summary:
      "Samir reported a minor crash at 14:02 and the order was lost. The agent sent a new courier and the customer is arriving at their door in 18 minutes. It cannot see whether the safety team has contacted Samir.",
    facts: [
      ["Courier", "Reported a minor crash at 14:02"],
      ["Order", "Remade, new courier in 18 min"],
      ["Customer", "Told about the delay"],
    ],
    input: {
      options: ["Yes, they are with him", "Not yet, I will call now"],
      placeholder: "Anything to add for the courier team",
    },
  },
  {
    id: "FD-48241",
    order: "20511",
    decision: "Does the photo support a misdelivery?",
    state: "input",
    title: "Delivery photo disputed",
    who: "Elena Marsh",
    restaurant: "Harbour Grill",
    total: 31.6,
    age: 33,
    sla: 25,
    why: "Only you can weigh the evidence before a courier is flagged",
    summary:
      "Elena says her order never arrived. The courier's proof photo shows building 218, but the order address is building 26. The agent cannot tell whether the courier went to the wrong building or photographed a neighbouring entrance.",
    compare: {
      left: {
        label: "Order says",
        value: "Building 26",
        note: "26 Harbour Row, apartment 4B",
      },
      right: {
        label: "Photo shows",
        value: "Building 218",
        note: "218 Harbour Row, number on the entrance",
      },
    },
    facts: [
      ["Courier GPS", "190 m from building 26"],
      ["Photo taken", "14:36, at the drop off"],
      ["Courier history", "1 earlier address mismatch"],
      ["Customer", "11 orders, first claim"],
    ],
    input: {
      options: [
        {
          label: "Confirm misdelivery",
          next: [
            "Refunds $31.60 to the card ending 5520",
            "Adds a strike to the courier record",
            "Apologises to Elena",
          ],
        },
        {
          label: "Request more evidence",
          next: [
            "Asks the courier for a second photo and a pin drop",
            "Holds the refund until the courier replies",
            "Tells Elena to expect an answer within 30 minutes",
          ],
        },
      ],
      placeholder: "Anything the agent should add to its message",
    },
  },
  {
    id: "FD-48198",
    order: "20431",
    decision: "Did Hannah's refund already go through?",
    state: "failed",
    title: "Refund provider timed out",
    who: "Hannah Kim",
    restaurant: "Bao Bar",
    total: 36,
    age: 25,
    sla: 14,
    why: "A blind retry could pay her twice, so the agent stopped",
    summary:
      "The agent sent Hannah's $36.00 refund at 14:11. The payment provider timed out after the request left, so nobody knows whether the money moved. Hannah has not been told anything yet.",
    facts: [
      ["Refund", "$36.00 to card ending 4421"],
      ["Provider", "Timed out after 30 s"],
      ["Customer told", "Not yet"],
    ],
    log: [
      { time: "14:11", text: "Agent approved a $36.00 refund" },
      { time: "14:11", text: "Refund request sent to the payment provider" },
      { time: "14:12", text: "Provider timed out, payment status unknown" },
    ],
    failed: {
      step: "Sending the refund",
      error: "The provider timed out after the request was sent, so the payment status is unknown.",
      check: {
        label: "Check refund status",
        started: { time: "14:37", text: "Status check sent to the payment provider" },
        result: [
          { time: "14:37", text: "Provider replied, refund of $36.00 completed at 14:12" },
          {
            time: "14:37",
            change: {
              label: "Payment status",
              from: { text: "Unknown", state: "input" },
              to: { text: "Refunded", state: "approval" },
            },
          },
        ],
        done: "The provider confirms the refund already went through at 14:12. Nothing more needs sending, and a retry would pay Hannah twice.",
        closeLabel: "Close case",
        outcome: "Case closed, refund confirmed",
      },
      fixes: [{ label: "Retry refund" }],
    },
  },
  {
    id: "FD-48205",
    order: "20452",
    decision: "How should Mateo get the apology?",
    state: "failed",
    title: "Message to customer bounced",
    who: "Mateo Silva",
    restaurant: "Casa Verde",
    total: 22.4,
    age: 70,
    sla: 44,
    why: "The phone number on file is not valid",
    summary:
      "The agent resolved Mateo's missing drink and tried to send the apology by text. The text bounced. He has an email on file but the agent is not allowed to switch channels alone.",
    facts: [
      ["Resolution", "$4.50 refunded"],
      ["Text", "Bounced, number not valid"],
      ["Email on file", "Yes"],
    ],
    failed: {
      step: "Telling the customer",
      error: "The text message bounced because the phone number is not valid.",
      fixes: [
        { label: "Send by email", primary: true },
        { label: "Call the customer" },
      ],
    },
  },
  {
    id: "FD-48217",
    order: "20450",
    decision: "How do we check Aiko's photo?",
    state: "failed",
    title: "Could not read the photo",
    who: "Aiko Tanaka",
    restaurant: "Sushi Den",
    total: 45,
    age: 95,
    sla: 62,
    why: "The photo file is damaged",
    summary:
      "Aiko says the sashimi was warm and sent a photo as proof. The file would not open, so the agent could not check the dish. Nothing has been decided.",
    facts: [
      ["Claim", "Sashimi arrived warm"],
      ["Photo", "File damaged"],
      ["History", "9 orders, 1 earlier claim"],
    ],
    failed: {
      step: "Checking the photo",
      error: "The photo file is damaged and could not be opened.",
      fixes: [
        { label: "Ask customer to resend", primary: true },
        { label: "Approve without the photo" },
      ],
    },
  },
  {
    id: "FD-48229",
    order: "20498 +4",
    decision: "Is Curry Lane open for orders?",
    state: "failed",
    title: "Restaurant tablet is offline",
    who: "Curry Lane",
    restaurant: null,
    total: null,
    age: 40,
    sla: 22,
    why: "Five orders were not confirmed by the restaurant",
    summary:
      "The tablet at Curry Lane has not responded for 40 minutes. The agent could not confirm five orders and cannot tell if the kitchen is open.",
    facts: [
      ["Offline for", "40 min"],
      ["Unconfirmed", "5 orders"],
      ["Last order", "14:06"],
    ],
    failed: {
      step: "Confirming orders",
      error: "The restaurant tablet has not answered for 40 minutes.",
      fixes: [
        { label: "Call the restaurant", primary: true },
        { label: "Pause the restaurant" },
        { label: "Reroute the orders" },
      ],
    },
  },
];
