import { Route, Routes } from 'react-router-dom'

import PublicLayout from '@/layouts/PublicLayout'
import LearnerLayout from '@/layouts/LearnerLayout'
import AdminLayout from '@/layouts/AdminLayout'
import { RedirectIfAuthed, RequireAdmin, RequireLearner } from '@/routes/guards'

import LandingPage from '@/pages/public/LandingPage'
import ExamModesPage from '@/pages/public/ExamModesPage'
import AboutPage from '@/pages/public/AboutPage'
import LoginPage from '@/pages/public/LoginPage'
import SignupPage from '@/pages/public/SignupPage'
import { ForbiddenPage, ServerErrorPage, NotFoundPage } from '@/pages/public/ErrorPages'

import DashboardPage from '@/pages/learner/DashboardPage'
import EnglishPage from '@/pages/learner/EnglishPage'
import GkPage from '@/pages/learner/GkPage'
import CurrentAffairsPage from '@/pages/learner/CurrentAffairsPage'
import EditorialsPage from '@/pages/learner/EditorialsPage'
import QuizzesPage from '@/pages/learner/QuizzesPage'
import RevisionPage from '@/pages/learner/RevisionPage'
import BookmarksPage from '@/pages/learner/BookmarksPage'
import SavedQuestionsPage from '@/pages/learner/SavedQuestionsPage'
import ProgressPage from '@/pages/learner/ProgressPage'
import ProfilePage from '@/pages/learner/ProfilePage'

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import ManageContentPage from '@/pages/admin/ManageContentPage'
import ContentFormPage from '@/pages/admin/ContentFormPage'
import QuestionFormPage from '@/pages/admin/QuestionFormPage'
import SourceInboxPage from '@/pages/admin/SourceInboxPage'
import ManageTagsPage from '@/pages/admin/ManageTagsPage'
import ManageUsersPage from '@/pages/admin/ManageUsersPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/exam-modes" element={<ExamModesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireLearner />}>
        <Route element={<LearnerLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/english" element={<EnglishPage />} />
          <Route path="/gk" element={<GkPage />} />
          <Route path="/current-affairs" element={<CurrentAffairsPage />} />
          <Route path="/editorials" element={<EditorialsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/revision" element={<RevisionPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/saved-questions" element={<SavedQuestionsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/content" element={<ManageContentPage />} />
          <Route path="/admin/content/new" element={<ContentFormPage />} />
          <Route path="/admin/content/:id/edit" element={<ContentFormPage />} />
          <Route path="/admin/current-affairs/new" element={<ContentFormPage presetCategory="Current Affairs" />} />
          <Route path="/admin/editorials/new" element={<ContentFormPage presetCategory="Editorials" />} />
          <Route path="/admin/quizzes/new" element={<QuestionFormPage />} />
          <Route path="/admin/source-inbox" element={<SourceInboxPage />} />
          <Route path="/admin/tags" element={<ManageTagsPage />} />
          <Route path="/admin/users" element={<ManageUsersPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
