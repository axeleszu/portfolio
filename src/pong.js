export class PongHero {
    constructor(canvasEl = 'pongCanvas') {
        this.OBJ_COLOR = "#FFFFFF";
        this.SPEED = 200;

        this.canvas = document.getElementById(canvasEl);
        this.ctx = this.canvas.getContext('2d');

        this.paddle_1 = null;
        this.paddle_2 = null;
        this.ball = null;

        this.elapsedTime = Date.now();

        this.btnUp = document.getElementById('paddleUP');
        this.btnDown = document.getElementById('paddleDOWN');

        this.resizeCanvas();
        this.bindEvents();
        this.bindTouchControls();
        this.canvas.focus();
        this.update();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const paddleW = 10, paddleH = 100, ballS = 10;

        this.paddle_1 = new Paddle(
            10,
            this.canvas.height / 2 - paddleH / 2,
            paddleW,
            paddleH,
            this.SPEED,
            this.OBJ_COLOR
        );
        this.paddle_2 = new Paddle(
            this.canvas.width - 10 - paddleW,
            this.canvas.height / 2 - paddleH / 2,
            paddleW,
            paddleH,
            this.SPEED,
            this.OBJ_COLOR
        );
        this.ball = new Ball(
            this.canvas.width / 2 - ballS / 2,
            this.canvas.height / 2 - ballS / 2,
            ballS,
            ballS,
            this.SPEED,
            this.OBJ_COLOR,
            this.canvas
        );

        this.canvas.focus();
    }

    bindEvents() {
        this.canvas.addEventListener('click', () => this.canvas.focus());
        this.canvas.addEventListener('mouseenter', () => this.canvas.focus());

        this.canvas.addEventListener('keydown', (e) => {
            if (['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
            if (e.key === 'w') this.paddle_1.up = true;
            if (e.key === 's') this.paddle_1.down = true;
            if (e.key === 'ArrowUp') this.paddle_2.up = true;
            if (e.key === 'ArrowDown') this.paddle_2.down = true;
        });

        this.canvas.addEventListener('keyup', (e) => {
            if (e.key === 'w') this.paddle_1.up = false;
            if (e.key === 's') this.paddle_1.down = false;
            if (e.key === 'ArrowUp') this.paddle_2.up = false;
            if (e.key === 'ArrowDown') this.paddle_2.down = false;
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.bindTouchControls();
        });
    }

    bindTouchControls() {
        if (!this.btnUp || !this.btnDown || !this.paddle_2) return;

        const bind = (btn, paddle, direction) => {
            const start = (e) => {
                e.preventDefault();
                paddle[direction] = true;
                btn.classList.add('active');
                this.canvas.focus();
            };
            const end = (e) => {
                e.preventDefault();
                paddle[direction] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        bind(this.btnUp, this.paddle_2, 'up');
        bind(this.btnDown, this.paddle_2, 'down');
    }

    update() {
        const now = Date.now();
        const dt = Math.min(0.05, (now - this.elapsedTime) / 1000);
        this.elapsedTime = now;

        this.paddle_1.update(dt);
        this.paddle_2.update(dt);
        this.ball.update(dt);

        if (this.checkCollision(this.paddle_1, this.ball)) {
            this.ball.isHit = true;
            this.ball.dx = Math.abs(this.ball.dx);
            this.ball.x = this.paddle_1.x + this.paddle_1.width;
            const hitPos = (this.ball.y + this.ball.height / 2 - this.paddle_1.y) / this.paddle_1.height;
            this.ball.dy += (hitPos - 0.5) * 2;
            this.ball.dx *= 1.03;
            this.ball.dy *= 1.03;
        }
        if (this.checkCollision(this.paddle_2, this.ball)) {
            this.ball.isHit = true;
            this.ball.dx = -Math.abs(this.ball.dx);
            this.ball.x = this.paddle_2.x - this.ball.width;
            const hitPos = (this.ball.y + this.ball.height / 2 - this.paddle_2.y) / this.paddle_2.height;
            this.ball.dy += (hitPos - 0.5) * 2;
            this.ball.dx *= 1.03;
            this.ball.dy *= 1.03;
        }

        if (this.ball.x + this.ball.width < 0) {
            this.paddle_2.score++;
            this.ball.reset();
        } else if (this.ball.x > this.canvas.width) {
            this.paddle_1.score++;
            this.ball.reset();
        }

        this.draw();
        requestAnimationFrame(() => this.update());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paddle_1.draw(this.ctx);
        this.paddle_2.draw(this.ctx);
        this.ball.draw(this.ctx);

        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = `${this.paddle_1.score} - ${this.paddle_2.score}`;
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paddle_1 = this.paddle_2 = this.ball = null;
    }
}

class Paddle {
    constructor(x, y, width, height, speed, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dy = 0;
        this.down = false;
        this.up = false;
        this.speed = speed; this.score = 0;
        this.color = color;
    }

    update(dt) {
        if (this.down) this.dy = this.speed;
        else if (this.up) this.dy = -this.speed;
        else this.dy = 0;

        this.y += this.dy * dt;
        this.y = Math.max(0, Math.min(window.innerHeight - this.height, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Ball {
    constructor(x, y, width, height, speed, color, canvasRef) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
        this.canvas = canvasRef; this.reset();
        this.isHit = false;
    }

    reset() {
        this.x = this.canvas.width / 2 - this.width / 2;
        this.y = this.canvas.height / 2 - this.height / 2;
        const r = () => Math.random() * 0.75 + (Math.random() < 0.5 ? -1 : 0.25);
        this.dx = r();
        this.dy = r();
        this.isHit = false;
    }

    update(dt) {
        this.x += this.dx * dt * this.speed;
        this.y += this.dy * dt * this.speed;

        if (this.y <= 0) {
            this.y = 0;
            this.dy = -this.dy;
        } else if (this.y + this.height >= this.canvas.height) {
            this.y = this.canvas.height - this.height;
            this.dy = -this.dy;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.isHit ? "#FF4444" : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        setTimeout(() => this.isHit = false, 200)
    }
}