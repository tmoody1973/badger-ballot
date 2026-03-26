# Remotion build prompts — paste these into Claude Code

## Before you start

```bash
# 1. Create the Remotion project (if you don't have one)
npx create-video@latest ballot-badger-video

# 2. Install fonts
npm install @remotion/google-fonts

# 3. Drop your recorded assets into public/
#    public/recordings/hook-on-camera.mp4
#    public/recordings/app-load.mp4
#    public/recordings/tiffany-research.mp4
#    public/recordings/voter-lookup.mp4
#    public/recordings/ballot-preview.mp4
#    public/recordings/close-on-camera.mp4
#    public/recordings/animated-badger.mp4
#    public/voiceover/scene-02-problem.mp3
#    public/voiceover/scene-03-turn.mp3
#    public/voiceover/scene-04-research.mp3
#    public/voiceover/scene-05-voter-lookup.mp3
#    public/voiceover/scene-06-ballot.mp3
#    public/branding/badger-ballot-logo.svg
#    public/music/bg-beat.mp3
```

## Prompt 0: Project setup

Paste this first to establish the project skeleton:

```
I'm building a hackathon demo video in Remotion. Set up the project structure:

1. Create src/lib/colors.ts with these brand constants:
   - DARK_BG: "#0a0a0a"
   - LIGHT_BG: "#F8F7F4"
   - WI_BLUE: "#002986"
   - WI_GOLD: "#FFCC18"
   - ALERT_RED: "#dc2626"
   - MUTED: "#71717a"

2. Create src/lib/fonts.ts that loads DM Sans, Public Sans, and JetBrains Mono from @remotion/google-fonts

3. Create src/Root.tsx that registers two compositions:
   - BallotBadgerFull: 1920x1080, 30fps, 2850 frames (~95 seconds)
   - BallotBadgerReels: 1080x1920, 30fps, 1650 frames (~55 seconds)

4. Create the scene files as empty placeholder components:
   - src/scenes/HookScene.tsx
   - src/scenes/ProblemMontage.tsx
   - src/scenes/TurnScene.tsx
   - src/scenes/ResearchScene.tsx
   - src/scenes/VoterLookupScene.tsx
   - src/scenes/BallotScene.tsx
   - src/scenes/CloseScene.tsx
   - src/scenes/BadgerScene.tsx
   - src/scenes/EndCardScene.tsx

5. Create src/BallotBadgerFull.tsx that uses <Series> to sequence all scenes with these durations:
   - HookScene: 360 frames
   - ProblemMontage: 300 frames
   - TurnScene: 150 frames
   - ResearchScene: 630 frames
   - VoterLookupScene: 450 frames
   - BallotScene: 210 frames
   - CloseScene: 360 frames
   - BadgerScene: 240 frames
   - EndCardScene: 150 frames

Use Remotion best practices: useCurrentFrame(), useVideoConfig(), spring(), interpolate(), <Series>, <Audio>, <OffthreadVideo>.
```

---

## Prompt 1: Scene 2 — The problem montage (the only complex motion graphics scene)

This is the key scene you need Remotion for. Everything else is mostly imported video.

