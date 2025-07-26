import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./widgets/Navbar";
import Home from "./pages/Home";
import Root from "./pages/Root";
import RedirectFailed from "./pages/RedirectFailed";
import Intro from "./pages/Intro";
import ExamScore from "./pages/ExamScore";
import SemestersListing from "./pages/SemestersListing";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Root />} />
        <Route path="home" element={<Home />}></Route>
        <Route path="intro" element={<Intro />} />
        <Route path="examscore" element={<ExamScore />} />
        <Route path="semesters" element={<SemestersListing />} />

        <Route path="error/">
          <Route path="redirectfailed" element={<RedirectFailed />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
