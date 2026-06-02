import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios'; // 백엔드 통신을 위한 axios 추가

const PLAYER_EMOJI = '🥷';
const API_URL = 'https://web-game-project.onrender.com/api'; // 백엔드 주소

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('TITLE');
  const [isBgmOn, setIsBgmOn] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [gameKey, setGameKey] = useState(0); 
  
  // --- [새로 추가된 데이터 상태(State)] ---
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // 현재 로그인한 유저
  const [myBestScore, setMyBestScore] = useState(0);    // 내 최고 점수
  const [rankingData, setRankingData] = useState([]);   // 랭킹 리스트
  
  const lobbyAudioRef = useRef(null);
  const gameAudioRef = useRef(null);

  // --- [BGM 컨트롤 (기존과 동일)] ---
  useEffect(() => {
    const savedBgm = localStorage.getItem('isBgmOn');
    if (savedBgm === 'true') setIsBgmOn(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('isBgmOn', isBgmOn);
    const lobbyBgm = lobbyAudioRef.current;
    const gameBgm = gameAudioRef.current;
    if (!lobbyBgm || !gameBgm) return;

    if (!isBgmOn) {
      lobbyBgm.pause(); gameBgm.pause(); return;
    }

    if (currentScreen === 'TITLE') {
      lobbyBgm.pause(); gameBgm.pause();
    } else if (['LOGIN', 'LOBBY', 'RANKING'].includes(currentScreen)) {
      gameBgm.pause(); gameBgm.currentTime = 0; 
      lobbyBgm.play().catch(e => console.log('BGM 재생 차단:', e));
    } else if (currentScreen === 'GAME') {
      lobbyBgm.pause(); gameBgm.play().catch(e => console.log('BGM 재생 차단:', e));
    }
  }, [isBgmOn, currentScreen]);

  const toggleBgm = () => setIsBgmOn(!isBgmOn);

  // --- [API 통신 함수들] ---

  // 1. 회원가입 요청
  const handleSignup = async () => {
    if (!usernameInput || !passwordInput) return alert('아이디와 비밀번호를 입력하세요.');
    try {
      const res = await axios.post(`${API_URL}/signup`, { username: usernameInput, password: passwordInput });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || '회원가입 실패');
    }
  };

  // 2. 로그인 요청
  const handleLogin = async () => {
    if (!usernameInput || !passwordInput) return alert('아이디와 비밀번호를 입력하세요.');
    try {
      const res = await axios.post(`${API_URL}/login`, { username: usernameInput, password: passwordInput });
      alert(res.data.message);
      setCurrentUser(res.data.username); // 로그인 성공 시 유저 이름 저장
      fetchMyBestScore(res.data.username); // 로그인하자마자 내 최고점수 불러오기
      setCurrentScreen('LOBBY'); // 로비로 이동
    } catch (err) {
      alert(err.response?.data?.message || '로그인 실패');
    }
  };

  // 3. 내 최고 점수 불러오기
  const fetchMyBestScore = async (username) => {
    try {
      const res = await axios.get(`${API_URL}/my-best?username=${username}`);
      setMyBestScore(res.data.bestScore);
    } catch (err) {
      console.error('최고점수 불러오기 에러', err);
    }
  };

  // 4. 랭킹 데이터 불러오기
  const fetchRanking = async () => {
    try {
      const res = await axios.get(`${API_URL}/ranking`);
      setRankingData(res.data.data);
      setCurrentScreen('RANKING');
    } catch (err) {
      alert('랭킹을 불러오는데 실패했습니다.');
    }
  };

  // --- [화면 전환 함수] ---
  const handleStartClick = () => {
    setIsBgmOn(true); 
    setIsSliding(true);
    setTimeout(() => { setCurrentScreen('LOGIN'); setIsSliding(false); }, 500);
  };

  const handleRestartGame = () => {
    setGameKey(prev => prev + 1); 
    if (isBgmOn && gameAudioRef.current) {
      gameAudioRef.current.currentTime = 0;
      gameAudioRef.current.play().catch(e => console.log('BGM 재생 차단:', e));
    }
  };

  // =====================================================================
  // 📺 화면 컴포넌트들
  // =====================================================================
  
  const renderTitleScreen = () => (
    <div style={{
      width: '100%', height: '100%', backgroundImage: "url('/title-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: isSliding ? 'translateX(-100vw)' : 'translateX(0)', transition: 'transform 0.5s ease-in-out'
    }}>
      <h1 style={{ fontSize: '80px', color: 'white', textShadow: '4px 4px 0 #000', marginBottom: '50px' }}>똥 피하기 게임</h1>
      <button onClick={handleStartClick} style={{ padding: '20px 50px', fontSize: '32px', fontWeight: 'bold', backgroundColor: '#f1c40f', color: '#333', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 8px 15px rgba(0,0,0,0.3)' }}>
        시작하기
      </button>
    </div>
  );

  const renderLoginScreen = () => (
    <div style={{ width: '100%', height: '100%',
     backgroundImage: "url('/login.png')", backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', animation: 'slideIn 0.5s ease-in-out forwards' }}>
      <h2 style={{ fontSize: '48px', marginBottom: '30px' }}>로그인 및 회원가입</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
        <input type="text" placeholder="아이디" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} style={{ padding: '15px', fontSize: '18px', borderRadius: '8px' }} />
        <input type="password" placeholder="비밀번호" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={{ padding: '15px', fontSize: '18px', borderRadius: '8px' }} />
        <button onClick={handleLogin} style={{ padding: '15px', fontSize: '20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>로그인</button>
        <button onClick={handleSignup} style={{ padding: '15px', fontSize: '20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>회원가입</button>
      </div>
    </div>
  );

  const renderLobbyScreen = () => (
    <div style={{ width: '100%', height: '100%',
   backgroundImage: "url('/main.png')", backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '30px', right: '40px', color: 'white', textAlign: 'right' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>👤 플레이어: {currentUser}</h3>
        {/* DB에서 가져온 최고 점수 렌더링 */}
        <p style={{ margin: 0, fontSize: '24px', color: '#f1c40f' }}>🏆 최고 점수: {parseFloat(myBestScore).toFixed(2)}초</p>
      </div>
      <h2 style={{ fontSize: '56px', color: 'white', marginBottom: '50px' }}>게임 로비</h2>
      <div style={{ display: 'flex', gap: '30px' }}>
        <button onClick={() => setCurrentScreen('GAME')} style={{ padding: '20px 40px', fontSize: '28px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>🎮 게임 시작</button>
        <button onClick={fetchRanking} style={{ padding: '20px 40px', fontSize: '28px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>📊 랭킹 보기</button>
      </div>
    </div>
  );

  const renderRankingScreen = () => (
    <div style={{ width: '100%', height: '100%',
    backgroundImage: "url('/rank1.png')", backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <h1 style={{ fontSize: '48px', color: '#f1c40f', marginBottom: '30px' }}>🏆 명예의 전당 🏆</h1>
      <div style={{ width: '600px', backgroundColor: '#34495e', padding: '30px', borderRadius: '15px', marginBottom: '30px', maxHeight: '400px', overflowY: 'auto' }}>
        {/* DB에서 가져온 랭킹 리스트 렌더링 */}
        {rankingData.map((rank, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #7f8c8d', fontSize: '24px' }}>
            <span>{index + 1}등. {rank.username}</span>
            <span style={{ color: '#f1c40f' }}>{parseFloat(rank.score).toFixed(2)}초</span>
          </div>
        ))}
      </div>
      <button onClick={() => setCurrentScreen('LOBBY')} style={{ padding: '15px 30px', fontSize: '20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>로비로 돌아가기</button>
    </div>
  );

  // =====================================================================
  // 🎮 인게임 화면 (Canvas)
  // =====================================================================
  const GameScreen = () => {
    const canvasRef = useRef(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [finalTime, setFinalTime] = useState(0);

    // 💡 죽었을 때 점수를 DB에 저장하고 로비로 돌아가는 함수
    const saveScoreAndExit = async () => {
      try {
        await axios.post(`${API_URL}/score`, { username: currentUser, score: finalTime });
        // 점수 저장 후 로비로 돌아갈 때 최고점수 갱신
        fetchMyBestScore(currentUser); 
        setCurrentScreen('LOBBY');
      } catch (err) {
        alert('점수 저장에 실패했습니다.');
      }
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      let animationFrameId;
      const bgImage = new Image();
      bgImage.src = '/background.png'; 

      let startTime = Date.now();
      let survivedTime = 0;
      let poops = [];
      let lastSpawnTime = 0;

      const player = { x: canvas.width/2 - 20, y: canvas.height - 40, width: 40, height: 40, speed: 10, velocityY: 0, jumpPower: -18, gravity: 0.8, isJumping: false };
      const keys = { ArrowLeft: false, ArrowRight: false };

      const handleKeyDown = (e) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
        if (e.code === 'ArrowRight') keys.ArrowRight = true;
        if (e.code === 'Space' && !player.isJumping) { player.velocityY = player.jumpPower; player.isJumping = true; }
      };
      const handleKeyUp = (e) => {
        if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
        if (e.code === 'ArrowRight') keys.ArrowRight = false;
      };

      window.addEventListener('keydown', handleKeyDown, { passive: false });
      window.addEventListener('keyup', handleKeyUp);

      const render = () => {
        const now = Date.now();
        survivedTime = (now - startTime) / 1000;
        const level = Math.min(Math.floor(survivedTime / 20), 6);
        const spawnRate = Math.max(200, 800 - (level * 100));
        const basePoopSpeed = 5 + (level * 2);

        if (bgImage.complete && bgImage.naturalWidth > 0) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (now - lastSpawnTime > spawnRate) {
          poops.push({ x: Math.random() * (canvas.width - 40), y: -40, width: 40, height: 40, speed: basePoopSpeed + Math.random() * 3 });
          lastSpawnTime = now;
        }

        if (keys.ArrowLeft) player.x -= player.speed;
        if (keys.ArrowRight) player.x += player.speed;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        player.velocityY += player.gravity; player.y += player.velocityY;
        if (player.y + player.height >= canvas.height) { player.y = canvas.height - player.height; player.velocityY = 0; player.isJumping = false; }

        ctx.font = `${player.height}px Arial`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillText(PLAYER_EMOJI, player.x, player.y);

        for (let i = poops.length - 1; i >= 0; i--) {
          let p = poops[i]; p.y += p.speed;
          ctx.font = `${p.height}px Arial`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
          ctx.fillText('💩', p.x, p.y);

          if (player.x < p.x + p.width && player.x + player.width > p.x && player.y < p.y + p.height && player.y + player.height > p.y) {
            cancelAnimationFrame(animationFrameId); setIsGameOver(true); setFinalTime(survivedTime);
            if (gameAudioRef.current) gameAudioRef.current.pause();
            return;
          }
          if (p.y > canvas.height) poops.splice(i, 1);
        }

        if (level > 0 && (survivedTime % 20 < 5) && survivedTime < 125) {
          ctx.fillStyle = 'red'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.strokeStyle = 'white'; ctx.lineWidth = 4;
          ctx.strokeText('난이도 UP!', canvas.width / 2, 120); ctx.fillText('난이도 UP!', canvas.width / 2, 120);
        }

        ctx.fillStyle = 'black'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'right'; ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        const timeText = `Time: ${survivedTime.toFixed(2)}s`;
        ctx.strokeText(timeText, canvas.width - 30, 60); ctx.fillText(timeText, canvas.width - 30, 60);

        animationFrameId = requestAnimationFrame(render);
      };

      render();
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    return (
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <canvas ref={canvasRef} width={1200} height={800} style={{ border: '4px solid black', backgroundColor: '#f9f9f9', display: 'block' }} />
        {isGameOver && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white'
          }}>
            <h1 style={{ color: 'red', fontSize: '64px', margin: '0 0 20px 0' }}>GAME OVER</h1>
            <h2 style={{ fontSize: '48px', margin: '0 0 40px 0' }}>기록: {finalTime.toFixed(2)}초</h2>
            <button onClick={handleRestartGame} style={{ padding: '15px 30px', fontSize: '24px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#e74c3c', color: 'white', fontWeight: 'bold' }}>
              다시 하기
            </button>
            {/* 💡 로비로 돌아갈 때 DB에 점수 저장 실행 */}
            <button onClick={saveScoreAndExit} style={{ padding: '15px 30px', fontSize: '24px', cursor: 'pointer', marginTop: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#3498db', color: 'white', fontWeight: 'bold' }}>
              점수 저장하고 로비로 돌아가기
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{` @keyframes slideIn { from { transform: translateX(100vw); } to { transform: translateX(0); } } `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#2c3e50' }}>
        <button onClick={toggleBgm} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, padding: '10px 20px', fontSize: '18px', borderRadius: '25px', border: 'none', backgroundColor: isBgmOn ? '#2ecc71' : '#e74c3c', color: 'white', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {isBgmOn ? '🔊 BGM ON' : '🔇 BGM OFF'}
        </button>
        <audio ref={lobbyAudioRef} src="/lobby-bgm.wav" loop />
        <audio ref={gameAudioRef} src="/game-bgm.wav" loop />
        {currentScreen === 'TITLE' && renderTitleScreen()}
        {currentScreen === 'LOGIN' && renderLoginScreen()}
        {currentScreen === 'LOBBY' && renderLobbyScreen()}
        {currentScreen === 'RANKING' && renderRankingScreen()}
        {currentScreen === 'GAME' && <GameScreen key={gameKey} />}
      </div>
    </>
  );
};

export default App;