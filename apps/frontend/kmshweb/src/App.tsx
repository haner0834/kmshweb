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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Root />} />

        <Route path="intro" element={<Intro />} />

        <Route path="login" element={<Login />} />

        <Route
          path="home"
          element={
            <ProtectedRoute>
              <Home />
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
