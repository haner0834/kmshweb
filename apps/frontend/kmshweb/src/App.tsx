import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./widgets/Navbar";
import Home from "./pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navbar buttons={["themeToggle", "inbox"]} />}>
        <Route path="home" element={<Home />}></Route>
      </Route>
    </Routes>
  );
}

export default App;
