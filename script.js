class ColorGame {
    constructor() {
        this.level = 1;
        this.timeLeft = 60;
        this.gameRunning = false;
        this.timerInterval = null;
        this.correctTileIndex = 0;
        
        this.initializeElements();
    }
    
    initializeElements() {
        this.countdownEl = document.getElementById('countdown');
        this.gameGridEl = document.getElementById('gameGrid');
        this.messageEl = document.getElementById('message');
        this.levelEl = document.getElementById('level');
        this.timerFillEl = document.querySelector('.timer-fill');
        this.timerTextEl = document.querySelector('.timer-text');
        this.gameOverEl = document.getElementById('gameOver');
        this.finalLevelEl = document.getElementById('finalLevel');
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
        this.gameOverEl.style.display = 'flex';
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
        this.countdownEl.style.display = 'block';
    }
}

let game;

function startGame() {
    if (game) {
        game.resetGame();
    } else {
        game = new ColorGame();
    }
    game.startCountdown();
}

// 페이지 로드 시 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    startGame();
});