import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./widgets/Navbar";
import Home from "./pages/Home";
import Root from "./pages/Root";
import RedirectFailed from "./pages/RedirectFailed";
import Intro from "./pages/Intro";
import ExamScore from "./pages/ExamScore";
import SemestersListing from "./pages/SemestersListing";
import Login from "./pages/Login";
import Disciplinary from "./pages/Disciplinary";
import ProtectedRoute from "./auth/ProtectedRoute";
import Profile from "./pages/Profile";
import { SharedStudent } from "./widgets/StudentContext";
import LoginCheck from "./pages/LoginCheck";
import { useEffect } from "react";
import Upcoming from "./pages/Upcoming";
import More from "./pages/More";
import ReportEditor from "./pages/ReportEditor";
import ReportListing from "./pages/ReportListing";
import FAQ from "./pages/FAQ";

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const isDarkMode =
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Root />} />

        <Route path="intro" element={<Intro />} />

        <Route path="login" element={<SharedStudent />}>
          <Route index element={<Login />} />
          <Route path="check" element={<LoginCheck />} />
        </Route>

        <Route
          path="home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="upcoming/:name"
          element={
            <ProtectedRoute>
              <Upcoming />
            </ProtectedRoute>
          }
        />

        <Route
          path="more"
          element={
            <ProtectedRoute>
              <More />
            </ProtectedRoute>
          }
        />

        <Route
          path="faq"
          element={
            <ProtectedRoute>
              <FAQ />
            </ProtectedRoute>
          }
        />

        <Route
          path="report/new"
          element={
            <ProtectedRoute>
              <ReportEditor />
            </ProtectedRoute>
          }
        />

        <Route
          path="report/list"
          element={
            <ProtectedRoute>
              <ReportListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="examscore"
          element={
            <ProtectedRoute>
              <ExamScore />
            </ProtectedRoute>
          }
        />
        <Route
          path="semesters"
          element={
            <ProtectedRoute>
              <SemestersListing />
            </ProtectedRoute>
          }
        />

        <Route
          path="disciplinary"
          element={
            <ProtectedRoute>
              <Disciplinary />
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="error/">
          <Route path="redirectfailed" element={<RedirectFailed />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
