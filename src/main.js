import resumeUrl from '../resume.pdf';
import podcastUrl from '../podcast.mp3';

function setMode(mode) {
    document.body.className = 'mode-' + mode;
    document.getElementById('mode-switch').textContent = mode === 'dev' ? 'DEV_OPS' : 'MULTIMEDIA';
    if (mode == 'media') {
        initMultimedia();
        initPodcastPlayer();
    }
}

let currentMode = 'dev';
document.getElementById('mode-switch').addEventListener('click', () => {
    currentMode = currentMode === 'dev' ? 'media' : 'dev';
    setMode(currentMode);
});
setMode(currentMode);

document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
});
async function initGithubWidget() {
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

initGithubWidget();
function initContactForm() {
    const form = document.querySelector('.simple-form');
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

import { TerminalHero } from './terminal.js';



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('resume-link').href = resumeUrl;
    initContactForm();
    new TerminalHero();

});

/* MEDIA Mode */

import AmbientPlayer from './mediaPlayer.js';
const animatedPlaylist = 'PL8OzJlspMutEdqXOpEMFAvg64dTJgGtOD';
const locationPlaylist = 'PL8OzJlspMutERXnUzw-KGWxFMr0eBef3Q';
let isYouTubeApiReady = false;

if (!window.cinematicPlayer) {
    window.cinematicPlayer = new AmbientPlayer({
        playerA_id: 'locationPlayerA',
        playerB_id: 'locationPlayerB',
        playlistId: locationPlaylist,
        pauseButtonId: 'playback-toggle-btn'
    });
}

if (!window.animationPlayer) {
    window.animationPlayer = new AmbientPlayer({
        playerA_id: 'animationPlayerA',
        playerB_id: 'animationPlayerB',
        playlistId: animatedPlaylist,
        pauseButtonId: 'animated-playback-toggle-btn'
    });
}

function initMultimedia() {
    if (cinematicPlayer) cinematicPlayer.init();
    if (animationPlayer) animationPlayer.init();
}

let podcastPlayerInitialized = false;

async function initPodcastPlayer() {
    // 1. Guard to stop if already initialized
    if (podcastPlayerInitialized) return;
    podcastPlayerInitialized = true;

    // 2. Get references to all the player elements
    const playerContainer = document.getElementById('podcast-player');
    if (!playerContainer) return; // Stop if the element isn't on the page

    const audioEl = playerContainer.querySelector('audio');
    const titleEl = playerContainer.querySelector('.title');
    const progressBar = playerContainer.querySelector('span:first-of-type');
    const toggleBtn = document.getElementById('podcast-playback-toggle-btn');
    const icon = toggleBtn.querySelector('span');

    const rssFeedUrl = 'http://www.fira.gob.mx/Nd/xml/podcast.xml';
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

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
        // 4. If fetching fails, load your local fallback MP3
        console.warn("Live feed failed, loading fallback episode. Error:", error.message);

        const fallbackTitle = "Perspectivas para el sector agroalimentario 2025";
        // Put your fallback MP3 in the `public` folder of your Vite project
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

/* Analytics */
const GA_ID = "G-H0M7LHEESB"
import { setupAnalytics } from './analytics.js';
setupAnalytics(GA_ID);