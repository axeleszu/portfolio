import resumeUrl from '../resume.pdf';
import podcastUrl from '../podcast.mp3';
import { TerminalHero } from './terminal.js';
import { SignalScope } from './signalscope.js';
import AmbientPlayer from './mediaPlayer.js';
import { setupAnalytics } from './analytics.js';
import { PongHero } from './pong.js';


const GA_ID = "G-H0M7LHEESB";
const validModes = ['dev', 'media', 'lab'];
const playlists = {
    animated: 'PL8OzJlspMutEdqXOpEMFAvg64dTJgGtOD',
    location: 'PL8OzJlspMutERXnUzw-KGWxFMr0eBef3Q',
    ai: 'PL8OzJlspMutFle3U1yW2VrLEWL7M9vhCo'
};

let currentMode = 'dev';
let podcastPlayerInitialized = false;
let githubInitialized = false;
let pongGame = null;


function handleRouting() {
    const path = window.location.pathname.split('/').filter(Boolean)[0];
    const targetMode = validModes.includes(path) ? path : 'dev';
    currentMode = targetMode;
    updateUI(targetMode);
}

function updateURL(mode) {
    const newPath = mode === 'dev' ? '/' : `/${mode}`;
    if (window.location.pathname !== newPath) {
        window.history.pushState({ mode }, '', newPath);
    }
}

function setMode(mode) {
    currentMode = mode;
    updateUI(mode);
    updateURL(mode);
}



function updateUI(mode) {
    const switchBtn = document.getElementById('mode-switch');
    if (!switchBtn) return;

    document.body.className = 'mode-' + mode;
    if (mode === 'dev') initGithubWidget();

    if (mode === 'lab') {
        switchBtn.textContent = 'LAB';
        document.querySelectorAll('#lab-grid iframe').forEach(frame => {
            if (!frame.src) frame.src = frame.dataset.src;
        });
        if (pongGame && typeof pongGame.destroy === 'function') {
            pongGame.destroy();
        }
        pongGame = new PongHero('pongCanvas');
        return;
    }

    switchBtn.textContent = mode === 'dev' ? 'DEV_OPS' : 'MULTIMEDIA';
    switchBtn.setAttribute('aria-checked', mode === 'media' ? 'true' : 'false');

    if (mode === 'media') {
        initMultimedia();
        initPodcastPlayer();
        initPhotoSlider();
    } else {
        const audioEl = document.querySelector('#podcast-player audio');
        if (audioEl && !audioEl.paused) audioEl.pause();
    }

    if (mode != 'lab') {
        if (pongGame && typeof pongGame.destroy === 'function') pongGame.destroy();
        pongGame = null;
    }
}

function setMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const menuLinks = document.querySelectorAll('[data-modal-target]');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('is-active');
        navMenu.classList.toggle('is-active');
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-modal-target');
            hamburger.classList.remove('is-active');
            navMenu.classList.remove('is-active');
            document.getElementById(targetId)?.showModal();
        });
    });
}

if (!window.cinematicPlayer) {
    window.cinematicPlayer = new AmbientPlayer({
        playerA_id: 'locationPlayerA',
        playerB_id: 'locationPlayerB',
        playlistId: playlists.location,
        pauseButtonId: 'playback-toggle-btn'
    });
}

if (!window.animationPlayer) {
    window.animationPlayer = new AmbientPlayer({
        playerA_id: 'animationPlayerA',
        playerB_id: 'animationPlayerB',
        playlistId: playlists.animated,
        pauseButtonId: 'animated-playback-toggle-btn'
    });
}
if (!window.aiPlayer) {
    window.aiPlayer = new AmbientPlayer({
        playerA_id: 'aiPlayerA',
        playerB_id: 'aiPlayerB',
        playlistId: playlists.ai,
        pauseButtonId: 'ai-playback-toggle-btn'
    });
}

function initMultimedia() {
    if (window.cinematicPlayer) window.cinematicPlayer.init();
    if (window.animationPlayer) window.animationPlayer.init();
    if (window.aiPlayer) window.aiPlayer.init();
    thumbChange();
}


