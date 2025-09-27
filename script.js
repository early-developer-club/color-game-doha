class ColorGame {
    constructor() {
        this.level = 1;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.timerInterval = null;
        this.correctTileIndex = 0;
        this.playerName = '';
        
        this.initializeElements();
    }
    
    initializeElements() {
        this.startScreenEl = document.getElementById('startScreen');
        this.gameAreaEl = document.getElementById('gameArea');
        this.nicknameInputEl = document.getElementById('nicknameInput');
        this.countdownEl = document.getElementById('countdown');
        this.gameGridEl = document.getElementById('gameGrid');
        this.messageEl = document.getElementById('message');
        this.levelEl = document.getElementById('level');
        this.timerFillEl = document.querySelector('.timer-fill');
        this.timerTextEl = document.querySelector('.timer-text');
        this.gameOverEl = document.getElementById('gameOver');
        this.finalLevelEl = document.getElementById('finalLevel');
        this.playerNameEl = document.getElementById('playerName');
    }
    
    getGridSize(level) {
        if (level <= 3) return 2; // 2x2 = 4 tiles
        if (level <= 6) return 3; // 3x3 = 9 tiles
        if (level <= 10) return 4; // 4x4 = 16 tiles
        return 5; // 5x5 = 25 tiles
    }
    
    generateColors(level) {
        const baseHue = Math.random() * 360;
        const baseSaturation = 60 + Math.random() * 40; // 60-100%
        const baseLightness = 40 + Math.random() * 20; // 40-60%
        
        const baseColor = `hsl(${baseHue}, ${baseSaturation}%, ${baseLightness}%)`;
        
        // 레벨이 올라갈수록 색상 차이를 줄임
        const maxDifference = Math.max(30 - level * 2, 3);
        const hueDiff = Math.random() * maxDifference;
        const satDiff = Math.random() * (maxDifference / 2);
        const lightDiff = Math.random() * (maxDifference / 2);
        
        // 랜덤하게 증가 또는 감소
        const hueChange = Math.random() > 0.5 ? hueDiff : -hueDiff;
        const satChange = Math.random() > 0.5 ? satDiff : -satDiff;
        const lightChange = Math.random() > 0.5 ? lightDiff : -lightDiff;
        
        const differentColor = `hsl(${baseHue + hueChange}, ${Math.max(0, Math.min(100, baseSaturation + satChange))}%, ${Math.max(10, Math.min(90, baseLightness + lightChange))}%)`;
        
        return { baseColor, differentColor };
    }
    
    createGrid(level) {
        const gridSize = this.getGridSize(level);
        const totalTiles = gridSize * gridSize;
        const { baseColor, differentColor } = this.generateColors(level);
        
        this.correctTileIndex = Math.floor(Math.random() * totalTiles);
        
        this.gameGridEl.innerHTML = '';
        this.gameGridEl.className = `game-grid grid-${gridSize}x${gridSize}`;
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.backgroundColor = i === this.correctTileIndex ? differentColor : baseColor;
            tile.addEventListener('click', () => this.handleTileClick(i));
            this.gameGridEl.appendChild(tile);
        }
    }
    
    handleTileClick(index) {
        if (!this.gameRunning) return;
        
        const tile = this.gameGridEl.children[index];
        
        if (index === this.correctTileIndex) {
            tile.classList.add('correct');
            this.showMessage('정답! 다음 레벨로...', 'success');
            
            setTimeout(() => {
                this.level++;
                this.levelEl.textContent = this.level;
                this.createGrid(this.level);
                this.messageEl.textContent = '';
                this.gameGridEl.classList.add('show');
            }, 1000);
        } else {
            tile.classList.add('wrong');
            this.showMessage('틀렸습니다! 다시 시도해보세요.', 'error');
            
            setTimeout(() => {
                tile.classList.remove('wrong');
                this.messageEl.textContent = '';
            }, 1500);
        }
    }
    
    showMessage(text, type = '') {
        this.messageEl.textContent = text;
        this.messageEl.className = `message ${type}`;
    }
    
    startCountdown() {
        let count = 3;
        this.countdownEl.textContent = count;
        this.countdownEl.classList.add('show');
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownEl.textContent = count;
            } else if (count === 0) {
                this.countdownEl.textContent = 'START!';
            } else {
                this.countdownEl.classList.remove('show');
                this.countdownEl.style.display = 'none';
                this.startGameplay();
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    startGameplay() {
        this.gameRunning = true;
        this.createGrid(this.level);
        this.gameGridEl.classList.add('show');
        this.startTimer();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerTextEl.textContent = `${this.timeLeft}초`;
            
            const percentage = (this.timeLeft / 60) * 100;
            this.timerFillEl.style.width = `${percentage}%`;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        this.finalLevelEl.textContent = this.level;
        this.playerNameEl.textContent = this.playerName || '무명';
        
        // 점수 저장
        this.saveScore();
        
        this.gameOverEl.style.display = 'flex';
    }
    
    async saveScore() {
        // 비정상적인 점수 체크
        if (this.level < 1 || this.level > 50) {
            console.warn('Invalid level detected, not saving score');
            return;
        }
        
        try {
            // 플레이어 이름 추가 검증
            const playerName = this.playerName || '무명';
            const sanitizedName = playerName.trim().substring(0, 50);
            
            if (!sanitizedName) {
                console.warn('Invalid player name, not saving score');
                return;
            }
            
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_name: sanitizedName,
                    level_reached: this.level
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('Rate limit exceeded');
                } else {
                    console.error('Failed to save score:', result.error);
                }
                return;
            }
            
            console.log('Score saved successfully');
        } catch (error) {
            console.error('Error saving score:', error);
            // 네트워크 오류는 조용히 처리 (사용자 경험 저해 방지)
        }
    }
    
    resetGame() {
        this.level = 1;
        this.timeLeft = 60;
        this.gameRunning = false;
        clearInterval(this.timerInterval);
        
        this.levelEl.textContent = this.level;
        this.timerTextEl.textContent = '60초';
        this.timerFillEl.style.width = '100%';
        this.messageEl.textContent = '';
        this.gameGridEl.classList.remove('show');
        this.gameOverEl.style.display = 'none';
        this.gameAreaEl.style.display = 'none';
        this.startScreenEl.style.display = 'block';
        this.countdownEl.style.display = 'block';
        this.nicknameInputEl.value = '';
    }
    
    startWithNickname(nickname) {
        this.playerName = nickname;
        this.startScreenEl.style.display = 'none';
        this.gameAreaEl.style.display = 'block';
        this.startCountdown();
    }
}

