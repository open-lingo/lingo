# Open Lingo UI Inventory

**Last Updated**: June 2026

This document catalogs every screen, modal, overlay, and major reusable component in the Open Lingo app. Organized by feature area for 1×1 design review flow.

---

## Table of Contents

1. [Marketing & Auth](#marketing--auth)
2. [Home & Navigation](#home--navigation)
3. [Learn](#learn)
4. [Practice](#practice)
5. [Flashcards](#flashcards)
6. [Stories](#stories)
7. [Social & Leaderboard](#social--leaderboard)
8. [Community & Forum](#community--forum)
9. [Shop](#shop)
10. [Settings & Profile](#settings--profile)
11. [Admin & Moderation](#admin--moderation)
12. [Shared UI Components](#shared-ui-components)
13. [Overlays & Modals (Global)](#overlays--modals-global)

---

## Marketing & Auth

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| MA-1 | Root Redirect | Screen | `/` | Entry point—routes auth'd users to `/home`, guests to `/landing` | `/src/routes/RootRoute.tsx` | Root |
| MA-2 | Landing Page | Screen | `/landing` | Public marketing pitch; hero, features, CTA | `/src/features/landing/LandingPage.tsx` | Marketing |
| MA-3 | Get Started | Screen | `/get-started` | Sign-up entry point with language selection | `/src/features/landing/GetStartedPage.tsx` | Marketing |
| MA-4 | Login Page | Screen | `/login` | Auth form (email/social sign-in) | `/src/features/auth/LoginPage.tsx` | Auth |
| MA-5 | Logout Page | Screen | `/logout` | Sign-out confirmation | `/src/features/auth/LogoutPage.tsx` | Auth |
| MA-6 | Preview Lesson | Screen | `/try` | Guest-accessible lesson preview (no auth required) | `/src/features/preview/PreviewLessonPage.tsx` | Marketing |
| MA-7 | About Page | Screen | `/about` | About/credits page (public) | `/src/features/legal/AboutPage.tsx` | Marketing |
| MA-8 | Privacy Policy | Screen | `/privacy` | Privacy policy (public) | `/src/features/legal/PrivacyPolicyPage.tsx` | Legal |
| MA-9 | Terms of Service | Screen | `/terms` | Terms page (public) | `/src/features/legal/TermsOfServicePage.tsx` | Legal |

**Marketing & Auth Count: 9 screens**

---

## Home & Navigation

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| HM-1 | Home Hub | Screen | `/home` (protected) | Main app dashboard; quick-access nav cards, activity summary, quests pill | `/src/features/home/HomePage.tsx` | Home |
| HM-2 | Home Restructure Mockup | Screen | `/:lang/home-preview` (dev) | Dev-only preview of redesigned home layout | `/src/features/home/dev/HomeRestructureMockup.tsx` | Home |
| HM-3 | Language Picker Modal | Modal | Home (on-load) | First-launch or language-switch picker (2×2 flag grid) | `/src/features/home/LanguagePickerModal.tsx` | Home |
| HM-4 | Sidebar Navigation | Component | Global (≥lg, authed) | Persistent left sidebar with nav links & collapse | `/src/routes/SidebarNav.tsx` | Navigation |
| HM-5 | Top Navigation Bar | Component | Global | Header with logo, desktop nav, mobile menu button, user menu | `/src/routes/Layout.tsx` | Navigation |
| HM-6 | Mobile Menu | Component | Global | Slide-down nav menu triggered by mobile menu button | `/src/routes/Layout.tsx` | Navigation |

**Home & Navigation Count: 6 items (4 screens/modals, 2 components)**

---

## Learn

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| LN-1 | Learn Hub | Screen | `/:lang/learn` (protected) | Main learn page with course list, progress cards, CTAs | `/src/features/learn/LearnPage.tsx` | Learn |
| LN-2 | Learn Layout | Component | `/:lang/learn/*` | Parent layout for all learn subroutes (sidebar, progress bar) | `/src/features/learn/LearnLayout.tsx` | Learn |
| LN-3 | Learn Courses (Legacy) | Screen | `/:lang/learn/courses` | Legacy course selection (redirects to main Learn Hub) | `/src/features/learn/LearnCoursesPage.tsx` | Learn |
| LN-4 | Travel Sprint | Screen | `/:lang/learn/travel-sprint` | Time-limited sprint mode with XP rewards | `/src/features/learn/TravelSprintPage.tsx` | Learn |
| LN-5 | Lesson Page | Screen | `/:lang/learn/lessons/:lessonId` (protected) | Primary lesson player; steps, progress, completion | `/src/features/lesson/LessonPage.tsx` | Learn |
| LN-6 | Placement Test | Screen | `/:lang/learn/placement-test` or `/:lang/learn/test-out/:moduleId` | Level assessment quiz | `/src/features/placement/PlacementTestPage.tsx` | Learn |
| LN-7 | Lesson Step Preview (Dev) | Screen | `/:lang/lesson-preview` (dev) | Dev tool to preview individual lesson steps | `/src/features/lesson/dev/LessonStepPreviewPage.tsx` | Learn |
| LN-8 | Celebration Toast | Component | Lesson (on-complete) | Animated toast on lesson completion with streaks/rewards | `/src/features/lesson/components/CelebrationToast.tsx` | Learn |

**Learn Count: 8 items (6 screens, 2 components)**

---

## Practice

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| PR-1 | Practice Hub | Screen | `/:lang/practice` (protected) | Main practice selector with mode cards (grammar, alphabet, etc.) | `/src/features/practice/PracticePage.tsx` | Practice |
| PR-2 | Practice Layout | Component | `/:lang/practice/*` | Parent layout for practice subroutes | `/src/features/practice/PracticeLayout.tsx` | Practice |
| PR-3 | Grammar Practice | Screen | `/:lang/practice/grammar` | Interactive grammar exercise mode | `/src/features/practice/PracticeGrammarPage.tsx` | Practice |
| PR-4 | Alphabet Hub | Screen | `/:lang/practice/alphabet` | List of available alphabets (hiragana, katakana, etc.) | `/src/features/practice/PracticeAlphabetHubPage.tsx` | Practice |
| PR-5 | Alphabet Practice | Screen | `/:lang/practice/alphabet/:alphabetId` | Practice specific alphabet (recognition, production, trace) | `/src/features/practice/AlphabetPracticePage.tsx` | Practice |
| PR-6 | Alphabet Lesson | Screen | `/:lang/practice/alphabet/:alphabetId/learn` | Teach alphabet with visual aids | `/src/features/practice/alphabet/AlphabetLessonPage.tsx` | Practice |
| PR-7 | Kanji Practice | Screen | `/:lang/practice/kanji` | Kanji character drills | `/src/features/practice/KanjiPracticePage.tsx` | Practice |
| PR-8 | Particle Practice | Screen | `/:lang/practice/particles` | Grammar particle exercises | `/src/features/practice/ParticlePracticePage.tsx` | Practice |
| PR-9 | Conjugation Practice | Screen | `/:lang/practice/conjugation` | Verb/adjective conjugation drills | `/src/features/practice/ConjugationPracticePage.tsx` | Practice |
| PR-10 | Reading Practice | Screen | `/:lang/practice/reading` | Reading comprehension exercises | `/src/features/practice/ReadingPracticePage.tsx` | Practice |
| PR-11 | Speaking Practice | Screen | `/:lang/practice/speaking` | Voice-based speaking exercises | `/src/features/practice/SpeakingPracticePage.tsx` | Practice |
| PR-12 | Counters Practice | Screen | `/:lang/practice/counters` | Counter/classifier drills | `/src/features/practice/CounterPracticePage.tsx` | Practice |
| PR-13 | Components Practice | Screen | `/:lang/practice/components` | Character component drills | `/src/features/practice/ComponentsPracticePage.tsx` | Practice |
| PR-14 | Videos Practice | Screen | `/:lang/practice/videos` | Video-based learning exercises | `/src/features/practice/VideosPracticePage.tsx` | Practice |
| PR-15 | External Content Practice | Screen | `/:lang/practice/external-content` | Community-contributed practice content | `/src/features/community/ExternalContentPracticePage.tsx` | Practice |
| PR-16 | Vocab Page | Screen | `/:lang/vocab` | Vocabulary reference & lookup (accessible from Learn or Practice) | `/src/features/vocab/VocabPage.tsx` | Practice |

**Practice Count: 16 screens**

---

## Flashcards

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| FC-1 | Flashcards Hub | Screen | `/:lang/practice/flashcards` (protected) | Main flashcards interface with deck list & quick-start | `/src/features/flashcards/FlashcardsPage.tsx` | Flashcards |
| FC-2 | Flashcard Tester | Screen | `/:lang/practice/flashcards/review` | Active review mode for a selected deck | `/src/features/flashcards/FlashcardTester.tsx` | Flashcards |
| FC-3 | Card Manager | Screen | `/:lang/practice/flashcards/cards` | Edit/delete individual cards in library | `/src/features/flashcards/CardManagerPage.tsx` | Flashcards |
| FC-4 | Deck Manager | Screen | `/:lang/practice/flashcards/decks` | Create/edit/delete custom decks | `/src/features/flashcards/DeckManagerPage.tsx` | Flashcards |
| FC-5 | Flashcards Info Modal | Modal | Flashcards (UI toggle) | Help/info popover explaining SRS and study modes | `/src/features/flashcards/components/FlashcardsInfoModal.tsx` | Flashcards |
| FC-6 | Deck Preview Modal | Modal | Community (explore) | Quick preview of deck contents before subscribing | `/src/features/flashcards/DeckPreviewModal.tsx` | Flashcards |

**Flashcards Count: 6 items (4 screens, 2 modals)**

---

## Stories

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| ST-1 | Stories Hub | Screen | `/:lang/practice/stories` (protected) | List of available story passages for reading practice | `/src/features/stories/StoriesPage.tsx` | Stories |
| ST-2 | Story Detail | Screen | `/:lang/practice/stories/:storyId` | Full story with glossary, audio, translations | `/src/features/stories/StoryDetailPage.tsx` | Stories |
| ST-3 | Story Preview Modal | Modal | Community (explore) | Sneak peek of story content before starting | `/src/features/stories/StoryPreviewModal.tsx` | Stories |

**Stories Count: 3 items (2 screens, 1 modal)**

---

## Social & Leaderboard

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| SC-1 | Social Hub | Screen | `/:lang/social` (protected) | Friend activity feed, achievements, notifications | `/src/features/social/SocialPage.tsx` | Social |
| SC-2 | Friends Page | Screen | `/:lang/social/friends` (protected) | Friend list with add/remove, direct message links | `/src/features/social/FriendsPage.tsx` | Social |
| SC-3 | Messenger | Screen | `/:lang/messenger` or `/:lang/messenger/:friendId` (protected) | DM inbox and conversation view with a specific user | `/src/features/messenger/MessengerPage.tsx` | Social |
| SC-4 | Leaderboard | Screen | `/:lang/community/leaderboard` (protected, flagged) | Global/league XP rankings | `/src/features/leaderboard/LeaderboardRoute.tsx` | Social |
| SC-5 | Find Friend Modal | Modal | Social (action) | Search & add friends by username | `/src/features/social/components/FindFriendModal.tsx` | Social |
| SC-6 | Pick Friend Modal | Modal | Messenger (action) | Select friend to start DM conversation | `/src/features/social/components/PickFriendModal.tsx` | Social |
| SC-7 | Leagues Modal | Modal | Social (UI toggle) | View league tiers and progression | `/src/features/social/components/LeaguesModal.tsx` | Social |
| SC-8 | User Preview Popover | Popover | Social/Community (hover) | Quick user card showing level, XP, recent activity | `/src/features/social/components/UserPreviewPopover.tsx` | Social |
| SC-9 | Profile Preview Popover | Popover | Friends (hover) | Condensed user profile summary | `/src/features/social/components/ProfilePreviewPopover.tsx` | Social |
| SC-10 | Reaction Row | Component | Social (feeds) | Emoji reaction/comment row on activity items | `/src/features/social/components/ReactionRow.tsx` | Social |

**Social & Leaderboard Count: 10 items (4 screens, 3 modals, 2 popovers, 1 component)**

---

## Community & Forum

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| CM-1 | Community Hub | Screen | `/:lang/community` → redirects to `/explore` (protected) | Community home (alias to explore) | `/src/features/community/CommunityLayout.tsx` | Community |
| CM-2 | Content Explorer | Screen | `/:lang/community/explore` (protected) | Browse user-created decks, stories, content | `/src/features/community/ContentBrowserPage.tsx` | Community |
| CM-3 | Contributors | Screen | `/:lang/community/contributors` (protected) | Creator profiles and contribution stats | `/src/features/community/ContributorsPage.tsx` | Community |
| CM-4 | Subscribed Decks | Screen | `/:lang/community/subscribed` (protected) | User's subscribed deck library | `/src/features/community/SubscribedPage.tsx` | Community |
| CM-5 | External Content Page | Screen | `/:lang/community/external-content` (protected) | Integrated third-party content library | `/src/features/community/ExternalContentPage.tsx` | Community |
| CM-6 | Create New Deck | Screen | `/:lang/community/decks/new` (protected) | Deck builder/wizard | `/src/features/community/DeckCreatePage.tsx` | Community |
| CM-7 | My Decks | Screen | `/:lang/community/decks/mine` (protected) | User's created/draft decks | `/src/features/community/MyDecksPage.tsx` | Community |
| CM-8 | Deck Editor | Screen | `/:lang/community/decks/:deckId` (protected) | Full deck editor with cards, preview, publish | `/src/features/community/contribute/DeckEditor.tsx` | Community |
| CM-9 | Contribute Tab | Screen | `/:lang/community/contribute` (protected) | Hub for content creation (tabs: my content, create, admin) | `/src/features/community/ContributePage.tsx` | Community |
| CM-10 | My Content Tab | Tab/Component | `/:lang/community/contribute` | View user's contributions (decks, stories) | `/src/features/community/contribute/MyContentTab.tsx` | Community |
| CM-11 | Create Tab | Tab/Component | `/:lang/community/contribute` | Tools to create new decks/stories | `/src/features/community/contribute/CreateTab.tsx` | Community |
| CM-12 | Admin Tab | Tab/Component | `/:lang/community/contribute` (role-gated) | Moderation and admin tools for reviewers | `/src/features/community/contribute/AdminTab.tsx` | Community |
| CM-13 | Story Editor | Screen | `/:lang/community/contribute/create/story` or `/create/story/:storyId` (protected) | Story creation and editing interface | `/src/features/community/contribute/StoryEditor.tsx` | Community |
| CM-14 | Forum Hub | Screen | `/:lang/community/discuss` (protected) | Discussion threads list, search, filters | `/src/features/community/forum/ForumPage.tsx` | Community |
| CM-15 | Thread Detail | Screen | `/:lang/community/discuss/thread/:threadId` (protected) | Single thread with comments and replies | `/src/features/community/forum/ThreadPage.tsx` | Community |
| CM-16 | New Thread | Screen | `/:lang/community/discuss/new` (protected) | Create new discussion thread | `/src/features/community/forum/NewThreadPage.tsx` | Community |

**Community & Forum Count: 16 items (14 screens, 2 tabs/components)**

---

## Shop

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| SH-1 | Shop | Screen | `/:lang/shop` (protected) | In-app store for cosmetics, ad-free, battle pass, etc. | `/src/features/shop/ShopPage.tsx` | Shop |

**Shop Count: 1 screen**

---

## Settings & Profile

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| ST-1 | Settings Modal | Modal | Global (via menu or useModal("settings")) | Tabbed settings (account, privacy, appearance, notifications, etc.) | `/src/features/settings/SettingsContent.tsx` | Settings |
| ST-2 | Public Profile | Screen | `/u/:username` (auth-optional) | User's public profile card with stats, badges, friend actions | `/src/features/profile/PublicProfilePage.tsx` | Profile |

**Settings & Profile Count: 2 items (1 modal, 1 screen)**

---

## Admin & Moderation

| ID | Name | Type | Route | Purpose | File | Area |
|-----|------|------|-------|---------|------|------|
| AD-1 | Admin Dashboard | Screen | `/admin` → redirects to `/admin/home` (role-gated) | Admin home with nav cards to all tools | `/src/features/admin/AdminHomePage.tsx` | Admin |
| AD-2 | Users List | Screen | `/admin/users` (role-gated) | Paginated user directory with search/filters | `/src/features/admin/AdminUsersListPage.tsx` | Admin |
| AD-3 | User Detail | Screen | `/admin/users/:userId` (role-gated) | Single user profile, learning progress, actions (impersonate, reset, adjust XP) | `/src/features/admin/AdminUserDetailPage.tsx` | Admin |
| AD-4 | Moderation Queue | Screen | `/admin/moderation` (role-gated) | User-generated content review & enforcement | `/src/features/admin/AdminModerationPage.tsx` | Admin |
| AD-5 | Operations | Screen | `/admin/ops` (role-gated) | System health, deployment, feature flags, etc. | `/src/features/admin/AdminOpsPage.tsx` | Admin |
| AD-6 | Audit Log | Screen | `/admin/ops/audit` (role-gated) | Detailed action audit trail | `/src/features/admin/AdminAuditPage.tsx` | Admin |
| AD-7 | Events Log | Screen | `/admin/events` (role-gated) | Real-time event stream and filtering | `/src/features/admin/events/EventsPage.tsx` | Admin |
| AD-8 | LMS Console | Screen | `/admin/lms` (role-gated) | Learning management system (course structure, publish pipeline) | `/src/features/admin/AdminLmsPage.tsx` | Admin |
| AD-9 | Decks Moderation | Screen | `/admin/content/decks` (role-gated) | Review and manage user-created decks | `/src/features/admin/AdminDecksPage.tsx` | Admin |
| AD-10 | Stories Moderation | Screen | `/admin/content/stories` (role-gated) | Review and manage user-created stories | `/src/features/admin/AdminStoriesPage.tsx` | Admin |
| AD-11 | Lessons List | Screen | `/admin/content/lessons` (role-gated) | Curriculum lesson management | `/src/features/admin/lessons/AdminLessonsListPage.tsx` | Admin |
| AD-12 | Lesson Editor | Screen | `/admin/content/lessons/:lessonId` (role-gated) | Full lesson builder (steps, media, grading, publish) | `/src/features/admin/lessons/AdminLessonEditorPage.tsx` | Admin |
| AD-13 | Impersonate Modal | Modal | User Detail (action) | Confirm impersonation of user for testing | `/src/features/admin/impersonation/ImpersonateConfirmModal.tsx` | Admin |
| AD-14 | Reset Progress Modal | Modal | User Detail (action) | Confirm and execute learning progress reset | `/src/features/admin/lms/ResetProgressModal.tsx` | Admin |
| AD-15 | Edit Learning Modal | Modal | User Detail (action) | Modify learning language, current level, XP | `/src/features/admin/lms/EditLearningModal.tsx` | Admin |
| AD-16 | Adjust Amount Modal | Modal | User Detail (action) | Grant/deduct Lingot or premium credits | `/src/features/admin/lms/AdjustAmountModal.tsx` | Admin |

**Admin & Moderation Count: 16 items (12 screens, 4 modals)**

---

## Shared UI Components

### Layout & Navigation Components

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-1 | Layout Root | Component | Global wrapper with header, sidebar (conditional), footer, modals, toasts | `/src/routes/Layout.tsx` |
| UP-2 | LangLayout | Component | Language-scoped wrapper (sets `:lang` context) | `/src/routes/LangLayout.tsx` |
| UP-3 | Page Shell | Component | Page padding, max-width, semantic main element | `/src/shared/components/PageShell.tsx` |
| UP-4 | Site Footer | Component | Global footer with links, credits, social icons | `/src/shared/components/SiteFooter.tsx` |
| UP-5 | Sidebar Navigation | Component | Persistent sidebar with nav links, collapse/expand | `/src/routes/SidebarNav.tsx` |
| UP-6 | Top Header | Component | Logo, nav links (desktop), mobile menu button, user menu | `/src/routes/Layout.tsx` |
| UP-7 | Mobile Menu | Component | Slide-down navigation menu for mobile viewports | `/src/routes/Layout.tsx` |

### Buttons & Controls

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-8 | Button | Component | Semantic button with variants (primary, secondary, ghost, danger), sizes, states | `/src/shared/components/ui/Button.tsx` |
| UP-9 | Checkbox | Component | Form checkbox with label | `/src/shared/components/ui/Checkbox.tsx` |
| UP-10 | Radio | Component | Form radio button group | `/src/shared/components/ui/Radio.tsx` |
| UP-11 | Toggle Switch | Component | On/off switch for binary settings | `/src/shared/components/ui/Switch.tsx` |
| UP-12 | Slider | Component | Range or value slider input | `/src/shared/components/ui/Slider.tsx` |
| UP-13 | Segmented Control | Component | Tab-like control for exclusive selection | `/src/shared/components/ui/SegmentedControl.tsx` |

### Forms & Inputs

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-14 | Text Input | Component | Single-line text input with label, error states | `/src/shared/components/ui/Input.tsx` |
| UP-15 | Textarea | Component | Multi-line text input with auto-expand option | `/src/shared/components/ui/Textarea.tsx` |
| UP-16 | Select Dropdown | Component | HTML select or custom dropdown picker | `/src/shared/components/ui/Select.tsx` |
| UP-17 | Search Input | Component | Text input with search icon and clear button | `/src/shared/components/ui/SearchInput.tsx` |
| UP-18 | Form Field | Component | Wrapper for label, input, error/help text | `/src/shared/components/ui/Field.tsx` |

### Info & Display

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-19 | Card | Component | Container with padding, border, shadow for grouped content | `/src/shared/components/ui/Card.tsx` |
| UP-20 | Badge | Component | Inline tag/badge for labels (success, warning, info, error) | `/src/shared/components/ui/Badge.tsx` |
| UP-21 | Alert Banner | Component | Full-width alert with dismiss option | `/src/shared/components/ui/AlertBanner.tsx` |
| UP-22 | Empty State | Component | Centered placeholder when no content available | `/src/shared/components/ui/EmptyState.tsx` |
| UP-23 | Avatar | Component | User profile picture circle with fallback initial | `/src/shared/components/ui/Avatar.tsx` |
| UP-24 | Decorated Avatar | Component | Avatar with frame/border decorations | `/src/shared/components/DecoratedAvatar.tsx` |
| UP-25 | User Avatar | Component | Avatar with popover on click (profile link) | `/src/shared/components/UserAvatar.tsx` |
| UP-26 | Breadcrumbs | Component | Navigation breadcrumb trail | `/src/shared/components/ui/Breadcrumbs.tsx` |
| UP-27 | Accordion | Component | Expandable/collapsible sections | `/src/shared/components/ui/Accordion.tsx` |
| UP-28 | Collapsible Section | Component | Single collapsible panel | `/src/shared/components/ui/CollapsibleSection.tsx` |
| UP-29 | Progress Ring | Component | Circular progress indicator | `/src/shared/components/ui/ProgressRing.tsx` |
| UP-30 | Progress Row | Component | Linear progress bar with label | `/src/shared/components/ui/ProgressRow.tsx` |
| UP-31 | Skeleton | Component | Placeholder loading state animation | `/src/shared/components/ui/Skeleton.tsx` |
| UP-32 | Spinner | Component | Animated loading indicator | `/src/shared/components/ui/Spinner.tsx` |
| UP-33 | Centered Loader | Component | Centered full-page loading state | `/src/shared/components/ui/CenteredLoader.tsx` |
| UP-34 | Week Sparkline | Component | Sparkline chart of weekly activity | `/src/shared/components/ui/WeekSparkline.tsx` |
| UP-35 | Tooltip | Component | Hover-triggered inline help text | `/src/shared/components/ui/Tooltip.tsx` |
| UP-36 | Key-Value List | Component | Definition list for structured data pairs | `/src/shared/components/ui/KeyValue.tsx` |
| UP-37 | List | Component | Semantic list container | `/src/shared/components/ui/List.tsx` |

### Navigation & Tabs

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-38 | Tabs | Component | Tabbed interface with content panels | `/src/shared/components/ui/Tabs.tsx` |
| UP-39 | Nav Card | Component | Card-style nav link with icon, label, badge | `/src/shared/components/ui/NavCard.tsx` |
| UP-40 | Nav Pill Link | Component | Inline pill-styled nav link | `/src/shared/components/ui/NavPillLink.tsx` |
| UP-41 | Toolbar | Component | Grouped action button bar | `/src/shared/components/ui/Toolbar.tsx` |
| UP-42 | Pagination | Component | Page navigation with prev/next and jump | `/src/shared/components/ui/Pagination.tsx` |
| UP-43 | Stepper | Component | Step indicator for multi-step flows | `/src/shared/components/ui/Stepper.tsx` |

### Data & Filtering

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-44 | Filter Bar | Component | Horizontal filter control bar with facets | `/src/shared/components/ui/FilterBar.tsx` |
| UP-45 | Facet Sidebar | Component | Vertical sidebar with expandable filter categories | `/src/shared/components/ui/FacetSidebar.tsx` |

### Utilities

| ID | Name | Type | Purpose | File |
|-----|------|------|---------|------|
| UP-46 | Markdown Renderer | Component | Render safe markdown to HTML | `/src/shared/components/MarkdownRenderer.tsx` |
| UP-47 | Rich Markdown Editor | Component | WYSIWYG markdown editor | `/src/shared/components/RichMarkdownEditor.tsx` |
| UP-48 | Chevron Icon | Component | Simple chevron SVG icon | `/src/shared/components/Chevron.tsx` |
| UP-49 | Icon | Component | Icon wrapper using icon library | `/src/shared/components/Icon.tsx` |
| UP-50 | Show (Conditional) | Component | Conditional render wrapper | `/src/shared/components/ui/Show.tsx` |
| UP-51 | Portal | Component | Portal for rendering outside DOM tree | `/src/shared/components/ui/Portal.tsx` |
| UP-52 | Scroll Area | Component | Scrollable container with styled scrollbar | `/src/shared/components/ScrollArea.tsx` |
| UP-53 | GitHub Badge | Component | Badge linking to GitHub repo | `/src/shared/components/GitHubBadge.tsx` |
| UP-54 | Theme Toggle | Component | Dark/light mode switcher | `/src/shared/components/ThemeToggle.tsx` |

**Shared UI Components Count: 54 components (7 layout, 6 buttons/controls, 5 forms, 15 info/display, 6 nav/tabs, 2 data, 8 utilities)**

---

## Overlays & Modals (Global)

| ID | Name | Type | Trigger | Purpose | File | Area |
|-----|------|------|---------|---------|------|------|
| OV-1 | Modal Root | System | Global (Layout) | Central modal stack renderer; currently handles "settings" modal | `/src/shared/components/ModalRoot.tsx` | System |
| OV-2 | Settings Modal | Modal | Menu > Settings or useModal("settings") | Tabbed settings interface (account, privacy, appearance, etc.) | `/src/features/settings/SettingsContent.tsx` | Settings |
| OV-3 | Dialog (Primitive) | Component | Custom usage | Confirmation dialog with title, message, actions | `/src/shared/components/ui/Dialog.tsx` | Primitives |
| OV-4 | Alert Dialog (Primitive) | Component | Custom usage | Alert-style dialog (one action + optional second) | `/src/shared/components/ui/Dialog.tsx` | Primitives |
| OV-5 | Modal (Primitive) | Component | Custom usage | Customizable modal with size, backdrop, animation | `/src/shared/components/ui/Modal.tsx` | Primitives |
| OV-6 | Modal Base (Primitive) | Component | Custom usage | Minimal modal scaffold with title, close button, max-width | `/src/shared/components/ModalBase.tsx` | Primitives |
| OV-7 | Modal Backdrop | Component | Used by Modal/ModalBase | Overlay backdrop with optional click-to-close | `/src/shared/components/ModalBackdrop.tsx` | Primitives |
| OV-8 | Sheet/Drawer (Primitive) | Component | Custom usage | Side or bottom sheet with slide animation | `/src/shared/components/ui/Sheet.tsx` | Primitives |
| OV-9 | Popover (Primitive) | Component | Custom usage | Positioned popover with arrow, auto-placement | `/src/shared/components/ui/Popover.tsx` | Primitives |
| OV-10 | Dropdown Menu (Primitive) | Component | Custom usage | Dropdown button menu | `/src/shared/components/ui/DropdownMenu.tsx` | Primitives |
| OV-11 | Confirm Modal (Primitive) | Component | Custom usage | Reusable confirm dialog with title, message, buttons | `/src/shared/components/ConfirmModal.tsx` | Primitives |
| OV-12 | Toast Container | System | Global (Layout) | Toast notification container and stack renderer | `/src/shared/components/ToastContainer.tsx` | System |
| OV-13 | Toast (Primitive) | Component | Custom usage | Individual toast notification | `/src/shared/components/ui/Toast.tsx` | Primitives |
| OV-14 | Cookie Consent Banner | Banner | Global (Layout) | Cookie/tracking consent UI with accept/decline | `/src/shared/components/CookieConsent.tsx` | Global |
| OV-15 | Funding Meter | Banner | Global (Layout) | Project funding progress meter (conditional) | `/src/shared/components/FundingMeter.tsx` | Global |
| OV-16 | Language Picker Modal | Modal | Home (on-load) | First-launch language selection (2×2 grid) | `/src/features/home/LanguagePickerModal.tsx` | Home |
| OV-17 | Theme Editor Panel | Panel | Global (toggle) | Dev/admin theme customization panel (color, fonts) | `/src/shared/components/ThemeEditorPanel.tsx` | Global |
| OV-18 | Auth Menu | Menu | Header (user avatar) | Dropdown with Profile, Settings, About, Logout | `/src/shared/components/AuthMenu.tsx` | Global |
| OV-19 | Language Selector | Menu | Header | Language picker popover | `/src/shared/components/LanguageSelector.tsx` | Global |
| OV-20 | Impersonation Banner | Banner | Admin (active) | Warning banner when admin is impersonating user | `/src/features/admin/impersonation/ImpersonationBanner.tsx` | Admin |
| OV-21 | Lingot Balance | Badge | Header | Current Lingot (in-game currency) chip | `/src/shared/components/LingotBalance.tsx` | Global |
| OV-22 | Ad-Free Pill | Badge | Header | Active ad-free window indicator | `/src/features/adFree/AdFreePill.tsx` | Global |
| OV-23 | Sync Manager Trigger | Component | Header | Sync status indicator and manual sync button | `/src/features/sync/SyncManagerTrigger.tsx` | Global |
| OV-24 | Daily Welcome Ad | Banner | Home (top) | Rewarded ad banner (conditional) | `/src/features/ads/DailyWelcomeAd.tsx` | Ads |
| OV-25 | Collapsible Ad Banner | Banner | Page footer | Dismissible ad banner (conditional) | `/src/features/ads/CollapsibleAdBanner.tsx` | Ads |
| OV-26 | SRS Pending Sync | Component | Global (auto) | Info banner when flashcard changes await sync | `/src/features/flashcards/SRSPendingSync.tsx` | Flashcards |
| OV-27 | Lesson Progress Hydrate | Component | Global (auto) | Loading indicator while lesson progress syncs | `/src/features/lesson/LessonProgressHydrate.tsx` | Learn |
| OV-28 | Quests Panel | Panel | Learn/Practice (URL-driven) | Quests list with filter tabs (?quests=open) | `/src/features/quests/components/QuestsPanel.tsx` | Quests |
| OV-29 | Quests Pill | Badge | Learn/Practice (nav) | Pill badge linking to quests panel | `/src/features/quests/components/QuestsPill.tsx` | Quests |
| OV-30 | Route Error Boundary | Component | Global (on error) | Error fallback UI for route failures | `/src/shared/components/RouteErrorBoundary.tsx` | System |
| OV-31 | Not Found Page | Component | Global (missing route) | 404 page (no content at route) | `/src/shared/components/NotFoundPage.tsx` | System |

**Overlays & Modals Count: 31 items (system, modals, primitives, banners, badges)**

---

## Summary by Area

| Area | Screens | Modals | Components | Popovers | Total |
|------|---------|--------|-----------|----------|-------|
| Marketing & Auth | 9 | 0 | 0 | 0 | 9 |
| Home & Navigation | 2 | 1 | 3 | 0 | 6 |
| Learn | 6 | 0 | 2 | 0 | 8 |
| Practice | 16 | 0 | 0 | 0 | 16 |
| Flashcards | 4 | 2 | 0 | 0 | 6 |
| Stories | 2 | 1 | 0 | 0 | 3 |
| Social & Leaderboard | 4 | 3 | 3 | 2 | 12 |
| Community & Forum | 14 | 0 | 2 | 0 | 16 |
| Shop | 1 | 0 | 0 | 0 | 1 |
| Settings & Profile | 1 | 1 | 0 | 0 | 2 |
| Admin & Moderation | 12 | 4 | 0 | 0 | 16 |
| Shared UI Components | 0 | 0 | 54 | 0 | 54 |
| Overlays & Modals (Global) | 0 | 0 | 31 | 0 | 31 |
| **TOTAL** | **71** | **12** | **95** | **2** | **180** |

---

## Notes for Review

1. **Screens** include full-page route-driven views, typically rendered within a layout wrapper.
2. **Modals** are dialog overlays with ModalBase, Dialog, or custom modal components.
3. **Popovers** are positioned contextual overlays (hover-triggered, usually user cards).
4. **Components** include reusable UI primitives and feature-specific modules (e.g., form fields, cards, navigation).
5. **Route Structure**: 
   - Root is `/` (redirects to `/home` if authed, else `/landing`)
   - Protected routes require auth and nest under `/:lang/*`
   - Admin routes live under `/admin`
   - Some routes have conditional feature-flag gating (e.g., leaderboard)
6. **Language Scoping**: Most app routes are under `/:lang/*` to allow per-language progress, settings, and content.
7. **Responsive Design**: Mobile views often collapse sidebar into slide-down menu, adjust spacing, and reorder nav links.
8. **Dev/Test Routes**: Some screens (e.g., LessonStepPreviewPage, AssetTestPage, PickerTestPage) are dev-only and hidden behind feature flags or not linked in main nav.
9. **Modal Stack**: The app uses a centralized `ModalContext` for coordinated modal display; most feature-specific modals manage their own local state via `useState`.
10. **Overlay Primitives**: Primitive components (Dialog, Modal, Sheet, Popover, Dropdown) are reusable across the app; feature areas compose them into domain-specific modals.

---

## Next Steps

Use this inventory as a reference for the 1×1 design review flow:
- Each unique row is a referenceable UI item for feedback
- Group by area for bulk review sessions
- Cross-reference file paths for quick navigation to source code
- Update this document as new screens or major components are added

