class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Configurações do jogo
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // Estado do jogo
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.dropTime = 0;
        this.dropInterval = 1000; // 1 segundo inicialmente
        
        // Definição das peças (tetrominós)
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00f000'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#f00000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000f0'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#f0a000'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
    }
    
    initBoard() {
        this.board = [];
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                this.board[y][x] = 0;
            }
        }
    }
    
    setupEventListeners() {
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused || this.gameOver) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.dropPiece();
                    break;
            }
        });
        
        // Controles de botões
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        // Controles móveis
        const setupMobileButton = (id, action) => {
            const btn = document.getElementById(id);
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('active');
                action();
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
            });
            btn.addEventListener('click', action);
        };
        
        setupMobileButton('leftBtn', () => this.movePiece(-1, 0));
        setupMobileButton('rightBtn', () => this.movePiece(1, 0));
        setupMobileButton('downBtn', () => this.movePiece(0, 1));
        setupMobileButton('rotateBtn', () => this.rotatePiece());
        setupMobileButton('dropBtn', () => this.dropPiece());
        
        // Prevenir rolagem da página ao tocar nos controles
        document.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('control-btn')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    generateNextPiece() {
        const randomType = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        this.nextPiece = {
            type: randomType,
            shape: this.pieces[randomType].shape,
            color: this.pieces[randomType].color,
            x: 0,
            y: 0
        };
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
            
            this.generateNextPiece();
            
            // Verificar game over
            if (this.checkCollision(this.currentPiece, 0, 0)) {
                this.endGame();
                return;
            }
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
        } else if (dy > 0) {
            // Peça tocou o fundo ou outra peça
            this.placePiece();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        // Verificar se a rotação é válida
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            // Tentar ajustar posição
            let adjusted = false;
            for (let dx = -2; dx <= 2; dx++) {
                if (!this.checkCollision(this.currentPiece, dx, 0)) {
                    this.currentPiece.x += dx;
                    adjusted = true;
                    break;
                }
            }
            
            if (!adjusted) {
                // Reverter rotação se não conseguir ajustar
                this.currentPiece.shape = originalShape;
            }
        }
        
        this.draw();
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }
    
    dropPiece() {
        if (!this.currentPiece) return;
        
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        
        this.placePiece();
        this.draw();
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    // Verificar limites
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Verificar colisão com peças já colocadas
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        // Colocar peça no tabuleiro
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Verificar linhas completas
        this.clearLines();
        
        // Gerar nova peça
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            let fullLine = true;
            
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (!this.board[y][x]) {
                    fullLine = false;
                    break;
                }
            }
            
            if (fullLine) {
                // Remover linha
                this.board.splice(y, 1);
                // Adicionar linha vazia no topo
                this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Verificar a mesma linha novamente
            }
        }
        
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
        }
    }
    
    updateScore(linesCleared) {
        // Sistema de pontuação do Tetris
        const points = [0, 40, 100, 300, 1200];
        this.score += points[linesCleared] * this.level;
        this.lines += linesCleared;
        
        // Aumentar nível a cada 10 linhas
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // Aumentar velocidade
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Limpar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar tabuleiro
        this.drawBoard();
        
        // Desenhar peça atual
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // Desenhar próxima peça
        this.drawNextPiece();
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                    
                    // Borda dos blocos
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }
    
    drawPiece(piece, context) {
        context.fillStyle = piece.color;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const drawX = (piece.x + x) * this.BLOCK_SIZE;
                    const drawY = (piece.y + y) * this.BLOCK_SIZE;
                    
                    context.fillRect(drawX, drawY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                    
                    // Borda dos blocos
                    context.strokeStyle = '#fff';
                    context.lineWidth = 1;
                    context.strokeRect(drawX, drawY, this.BLOCK_SIZE, this.BLOCK_SIZE);
                }
            }
        }
    }
    
    drawNextPiece() {
        // Limpar canvas da próxima peça
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            this.nextCtx.fillStyle = this.nextPiece.color;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        const drawX = offsetX + x * blockSize;
                        const drawY = offsetY + y * blockSize;
                        
                        this.nextCtx.fillRect(drawX, drawY, blockSize, blockSize);
                        
                        // Borda dos blocos
                        this.nextCtx.strokeStyle = '#fff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(drawX, drawY, blockSize, blockSize);
                    }
                }
            }
        }
    }
    
    gameLoop(timestamp) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        if (timestamp - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = timestamp;
        }
        
        this.draw();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    startGame() {
        if (this.gameOver) {
            this.restartGame();
            return;
        }
        
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('startBtn').textContent = 'Pausar';
        requestAnimationFrame((timestamp) => {
            this.dropTime = timestamp;
            this.gameLoop(timestamp);
        });
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            document.getElementById('pauseBtn').textContent = 'Continuar';
        } else {
            document.getElementById('pauseBtn').textContent = 'Pausar';
            requestAnimationFrame((timestamp) => {
                this.dropTime = timestamp;
                this.gameLoop(timestamp);
            });
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('startBtn').textContent = 'Iniciar';
    }
    
    restartGame() {
        this.gameOver = false;
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        
        this.initBoard();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.draw();
        
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startBtn').textContent = 'Iniciar';
        document.getElementById('pauseBtn').textContent = 'Pausar';
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
    
    // Ajustar tamanho do canvas para dispositivos móveis
    function resizeCanvas() {
        const gameBoard = document.querySelector('.game-board');
        const canvas = document.getElementById('gameCanvas');
        
        if (window.innerWidth <= 768) {
            const maxWidth = gameBoard.clientWidth;
            canvas.width = maxWidth;
            canvas.height = maxWidth * 2; // Mantém proporção 1:2
        } else {
            canvas.width = 300;
            canvas.height = 600;
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});