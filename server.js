// Добавете функция за регистриране на потребителя
const registerUserWithPeer = async (peerId: string) => {
  if (!user) return;
  
  try {
    const response = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: user.uid,
        peerId: peerId
      })
    });
    
    const data = await response.json();
    console.log('✅ Регистриран в сървъра:', data);
  } catch (error) {
    console.error('Грешка при регистрация:', error);
  }
};

// Намерете потребител по UID
const findUserByUid = async (uid: string) => {
  try {
    const response = await fetch(`http://localhost:3001/find-user/${uid}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Грешка при търсене:', error);
    return null;
  }
};

// Променете Peer инициализацията:
peer.on('open', async (id) => {
  console.log('✅ Peer ID:', id);
  if (isMounted) {
    setPeerId(id);
    
    // Регистрираме потребителя в нашия сървър
    await registerUserWithPeer(id);
    
    // Обновяваме статуса във Firebase
    await updateOnlineStatus(true, id);
    setIsInitializing(false);
  }
});

// Променете startCall функцията да използва UID
const startCall = async (targetUser: OnlineUser) => {
  // Вместо директно да използваме peerId от Firebase,
  // можем да проверим в нашия сървър дали потребителят е онлайн
  const userInfo = await findUserByUid(targetUser.uid);
  
  if (!userInfo || !userInfo.exists) {
    setError(`${targetUser.name} не е онлайн`);
    return;
  }
  
  const targetPeerId = userInfo.peerId;
  
  if (!targetPeerId) {
    setError(`${targetUser.name} не е готов за видео разговор.`);
    return;
  }
  
  // ... останалата част от кода
  if (!localStreamRef.current || !peerRef.current) {
    setError('Грешка при инициализация');
    return;
  }

  setSelectedUser(targetUser);
  setConnectionStatus('connecting');
  setIsWaitingForAnswer(true);
  
  try {
    const call = peerRef.current.call(targetPeerId, localStreamRef.current);
    
    call.on('stream', (remoteStream: MediaStream) => {
      console.log('✅ Получен отдалечен stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(e => console.log('Play error:', e));
        setHasRemoteStream(true);
      }
      setIsCallActive(true);
      setConnectionStatus('connected');
      setIsWaitingForAnswer(false);
    });
    
    call.on('close', () => {
      console.log('📞 Повикването е затворено');
      endCall();
    });
    
    call.on('error', (err: Error) => {
      console.error('Грешка в call:', err);
      setError('Не може да се свърже с потребителя');
      endCall();
    });
    
    currentCallRef.current = call;
  } catch (err) {
    console.error('Грешка при позвъняване:', err);
    setError('Грешка при позвъняване');
    setConnectionStatus('disconnected');
    setIsWaitingForAnswer(false);
  }
};

// При затваряне, дерегистрирайте потребителя
useEffect(() => {
  return () => {
    if (peerId && user) {
      fetch('http://localhost:3001/unregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, peerId })
      }).catch(console.error);
    }
  };
}, [peerId, user]);
