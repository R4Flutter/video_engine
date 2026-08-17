// Builds script_beats.md from the canonical yt_engine narration.
//
//   node tools/build-longform-beats.mjs            # build script_beats.md
//   node tools/build-longform-beats.mjs --list     # print extracted sentences
//
// The narration is sliced VERBATIM from yt_engine/new_story_script.md (the
// 19:14 canonical script, 2,920 words @ 170 wpm) so the beat text can never
// drift from the source. Scene structure follows yt_engine/editorial-plan.md.
// Fact-check replacements are applied per beat and asserted against the source
// text; every extracted sentence must be consumed exactly once, in order.
import { readFileSync, writeFileSync } from "node:fs";

const YT_ENGINE = "C:/Users/rajna/yt_engine/new_story_script.md";
const OUT = "C:/video_engine/script_beats.md";
const WPM = 170;
const PAUSE = 1.12;
const TARGET = 19 * 60 + 14;

const REPLACEMENTS = [
  // Fact-check lock (editorial-plan.md #1): Planet Fitness 2025 10-K figures.
  ["eighteen point seven million", "twenty point eight million"],
  ["two thousand five hundred gyms", "two thousand eight hundred and ninety-six clubs"],
  ["Eighteen point seven million", "Twenty point eight million"],
];

// Each beat: narration anchor range (from..to, inclusive, in source order),
// editorial rows, and per-beat fact-check replacements.
const BEATS = [
  { name: "COLD OPEN / THE EMPTY GYM", module: "footage", text: "20.8 MILLION MEMBERS", purpose: "hook", question: "How can a gym support this many members?", reveal: "The empty room is the contradiction: huge membership, limited physical capacity.", emotion: "curiosity", camera: "hold", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "IMMEDIATE", hook: "ABOUT 20.8 MILLION MEMBERS", from: "Planet Fitness has about", to: "two thousand five hundred gyms", repl: [0, 1] },
  { name: "THE IMPOSSIBLE RATIO", module: "stat", text: "~7,200 MEMBERS / CLUB", purpose: "turn", question: "What if low attendance is not a failure?", reveal: "Capacity math: 7,200 members per club against 200–350 per room.", emotion: "surprise", camera: "push", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "That's around seven thousand two hundred", to: "three hundred and fifty people" },
  { name: "THE FIRE CODE", module: "compare", text: "4% CLOSES THE CLUB", purpose: "proof", question: "What would happen if members actually came?", reveal: "4% of members would trip the fire marshal; 10% would kill the business.", emotion: "surprise", camera: "punch", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "So if four percent", to: "would not survive the month" },
  { name: "THIS IS THE PRODUCT", module: "payoff", text: "THIS IS THE PRODUCT.", purpose: "reveal", question: "What is the business actually selling?", reveal: "Not managing the risk — selling the absence of customers.", emotion: "recognition", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "This is not a risk", to: "It's the product" },
  { name: "THE $86 ESTIMATE", module: "stat", text: "$86 / ESTIMATED", purpose: "turn", question: "What do people think subscriptions cost?", reveal: "The average guess: $86 a month — C+R Research survey.", emotion: "curiosity", camera: "push", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Here's a number that should bother you", to: "average guess was eighty-six dollars" },
  { name: "THE $219 REALITY", module: "compare", text: "$219 / ITEMIZED", purpose: "proof", question: "What do the same people actually spend?", reveal: "Itemizing the same people: $219 — $133 more than they guessed.", emotion: "surprise", camera: "punch", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "Then they walked the same people", to: "real figure was two hundred and nineteen" },
  { name: "THE $133 GAP", module: "stat", text: "+$133 / MONTH", purpose: "proof", question: "Where does the forgotten money go?", reveal: "54% underestimate by $100+; 4 in 10 still pay for something forgotten.", emotion: "recognition", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "A hundred and thirty-three dollars a month", to: "forgotten they have" },
  { name: "SOMEBODY BUILT IT", module: "evidence", text: "NOT CARELESSNESS", purpose: "escalate", question: "Is the gap an accident?", reveal: "The gap was built in public over thirty years — then it became the default.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "That gap is not carelessness", to: "This is how that happened" },
  { name: "START WITH THE GYM", module: "footage", text: "THE GYM", purpose: "turn", question: "Where does the model become visible?", reveal: "The gym makes the economics visible without hiding behind software.", emotion: "curiosity", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "IMMEDIATE", from: "Start with the gym", to: "easiest to see" },
  { name: "FIXED COSTS", module: "chart", text: "FIXED COSTS", purpose: "explain", question: "Why is a gym's cost structure strange?", reveal: "Building, machines, lease, lights, staff — fixed whether one or a thousand walk in.", emotion: "clarity", camera: "settle", music: "hold", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "A gym has a strange cost structure", to: "all of it is fixed" },
  { name: "PURE PROFIT UNTIL THEY TURN UP", module: "investChart", text: "PROFIT → COST", purpose: "explain", question: "When does a member stop being pure profit?", reveal: "The economics invert the moment the member actually consumes.", emotion: "surprise", camera: "push", music: "hold", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Which means every additional member", to: "economics invert" },
  { name: "THE IDEAL CUSTOMER", module: "footage", text: "PAYS / DOESN'T COME", purpose: "reveal", question: "Who is the ideal customer?", reveal: "The one who pays and never walks in.", emotion: "recognition", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "So the ideal customer is obvious", to: "pays and doesn't come" },
  { name: "TWO-THIRDS UNUSED", module: "stat", text: "UP TO 2/3 UNUSED", purpose: "proof", question: "How common is non-use?", reveal: "Up to two-thirds of memberships go essentially unused; most intended to go in January.", emotion: "surprise", camera: "settle", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Industry estimates put the share", to: "intended to go in January" },
  { name: "BREAKAGE", module: "payoff", text: "BREAKAGE", purpose: "reveal", question: "What is revenue for a service never delivered called?", reveal: "Breakage — the word from the gift-card business.", emotion: "surprise", camera: "hold", music: "drop", silence: "pre / post", sfx: "stamp", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "There's a word for revenue", to: "Breakage" },
  { name: "GIFT CARDS / MILES / CREDIT", module: "icon", text: "ONE-TIME BREAK", purpose: "explain", question: "Where did breakage come from?", reveal: "Gift cards, expired miles, store credit — but each breaks only once.", emotion: "clarity", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "It came from the gift card business", to: "store credit" },
  { name: "EVERY MONTH, FOREVER", module: "timeline", text: "EVERY MONTH", purpose: "escalate", question: "How is subscription breakage different?", reveal: "A subscription breaks every month until someone actively stops it.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "But a gift card only breaks once", to: "actively stops it" },
  { name: "BALLY / THE OLD MODEL", module: "footage", text: "BALLY TOTAL FITNESS", purpose: "proof", question: "Who industrialised this first?", reveal: "Bally: long contracts, three-year commitments, enforced.", emotion: "tension", camera: "push", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "The first companies to industrialise this", to: "it enforced them" },
  { name: "THE 1994 INVESTIGATION", module: "evidence", text: "1994 — FEDERAL REGULATORS", purpose: "proof", question: "What happened when regulators looked at Bally?", reveal: "1994: federal investigation, settled with a penalty and refunds, no admission.", emotion: "tension", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "In 1994, federal regulators investigated", to: "without admitting wrongdoing" },
  { name: "600+ COMPLAINTS", module: "footage", text: "600+ COMPLAINTS", purpose: "proof", question: "Did the first settlement end it?", reveal: "A decade later: NY AG, 600+ complaints, reforms — grace period, clearer cancellation, pro-rata refunds.", emotion: "tension", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "That did not end it", to: "pro-rata refunds" },
  { name: "THE VICTIM WITH A DOCUMENT", module: "evidence", text: "3 YEARS", purpose: "reveal", question: "Why was the contract dangerous?", reveal: "A legal obligation creates a victim who can point at a document.", emotion: "surprise", camera: "push", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "Now, read what happened next", to: "you wouldn't let me" },
  { name: "THE CONTRACT WAS THE WRONG TOOL", module: "payoff", text: "THE CONTRACT WAS THE WRONG TOOL", purpose: "reveal", question: "What did the industry learn?", reveal: "Complaints → attorneys general → settlements — so the next generation removed the contract.", emotion: "surprise", camera: "punch", music: "drop", silence: "pre / post", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "That produces complaints", to: "removed the contract" },
  { name: "PLANET FITNESS REVERSAL", module: "footage", text: "NO THREE-YEAR TRAP", purpose: "turn", question: "What replaced the contract?", reveal: "Planet Fitness: no contract, no collections — friction instead of legal obligation.", emotion: "recognition", camera: "settle", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Planet Fitness will let you cancel", to: "Bally never understood" },
  { name: "LEAVING IS NOT WORTH YOUR AFTERNOON", module: "footage", text: "EFFORT IS THE FRICTION", purpose: "reveal", question: "Why not trap people?", reveal: "You don't need a trap if leaving isn't worth the afternoon.", emotion: "recognition", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "You don't need to trap somebody", to: "worth their afternoon" },
  { name: "$10 BELOW THE THRESHOLD", module: "stat", text: "$10 / MONTH", purpose: "explain", question: "What is the worst price to charge?", reveal: "$99 gets noticed; $10 sits below the effort threshold of cancelling.", emotion: "recognition", camera: "push", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "And here's the part that took real intelligence", to: "to recover ten dollars" },
  { name: "THE $120 / YEAR PUNCH", module: "compare", text: "$10 → $120 / YEAR", purpose: "proof", question: "How do small charges compound?", reveal: "People keep paying because stopping costs more than continuing.", emotion: "recognition", camera: "punch", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "Most people, correctly, decide that's a bad trade", to: "costs more than continuing" },
  { name: "THE INTENTION PRODUCT", module: "icon", text: "THE INTENTION TO GET FIT", purpose: "reveal", question: "What is the gym actually selling?", reveal: "Not fitness — the intention to get fit, billed against your Tuesday evening.", emotion: "recognition", camera: "settle", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "The gym isn't selling you fitness", to: "actual Tuesday evening" },
  { name: "THEY JUST MADE IT VISIBLE", module: "footage", text: "MADE IT VISIBLE", purpose: "escalate", question: "Did the gyms invent this?", reveal: "The gyms made the model visible — software was about to apply it to what you owned.", emotion: "curiosity", camera: "push", music: "swell", silence: "none", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "The gyms didn't invent this", to: "something you already owned" },
  { name: "BUYING SOFTWARE LIKE AN APPLIANCE", module: "footage", text: "YOU OWNED IT", purpose: "turn", question: "How did software ownership work?", reveal: "Buy once — disc, licence key — yours, even if Adobe went out of business.", emotion: "recognition", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "For about twenty years", to: "the disc still worked" },
  { name: "THE SAWTOOTH REVENUE", module: "investChart", text: "REVENUE ARRIVES IN SPIKES", purpose: "explain", question: "What was Adobe's problem?", reveal: "Upgrade spikes then flat stretches — the customer had no reason to re-buy.", emotion: "clarity", camera: "settle", music: "hold", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "The problem, from Adobe's side", to: "another dollar" },
  { name: "MAY 6, 2013", module: "timeline", text: "MAY 6, 2013", purpose: "reveal", question: "What did Adobe announce?", reveal: "Creative Suite finished. No CS7. Only Creative Cloud — a subscription that never ends.", emotion: "surprise", camera: "punch", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "Worse, the software had become good enough", to: "never became yours" },
  { name: "THE BACKLASH", module: "evidence", text: "HOSTAGE-TAKING", purpose: "escalate", question: "How did customers react?", reveal: "Furious: petition, hostage-taking press, files you could no longer open. Adobe did it anyway.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "The reaction was genuinely furious", to: "Adobe did it anyway" },
  { name: "THE NUMBERS", module: "investChart", text: "$1.23B → $18.28B", purpose: "proof", question: "Did the model work financially?", reveal: "Subscription revenue $1.23B (2013) → $18.28B (2023); company revenue $4.4B → $15B+; 30M+ subscribers.", emotion: "surprise", camera: "hold", music: "quiet", silence: "pre / post", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "Here's what happened", to: "more than thirty million" },
  { name: "NOT 15× BETTER", module: "compare", text: "OWNED → RENTED", purpose: "reveal", question: "What actually changed?", reveal: "Not the product — the ownership. Bought once became rented forever.", emotion: "surprise", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "And notice what did not cause that", to: "what they've already made" },
  { name: "THE BACKLASH DOESN'T MATTER", module: "footage", text: "ANGER ≠ CHURN", purpose: "escalate", question: "What did other companies learn?", reveal: "The lesson taken: the backlash doesn't matter — people subscribed anyway.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "That result did not go unnoticed", to: "then they subscribed" },
  { name: "STREAMING RESET", module: "evidence", text: "2013 / 2023", purpose: "turn", question: "Where is the model's clearest proof?", reveal: "The thing that was supposed to be the opposite of subscriptions.", emotion: "curiosity", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "IMMEDIATE", from: "The clearest proof that the model won", to: "model's opposite" },
  { name: "THE BUNDLE", module: "footage", text: "THE BUNDLE", purpose: "explain", question: "What was the argument against cable?", reveal: "200 channels, watched 9 — the most resented recurring charge; streaming sold as the escape.", emotion: "recognition", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "For years, the argument against cable", to: "no box, no installer" },
  { name: "THE CATALOGUE SPLITS", module: "icon", text: "ANOTHER PAYMENT", purpose: "escalate", question: "What happened to the escape?", reveal: "Studios kept their catalogues; the show moved; now four or five subscriptions at once.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "And for a while it was exactly that", to: "four or five subscriptions at once" },
  { name: "THE NEW BUNDLE", module: "stat", text: "4.7 SERVICES / $61", purpose: "proof", question: "Did streaming rebuild the bundle?", reveal: "By 2025: 4.7 services / $61 a month — JD Power 2025, up from $48 two years earlier.", emotion: "recognition", camera: "push", music: "quiet", silence: "pre / post", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "By 2025, survey work put", to: "past a hundred and twenty dollars" },
  { name: "SIX SMALL BILLS", module: "compare", text: "SIX SMALL BILLS", purpose: "reveal", question: "What did the industry rebuild?", reveal: "One large bill is a thing you argue with. Six small ones are a thing you stop noticing.", emotion: "recognition", camera: "push", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "Which is roughly what cable cost", to: "you stop noticing" },
  { name: "STREAMFLATION", module: "chart", text: "STREAMFLATION", purpose: "explain", question: "What mechanism reassembled the bill?", reveal: "Each modest price rise alone feels petty; together they rebuild the exact bill you left.", emotion: "clarity", camera: "settle", music: "hold", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "There's a term for the mechanism", to: "exact bill everybody had left" },
  { name: "THE MODEL EVERYWHERE", module: "icon", text: "WAITING BEHIND A PAYMENT", purpose: "escalate", question: "Where did the model spread?", reveal: "Cars, printers, doorbells, appliances — features in things you own. Making it hard to leave is the product.", emotion: "tension", camera: "push", music: "swell", silence: "post", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "Within a few years the model was everywhere", to: "Making it hard to leave" },
  { name: "FTC SUES AMAZON", module: "footage", text: "IT WAS ABOUT A BUTTON", purpose: "turn", question: "What was the FTC's case about?", reveal: "Enrollment without understanding — dark patterns: the expensive choice is the easy one.", emotion: "tension", camera: "push", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "In 2023, the Federal Trade Commission sued Amazon", to: "you have to look for" },
  { name: "MILLIONS PAYING", module: "evidence", text: "MILLIONS ENROLLED", purpose: "escalate", question: "How many people were affected?", reveal: "Millions paying for a subscription they never knowingly started — but the famous part was cancelling.", emotion: "tension", camera: "push", music: "swell", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Millions of people, the FTC alleged", to: "tried to cancel" },
  { name: "THE CANCELLATION MAZE", module: "footage", text: "ARE YOU SURE?", purpose: "escalate", question: "What does the cancellation flow do?", reveal: "Page after page: confirms, reasons to stay, smaller continue buttons than abandon buttons.", emotion: "tension", camera: "push", music: "swell", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "To leave Prime, a customer had to move", to: "button that abandoned it" },
  { name: "ILIAD", module: "payoff", text: "ILIAD", purpose: "reveal", question: "What did Amazon employees call it?", reveal: "Iliad — a name for the sequence that would not end.", emotion: "surprise", camera: "hold", music: "drop", silence: "pre / post", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "Internally, Amazon employees had a name", to: "Iliad", repl: [3] },
  { name: "A TEN-YEAR WAR", module: "footage", text: "A WAR THAT LASTED TEN YEARS", purpose: "explain", question: "Why the name Iliad?", reveal: "Somebody inside Amazon saw a path that famously would not end — and they kept it.", emotion: "tension", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "They named it after Homer's epic", to: "named it, and they kept it" },
  { name: "SEP 25, 2025", module: "evidence", text: "SEP 25, 2025", purpose: "proof", question: "How did the case end?", reveal: "Mid-trial, Amazon settled.", emotion: "surprise", camera: "settle", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "On the twenty-fifth of September", to: "Amazon settled" },
  { name: "$2.5 BILLION", module: "stat", text: "$2.5 BILLION", purpose: "proof", question: "How big was the settlement?", reveal: "$2.5B: $1B civil penalty — largest ever for an FTC rule — $1.5B refunds.", emotion: "surprise", camera: "hold", music: "drop", silence: "pre / post", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "Two and a half billion dollars", to: "meaningfully agreeing to it" },
  { name: "ADOBE SUED TOO", module: "evidence", text: "BURIED IN FINE PRINT", purpose: "proof", question: "Was Amazon alone?", reveal: "June 2024: DOJ sued Adobe over a buried early-termination fee hidden in fine print.", emotion: "tension", camera: "pull", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Amazon was not alone", to: "designed to go unnoticed" },
  { name: "THE FEE", module: "stat", text: "50% OF REMAINING CONTRACT", purpose: "proof", question: "What was the hidden fee?", reveal: "Half of the remaining contract — month four, leaving cost half of eight months. Adobe paid $75M.", emotion: "tension", camera: "settle", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "The fee itself was fifty percent", to: "seventy-five million dollars to settle it" },
  { name: "THE SAME UNDERLYING THING", module: "compare", text: "$2.5B / $75M", purpose: "escalate", question: "What did both cases share?", reveal: "Two of the largest companies, penalised within two years, for making it hard to stop paying.", emotion: "tension", camera: "push", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Two of the largest companies", to: "hard to stop paying" },
  { name: "SOMEBODY WROTE A RULE", module: "footage", text: "SOMEBODY WROTE A RULE", purpose: "turn", question: "If the cases win, what next?", reveal: "The obvious question — and somebody did.", emotion: "relief", camera: "push", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "IMMEDIATE", from: "Which raises the obvious question", to: "Somebody did" },
  { name: "CLICK-TO-CANCEL", module: "compare", text: "START = STOP", purpose: "reveal", question: "What did click-to-cancel demand?", reveal: "Symmetry: whatever effort to begin, no more to end.", emotion: "relief", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "It was called click-to-cancel", to: "demand to end — and no more" },
  { name: "THE CHALLENGE", module: "timeline", text: "JUL 8, 2025", purpose: "escalate", question: "Who opposed the rule?", reveal: "Companies and the largest trade associations fought it hard.", emotion: "tension", camera: "push", music: "swell", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Companies fought it hard", to: "in the country" },
  { name: "JULY 8, 2025", module: "evidence", text: "JUL 8, 2025 — VACATED", purpose: "proof", question: "What happened days before the rule took effect?", reveal: "The Eighth Circuit struck it down. Entirely.", emotion: "surprise", camera: "punch", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "On the eighth of July", to: "Entirely" },
  { name: "NOT ABOUT THE RULE", module: "evidence", text: "NOT WRONG / NOT UNFAIR", purpose: "explain", question: "Did the court reject the rule's substance?", reveal: "No — the FTC failed to carry out a required preliminary regulatory analysis.", emotion: "clarity", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "And here's the detail worth sitting with", to: "regulate subscriptions" },
  { name: "PROCEDURE", module: "payoff", text: "PROCEDURE", purpose: "reveal", question: "What killed the rule?", reveal: "A paperwork failure — years of rulemaking vacated days before the deadline.", emotion: "surprise", camera: "hold", music: "drop", silence: "pre / post", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", from: "It struck the rule down on procedure", to: "because of a missing analysis" },
  { name: "2026: NO FEDERAL RULE", module: "timeline", text: "NO FEDERAL RULE IN FORCE", purpose: "proof", question: "What is the status in 2026?", reveal: "No federal click-to-cancel rule in effect; FTC restarting; states have their own laws.", emotion: "clarity", camera: "hold", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "So as of right now, in 2026", to: "does not exist" },
  { name: "THE FRICTION IS STILL LEGAL", module: "evidence", text: "STILL LEGAL", purpose: "proof", question: "What does no federal rule mean?", reveal: "Retention screens, six-page flows, phone-call cancellation — still legal.", emotion: "tension", camera: "settle", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "Which means the friction is still legal", to: "phone call to end is legal" },
  { name: "NOT AN OVERSIGHT", module: "payoff", text: "DELIBERATE / DOCUMENTED / PROFITABLE", purpose: "reveal", question: "Is this an oversight?", reveal: "A deliberate, documented, profitable design — reviewed, and left in place.", emotion: "recognition", camera: "settle", music: "drop", silence: "pre", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "Not an oversight", to: "left in place" },
  { name: "GO BACK TO WHERE THIS STARTED", module: "footage", text: "20.8M MEMBERS / A FEW HUNDRED FIT", purpose: "payoff", question: "Why return to the empty gym?", reveal: "The business works because the people paying are not there.", emotion: "satisfaction", camera: "hold", music: "quiet", silence: "post", caption: "EMPHASIS", revealMode: "IMMEDIATE", loop: "true", from: "Go back to where this started", to: "are not there", repl: [2] },
  { name: "THE LINK", module: "compare", text: "PAY → RECEIVE", purpose: "explain", question: "What kept old business honest?", reveal: "If it stopped delivering, you stopped paying — that link was the discipline.", emotion: "clarity", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "For most of economic history", to: "discipline of the thing" },
  { name: "THE SEVERED LINK", module: "chart", text: "PAYMENT CONTINUES", purpose: "reveal", question: "What did subscriptions break?", reveal: "The payment continues on its own until you act — action the company makes harder than you can be bothered with.", emotion: "recognition", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "PROGRESSIVE", from: "The subscription economy severed that link", to: "than you can be bothered with" },
  { name: "THE $133 GAP REFRAMED", module: "stat", text: "THE GAP", purpose: "proof", question: "What is the $133 gap really?", reveal: "The measured output of a system built to convert attention into revenue.", emotion: "clarity", camera: "hold", music: "quiet", silence: "pre", caption: "EMPHASIS", revealMode: "COUNTER_REVEAL", from: "That's what the hundred and thirty-three dollar gap actually is", to: "your inattention is the raw material" },
  { name: "THE ONLY USEFUL THING", module: "footage", text: "CHECK THE LAST 12 MONTHS", purpose: "explain", question: "What can you do with this?", reveal: "Search twelve months of statements for same-amount, same-date charges.", emotion: "relief", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "SEQUENTIAL", from: "So here's the only useful thing", to: "renewing silently ever since" },
  { name: "KEEP WHAT YOU WANT", module: "icon", text: "THAT'S A CHOICE", purpose: "payoff", question: "Do you have to cancel everything?", reveal: "Some you'll keep — that's fine. That's a choice.", emotion: "satisfaction", camera: "settle", music: "quiet", silence: "none", caption: "EMPHASIS", revealMode: "IMMEDIATE", parts: [["Some of them you'll want to keep", "That's a choice"], ["Right now, for most people, it isn't", "still running"]] },
  { name: "FINAL THESIS / HARD STOP", module: "payoff", text: "THE POINT IS THAT IT SHOULD BE A CHOICE.", purpose: "payoff", reveal: "It should be a choice — right now it's just the last thing you agreed to, still running.", emotion: "satisfaction", camera: "hold", music: "drop", silence: "post", caption: "EMPHASIS", revealMode: "HIDDEN_THEN_REVEAL", loop: "Return to the empty-gym motif so the final frame conceptually rhymes with the opening.", reorder: true, parts: [["The point is that it should be a choice", "should be a choice"]] },
];

// Per-beat extra replacements beyond the global fact-check lock.
const EXTRA = [
  ['"Iliad."', "Iliad."],
];

// ------------------------------------------------------------------ extract
const src = readFileSync(YT_ENGINE, "utf8");
const body = src.slice(src.indexOf("### COLD OPEN"), src.indexOf("## 5. FACT-CHECK APPENDIX"));
const narration = body
  .split("\n")
  .map((l) => l.trim().replace(/^`|`$/g, ""))
  .filter((l) => l && !/^\[/.test(l) && l !== "**NARRATION**" && !/^### /.test(l) && !/^-{3,}$/.test(l))
  .join(" ")
  .replace(/\*\*/g, "")
  .replace(/\*([^*]+?)\*/g, "$1")
  .replace(/\s+/g, " ");
const sentences = narration.split(/(?<=[.!?"])\s+/).map((s) => s.trim()).filter(Boolean);

if (process.argv.includes("--list")) {
  sentences.forEach((s, i) => console.log(`${String(i).padStart(3)}  ${s}`));
  console.log(`\n${sentences.length} sentences · ${words(narration)} words`);
  process.exit(0);
}

// ------------------------------------------------------------------- assign
const used = new Array(sentences.length).fill(false);
let cursor = 0;
const beats = [];
for (const cfg of BEATS) {
  const parts = cfg.parts ?? [[cfg.from, cfg.to]];
  const voParts = [];
  for (const [fromA, toA] of parts) {
    const startIdx = cfg.reorder ? 0 : cursor;
    const fromIdx = sentences.findIndex((s, i) => i >= startIdx && !used[i] && s.includes(fromA));
    if (fromIdx < 0) throw new Error(`from-anchor not found for beat "${cfg.name}": "${fromA}"`);
    const toIdx = sentences.findIndex((s, i) => i >= fromIdx && !used[i] && s.includes(toA));
    if (toIdx < 0) throw new Error(`to-anchor not found for beat "${cfg.name}": "${toA}"`);
    for (let i = fromIdx; i <= toIdx; i++) {
      if (used[i]) throw new Error(`sentence ${i} double-consumed at beat "${cfg.name}"`);
      used[i] = true;
    }
    voParts.push(sentences.slice(fromIdx, toIdx + 1).join(" "));
    if (!cfg.reorder) cursor = toIdx + 1;
  }
  let vo = voParts.join(" ");
  for (const i of cfg.repl ?? []) {
    const [find, replace] = i < REPLACEMENTS.length ? REPLACEMENTS[i] : EXTRA[i - REPLACEMENTS.length];
    if (!vo.includes(find)) throw new Error(`replacement "${find}" not present in beat "${cfg.name}"`);
    vo = vo.replaceAll(find, replace);
  }
  beats.push({ ...cfg, vo });
}
const leftover = used.findIndex((u) => !u);
if (leftover >= 0) {
  throw new Error(
    `narration not fully consumed: sentence ${leftover} unused — "${sentences[leftover]?.slice(0, 70)}..."`,
  );
}

// ----------------------------------------------------------------- durations
const totalWords = beats.reduce((n, b) => n + words(b.vo), 0);
const secs = (b) => Math.max(4, Math.round((words(b.vo) / WPM) * 60 * PAUSE));
let t = 0;
for (const b of beats) {
  b.start = t;
  b.dur = secs(b);
  t += b.dur;
}
beats[beats.length - 1].end = t;
for (const b of beats) b.end = b.start + b.dur;
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ------------------------------------------------------------------- checks
const flashy = new Set(["stat", "compare", "payoff", "icon", "chart", "investChart", "timeline"]);
const adjacency = [];
for (let i = 1; i < beats.length; i++) {
  if (flashy.has(beats[i].module) && beats[i].module === beats[i - 1].module) {
    adjacency.push(`beats ${i}/${i + 1} both ${beats[i].module}`);
  }
}
const hook = beats[0].hook ?? beats[0].text;
if (hook.length > 46) throw new Error(`frame-one hook ${hook.length} chars (>46)`);

// -------------------------------------------------------------------- emit
const rows = (b) =>
  [
    ["Audio", b.vo],
    ["Visual", `${VISUAL_TMPL[b.module]} ${b.name}`.trim()],
    ["On-screen text", b.text],
    ["Module", b.module],
    ["Purpose", b.purpose],
    ["Question", b.question],
    ["Reveal", b.reveal],
    ["Emotion", b.emotion],
    ...(b.hook ? [["Hook", b.hook]] : []),
    ...(b.loop ? [["Loop", b.loop]] : []),
    ["Camera", b.camera],
    ["Music", b.music],
    ["Silence", b.silence],
    ...(b.sfx ? [["Sfx", b.sfx]] : []),
    ["Caption mode", b.caption],
    ["Reveal mode", b.revealMode],
  ]
    .filter(([, v]) => v != null && String(v) !== "undefined" && String(v) !== "")
    .map(([k, v]) => `| **${k}** | ${v} |`)
    .join("\n");

const VISUAL_TMPL = {
  footage: "B-roll:",
  stat: "One number, paper background —",
  compare: "Two-sided contradiction card —",
  payoff: "Closing payoff card —",
  evidence: "Document/evidence on paper background —",
  chart: "Rising line chart, paper background —",
  investChart: "Trend chart, paper background —",
  timeline: "Chronological timeline —",
  icon: "Icon card —",
};

const md = `# The Company That Sells You Nothing

**Style:** Documentary — faceless long-form finance

**Format:** Landscape 16:9

> Narration sliced verbatim from \`yt_engine/new_story_script.md\` (canonical 19:14 script) by
> \`tools/build-longform-beats.mjs\`; scene structure follows \`yt_engine/editorial-plan.md\`.
> Fact-check lock applied: Planet Fitness 20.8M members / 2,896 clubs (2025 10-K); \$86/\$219/\$133 = C+R Research survey;
> Adobe = SEC FY2023 figures; streaming = JD Power 2025 (4.7 services / \$61); Amazon = FTC settlement Sep 25, 2025
> (\$2.5B = \$1B penalty + \$1.5B refunds); Eighth Circuit vacated click-to-cancel Jul 8, 2025 on procedure.

${beats
  .map(
    (b, i) =>
      `### BEAT ${i + 1} — ${b.name} (${fmt(b.start)}–${fmt(b.end)})\n\n${rows(b)}\n`,
  )
  .join("\n")}
## FACT-CHECK LOCK (for human review — not parsed by the pipeline)

- Planet Fitness: 20.8M members / 2,896 clubs (SEC 2025 10-K) — figures baked into beats 1 and 61.
- \$86 / \$219 / \$133: C+R Research survey (n=1,000) — label the source on screen, beats 5–7.
- Adobe: subscription revenue \$1.23B (2013) → \$18.28B (2023), total revenue \$4.4B → \$15B+, 30M+ CC subscribers (SEC) — beats 32–33.
- Amazon: FTC settlement Sep 25, 2025 — \$2.5B = \$1B penalty + \$1.5B refunds — beat 48.
- Click-to-cancel: Eighth Circuit vacated Jul 8, 2025 on procedural grounds; FTC restarted rulemaking 2026 — recheck federal status before publishing — beats 55–59.
- Streaming: JD Power 2025 — 4.7 services / \$61/mo — label methodology — beat 38.
- Bally: 1994 federal action (penalty + refunds, no admission); NY AG 2004, 600+ complaints — beats 18–19.
- Adobe/DOJ: June 2024 suit over early-termination fee (50% of remaining contract); \$75M settlement — beats 49–50.
`;

writeFileSync(OUT, md);

// ------------------------------------------------------------------ report
console.log(`${OUT}\n  ${beats.length} beats · ${totalWords} words · ${fmt(t)} (target ${fmt(TARGET)}, ${t - TARGET >= 0 ? "+" : ""}${t - TARGET}s)`);
console.log(`  modules: ${beats.map((b) => b.module).join(" → ")}`);
console.log(`  wpm: ${(totalWords / (t / 60)).toFixed(1)} spoken incl. ${Math.round((PAUSE - 1) * 100)}% pause budget`);
if (adjacency.length) console.log(`  adjacency: ${adjacency.join("; ")}`);
console.log(`  frame 1 hook (${hook.length} chars): "${hook}"`);

function words(s) {
  return (s.match(/[\w'-]+/g) ?? []).length;
}
