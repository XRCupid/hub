import { FC, useEffect, useState } from 'react';
import ConferenceBoothDemo from './ConferenceBoothDemo';

const ConferenceMobile: FC = () => {
  const [roomId, setRoomId] = useState<string>('');

  useEffect(() => {
    // Extract room ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room) {
      console.log('[ConferenceMobile] Found room ID in URL:', room);
      setRoomId(room);
    }
  }, []);

  return <ConferenceBoothDemo initialMode="participant" roomId={roomId} />;
};

export default ConferenceMobile;
