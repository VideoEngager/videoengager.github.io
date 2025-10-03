import { HashRouter, Route, Routes } from "react-router";
import Index from "./Index";
import Single from "./Single";

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/single" element={<Single />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
