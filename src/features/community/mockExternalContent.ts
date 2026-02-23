import type { ExternalContentItem } from "./types";

const PAST = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_EXTERNAL_CONTENT: ExternalContentItem[] = [
  {
    id: "ec-1",
    title: "Talk To Me In Korean – TTMIK",
    description:
      "Popular Korean learning podcast with clear explanations and cultural context. Great for beginners.",
    links: [
      {
        url: "https://www.youtube.com/@talktomeinkorean",
        label: "YouTube",
        description: "Free video lessons",
      },
      {
        url: "https://open.spotify.com/show/0g3T957nF3wmHoY7zrY1qJ",
        label: "Spotify",
        description: "Audio episodes",
      },
      {
        url: "https://podcasts.apple.com/us/podcast/talk-to-me-in-korean/id377702416",
        label: "Apple Podcasts",
      },
    ],
    contentType: "podcast",
    contentLanguageId: "ko",
    translationLanguageId: "en",
    level: "beginner",
    skill: "listening",
    upvoteCount: 142,
    createdAt: PAST(120),
    updatedAt: PAST(5),
    submittedBy: "Community",
  },
  {
    id: "ec-2",
    title: "Crash Landing on You OST –初恋",
    description:
      "Beautiful ballad from the K-drama. Practice listening to slow, clear Korean singing.",
    links: [
      {
        url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
        label: "YouTube",
      },
      {
        url: "https://open.spotify.com/track/5GVnnIZxc7gAhvdSOZEeis",
        label: "Spotify",
      },
    ],
    contentType: "song",
    contentLanguageId: "ko",
    translationLanguageId: "en",
    level: "intermediate",
    skill: "listening",
    upvoteCount: 89,
    createdAt: PAST(90),
    updatedAt: PAST(12),
  },
  {
    id: "ec-3",
    title: "Japanese Ammo with Misa",
    description:
      "YouTube channel for Japanese learners. Grammar, vocabulary, and real-life usage.",
    links: [
      {
        url: "https://www.youtube.com/@JapaneseAmmowithMisa",
        label: "YouTube",
      },
    ],
    contentType: "video",
    contentLanguageId: "ja",
    translationLanguageId: "en",
    level: "beginner",
    skill: "both",
    upvoteCount: 76,
    createdAt: PAST(200),
    updatedAt: PAST(3),
  },
  {
    id: "ec-4",
    title: "Weblio Japanese Dictionary",
    description:
      "Comprehensive Japanese dictionary with example sentences, kanji breakdowns, and audio.",
    links: [
      {
        url: "https://www.weblio.jp/",
        label: "Website",
        description: "Main dictionary",
      },
    ],
    contentType: "website",
    contentLanguageId: "ja",
    level: "intermediate",
    skill: "reading",
    upvoteCount: 201,
    createdAt: PAST(365),
    updatedAt: PAST(1),
  },
  {
    id: "ec-5",
    title: "Squid Game – Korean Dialogue Practice",
    description:
      "Clip compilation for intermediate learners. Real conversational Korean from the hit series.",
    links: [
      {
        url: "https://www.youtube.com/watch?v=oqxAJKy0ii4",
        label: "YouTube",
      },
      {
        url: "https://www.netflix.com/title/81040344",
        label: "Netflix",
        description: "Full series",
      },
    ],
    contentType: "video",
    contentLanguageId: "ko",
    translationLanguageId: "en",
    level: "hard",
    skill: "listening",
    upvoteCount: 134,
    createdAt: PAST(60),
    updatedAt: PAST(20),
  },
  {
    id: "ec-6",
    title: "Tofugu – Japanese Learning Blog",
    description:
      "In-depth articles on Japanese grammar, culture, and study methods. Well-researched and engaging.",
    links: [
      {
        url: "https://www.tofugu.com/",
        label: "Website",
      },
    ],
    contentType: "article",
    contentLanguageId: "ja",
    translationLanguageId: "en",
    level: "beginner",
    skill: "reading",
    upvoteCount: 167,
    createdAt: PAST(400),
    updatedAt: PAST(2),
  },
  {
    id: "ec-7",
    title: "BTS – Spring Day (봄날)",
    description:
      "Classic BTS track. Good for intermediate listening; lyrics are poetic but commonly studied.",
    links: [
      {
        url: "https://www.youtube.com/watch?v=7C2z4GqqS5E",
        label: "YouTube",
      },
      {
        url: "https://open.spotify.com/track/2jrg7fYW6xlR3EDNfcEQh6",
        label: "Spotify",
      },
    ],
    contentType: "song",
    contentLanguageId: "ko",
    translationLanguageId: "en",
    level: "intermediate",
    skill: "listening",
    upvoteCount: 98,
    createdAt: PAST(150),
    updatedAt: PAST(8),
  },
  {
    id: "ec-8",
    title: "NHK Easy Japanese News",
    description:
      "Simplified Japanese news with furigana and audio. Ideal for reading practice.",
    links: [
      {
        url: "https://www3.nhk.or.jp/news/easy/",
        label: "Website",
      },
    ],
    contentType: "article",
    contentLanguageId: "ja",
    level: "intermediate",
    skill: "reading",
    upvoteCount: 189,
    createdAt: PAST(300),
    updatedAt: PAST(0),
  },
  {
    id: "ec-9",
    title: "Beginner Korean Textbook PDF",
    description:
      "Free PDF resource for absolute beginners. Hangeul, basic phrases, and exercises.",
    links: [
      {
        url: "https://www.koreanclass101.com/blog/korean-for-beginners/",
        label: "Website",
      },
    ],
    contentType: "text",
    contentLanguageId: "ko",
    translationLanguageId: "en",
    level: "new",
    skill: "reading",
    upvoteCount: 54,
    createdAt: PAST(45),
    updatedAt: PAST(30),
  },
  {
    id: "ec-10",
    title: "Shirokuma Cafe – Anime for Learners",
    description:
      "Slow-paced slice-of-life anime. Clear speech, everyday vocabulary, great for advanced beginners.",
    links: [
      {
        url: "https://www.netflix.com/search?q=shirokuma%20cafe",
        label: "Netflix",
      },
      {
        url: "https://www.youtube.com/results?search_query=shirokuma+cafe",
        label: "YouTube",
      },
    ],
    contentType: "tv_show",
    contentLanguageId: "ja",
    translationLanguageId: "en",
    level: "beginner",
    skill: "listening",
    upvoteCount: 112,
    createdAt: PAST(180),
    updatedAt: PAST(7),
  },
];

export function getExternalContent(languageId?: string): ExternalContentItem[] {
  if (!languageId) return MOCK_EXTERNAL_CONTENT;
  return MOCK_EXTERNAL_CONTENT.filter((item) => item.contentLanguageId === languageId);
}
