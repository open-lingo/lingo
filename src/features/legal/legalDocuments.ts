export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  id: "privacy" | "terms" | "about";
  title: string;
  summary: string;
  sections: LegalSection[];
};

const privacy: LegalDocument = {
  id: "privacy",
  title: "Privacy Policy",
  summary:
    "We run Open Lingo to help you learn languages. We do not sell your personal information. We store only what is needed to operate your account and learning progress.",
  sections: [
    {
      id: "who",
      title: "Who we are",
      paragraphs: [
        "Open Lingo (“we”, “us”) operates the Open Lingo web application and related services. This policy describes how we handle information when you use our site and apps.",
        "We are an open-source learning project. If you have questions, use the contact method listed at the bottom of this page.",
      ],
    },
    {
      id: "no-sale",
      title: "We do not sell your data",
      paragraphs: [
        "We do not sell, rent, or trade your personal information to data brokers or advertisers for their own marketing lists.",
        "Our business model is not based on monetizing your identity. Any advertising (see below) is served by third-party ad networks under their own policies when you consent to advertising cookies.",
      ],
    },
    {
      id: "collect",
      title: "What we collect and why",
      paragraphs: [
        "We collect and process only what is needed to provide the service:",
      ],
      bullets: [
        "Account identity — When you sign in, our authentication provider (Auth0) gives us a stable account identifier and basic profile fields you choose to share (such as email and display name). We use this to recognize you across devices.",
        "Learning data — Lesson progress, flashcard review history (SRS), deck subscriptions, and preferences you save in the app. This is stored so your study can sync and continue on other devices.",
        "Content you create — If you publish community decks or stories, that content is stored and shown according to the visibility you choose.",
        "Technical data — Standard server and security logs (IP address, user agent, timestamps) may be kept briefly to operate and protect the service.",
        "Local device storage — The app may store settings, offline review queues, and similar data in your browser (localStorage) until you clear it or delete your account.",
      ],
    },
    {
      id: "auth0",
      title: "Authentication (Auth0)",
      paragraphs: [
        "Sign-in is handled by Auth0. Their privacy policy applies to how they process credentials and session data: https://auth0.com/privacy",
        "We receive only the profile and identifier needed to link your Auth0 account to your Open Lingo user record.",
      ],
    },
    {
      id: "ads",
      title: "Advertising (Google AdSense)",
      paragraphs: [
        "We may show ads through Google AdSense or similar programs to help fund free access. Ad networks may use cookies and similar technologies to show and measure ads.",
        "We only enable advertising-related storage after you choose “Accept” on our cookie banner (or equivalent control in settings). You can withdraw consent at any time via cookie settings.",
        "Google’s policies and your choices are described at https://policies.google.com/privacy and https://adssettings.google.com",
        "If you subscribe to a paid tier in the future that removes ads, we will not show personalized ads to that account while the subscription is active.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and similar technologies",
      paragraphs: [
        "Essential cookies and local storage are used for sign-in sessions, security, and saving your in-app preferences. These are necessary for the service to work.",
        "Optional advertising cookies are used only if you consent, primarily to support AdSense.",
        "You can control optional cookies through our cookie banner or by clearing site data in your browser.",
      ],
    },
    {
      id: "processors",
      title: "Service providers (subprocessors)",
      paragraphs: ["We use trusted providers to run the product. They process data only on our instructions:"],
      bullets: [
        "Auth0 — authentication",
        "Cloud hosting and database providers for the API and stored progress (as configured in our deployment)",
        "Google — advertising, if you consent to ad cookies",
      ],
    },
    {
      id: "retention",
      title: "How long we keep data",
      paragraphs: [
        "We keep account and learning data while your account is active. If you delete your account, we delete your user profile and settings from our database. Some server logs may be retained for a limited period for security and troubleshooting.",
        "Community content you published may remain if licensed under open terms, but will no longer be attributed to your account after deletion where technically feasible.",
      ],
    },
    {
      id: "rights",
      title: "Your rights and choices",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, export, or delete personal data we hold about you.",
        "You can delete your Open Lingo account from Settings (signed in). That removes your record from our systems. Your Auth0 login may still exist until you delete it at Auth0 or through your identity provider.",
        "To request help with privacy questions, contact us using the link below.",
      ],
    },
    {
      id: "children",
      title: "Children",
      paragraphs: [
        "Open Lingo is not directed at children under 13 (or the minimum age in your country). We do not knowingly collect personal information from children. Contact us if you believe a child has provided data and we will delete it.",
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      paragraphs: [
        "We may update this policy as the product changes. We will post the new date at the top of this page. Continued use after changes means you accept the updated policy.",
      ],
    },
  ],
};

const terms: LegalDocument = {
  id: "terms",
  title: "Terms of Service",
  summary:
    "By using Open Lingo you agree to these terms. The service is provided as-is for language learning; community content is offered by users under open licenses.",
  sections: [
    {
      id: "accept",
      title: "Agreement",
      paragraphs: [
        "These Terms of Service (“Terms”) govern your use of Open Lingo. By creating an account or using the service, you agree to these Terms and our Privacy Policy.",
        "If you do not agree, do not use the service.",
      ],
    },
    {
      id: "service",
      title: "The service",
      paragraphs: [
        "Open Lingo provides language-learning tools including courses, flashcards, stories, and community content. Features may change, be added, or be removed during beta and MVP releases.",
        "We do not guarantee uninterrupted availability. We may suspend access for maintenance, abuse, or legal reasons.",
      ],
    },
    {
      id: "accounts",
      title: "Accounts",
      paragraphs: [
        "You are responsible for activity under your account. Keep your login credentials secure.",
        "You must provide accurate registration information and not impersonate others.",
        "We may suspend or terminate accounts that violate these Terms or harm other users or the service.",
      ],
    },
    {
      id: "content",
      title: "User and community content",
      paragraphs: [
        "You retain rights to content you create. By submitting content to community areas, you grant Open Lingo a license to host, display, and distribute that content as part of the service (including under open-source terms you select when publishing).",
        "Do not upload content that infringes others’ rights, is illegal, harassing, or malware.",
        "We may remove content that violates these Terms or applicable law.",
      ],
    },
    {
      id: "disclaimer",
      title: "Educational disclaimer",
      paragraphs: [
        "Open Lingo is for general language education. It is not professional advice (legal, medical, immigration, etc.). Community decks and courses may contain errors.",
      ],
    },
    {
      id: "ads-premium",
      title: "Ads and future paid features",
      paragraphs: [
        "The free tier may include advertising. Optional paid features may be offered later with separate billing terms.",
        "Advertising is subject to third-party network policies when you consent to advertising cookies.",
      ],
    },
    {
      id: "liability",
      title: "Disclaimer of warranties; limitation of liability",
      paragraphs: [
        "THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, OPEN LINGO AND CONTRIBUTORS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.",
      ],
    },
    {
      id: "opensource",
      title: "Open source",
      paragraphs: [
        "Application source code is available under open-source licenses listed in the repository. Your use of the software is also subject to those licenses where applicable.",
      ],
    },
    {
      id: "law",
      title: "Governing law",
      paragraphs: [
        "These Terms are governed by the laws applicable to the project operators’ principal place of business, without regard to conflict-of-law rules, except where mandatory consumer protections in your country require otherwise.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Questions about these Terms can be sent using the same contact method as our Privacy Policy.",
      ],
    },
  ],
};

const about: LegalDocument = {
  id: "about",
  title: "About Open Lingo",
  summary:
    "A free, open-source language learning app built by learners. We fund hosting through optional ads—not by selling your data.",
  sections: [
    {
      id: "mission",
      title: "Our mission",
      paragraphs: [
        "Open Lingo helps people learn languages with spaced repetition, structured courses, stories, and community-created decks.",
        "The project is open source. You can inspect the code, report issues, and contribute on GitHub.",
      ],
    },
    {
      id: "funding",
      title: "How we’re funded",
      paragraphs: [
        "We aim to keep core learning free. Revenue may come from optional advertising (with your consent) and, in the future, optional premium subscriptions that remove ads and support development.",
        "We do not sell personal information.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "For privacy requests, account issues, or general feedback, reach us via the contact link on our Privacy Policy page or open an issue on GitHub.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocument["id"], LegalDocument> = {
  privacy,
  terms,
  about,
};
