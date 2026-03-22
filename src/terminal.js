
export class TerminalHero {
    constructor() {
        this.root = document.querySelector('.terminal-window');
        this.output = document.getElementById('term-output');
        this.inputLine = document.getElementById('term-input-line');
        this.typingDisplay = document.getElementById('term-typing');
        this.hiddenInput = document.getElementById('hidden-input');

        this.history = [];
        this.bootSequence = [
            { text: "> KERNEL_INIT...", delay: 200 },
            { text: "> LOADING DRIVERS: [GPU, AUDIO, NET]", delay: 400 },
            { text: "> RESOLVING HOST: axelescutia.com...", delay: 600 },
            { text: "> CONNECTION ESTABLISHED (PING: 12ms)", delay: 800, type: "success" },
            { text: "> ACCESS GRANTED. WELCOME USER.", delay: 1000, type: "info" }
        ];

        this.init();
    }

    init() {
        this.runBootSequence();

        this.root.addEventListener('click', () => {
            this.hiddenInput.focus();
            this.root.classList.add('active');
        });

        this.hiddenInput.addEventListener('input', (e) => {
            this.typingDisplay.innerText = e.target.value;
        });

        this.hiddenInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand(e.target.value);
                e.target.value = '';
                this.typingDisplay.innerText = '';
            }
        });
        const hints = [
            ">> System stability: 99.7%...",
            ">> Anomaly detection: ACTIVE",
            ">> Patience is a virtue...",
        ];

        // Show one hint at 7 minutes 
        setTimeout(() => {
            this.printLine(hints[Math.floor(Math.random() * hints.length)], 'info');
        }, 7 * 60 * 1000);
        // Trigger matrix at 10 minutes
        /*     setTimeout(() => {
                 this.triggerMatrix();
             }, 10, 60 * 10000);*/
    }

    async runBootSequence() {
        for (let line of this.bootSequence) {
            await new Promise(r => setTimeout(r, line.delay / 2)); // Faster boot
            this.printLine(line.text, line.type);
        }
        this.inputLine.classList.remove('hidden');
        this.hiddenInput.focus();
    }

    printLine(text, type = '') {
        const div = document.createElement('div');
        div.className = `log-line ${type}`;
        div.innerText = text;
        this.output.appendChild(div);
        requestAnimationFrame(() => {
            this.output.scrollTop = this.output.scrollHeight;
        });
    }

    handleCommand(cmd) {
        const cleanCmd = cmd.trim().toLowerCase();

        this.printLine(`guest@axelescutia:~$ ${cmd}`, 'info');

        switch (cleanCmd) {
            case 'help':
                this.printLine(`
                    AVAILABLE COMMANDS:
                    -------------------
                    about     - Brief professional summary
                    contact   - Show contact info
                    resume    - Download PDF CV
                    skills    - List tech stack
                    clear     - Clear terminal
                    pong      - Play pong
                    theLab    - Switch to game dev profile
                    switch    - Switch to multimedia profile
                            `, 'cmd-response');
                break;

            case 'ls':
                this.printLine("about.sh  contact.sh  resume.sh  skills.sh  switch.sh  theLab.sh  pong.sh", 'cmd-response');
                break;

            case 'about':
                this.printLine("Axel Escutia: 12+ Years Full Stack Engineer & Multimedia Specialist. Expert in integrating Java/PHP backends with high-end frontend experiences.", 'cmd-response');
                break;

            case 'contact':
                this.printLine("Email: contact@axelescutia.com\nLinkedIn: linkedin.com/in/axel-escutia", 'cmd-response');
                document.querySelector('.contact-card').scrollIntoView({ behavior: 'smooth' });
                break;

            case 'resume':
                this.printLine(">> INITIATING DOWNLOAD...", 'success');
                document.getElementById('resume-link').click();
                this.printLine(">> For live version, visit: https://github.com/axeleszu/portfolio", 'cmd-response');
                break;

            case 'skills':
                this.printLine("[Frontend] JS, CSS3, HTML5, PWA\n[Backend] PHP, Java, SQL, Supabase\n[Creative] After Effects, Premiere, Illustrator", 'cmd-response');
                break;

            case 'clear':
                this.output.innerHTML = '';
                break;

            case 'sudo':
                this.printLine("Nice try. Admin privileges denied.", 'error');
                break;

            case 'switch':
                this.printLine(">> INITIATING SWITCH...", 'success');
                document.getElementById('mode-switch').click();
                break;

            case 'pong':
            case 'theLab':
                this.printLine(">> INITIATING SWITCH...", 'success');
                document.getElementById('theLab').click();
                break;

            case 'neofetch': // Easter egg
                this.printLine(`
                ██████████████████  guest@axelescutia
                ███████████▓▓▓████  ------------------
                ████████▓██▓▓▓████  OS: PortfolioOS 1.2
                ███████▓▓▓████████  Host: axelescutia.com
                █████▓▓▓▓▓▓▓██████  Kernel: TerminalHero v2.0
                ████▓▓▓▓▓▓▓▓▓▓████  Uptime: ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m
                ███▓▓▓▓▓▓▓▓▓▓▓▓███  Packages: 42 (js, css, creativity)
                ██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█  Shell: term.js
                ██████████████████  Resolution: ${window.innerWidth}x${window.innerHeight}
                                `, 'cmd-response');
                break;

            case 'matrix':
                this.triggerMatrix();
                break;

            default:
                if (cleanCmd !== '') {
                    this.printLine(`Command not found: ${cleanCmd}. Type 'help'.`, 'warn');
                }
        }
    }

    triggerMatrix() {
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        canvas.id = 'matrix-canvas';
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const alphabet = katakana + latin;

        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let x = 0; x < columns; x++) { drops[x] = 1; }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 30);
        window.addEventListener('keydown', onKey);

        const onKey = (e) => {
            if (e.key === 'Escape') {
                clearInterval(interval);
                window.removeEventListener('keydown', onKey);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.remove();
                this.printLine(">> MATRIX TERMINATED", 'info');
            }
        };

    }
}