async function initPodcastPlayer() {
    if (podcastPlayerInitialized) return;
    podcastPlayerInitialized = true;

    const playerContainer = document.getElementById('podcast-player');
    if (!playerContainer) return;

    const audioEl = playerContainer.querySelector('audio');
    const titleEl = playerContainer.querySelector('.title');
    const progressBar = playerContainer.querySelector('span:first-of-type');
    const toggleBtn = document.getElementById('podcast-playback-toggle-btn');
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('span');

    const rssFeedUrl = 'http://www.fira.gob.mx/Nd/xml/podcast.xml';
    const proxyUrl = 'https://cors-fira.firabancodemexico.workers.dev/?url=';

    try {
        const response = await fetch(proxyUrl + rssFeedUrl);
        if (!response.ok) {
            throw new Error(`Live feed failed with status: ${response.status}`);
        }
        const xmlText = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const latestItem = xmlDoc.querySelector("item");

        if (!latestItem) {
            throw new Error("XML feed is empty or invalid.");
        }

        const title = latestItem.querySelector("title").textContent;
        const audioUrl = latestItem.querySelector("enclosure").getAttribute("url");

        setupPlayer(title, audioUrl);

    } catch (error) {
        console.warn("Live feed failed, loading fallback episode. Error:", error.message);
        const fallbackTitle = "Perspectivas para el sector agroalimentario 2025";
        const fallbackAudioUrl = podcastUrl;
        setupPlayer(fallbackTitle, fallbackAudioUrl);
    }

    function setupPlayer(title, audioUrl) {
        titleEl.textContent = title;
        audioEl.src = audioUrl;


        toggleBtn.addEventListener('click', () => {
            if (audioEl.paused) {
                audioEl.play();
            } else {
                audioEl.pause();
            }
        });

        audioEl.addEventListener('play', () => {
            icon.className = 'icon-pause';
            toggleBtn.setAttribute('aria-label', 'Pause podcast');
        });

        audioEl.addEventListener('pause', () => {
            icon.className = 'icon-play';
            toggleBtn.setAttribute('aria-label', 'Play podcast');
        });

        audioEl.addEventListener('ended', () => {
            icon.className = 'icon-play';
            progressBar.style.width = '0%';
        });


        audioEl.addEventListener('timeupdate', () => {
            if (audioEl.duration) {
                const progressPercent = (audioEl.currentTime / audioEl.duration) * 100;
                progressBar.style.width = `${progressPercent}%`;
            }
        });
    }
}
function thumbChange() {
    const thumbs = document.querySelectorAll('.film-strip .thumb');

    thumbs.forEach(thumb => {
        if (thumb.dataset.bound) return;
        thumb.dataset.bound = true;
        thumb.addEventListener('click', (e) => {
            thumbs.forEach(t => t.classList.remove('active'));
            const img = e.currentTarget.querySelector('img');
            document.getElementById('main-photo').src = img.src;
            document.getElementById('photoName').innerText = img.src.split('/').pop().split('.')[0] + '.cr2';
            e.currentTarget.classList.add('active');
        });
    });
}


function initPhotoSlider() {
    const carousel = document.getElementById('carousel-photo');

    if (!carousel) return;

    const slider = carousel.querySelector('.slider');
    if (!slider) return;

    if (slider.children.length > 0) return;
    for (let i = 1; i < 20; i++) {
        let item = document.createElement('div');
        let img = document.createElement('img');

        if (i === 1) {
            item.classList.add('active');
        }

        item.classList.add('item')
        img.src = i < 10 ? `/photo/photo_0${i}.jpg` : `./photo/photo_${i}.jpg`;
        item.appendChild(img);
        slider.appendChild(item);
    }


    const items = slider.querySelectorAll('.item');
    if (items.length === 0) return;

    const next = carousel.querySelector('.next');
    const prev = carousel.querySelector('.prev');

    let active = 0;

    next.addEventListener('click', () => {
        items[active].classList.remove('active');
        active = (active + 1) % items.length;
        items[active].classList.add('active');
    });

    prev.addEventListener('click', () => {
        items[active].classList.remove('active');
        active = (active - 1 + items.length) % items.length;
        items[active].classList.add('active');
    });
}



async function initGithubWidget() {
    if (githubInitialized) return;
    githubInitialized = true;
    const grid = document.getElementById('github-grid');
    const statusText = document.getElementById('last-commit-text');
    const username = 'axeleszu';

    for (let i = 0; i < 50; i++) {
        const square = document.createElement('div');
        square.classList.add('pixel');

        const rand = Math.random();
        let level = 0;
        if (rand > 0.9) level = 4;
        else if (rand > 0.7) level = 3;
        else if (rand > 0.5) level = 2;
        else if (rand > 0.3) level = 1;

        square.classList.add(`level-${level}`);
        grid.appendChild(square);
    }
    try {
        const response = await fetch(`https://api.github.com/users/${username}/events/public`);
        if (!response.ok) throw new Error('GitHub API Error');

        const events = await response.json();
        const pushEvent = events.find(e => e.type === 'PushEvent');

        if (pushEvent) {
            const date = new Date(pushEvent.created_at);
            const timeAgo = timeSince(date);
            statusText.innerText = `Latest commit: ${timeAgo} ago`;
            statusText.style.color = '#39d353';
        } else {
            statusText.innerText = 'No recent public commits';
        }
    } catch (error) {
        statusText.innerText = 'GitHub System: Offline';
        console.error(error);
    }
}