```
Build src/scenes/ProblemMontage.tsx — a 10-second (300 frames, 30fps) motion graphics sequence on a #0a0a0a background. This is the "information overload" montage for a civic tech hackathon video about Wisconsin's 2026 elections.

Use spring() from 'remotion' for all animations. Use interpolate() for opacity/position. Import colors and fonts from ../lib/colors and ../lib/fonts.

The scene has 5 segments with HARD CUTS (no transitions) between them:

SEGMENT A (frames 0-60): "The volume"
5 white headline cards (#ffffff bg, #0a0a0a text) stack from bottom, one every 10 frames. Each card is ~600px wide, 18px DM Sans bold, with a 2px #1a1a1a border and slight drop shadow. Alternate rotation -2deg/+2deg. They overlap slightly to feel overwhelming.
Headlines:
- "Here Are All 11 Candidates Running for Governor"
- "Supreme Court Race: Taylor vs. Lazar"
- "3 Constitutional Amendments on November Ballot"
- "72 School Referenda on April 7 Ballot"
- "Open Governor's Race Headlines Wisconsin 2026"
Each has a small source label below (Milwaukee Magazine, WPR, etc.) in 12px JetBrains Mono #71717a.

SEGMENT B (frames 61-130): "The stat"
Hard cut to #0a0a0a. Center of screen:
- "38%" in #dc2626, 200px JetBrains Mono bold — spring scale from 0.8→1.0 (damping: 12)
- Below: "of Wisconsin voters have heard NOTHING" — white, 36px DM Sans
- Below: "about the Supreme Court race" — #71717a, 24px
- Below: "— Marquette Law School, March 2026" — #71717a, 14px JetBrains Mono
Add a screen shake when the 38% lands: translateX oscillates 2px amplitude, 3 cycles over 8 frames.

SEGMENT C (frames 131-195): "The contradiction"
Two cards slide in from opposite sides (spring, damping: 15):
- Left card: blue-tinted left border (#002986), text: "WILL-Backed Equality Amendment"
- Right card: red-tinted left border (#dc2626), text: "Vote NO on GOP Amendment to Ban DEI"
Below both, centered: "Same amendment." in white 28px DM Sans, fades in 15 frames after cards land.

SEGMENT D (frames 196-260): "The misinformation"
Three lines appear with typewriter effect (1 character every 2 frames):
Line 1: "GOP releases AI deepfake of candidate — CNN"
Line 2: "58% expect synthetic lies to escalate — AI CERTs"
Line 3: "TikTok says Wisconsin votes in June. It doesn't."
Line 3: "It doesn't." portion is #dc2626 bold.
Each line is 24px Public Sans on #0a0a0a, left-aligned with 40px left margin. Lines spaced 50px apart vertically, centered on screen.

SEGMENT E (frames 261-300): "The ask"
Hard cut to #0a0a0a. 8 frame pause (empty). Then fade in (opacity 0→1 over 20 frames):
"How is anyone supposed to figure this out?"
White, 44px DM Sans, centered horizontally and vertically. Hold to end.

Export as a named export ProblemMontage.
```

---

## Prompt 2: Scene 9 — End card

```
Build src/scenes/EndCardScene.tsx — a 5-second (150 frames, 30fps) end card.

Frames 0-30: Fade to #0a0a0a (if previous scene isn't already black, use interpolate on a full-screen overlay opacity 0→1).
Frames 31-45: Hold black.
Frames 46 onward: Elements fade in, centered on #0a0a0a background:

1. Ballot Badger logo — use <Img> loading from "/branding/badger-ballot-logo.svg", 200px wide, centered. Opacity 0→1 and scale spring 0.9→1.0 (damping: 20) starting at frame 46.

2. "badger-ballot.vercel.app" — 24px JetBrains Mono, color #FFCC18 (gold), 20px below logo. Fades in at frame 56.

3. Tech logos row — three <Img> tags loading ElevenLabs, Firecrawl, Groq SVGs from /branding/. Each 40px tall, grayscale (#71717a tint via CSS filter), spaced 30px apart, centered. Stagger in left to right starting frame 66, 5 frames apart.

4. "@firecrawl @elevenlabs #ElevenHacks" — 14px Public Sans, #71717a, 30px below logos. Fades in at frame 86.

Hold all elements to frame 150.

Export as a named export EndCardScene.
```

---

## Prompt 3: Video import scenes (batch — these are simpler)

