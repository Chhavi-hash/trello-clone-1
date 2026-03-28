import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from '../api';
import Navbar from '../components/Navbar';
import CreateBoardModal from '../components/CreateBoardModal';
import Sidebar from '../components/Sidebar';
import { useMember } from '../context/MemberContext';

export default function Home() {
  const [boards, setBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentMember } = useMember();

  useEffect(() => {
    if (!currentMember) return;
    getBoards(currentMember.id)
      .then(setBoards)
      .catch(err => setError(err.message || 'Failed to connect to backend database'));
  }, [currentMember]);

  return (
    <div className="home-page-container">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="home-main">
          <section className="board-section">
            <header className="home-section-header">
              <h2 className="section-title">
                <span className="ws-avatar sm">T</span> Your boards
              </h2>
            </header>
            
            {error && (
              <div className="api-error-alert glass">
                <strong>API Error:</strong> {error}.
              </div>
            )}

            <div className="boards-grid">
              {boards.map(b => (
                <button 
                  key={b.id} 
                  className="board-tile" 
                  style={{ 
                    background: b.bg_type === 'image' ? `url(${b.bg_value}) center/cover` : b.bg_value 
                  }} 
                  onClick={() => navigate(`/board/${b.id}`)}
                >
                  <div className="board-tile-overlay" />
                  <span className="board-tile-title">{b.title}</span>
                  <div className="board-tile-star">☆</div>
                </button>
              ))}
              <button className="board-tile create-tile glass" onClick={() => setShowModal(true)}>
                Create new board
              </button>
            </div>
          </section>
        </main>
      </div>
      {showModal && (
        <CreateBoardModal onClose={() => setShowModal(false)} memberId={currentMember?.id}
          onCreated={b => { setBoards(p => [b, ...p]); setShowModal(false); navigate(`/board/${b.id}`); }} />
      )}
    </div>
  );
}
