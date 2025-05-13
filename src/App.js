import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <h1>DIPSEA</h1>
          <div className="nav-links">
            <Link to="/">동영상 생성</Link>
            <Link to="/page2">시 생성</Link>
            <Link to="/page3">음성 입력</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;