let game;

// 입력값 검증 및 살니티제이션 함수
function validateAndSanitizeNickname(nickname) {
    if (!nickname || typeof nickname !== 'string') {
        throw new Error('닉네임을 입력해주세요!');
    }
    
    const sanitized = nickname
        .trim()
        .substring(0, 50)
        .replace(/[<>\"'&]/g, '') // XSS 방지
        .replace(/\s+/g, ' '); // 연속 공백 제거
    
    if (sanitized.length === 0) {
        throw new Error('유효한 닉네임을 입력해주세요!');
    }
    
    if (sanitized.length < 2) {
        throw new Error('닉네임은 2글자 이상이어야 합니다!');
    }
    
    // 욕설 필터링 (간단한 예시)
    const bannedWords = ['admin', 'test', '관리자', 'null', 'undefined'];
    const lowerName = sanitized.toLowerCase();
    
    for (const word of bannedWords) {
        if (lowerName.includes(word)) {
            throw new Error('사용할 수 없는 닉네임입니다!');
        }
    }
    
    return sanitized;
}

function startGameWithNickname() {
    try {
        const nickname = document.getElementById('nicknameInput').value;
        const sanitizedNickname = validateAndSanitizeNickname(nickname);
        
        if (!game) {
            game = new ColorGame();
        }
        
        game.startWithNickname(sanitizedNickname);
    } catch (error) {
        alert(error.message);
        return;
    }
}

function restartGame() {
    if (game) {
        game.resetGame();
    }
}

async function showLeaderboard() {
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const leaderboardList = document.getElementById('leaderboardList');
    
    // 화면 전환
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'block';
    
    // 로딩 표시
    leaderboardList.innerHTML = '<div class="loading">랭킹을 불러오는 중...</div>';
    
    try {
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            renderLeaderboard(result.data);
        } else {
            leaderboardList.innerHTML = '<div class="loading">아직 기록이 없습니다.</div>';
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        leaderboardList.innerHTML = '<div class="error">랭킹을 불러오는데 실패했습니다.</div>';
    }
}

function renderLeaderboard(data) {
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (data.length === 0) {
        leaderboardList.innerHTML = '<div class="loading">아직 기록이 없습니다.</div>';
        return;
    }
    
    const html = data.map((item, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="leaderboard-item ${rankClass}">
                <div class="rank">${rank}</div>
                <div class="player-info">
                    <div class="name">${item.player_name}</div>
                    <div class="date">${date}</div>
                </div>
                <div class="level">Level ${item.level_reached}</div>
            </div>
        `;
    }).join('');
    
    leaderboardList.innerHTML = html;
}

function hideLeaderboard() {
    const startScreen = document.getElementById('startScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    
    leaderboardScreen.style.display = 'none';
    startScreen.style.display = 'block';
}

// 페이지 로드 시 게임 객체 생성
document.addEventListener('DOMContentLoaded', () => {
    game = new ColorGame();
    
    // Enter 키로도 게임 시작 가능
    document.getElementById('nicknameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameWithNickname();
        }
    });
});