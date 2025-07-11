import { Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./widgets/Navbar";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navbar buttons={["themeToggle"]} />}></Route>
    </Routes>
  );
}

export default App;
