# Lingo tester walkthrough — M1 + M2 (2026-05-17)

Thanks for testing! You're going through **Module 1 (hiragana — 9 rows + vowels)** and **Module 2 (dakuten + yōon — 9 rows)**. Most testers take roughly **2-4 hours total** across multiple sessions. **Take breaks** — completing the modules in one go is not the goal; we want to know how it actually feels.

## What we need from you

**Honest reactions.** "I was confused here." "This made me laugh." "I almost quit." "I didn't understand why this came next." All useful. No need to phrase carefully — bullet points or voice-memo style is fine.

If something feels broken, that's data. If something feels great, that's data too.

---

## 5 things to watch for

### 1. ⏱️ **How long does each module actually take?**
Note your start time when you begin, and your end time when you finish each row test. Total clock time for each module is the headline metric.
- **Rough expectation**: M1 ≈ 60-120 min total, M2 ≈ 45-90 min total. If you're far off either way, that's a finding.
- We're particularly interested in **per-row time** (vowels, ka, sa, ta, na, ha, ma, ya, ra, wa for M1; g, z, d, b, p, yoon-intro, yoon-sh-ch, yoon-voiced, yoon-rare for M2).

### 2. 🚪 **Where do you almost stop?**
The single most useful thing you can flag. Examples of what to note:
- "Step felt repetitive, I checked my phone."
- "I got stuck on this kana and couldn't find a way past."
- "I didn't know what I was supposed to do."
- "I was tired by step 12 and rushed the rest."

If you actually do stop and come back, **note the gap** ("stopped at 8pm, resumed next morning"). The "do I come back?" signal matters more than the lesson itself.

### 3. 🎤 **The speaking step (Whisper)**
First time it appears, the app needs to download a model (~80MB). This is a one-time hit per browser/device, but it might be slow on a poor connection. Note:
- How long the model took to load (first-time only).
- Whether your mic worked first try, or you had to grant permission / retry.
- Whether the "you said X / target Y" transcript comparison felt useful or confusing.
- If you mumbled or got it wrong — what did the app do? Was the "good effort, moving on" response after 2 fails reassuring or condescending?

### 4. ✍️ **The trace step (drawing kana)**
We just made the threshold ~10% more lenient. Tell us if:
- You could draw the kana on the first try.
- You hit "Try again" repeatedly and gave up.
- The 2-attempt minimum felt fair or annoying.
- Drawing on touchscreen vs trackpad vs mouse — which device, how was it?

### 5. 🗺️ **Pathway clarity — "what do I do next?"**
After every lesson, the app drops you back to the Learn page. Note:
- Did you know which lesson to do next without thinking?
- Did the progress bar / pulsing node / "Resume" button do the right thing?
- Was there ever a moment where you closed the tab because you didn't know what was next?

### 6. 💡 **Anything you wish the app had**
Open-ended — anything that would have made it better. "I wanted a flashcards button after the row test." "I want to skip the trace." "I forgot what こ meant and there was nowhere to look it up." All useful.

---

## How to send us your results

### Easiest path — auto-download on every lesson
Open the app via:

> **`https://openlingoapp.com/?tester=1`**

That one URL flips on tester mode (it sticks through signup + every later visit on the same browser). From then on, **every time you finish a lesson, a fresh `lingo-tester-*.json` file auto-downloads.**

- First time, your browser will ask "Allow openlingoapp.com to download multiple files?" → click **Allow**. (Otherwise it'll only let one through.)
- The filename ends with `L01`, `L02`, `L03`... matching how many lessons you've completed. **Each new file supersedes the prior one** — at the end of your session, just email the highest-numbered file to Spencer.
- All files have the same `s-xxxx` session ID in the name, so it's easy to spot the latest.

The log captures: lesson starts + ends + time per lesson, speaking attempts, trace attempts, where you exited mid-lesson, what step types you hit. **No personal info — no names, no audio, no typed text.** Pure event data.

### Manual fallback — dev panel
If auto-download isn't working (browser blocked it, or you opted out), the DEV panel on the right side of the Learn page has a **📊 Tester log** button. Click → **⬇ Download now** → email the file.

If you can't access either, your written notes are still the most important thing.

### Notes template (free-form, fill what's relevant)

```
Tester name (or nickname): ______
Device: phone / laptop / tablet
Browser: Chrome / Safari / Firefox / etc.
Total sessions: ____

M1 (hiragana):
  Total time across sessions: ____ min
  Rows where I stalled: ____
  Rows that flowed: ____
  Did I finish? Y / N (if no, where did I stop?)

M2 (dakuten + yōon):
  Total time: ____ min
  Hardest moment: ____
  Best moment: ____
  Did I finish? Y / N

Speaking step:
  Mic permission first try? Y / N
  Whisper download was: fast / slow / I gave up
  Transcript comparison: useful / confusing / didn't notice
  "Good effort moving on" felt: kind / patronising / didn't trigger

Trace step:
  Could pass on first try: usually / sometimes / rarely
  Device used for tracing: ____
  Skipped trace via the Skip button: never / a few times / often

Pathway:
  Knew what to do next every time: Y / N
  Resume button worked when I came back: Y / N
  Got lost trying to find: ____

Overall reactions / open notes:
  (anything)

Would I come back tomorrow? Y / N
  If no, why: ____
```

---

## What we WON'T fix from your feedback in this round (so you can skip those if you want)

We already have a punch list of known issues from internal audits. Don't burn energy flagging:

- The streak counter being "5" regardless of what you do *(fix in flight)*
- The "Test out of Module" button doing nothing *(known; hidden in next push)*
- The Leaderboard showing fake names *(known; coming-soon splash in next push)*
- Audio auto-playing on the speaking step in public *(silent mode toggle in flight; if you want it now, look for it in theme settings)*
- The lesson length estimate being slightly off *(we'll calibrate from YOUR data)*

**Do flag** anything we *didn't* call out above. New surprises are the most valuable.

---

## Thanks

This is real-data calibration — the personas we ran internally caught a lot, but they're not you. Your reaction is what makes the time-estimates and the bail-points real.

Spencer
