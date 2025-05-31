import React, { useState } from 'react';
import './DatingApp.css';

// Mock NPC data
const NPCS = [
  {
    id: 1,
    name: 'Alex',
    age: 28,
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Loves hiking, philosophy, and jazz. Looking for deep conversation.',
    interests: ['Hiking', 'Philosophy', 'Jazz'],
    funFact: 'Once backpacked solo across Patagonia.',
    avatarPath: '/avatars/male_1.glb'
  },
  {
    id: 2,
    name: 'Jamie',
    age: 26,
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Startup founder, foodie, and aspiring novelist.',
    interests: ['Startups', 'Food', 'Writing'],
    funFact: 'Wrote a novel in 30 days.',
    avatarPath: '/avatars/female_1.glb'
  },
  {
    id: 3,
    name: 'Taylor',
    age: 31,
    photo: 'https://randomuser.me/api/portraits/men/65.jpg',
    bio: 'Yoga teacher, traveler, and dog lover. Enjoys meaningful connections.',
    interests: ['Yoga', 'Travel', 'Dogs'],
    funFact: 'Has visited over 40 countries.',
    avatarPath: '/avatars/male_2.glb'
  },
  {
    id: 4,
    name: 'Angel',
    age: 25,
    photo: 'https://randomuser.me/api/portraits/women/25.jpg',
    bio: 'Creative soul, music lover, and adventure seeker. Life is too short for boring conversations.',
    interests: ['Music', 'Art', 'Adventure'],
    funFact: 'Can play three instruments and loves spontaneous road trips.',
    avatarPath: '/avatars/AngelChick.glb'
  }
];

export default function DatingApp() {
  const [current, setCurrent] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalNPC, setModalNPC] = useState<typeof NPCS[0] | null>(null);

  const handleSwipe = (liked: boolean) => {
    if (liked) setMatches([...matches, NPCS[current].id]);
    setCurrent((prev) => (prev + 1 < NPCS.length ? prev + 1 : 0));
  };

  const openModal = (npc: typeof NPCS[0]) => {
    setModalNPC(npc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalNPC(null);
  };

  return (
    <div>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'yellow',
          color: 'black',
          fontSize: '36px',
          textAlign: 'center',
          zIndex: 999999,
          padding: '20px',
          border: '5px solid red'
        }}
      >
        ⚡ CHANGES ARE NOW WORKING! REFRESH IF YOU SEE THIS! ⚡
      </div>
      <div className="dating-app-bg">
        <div className="dating-app-card-stack">
          {NPCS.length > 0 && (
            <div className="dating-app-card">
              <img src={NPCS[current].photo} alt={NPCS[current].name} className="dating-app-photo" />
              <h2>{NPCS[current].name}, {NPCS[current].age}</h2>
              <p className="dating-app-bio">{NPCS[current].bio}</p>
              <div className="dating-app-interests">
                {NPCS[current].interests.map((interest) => (
                  <span className="dating-app-interest" key={interest}>{interest}</span>
                ))}
              </div>
              <button className="dating-app-more-btn" onClick={() => openModal(NPCS[current])}>More</button>
              <div className="dating-app-actions">
                <button className="dating-app-swipe-left" onClick={() => handleSwipe(false)}>&#10006;</button>
                <button className="dating-app-swipe-right" onClick={() => handleSwipe(true)}>&#10084;</button>
              </div>
            </div>
          )}
        </div>
        {showModal && modalNPC && (
          <div className="dating-app-modal-bg" onClick={closeModal}>
            <div className="dating-app-modal" onClick={e => e.stopPropagation()}>
              <img src={modalNPC.photo} alt={modalNPC.name} className="dating-app-modal-photo" />
              <h2>{modalNPC.name}, {modalNPC.age}</h2>
              <p>{modalNPC.bio}</p>
              <p><strong>Fun Fact:</strong> {modalNPC.funFact}</p>
              <div className="dating-app-interests">
                {modalNPC.interests.map((interest) => (
                  <span className="dating-app-interest" key={interest}>{interest}</span>
                ))}
              </div>
              <button className="dating-app-modal-close" onClick={closeModal}>Close</button>
              <button className="dating-app-modal-date" onClick={() => alert('Date flow coming soon!')}>Ask on a Date</button>
            </div>
          </div>
        )}
        <div className="dating-app-matches">
          <h3>Matches</h3>
          <div className="dating-app-match-list">
            {matches.map(id => {
              const npc = NPCS.find(n => n.id === id);
              return npc ? (
                <div key={npc.id} className="dating-app-match">
                  <img src={npc.photo} alt={npc.name} className="dating-app-match-photo" />
                  <span>{npc.name}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
