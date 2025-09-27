// 환경변수에서 민감한 정보 가져오기 (Vercel에서 설정)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zgexmghxobuavibcgwrm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZXhtZ2h4b2J1YXZpYmNnd3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTE4NzcsImV4cCI6MjA3NDUyNzg3N30.QctvITPlg4agYRQL2KoFzVD32QHh122B3L2iRqKBHQk';

// Rate limiting을 위한 간단한 메모리 저장소
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1분
const MAX_REQUESTS_PER_WINDOW = 10; // 1분에 최대 10회

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// 입력 값 검증 및 살니티제이션
function validateAndSanitizeInput(playerName, levelReached) {
  // 플레이어 이름 검증
  if (!playerName || typeof playerName !== 'string') {
    throw new Error('Invalid player name');
  }
  
  // 레벨 검증
  if (!levelReached || typeof levelReached !== 'number' || levelReached < 1 || levelReached > 1000) {
    throw new Error('Invalid level reached');
  }
  
  // 플레이어 이름 살니티제이션
  const sanitizedName = playerName
    .trim()
    .substring(0, 50)
    .replace(/[<>\"'&]/g, '') // XSS 방지
    .replace(/\s+/g, ' '); // 연속 공백 제거
  
  if (sanitizedName.length === 0) {
    throw new Error('Player name cannot be empty');
  }
  
  return {
    sanitizedName,
    validLevel: Math.floor(levelReached)
  };
}

// Rate limiting 체크
function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier) || [];
  
  // 시간 윈도우 밖의 요청들 제거
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit 초과
  }
  
  // 새 요청 추가
  validRequests.push(now);
  requestCounts.set(identifier, validRequests);
  
  return true;
}

// IP 주소 가져오기
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         'unknown';
}

export default async function handler(req, res) {
  // 모든 응답에 CORS 헤더 추가
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // 클라이언트 IP 주소 가져오기
  const clientIP = getClientIP(req);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Rate limiting 체크 (POST 요청만)
  if (req.method === 'POST') {
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }
  }

  // GET: 랭킹 조회
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=level_reached.desc,created_at.desc&limit=10`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      return res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  }

  // POST: 점수 저장
  if (req.method === 'POST') {
    try {
      const { player_name, level_reached, integrity_token, timestamp } = req.body;

      // 무결성 토큰 검증 (선택적)
      if (integrity_token && timestamp) {
        const tokenAge = Date.now() - timestamp;
        // 토큰이 10분 이상 오래된 경우 거부
        if (tokenAge > 600000) {
          return res.status(400).json({
            success: false,
            error: 'Request too old'
          });
        }
        
        // 기본적인 토큰 검증 (더 강화 가능)
        const userAgent = req.headers['x-user-agent'] || '';
        const expectedData = JSON.stringify({ player_name, level_reached });
        const expectedToken = Buffer.from(expectedData + timestamp + userAgent.slice(0, 10)).toString('base64');
        
        if (integrity_token !== expectedToken) {
          console.warn('Invalid integrity token detected');
          // 엄격하게 차단하지 않고 경고만 로그
        }
      }

      // 추가 헤더 검증
      const gameVersion = req.headers['x-game-version'];
      if (gameVersion && gameVersion !== '1.0.0') {
        return res.status(400).json({
          success: false,
          error: 'Invalid game version'
        });
      }

      // 입력값 검증 및 살니티제이션
      const { sanitizedName, validLevel } = validateAndSanitizeInput(player_name, level_reached);

      // 비정상적으로 높은 레벨 체크 (스팸/해킹 방지)
      if (validLevel > 50) {
        return res.status(400).json({
          success: false,
          error: 'Invalid level detected'
        });
      }

      // 레벨별 최소 시간 체크 (타임스탬프가 있는 경우)
      if (timestamp && validLevel > 5) {
        const gameTime = Date.now() - timestamp;
        const minTime = validLevel * 2000; // 레벨당 최소 2초
        if (gameTime < minTime) {
          return res.status(400).json({
            success: false,
            error: 'Game completed too quickly'
          });
        }
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          player_name: sanitizedName,
          level_reached: validLevel
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase error:', errorText);
        throw new Error('Failed to save score');
      }

      const data = await response.json();
      
      return res.status(201).json({
        success: true,
        data: data[0]
      });
    } catch (error) {
      console.error('Error saving score:', error);
      
      // 에러 메시지 필터링 (민감한 정보 노출 방지)
      const safeErrorMessage = error.message.includes('Invalid') ? 
        error.message : 'Failed to save score';
      
      return res.status(400).json({
        success: false,
        error: safeErrorMessage
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}