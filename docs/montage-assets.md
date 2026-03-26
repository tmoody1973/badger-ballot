# Montage assets and Remotion prompt

For Shot 2 of the demo video: "The problem — the overwhelm."

## The stat

**38% of Wisconsin voters have heard NOTHING about the Supreme Court race — 12 days before the election.**
Source: Marquette Law School Poll, March 11-18, 2026 ([link](https://today.marquette.edu/2026/03/new-marquette-law-school-poll-finds-majorities-of-registered-voters-still-undecided-in-wisconsin-supreme-court-race-with-taylor-leading-lazar-among-likely-voters/))

Also: 53% undecided. Only 6% said they had "heard a lot" about the race.

## Links by category

### Legitimate but overwhelming sources (the "too much to research" tabs)
- https://myvote.wi.gov/en-us/ — State election site, dense government UI
- https://ballotpedia.org/Wisconsin_elections,_2026 — Wall of text, every race listed
- https://www.wisdc.org/follow-the-money/151-campaign-finance-profiles-2026/7943-campaign-2026-supreme-court — Wisconsin Democracy Campaign money tracker
- https://www.milwaukeemag.com/candidates-wisconsin-governor-2026/ — "Here Are All the Candidates Running for Governor" — eleven people

### Nobody knows what's happening (the proof)
- https://wislawjournal.com/2026/03/25/most-voters-still-undecided-in-supreme-court-vote/ — "Most voters still undecided in Supreme Court vote"
- https://today.marquette.edu/2026/03/new-marquette-law-school-poll-finds-majorities-of-registered-voters-still-undecided-in-wisconsin-supreme-court-race-with-taylor-leading-lazar-among-likely-voters/ — 38% heard NOTHING, 53% undecided
- https://badgerherald.com/news/wisconsin/2026/03/25/wisconsin-supreme-court-race-sees-decline-in-campaign-spending-voter-awareness/ — "Decline in voter awareness"

### Misleading ads and outside money
- https://www.brennancenter.org/our-work/research-reports/buying-time-2026-wisconsin — Brennan Center ad spending tracker
- https://wislawjournal.com/2026/03/13/aclu-spends-450k-in-wisconsin-supreme-court-race-ads/ — ACLU $450K ad buy
- https://www.wbay.com/2026/03/24/wisconsin-supreme-court-race-poll-shows-taylor-leading-lazar-ahead-debate/ — references "noncitizen voting" attack ad

### Same amendment, opposite framing (contradiction montage)
- https://civicmedia.us/news/2026/01/24/vote-no-on-november-gop-ballot-amendment-to-ban-dei-in-wisconsin-government — "Vote NO on GOP Ballot Amendment to Ban DEI"
- https://will-law.org/will-backed-equality-amendment-on-november-2026-ballot/ — "WILL-Backed Equality Amendment" (same amendment, opposite framing)
- https://ballotpedia.org/Wisconsin_2026_ballot_measures — Dense legal language for all 3 amendments

### AI misinformation in 2026
- https://www.aicerts.ai/news/how-political-misinformation-deepfakes-threaten-2026-elections/ — "58% expect synthetic lies to escalate"
- https://www.cnn.com/2026/03/13/politics/james-talarico-ai-deepfake-republicans-midterms — GOP released AI deepfake of a Democratic candidate
- https://www.weforum.org/stories/2026/03/how-cognitive-manipulation-and-ai-will-shape-disinformation-in-2026/ — WEF on AI disinfo in 2026

---

## Remotion prompt for the montage

Paste this into Claude Code with Remotion installed. It follows the scene-by-scene structure from the [Remotion Prompt Gallery](https://www.remotion.dev/prompts/) and uses spring() animations per [Remotion AI best practices](https://www.remotion.dev/docs/ai/generate).

```
Create a Remotion composition called "ElectionOverwhelm" — an 8-second montage (1920x1080, 30fps, 240 frames) showing the information overload problem facing Wisconsin voters. This is Shot 2 of a hackathon demo video.

Color palette:
- Background: #0a0a0a (near black)
- Text: #ffffff
- Accent red: #dc2626 (for alarming stats)
- Accent blue: #002986 (Wisconsin blue)
- Accent gold: #FFCC18 (Wisconsin gold)
- Muted: #71717a (for secondary text)

Fonts: Inter for headlines, JetBrains Mono for stats.

The composition has 5 rapid-fire segments. Each segment appears with a spring() animation (config: { damping: 15, mass: 0.5 }), holds briefly, then cuts hard to the next. No smooth transitions — hard cuts create urgency.

SEGMENT 1 (frames 0-50): "The volume"
A stack of headlines slides in from the bottom, one after another, 8 frames apart:
- "Here Are All 11 Candidates Running for Governor" (source: Milwaukee Magazine)
- "Supreme Court Race: Taylor vs. Lazar" (source: WPR)
- "3 Constitutional Amendments Heading to November Ballot" (source: Wisconsin Examiner)
- "72 School Referenda on April 7 Ballot" (source: Ballotpedia)
- "Open Governor's Race Headlines Wisconsin 2026" (source: Wisconsin Independent)
Headlines stack and overlap slightly — visually overwhelming. Each headline is a white card with black text, slight drop shadow, slightly rotated (-2deg to +2deg alternating).

SEGMENT 2 (frames 51-95): "Nobody knows"
Hard cut. Black screen. Then the stat punches in, large and centered:
"38%" in #dc2626, 180px bold Inter
Below it, smaller: "of Wisconsin voters have heard NOTHING about the Supreme Court race"
Below that, muted: "— Marquette Law School Poll, March 2026"
The 38% number should scale from 0.8 to 1.0 with a spring() over 15 frames. Add a subtle screen shake (translateX oscillation, 2px amplitude, 3 cycles) when it lands.

SEGMENT 3 (frames 96-140): "The contradictions"
Split screen, left and right:
Left card (blue tint): "WILL-Backed Equality Amendment on November Ballot"
Right card (red tint): "Vote NO on GOP Ballot Amendment to Ban DEI"
Below both: "Same amendment. Opposite framing." in muted text.
The two cards slide in from opposite sides with spring() and meet in the center. Hold for 1 second.

SEGMENT 4 (frames 141-190): "The misinformation"
Three lines appear sequentially, typewriter style (15ms per character):
Line 1: "GOP releases AI deepfake of Democratic candidate" (source: CNN)
Line 2: "58% of Americans expect synthetic lies to escalate" (source: AI CERTs)
Line 3: "TikTok claims Wisconsin votes in June. It doesn't."
Each line appears below the previous. Line 3 should have "It doesn't." in #dc2626 bold.

SEGMENT 5 (frames 191-240): "The ask"
Hard cut to black. Pause 10 frames. Then fade in (opacity 0 to 1 over 20 frames):
"How is anyone supposed to figure this out?"
White text, 48px Inter, centered. Hold to end.

Technical notes:
- Use useCurrentFrame() and useVideoConfig() from 'remotion'
- Use spring() from 'remotion' for all animations
- Use interpolate() for opacity and position transitions
- Keep the component self-contained with no external dependencies
- All text is hardcoded (no external data fetching)
- Export as a named export called ElectionOverwhelm
```

---

## How to use this

1. Install Remotion: `npx create-video@latest`
2. Paste the prompt above into Claude Code (with Remotion skills loaded)
3. It generates the React component
4. Render: `npx remotion render ElectionOverwhelm --output montage.mp4`
5. Drop the 8-second clip into your video editor at the Shot 2 timestamp

The montage replaces the "tabs open" direction from the script. It's faster, punchier, and the stats do the work instead of static screenshots.
