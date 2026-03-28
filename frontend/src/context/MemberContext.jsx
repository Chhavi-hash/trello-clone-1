import { createContext, useContext, useState, useEffect } from 'react';
import { getMembers } from '../api';

const MemberCtx = createContext(null);

export function MemberProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);

  useEffect(() => {
    getMembers().then(list => {
      setMembers(list);
      // default to first member
      const saved = localStorage.getItem('currentMemberId');
      const found = saved ? list.find(m => String(m.id) === saved) : null;
      setCurrentMember(found || list[0] || null);
    });
  }, []);

  const switchMember = (member) => {
    setCurrentMember(member);
    localStorage.setItem('currentMemberId', member.id);
  };

  return (
    <MemberCtx.Provider value={{ members, currentMember, switchMember }}>
      {children}
    </MemberCtx.Provider>
  );
}

export const useMember = () => useContext(MemberCtx);
