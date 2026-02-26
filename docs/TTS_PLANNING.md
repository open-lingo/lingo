# TTS (Text-to-Speech) — Planning Document

**Status:** Planning  
**Scope:** Own APIs, CDN, caching, ElevenLabs (swappable), usage tracking, monetization hooks

---

## Executive Summary

We will have **our own TTS APIs** for generation, CDN delivery, and caching. Never call ElevenLabs (or any provider) directly from the frontend. Architecture:

**Frontend → Your API → ElevenLabs → Cache → CDN → Frontend**

This enables: rate limiting, caching, abuse prevention, monetization hooks, provider swapping later.

---

## Core Principle

**Do NOT call ElevenLabs directly from the frontend.**

Always route through our backend. This gives:

- Rate limiting
- Caching
- Abuse prevention
- Monetization hooks
- Provider swapping later

---

## Architecture Overview

```
User clicks Play
        ↓
GET /api/tts?text=학생&lang=ko
        ↓
Backend checks cache (S3 / DB)
        ↓
If exists → return CDN URL
If not   → call ElevenLabs
        ↓
Upload mp3 to S3
        ↓
Save metadata
        ↓
Return CDN URL
```

---

## Step 1 — Abstract TTS Behind a Provider Layer

Create a swappable provider interface. Never tie business logic directly to ElevenLabs.

```ts
interface TTSProvider {
  generateAudio(text: string, language: string): Promise<Buffer>;
}

class ElevenLabsProvider implements TTSProvider {
  async generateAudio(text: string, language: string): Promise<Buffer> {
    // call ElevenLabs API
  }
}

// Later:
class PollyProvider implements TTSProvider {}
class AzureTTSProvider implements TTSProvider {}
```

---

## Step 2 — Deterministic Caching

Critical for cost control.

**Hash:**

```ts
const hash = sha256(`${language}:${text}`);
```

**File path in S3:**

```
tts/${language}/${hash}.mp3
```

**Flow:**

1. Before calling ElevenLabs: check if file exists in S3
2. If yes → return CDN URL
3. If no → generate, upload, save, return

**Benefits:**

- Same word never regenerated
- Stories and cards reuse audio
- Cost stays predictable

---

## Step 3 — Language + Voice Mapping

Config table for per-language voice settings:

```ts
LanguageTTSConfig {
  languageId: string;   // "ko", "ja", etc.
  provider: string;     // "elevenlabs"
  voiceId: string;      // "EXAVITQu4vr4xnSDxMaL"
  model: string;        // "eleven_multilingual_v2"
}
```

**Benefits:**

- Switch voice per language
- A/B test voices
- Offer premium voices later

---

## Step 4 — Usage Tracking (For Ads / Monetization)

Add tracking **before** generation:

```ts
tts_usage {
  id: string;
  userId: string | null;   // null if unauthenticated
  textLength: number;
  languageId: string;
  provider: string;
  createdAt: string;
}
```

**Enables:**

- Limit free users to X characters/day
- "Upgrade for unlimited audio" prompts
- Inject ad playback before audio (future)
- Analytics

---

## Ads / Monetization Strategy Options

| Option | Description |
|--------|-------------|
| **A — Rate limits** | Free: 100 TTS plays/day. Premium: unlimited. Simple, clean, doesn't degrade UX. |
| **B — Audio pre-roll ad** | Play short sponsor audio before main audio. More intrusive. Use carefully. |
| **C — Banner triggered by usage** | After X plays: "Enjoying pronunciation? Support us." Non-intrusive. |

**Recommendation:** Start with Option A (rate limits). Add B/C later if needed.

---

## Step 5 — Frontend Integration

Frontend never knows about ElevenLabs or any provider.

```ts
async function playTTS(text: string, language: string) {
  const res = await fetch(
    `/api/tts?text=${encodeURIComponent(text)}&lang=${language}`
  );
  const { url } = await res.json();
  const audio = new Audio(url);
  audio.play();
}
```

