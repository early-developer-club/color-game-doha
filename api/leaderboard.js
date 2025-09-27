const SUPABASE_URL = 'https://***REMOVED***.supabase.co';
const SUPABASE_ANON_KEY = '***REMOVED***';

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
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
      const { player_name, level_reached } = req.body;

      if (!player_name || !level_reached) {
        return res.status(400).json({
          success: false,
          error: 'Player name and level are required'
        });
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
          player_name: player_name.trim().substring(0, 50),
          level_reached: parseInt(level_reached)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      const data = await response.json();
      
      return res.status(201).json({
        success: true,
        data: data[0]
      });
    } catch (error) {
      console.error('Error saving score:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save score'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}