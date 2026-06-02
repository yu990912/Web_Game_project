const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 8080; // 💡 8080 포트 고정

app.use(cors()); 
app.use(express.json()); 

// --- [DB 연결 풀(Pool) 설정] ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- [DB 초기화 및 더미 데이터 삽입 함수] ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        score NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('🌱 초기 데이터가 없어서 더미 데이터를 생성합니다...');
      
      await pool.query(`
        INSERT INTO users (username, password) VALUES 
        ('testuser', '1234'),
        ('gildong', '1234'),
        ('mario', '1234');
      `);
      
      await pool.query(`
        INSERT INTO scores (username, score) VALUES 
        ('testuser', 12.34),
        ('gildong', 45.67),
        ('mario', 89.12),
        ('testuser', 23.45),
        ('gildong', 10.01);
      `);
      console.log('✅ 더미 데이터 삽입 완료!');
    } else {
      console.log('✅ DB 테이블과 데이터가 이미 준비되어 있습니다.');
    }
  } catch (err) {
    console.error('❌ DB 초기화 에러:', err);
  }
};

// --- [API 라우터 (Endpoints)] ---

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
    console.log(`🎉 회원가입 성공: ${username}`);
    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(400).json({ success: false, message: '이미 존재하는 아이디이거나 오류가 발생했습니다.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    
    if (result.rows.length > 0) {
      console.log(`🔓 로그인 성공: ${username}`);
      res.json({ success: true, message: '로그인 성공!', username: result.rows[0].username });
    } else {
      res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
  }
});

// 3. 점수 저장 API (기록 갱신 로직 추가)
app.post('/api/score', async (req, res) => {
  const { username, score } = req.body;
  try {
    // 1. 현재 DB에 저장된 내 최고 점수 확인
    const check = await pool.query('SELECT MAX(score) as best FROM scores WHERE username = $1', [username]);
    const bestScore = check.rows[0].best ? parseFloat(check.rows[0].best) : 0;

    // 2. 방금 죽었을 때의 점수가 내 기존 최고 점수보다 높을 때만 실행!
    if (score > bestScore) {
      // 기존에 있던 내 낮거나 같은 기록들을 전부 깔끔하게 삭제
      await pool.query('DELETE FROM scores WHERE username = $1', [username]);
      
      // 새로운 최고 기록으로 다시 삽입
      await pool.query('INSERT INTO scores (username, score) VALUES ($1, $2)', [username, score]);
      
      console.log(`🎉 신기록 달성 및 덮어쓰기 완료: ${username} - ${score}초`);
      res.json({ success: true, message: '신기록이 랭킹에 등록되었습니다!' });
    } else {
      // 신기록 갱신 실패 시 DB 건드리지 않음
      console.log(`😅 기록 갱신 실패: ${username} (최고: ${bestScore}초, 현재: ${score}초)`);
      res.json({ success: true, message: '최고 기록을 넘지 못했습니다.' });
    }
  } catch (err) {
    console.error('점수 저장 에러:', err);
    res.status(500).json({ success: false, message: '점수 저장에 실패했습니다.' });
  }
});

// 4. 랭킹 조회 API (1인 1기록 노출)
app.get('/api/ranking', async (req, res) => {
  try {
    // 혹시라도 남아있는 더미데이터 중복을 방지하기 위해 
    // GROUP BY로 유저별 최고 점수(MAX) 하나만 뽑아서 내림차순 정렬
    const result = await pool.query(`
      SELECT username, MAX(score) as score 
      FROM scores 
      GROUP BY username 
      ORDER BY score DESC 
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('랭킹 조회 에러:', err);
    res.status(500).json({ success: false, message: '랭킹을 불러오지 못했습니다.' });
  }
});
app.get('/api/my-best', async (req, res) => {
  const { username } = req.query;
  try {
    const result = await pool.query(`
      SELECT MAX(score) as best_score 
      FROM scores 
      WHERE username = $1
    `, [username]);
    
    res.json({ success: true, bestScore: result.rows[0].best_score || 0 });
  } catch (err) {
    console.error('최고 점수 조회 에러:', err);
    res.status(500).json({ success: false, message: '점수를 불러오지 못했습니다.' });
  }
});

// 💡 (중요) 서버를 끄지 않고 계속 포트를 열어두는 핵심 부분
app.listen(PORT, async () => {
  console.log(`🚀 백엔드 서버가 http://localhost:${PORT} 에서 돌아가는 중!`);
  await initDB(); 
});