function initContactForm() {
    const form = document.querySelector('.simple-form');
    if (!form) return;
    const input = form.querySelector('input');
    const terminalView = document.querySelector('.terminal-view');

    const FUNCTION_URL = "https://zruucshwqlbsndqpgatz.supabase.co/functions/v1/contact-protocol";
    const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydXVjc2h3cWxic25kcXBnYXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODUyNjQsImV4cCI6MjA4Mjk2MTI2NH0.NpOQn0mBGIrL6AvuAS4GMbX5Mdtds8DGExHS9eybqVs";

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value;

        input.disabled = true;
        const originalBtnText = form.querySelector('button').innerText;
        form.querySelector('button').innerText = "TRANSMITTING...";

        let logs = terminalView.querySelector('.terminal-logs');
        if (!logs) {
            logs = document.createElement('div');
            logs.className = 'terminal-logs';
            terminalView.appendChild(logs);
        }
        logs.innerHTML = `<div>> Initializing handshake...</div>`;

        try {
            const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Unknown Error');
            const lines = [
                `> Connecting to node: ${data.region}... OK`,
                `> Encrypting payload... OK`,
                `> Latency: ${data.latency}`,
                `> Status: ${data.protocol}`,
                `> <span style="color:#00ff41">SUCCESS: ${data.message}</span>`
            ];

            lines.forEach((line, index) => {
                setTimeout(() => {
                    logs.innerHTML += `<div>${line}</div>`;
                    logs.scrollTop = logs.scrollHeight;
                }, index * 400);
            });
            input.value = "";

        } catch (err) {
            logs.innerHTML += `<div style="color:red">> ERROR: ${err.message}</div>`;
        } finally {

            setTimeout(() => {
                input.disabled = false;
                form.querySelector('button').innerText = originalBtnText;
            }, 3000);
        }
    });
}


function setTheLab() {
    const canvas = document.getElementById('theLabCanvas');
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;

    const UNIT = canvas.width / 100;
    const SPEED = 1;
    const BALL_NUM = 60;

    const colors = [
        "#FF0000", "#FFFF00", "#00FF00", "#0000FF", "#00FFFF",
        "#FF00FF", "#F05924", "#FAB03A", "#006636", "#29ABE0",
        "#662B8F", "#C49C6B", "#734A24", "#FF911C", "#FFFFFF"
    ];

    let balls = [];


    class Ball {
        constructor() {
            this.firstTime = true;
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = 0;
            if (this.firstTime) {
                this.y = Math.random() * canvas.height;
                this.firstTime = false;
            }
            this.radius = 2.5 * UNIT;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vy = Math.random() * UNIT + SPEED;
            this.isActive = true;
        }

        update() {
            this.y += this.vy;
            if (this.y > canvas.height) {
                this.reset();
            }
        }

        draw() {
            // Only draw if visible
            if (this.isActive) {

                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.lineWidth = 5;
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
                ctx.fill()
            }
        }
        destroy() {
            this.isActive = false;
        }
    }

    for (let i = 0; i < BALL_NUM; i++) {
        balls.push(new Ball());
    }

    function animate() {
        // ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        balls.forEach(p => {
            p.update();
            p.draw();

        });
        requestAnimationFrame(animate);
    }
    animate();

    function resizeLabCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

    }
    resizeLabCanvas();
    window.addEventListener('resize', resizeLabCanvas);
}

document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('mode-switch');
    document.getElementById('resume-link').href = resumeUrl;

    setMenu();
    initContactForm();
    new TerminalHero();
    new SignalScope();

    handleRouting();

    setTheLab();
    setupAnalytics(GA_ID);

    document.querySelectorAll('dialog').forEach(dialog => {
        dialog.onclick = (e) => e.target === dialog && dialog.close();
    });
    switchBtn.addEventListener('click', () => setMode(currentMode === 'dev' ? 'media' : 'dev'));
    document.getElementById('theLab').addEventListener('click', () => setMode('lab'));
    document.getElementById('return2work').addEventListener('click', () => setMode('dev'));
});


window.addEventListener('popstate', handleRouting);


function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            console.log('ServiceWorker: ', registration.scope);
        }, function (err) {
            console.log('ServiceWorker error: ', err);
        });
    });
}