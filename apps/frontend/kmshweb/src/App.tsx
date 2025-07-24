import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./widgets/Navbar";
import Home from "./pages/Home";
import Root from "./pages/Root";
import RedirectFailed from "./pages/RedirectFailed";
import Intro from "./pages/Intro";
import ExamScore from "./pages/ExamScore";
import { useEffect } from "react";
import { useNavbarButtons } from "./widgets/NavbarButtonsContext";

function App() {
  // const { setNavbarButtonsByType } = useNavbarButtons();
  // useEffect(() => {
  //   console.log("Run App");
  //   setNavbarButtonsByType(["logo", "themeToggle"]);
  // }, []);

  return (
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<Root />} />
        <Route path="home" element={<Home />}></Route>
        <Route path="intro" element={<Intro />} />
        <Route path="examscore" element={<ExamScore />} />

        <Route path="error/">
          <Route path="redirectfailed" element={<RedirectFailed />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