```
Build these 6 scenes that import pre-recorded video files. Each uses <OffthreadVideo> from 'remotion'. Use the same color/font imports.

1. src/scenes/HookScene.tsx (360 frames)
   Video: staticFile("recordings/hook-on-camera.mp4")
   Overlay: lower-third at frame 60-240 — "Tarik Moody · Milwaukee, WI" in 18px DM Sans white, bottom-left with 40px padding, semi-transparent #0a0a0a80 background pill. Spring fade in, fade out.
   Motion: Subtle slow zoom scale 1.0→1.03 over full duration using interpolate.

2. src/scenes/TurnScene.tsx (150 frames)
   Video: staticFile("recordings/app-load.mp4")
   Overlay: "badger-ballot.vercel.app" in 16px JetBrains Mono #71717a, bottom-left, appears at frame 60, holds to end.
   Transition: First 15 frames crossfade from black (opacity overlay 1→0).

3. src/scenes/ResearchScene.tsx (630 frames)
   Video: staticFile("recordings/tiffany-research.mp4")
   Audio: <Audio> from staticFile("voiceover/scene-04-research.mp3") starting at frame 150, volume 0.7.
   Note: The raw video includes the live agent audio. The voiceover fades in over it.

4. src/scenes/VoterLookupScene.tsx (450 frames)
   Video: staticFile("recordings/voter-lookup.mp4")
   Audio: <Audio> from staticFile("voiceover/scene-05-voter-lookup.mp3")
   Motion: At frame 300 (when the card appears), zoom from 1.0→1.15 centered on the middle of the screen, spring (damping: 20).

5. src/scenes/BallotScene.tsx (210 frames)
   Video: staticFile("recordings/ballot-preview.mp4")
   Audio: <Audio> from staticFile("voiceover/scene-06-ballot.mp3")
   Motion: Subtle zoom 1.0→1.05 over full duration.

6. src/scenes/CloseScene.tsx (360 frames)
   Video: staticFile("recordings/close-on-camera.mp4")
   Motion: Same subtle zoom as HookScene.

7. src/scenes/BadgerScene.tsx (240 frames)
   Video: staticFile("recordings/animated-badger.mp4")
   No overlays. Play as-is.

All scenes: use absoluteFill for the video container, objectFit "cover". Export each as a named export.
```

---

## Prompt 4: Master composition with audio

```
Update src/BallotBadgerFull.tsx to be the master composition. It should:

1. Use <Series> to sequence all 9 scenes in order with these frame durations:
   HookScene: 360, ProblemMontage: 300, TurnScene: 150, ResearchScene: 630,
   VoterLookupScene: 450, BallotScene: 210, CloseScene: 360, BadgerScene: 240,
   EndCardScene: 150

2. Add background music:
   <Audio src={staticFile("music/bg-beat.mp3")} volume={0.15} />
   Use interpolate to fade in over 30 frames at the start and fade out over 60 frames at the end.
   Mute (volume 0) during frames 810-900 (Scene 4, when the agent voice is audible).

3. Add voiceover audio synced to scenes:
   - scene-02-problem.mp3 starts at frame 360 (Scene 2 start)
   - scene-03-turn.mp3 starts at frame 660 (Scene 3 start)
   - scene-05-voter-lookup.mp3 starts at frame 1440 (Scene 5 start)
   - scene-06-ballot.mp3 starts at frame 1890 (Scene 6 start)
   Scene 4 voiceover is handled inside ResearchScene.tsx.

4. Scenes 1 and 7 use on-camera audio from the video files (already baked in).
   Scene 8 uses audio from the animated badger clip (already baked in).
```

---

## Prompt 5: Reels version (optional — do this after the full version works)

```
Create src/BallotBadgerReels.tsx — a vertical (1080x1920, 30fps, 1650 frames, ~55s) cut of the same video.

Use the same scenes but with these adaptations:
- All <OffthreadVideo> components use style={{ objectFit: "cover", objectPosition: "center" }} to crop for vertical
- HookScene: 240 frames (trimmed)
- ProblemMontage: 300 frames (text scaled up 1.3x for readability on mobile)
- TurnScene: 90 frames (trimmed)
- ResearchScene: 450 frames (trimmed, focus on cards appearing)
- VoterLookupScene: 300 frames (trimmed)
- Skip BallotScene
- CloseScene: 240 frames (trimmed)
- BadgerScene: 90 frames (trimmed to punchline)
- EndCardScene: 90 frames (vertical layout — logo, URL, logos stacked)

Register this composition in Root.tsx alongside BallotBadgerFull.
```

---

## The order to run these prompts

1. Record all video assets and voiceover audio first
2. Drop them in `public/`
3. Run Prompt 0 (project setup)
4. Run Prompt 1 (problem montage — the hardest scene)
5. Preview in Remotion Studio: `npm run dev`
6. Iterate on timing against your voiceover
7. Run Prompt 2 (end card)
8. Run Prompt 3 (all video import scenes)
9. Run Prompt 4 (master composition with audio sync)
10. Preview the full video
11. Adjust frame counts to match your actual recordings
12. Render: `npx remotion render BallotBadgerFull --output ballot-badger.mp4`
13. (Optional) Run Prompt 5 for the Reels cut