No provider logic in UI.

---

## Step 6 — Story Word Embeds

When rendering story embeds `[card:id]display[/card]`:

```tsx
<span
  className="story-word"
  onClick={() => playTTS(displayText, languageId)}
>
  {displayText}
</span>
```

**Important:** Always use **display text** from the embed, **not** `card.front`. Display text is canonical for the story context.

---

## ElevenLabs-Specific Notes

- Use `eleven_multilingual_v2` model
- Pick a good Korean voice manually
- Set stability and similarity tuning
- Keep audio format as **mp3** for CDN efficiency
- Use streaming response if possible (faster perceived speed)

---

## Security & Abuse Prevention

- Rate limit per IP
- Rate limit per user (when authenticated)
- Minimum text length (reject empty / too short)
- Max text length (e.g., 500 chars)
- Reject long paragraphs (avoid cost spikes)

---

## Performance Optimization (Future)

- **Prefetch:** If story paragraph contains 10 linked words, prefetch audio silently after render
- **Background generation:** Generate audio on story publish
- Architect for these; don't implement yet

---

## Database Tables

### tts_cache

| Column   | Type   | Description                    |
|----------|--------|--------------------------------|
| id       | string | Primary key                    |
| textHash | string | `sha256(language:text)`        |
| languageId | string | e.g. `ko`                    |
| provider | string | e.g. `elevenlabs`              |
| voiceId  | string | Provider voice ID              |
| url      | string | CDN URL (S3 or CloudFront)     |
| createdAt | string | ISO timestamp                |

### tts_usage

| Column     | Type   | Description           |
|------------|--------|-----------------------|
| id         | string | Primary key           |
| userId     | string? | null if unauthenticated |
| textLength | int    | Characters requested  |
| languageId | string | e.g. `ko`             |
| provider   | string | e.g. `elevenlabs`     |
| createdAt  | string | ISO timestamp         |

Keep separate from content tables (decks, stories, cards).

---

## API Endpoint

### GET /api/tts

**Query params:**

- `text` (required) — Text to synthesize
- `lang` (required) — Language ID (ko, ja, etc.)

**Response:**

```json
{
  "url": "https://cdn.example.com/tts/ko/abc123.mp3"
}
```

**Flow:**

1. Validate params (length, charset)
2. Check rate limit
3. Compute hash
4. Check cache (S3 or DB)
5. If hit → return URL
6. If miss → generate → upload → save → return URL
7. Log usage

---

## Files to Create (Backend)

| File | Purpose |
|------|---------|
| `app/tts/providers/base.py` | `TTSProvider` protocol |
| `app/tts/providers/elevenlabs.py` | ElevenLabs implementation |
| `app/tts/cache.py` | Hash-based S3 cache lookup/upload |
| `app/tts/router.py` | `GET /api/tts` endpoint |
| `app/tts/schemas.py` | Request/response types |
| `app/db/tts.py` | tts_cache, tts_usage tables |

---

## Files to Create (Frontend)

| File | Purpose |
|------|---------|
| `src/shared/api/tts.ts` | `playTTS(text, lang)` → fetch URL |
| `src/shared/hooks/useTTS.ts` | Hook: `playTTS(text, lang)` |
| StoryPreview / CardPreview | Add play button; call `playTTS(displayText, languageId)` |

---

## Why This Is Architecturally Strong

| Benefit | How |
|---------|-----|
| **Swappable provider** | `TTSProvider` interface; swap ElevenLabs for Polly/Azure |
| **Monetization-ready** | Usage tracking, rate limits, ad hooks |
| **Cache-efficient** | Hash-based; same text never regenerated |
| **Multi-language aware** | Per-language voice config |
| **CDN friendly** | Return static URLs; S3/CloudFront |
| **Works for cards and stories** | Single API; display text canonical |
