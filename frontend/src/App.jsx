import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MemberProvider } from './context/MemberContext';
import Home from './pages/Home';
import Board from './pages/Board';

export default function App() {
  return (
    <MemberProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/board/:id" element={<Board />} />
        </Routes>
      </BrowserRouter>
    </MemberProvider>
  );
}
