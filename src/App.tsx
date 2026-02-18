import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/routes/Layout";
import { HomePage } from "@/features/home/HomePage";
import { LoginPage } from "@/features/auth/LoginPage";
import { LogoutPage } from "@/features/auth/LogoutPage";
import { FlashcardsPage } from "@/features/flashcards/FlashcardsPage";
import { StoriesPage } from "@/features/stories/StoriesPage";
import { StoryDetailPage } from "@/features/stories/StoryDetailPage";
import { VocabPage } from "@/features/vocab/VocabPage";
import { PracticePage } from "@/features/practice/PracticePage";
import { ParticlePracticePage } from "@/features/practice/ParticlePracticePage";
import { KanjiPracticePage } from "@/features/practice/KanjiPracticePage";
import { AlphabetPracticePage } from "@/features/practice/AlphabetPracticePage";
import { ComponentsPracticePage } from "@/features/practice/ComponentsPracticePage";
import { GrammarPage } from "@/features/grammar/GrammarPage";
import { CommunityPage } from "@/features/community/CommunityPage";
import { ForumPage } from "@/features/community/forum/ForumPage";
import { ThreadPage } from "@/features/community/forum/ThreadPage";
import { NewThreadPage } from "@/features/community/forum/NewThreadPage";
import { LeaderboardPage } from "@/features/leaderboard/LeaderboardPage";
import { CourseMapPage } from "@/features/course/CourseMapPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ProfileEditPage } from "@/features/settings/ProfileEditPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="stories/:storyId" element={<StoryDetailPage />} />
          <Route path="vocab" element={<VocabPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/particles" element={<ParticlePracticePage />} />
          <Route path="practice/kanji" element={<KanjiPracticePage />} />
          <Route path="practice/alphabet/:alphabetId?" element={<AlphabetPracticePage />} />
          <Route path="practice/components" element={<ComponentsPracticePage />} />
          <Route path="grammar" element={<GrammarPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/forum" element={<ForumPage />} />
          <Route path="community/forum/thread/:threadId" element={<ThreadPage />} />
          <Route path="community/forum/new" element={<NewThreadPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="course-map" element={<CourseMapPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/profile" element={<ProfileEditPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
