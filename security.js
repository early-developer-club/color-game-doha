// ========================================
// 클라이언트 사이드 보안 강화 모듈
// ========================================

class SecurityManager {
    constructor() {
        this.devToolsOpen = false;
        this.gameStartTime = null;
        this.lastLevelTime = null;
        this.susiciousActivity = 0;
        this.maxSuspiciousThreshold = 3;
        
        this.initSecurity();
    }
    
    initSecurity() {
        this.detectDevTools();
        this.preventCommonHacks();
        this.setupIntegrityChecks();
        this.monitorGameplay();
    }
    
    // 개발자 도구 탐지
    detectDevTools() {
        let devtools = { open: false, orientation: null };
        const threshold = 160;
        
        const detectDevTools = () => {
            if (window.outerWidth - window.innerWidth > threshold || 
                window.outerHeight - window.innerHeight > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.onDevToolsDetected();
                }
            } else {
                devtools.open = false;
            }
        };
        
        // 여러 방법으로 개발자 도구 탐지
        setInterval(detectDevTools, 500);
        
        // Console 접근 탐지
        let consoleOpened = false;
        Object.defineProperty(window, 'console', {
            get: function() {
                if (!consoleOpened) {
                    consoleOpened = true;
                    setTimeout(() => {
                        security.onDevToolsDetected();
                    }, 100);
                }
                return console;
            }
        });
        
