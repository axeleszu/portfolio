import resumeUrl from '../resume.pdf';
function setMode(mode) {
    document.body.className = 'mode-' + mode;
    document.getElementById('mode-switch').textContent = mode === 'dev' ? 'DEV_OPS' : 'MULTIMEDIA';
    if (mode == 'media') initMultimedia();
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

function initMultimedia() {
    initializeShowcase();
}

let showcaseLoaded = false;

const API_KEY = 'AIzaSyA4TZKeJawVDM-AXoVpKMw5Dj7DiQM_lcc';
const PLAYLIST_ID = 'PL8OzJlspMutERXnUzw-KGWxFMr0eBef3Q';
const CLIP_DURATION_SECONDS = 12;
let videoData = [];
let playerA, playerB;
let activePlayerIsA = true;
let playersReady = 0;
let showcaseInitialized = false;


async function fetchVideoData() {
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${API_KEY}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    const videosDetails = await videosResponse.json();

    const parseDuration = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (parseInt(match[1]) || 0);
        const minutes = (parseInt(match[2]) || 0);
        const seconds = (parseInt(match[3]) || 0);
        return hours * 3600 + minutes * 60 + seconds;
    };

    videoData = videosDetails.items.map(item => ({
        id: item.id,
        duration: parseDuration(item.contentDetails.duration)
    }));
}


async function initializeShowcase() {
    if (showcaseInitialized) return;
    showcaseInitialized = true;

    await fetchVideoData();
    if (videoData.length === 0) return;

    const playerOptions = {
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange },
        playerVars: { 'controls': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3 }
    };
    playerA = new YT.Player('playerA', playerOptions);
    playerB = new YT.Player('playerB', playerOptions);
}


function onPlayerReady(event) {
    event.target.mute();
    playersReady++;
    if (playersReady === 2) {
        playNextClip();
    }
}

function playNextClip() {
    const nextVideo = videoData[Math.floor(Math.random() * videoData.length)];
    const maxStartTime = nextVideo.duration - CLIP_DURATION_SECONDS;
    const startTime = Math.floor(Math.random() * (maxStartTime > 0 ? maxStartTime : 1));

    const playerToLoad = activePlayerIsA ? playerB : playerA;
    playerToLoad.loadVideoById({
        videoId: nextVideo.id,
        startSeconds: startTime,
        endSeconds: startTime + CLIP_DURATION_SECONDS
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        const activePlayer = activePlayerIsA ? playerA : playerB;
        const inactivePlayer = activePlayerIsA ? playerB : playerA;

        // Crossfade
        activePlayer.getIframe().classList.remove('visible');
        inactivePlayer.getIframe().classList.add('visible');

        activePlayerIsA = !activePlayerIsA;

        setTimeout(playNextClip, CLIP_DURATION_SECONDS * 1000);
    }
}