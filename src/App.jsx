import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import StyleGuide from "./pages/StyleGuide.jsx";
import Library from "./pages/Library.jsx";
import LessonViewer from "./pages/LessonViewer.jsx";
import Highlights from "./pages/Highlights.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import Quizzes from "./pages/Quizzes.jsx";
import Import from "./pages/Import.jsx";
import Planner from "./pages/Planner.jsx";
import Progress from "./pages/Progress.jsx";
import Notes from "./pages/Notes.jsx";
import Backup from "./pages/Backup.jsx";
import { TimerProvider } from "./context/TimerContext.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <TimerProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              <Route path="library/:id" element={<LessonViewer />} />
              <Route path="highlights" element={<Highlights />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="quizzes" element={<Quizzes />} />
              <Route path="import" element={<Import />} />
              <Route path="planner" element={<Planner />} />
              <Route path="progress" element={<Progress />} />
              <Route path="notes" element={<Notes />} />
              <Route path="backup" element={<Backup />} />
              <Route
                path="*"
                element={
                  <Placeholder
                    title="Page not found"
                    description="That page doesn't exist. Use the menu to head back home."
                    stage="n/a"
                  />
                }
              />
            </Route>

            {/* The design-system page from Stage 1 (no sidebar) */}
            <Route path="style-guide" element={<StyleGuide />} />
          </Routes>
        </HashRouter>
      </TimerProvider>
    </ErrorBoundary>
  );
}