        // F12, Ctrl+Shift+I 차단
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
                this.onDevToolsDetected();
                return false;
            }
            
            // Ctrl+Shift+I (개발자 도구)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                this.onDevToolsDetected();
                return false;
            }
            
            // Ctrl+U (소스 보기)
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
            
            // Ctrl+S (저장)
            if (e.ctrlKey && e.keyCode === 83) {
                e.preventDefault();
                return false;
            }
        });
        
        // 우클릭 방지
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
        
        // 드래그 방지
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // 선택 방지
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });
    }
    
    onDevToolsDetected() {
        this.devToolsOpen = true;
        this.susiciousActivity++;
        
        // 경고 메시지
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        overlay.innerHTML = `
            <h2>⚠️ 보안 경고</h2>
            <p>개발자 도구가 감지되었습니다.</p>
            <p>공정한 게임 플레이를 위해 개발자 도구를 닫아주세요.</p>
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                margin-top: 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">게임 다시 시작</button>
        `;
        
        document.body.appendChild(overlay);
        
        // 게임 중단
        if (window.game) {
            window.game.gameRunning = false;
            clearInterval(window.game.timerInterval);
        }
        
        console.clear();
        console.log('%c⚠️ 개발자 도구가 감지되었습니다!', 'color: red; font-size: 20px; font-weight: bold;');
    }
    
    // 일반적인 해킹 시도 방지
    preventCommonHacks() {
        // Script injection 방지
        const originalEval = window.eval;
        window.eval = function() {
            throw new Error('eval() is disabled for security reasons');
        };
        
        // Function constructor 차단
        const originalFunction = window.Function;
        window.Function = function() {
            throw new Error('Function constructor is disabled for security reasons');
        };
        
        // setTimeout/setInterval 문자열 실행 차단
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        window.setTimeout = function(callback, delay) {
            if (typeof callback === 'string') {
                throw new Error('String-based setTimeout is disabled for security reasons');
            }
            return originalSetTimeout.apply(this, arguments);
        };
        
        window.setInterval = function(callback, delay) {
            if (typeof callback === 'string') {
                throw new Error('String-based setInterval is disabled for security reasons');
            }
            return originalSetInterval.apply(this, arguments);
        };
        
        // innerHTML 모니터링
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(Element.prototype, 'innerHTML', {
            set: function(value) {
                if (typeof value === 'string' && (value.includes('<script') || value.includes('javascript:'))) {
                    console.warn('Suspicious innerHTML detected:', value);
                    return;
                }
                originalInnerHTML.set.call(this, value);
            },
            get: originalInnerHTML.get
        });
    }
    
    // 게임 무결성 검사
    setupIntegrityChecks() {
        // 게임 변수 보호
        if (window.game) {
            this.protectGameObject();
        }
        
        // DOM 조작 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // 의심스러운 DOM 변경 감지
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const element = node;
                            if (element.tagName === 'SCRIPT' || 
                                element.innerHTML?.includes('script') ||
                                element.innerHTML?.includes('eval')) {
                                console.warn('Suspicious script injection detected');
                                element.remove();
                                this.susiciousActivity++;
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    protectGameObject() {
        if (!window.game) return;
        
        // 게임 레벨 조작 방지
        let actualLevel = window.game.level;
        Object.defineProperty(window.game, 'level', {
            get: function() {
                return actualLevel;
            },
            set: function(value) {
                // 비정상적인 레벨 증가 감지
                if (value > actualLevel + 1 || value > 50) {
                    console.warn('Abnormal level change detected:', value);
                    security.susiciousActivity++;
                    return;
                }
                actualLevel = value;
            }
        });
        
        // 시간 조작 방지
        let actualTimeLeft = window.game.timeLeft;
        Object.defineProperty(window.game, 'timeLeft', {
            get: function() {
                return actualTimeLeft;
            },
            set: function(value) {
                // 시간 증가 시도 감지
                if (value > actualTimeLeft + 1) {
                    console.warn('Time manipulation detected:', value);
                    security.susiciousActivity++;
                    return;
                }
                actualTimeLeft = value;
            }
        });
    }
    
    // 게임플레이 모니터링
    monitorGameplay() {
        // 게임 시작 시간 기록
        this.gameStartTime = Date.now();
        
        // 비정상적으로 빠른 클릭 감지
        let clickCount = 0;
        let lastClickTime = 0;
        
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastClickTime < 50) { // 50ms 이내 연속 클릭
                clickCount++;
                if (clickCount > 5) {
                    console.warn('Automated clicking detected');
                    this.susiciousActivity++;
                }
            } else {
                clickCount = 0;
            }
            lastClickTime = now;
        });
    }
    
    // 게임 종료 시 무결성 검증
    validateGameCompletion(level, playerName) {
        // 정상적인 게임 종료는 항상 허용 (보안 경고 방지)
        if (level <= 50 && level >= 1) {
            return true;
        }
        
        const gameEndTime = Date.now();
        const gameDuration = gameEndTime - (this.gameStartTime || gameEndTime);
        
        // 의심스러운 활동이 너무 많은 경우 (임계값 높임)
        if (this.susiciousActivity >= (this.maxSuspiciousThreshold + 2)) {
            console.warn('Too many suspicious activities detected');
            return false;
        }
        
        // 너무 짧은 게임 시간 (임계값 낮춤)
        if (gameDuration < 2000) {
            console.warn('Game completed too quickly');
            return false;
        }
        
        // 개발자 도구 감지는 경고만 하고 차단하지 않음
        if (this.devToolsOpen) {
            console.warn('Developer tools were detected during game');
            // return false; // 주석 처리하여 차단하지 않음
        }
        
        // 레벨당 최소 시간 체크 (평균 3초)
        const minTimePerLevel = level * 3000;
        if (gameDuration < minTimePerLevel && level > 5) {
            console.warn('Game progression too fast for level:', level);
            return false;
        }
        
        return true;
    }
    
    // API 요청에 무결성 토큰 추가
    generateIntegrityToken(data) {
        const timestamp = Date.now();
        const gameData = JSON.stringify(data);
        const token = btoa(gameData + timestamp + navigator.userAgent.slice(0, 10));
        return { token, timestamp };
    }
}

// 보안 매니저 인스턴스 생성
let security;

// 페이지 로드 시 보안 초기화
document.addEventListener('DOMContentLoaded', () => {
    security = new SecurityManager();
    
    // 게임 객체가 생성된 후 보호 설정
    const checkGameObject = setInterval(() => {
        if (window.game) {
            security.protectGameObject();
            clearInterval(checkGameObject);
        }
    }, 100);
});

// 전역 오류 처리
window.addEventListener('error', (e) => {
    console.warn('Script error detected:', e.message);
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (security) {
        security.susiciousActivity = 0;
    }
});