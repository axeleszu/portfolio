import YouTubePlayer from 'youtube-player';

export default class AmbientPlayer {

    constructor(config) {
        this.playerA_id = config.playerA_id;
        this.playerB_id = config.playerB_id;
        this.playlistId = config.playlistId;
        this.pauseButtonId = config.pauseButtonId;

        // --- Internal State ---
        this.API_KEY = 'AIzaSyA4TZKeJawVDM-AXoVpKMw5Dj7DiQM_lcc';
        this.CLIP_DURATION_SECONDS = 12;
        this.videoData = [];
        this.playerA = null;
        this.playerB = null;
        this.activePlayerIsA = true;
        this.isInitialized = false;
        this.clipTimeoutId = null;

        if (this.pauseButtonId) {
            const button = document.getElementById(this.pauseButtonId);
            if (button) {
                button.addEventListener('click', () => this.togglePlayback());
            }
        }
    }

    async fetchVideoData() {
        try {
            const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${this.playlistId}&maxResults=50&key=${this.API_KEY}`;
            const playlistResponse = await fetch(playlistUrl);
            const playlistData = await playlistResponse.json();
            const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

            if (!videoIds) {
                console.warn(`Playlist ${this.playlistId} appears to be empty or private.`);
                return;
            }

            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${this.API_KEY}`;
            const videosResponse = await fetch(videosUrl);
            const videosDetails = await videosResponse.json();

            const parseDuration = (isoDuration) => {
                const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                const seconds = parseInt(match[3]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            };

            this.videoData = videosDetails.items.map(item => ({
                id: item.id,
                duration: parseDuration(item.contentDetails.duration)
            }));
        } catch (error) {
            console.error('Failed to fetch YouTube video data:', error);
        }
    }


    async init() {

        const playerAElement = document.getElementById(this.playerA_id);
        if (!playerAElement || playerAElement.hasAttribute('data-yt-player-initialized')) {
            return;
        }
        if (this.isInitialized) return;
        this.isInitialized = true;

        await this.fetchVideoData();
        if (this.videoData.length === 0) {
            console.error(`Initialization failed: No valid videos found for playlist ${this.playlistId}.`);
            return;
        }



        try {
            const playerOptions = {
                playerVars: {
                    'controls': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3
                }
            };
            const playerOptions2 = {
                playerVars: {
                    'controls': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3
                }
            };
            this.playerA = await YouTubePlayer(this.playerA_id, playerOptions);
            this.playerB = await YouTubePlayer(this.playerB_id, playerOptions2);

            this.playerA.mute();
            this.playerB.mute();
            this.playerA.on('stateChange', (event) => this.onPlayerStateChange(event));
            this.playerB.on('stateChange', (event) => this.onPlayerStateChange(event));

            this.playNextClip();
        } catch (error) {
            console.error(`Error creating YouTube player instances for ${this.playlistId}:`, error);
        }
    }

    playNextClip() {
        if (this.videoData.length === 0) return;

        const nextVideo = this.videoData[Math.floor(Math.random() * this.videoData.length)];
        const maxStartTime = nextVideo.duration - this.CLIP_DURATION_SECONDS;
        const startTime = Math.floor(Math.random() * (maxStartTime > 0 ? maxStartTime : 0));

        const playerToLoad = this.activePlayerIsA ? this.playerB : this.playerA;
        playerToLoad.loadVideoById(nextVideo.id, startTime);
    }


    async onPlayerStateChange(event) {

        const iframe = await event.target.getIframe();

        const changedPlayerId = iframe.id;

        const hiddenPlayerId = this.activePlayerIsA ? this.playerB_id : this.playerA_id;
        const isHiddenPlayer = (changedPlayerId === hiddenPlayerId);

        if (event.data === 5 && isHiddenPlayer) { // 5 = CUED
            event.target.playVideo();
            return;
        }

        if (event.data === 1 && isHiddenPlayer) { // 1 = PLAYING
            const activeIframe = await (this.activePlayerIsA ? this.playerA.getIframe() : this.playerB.getIframe());
            const inactiveIframe = await (this.activePlayerIsA ? this.playerB.getIframe() : this.playerA.getIframe());

            activeIframe.classList.remove('visible');
            inactiveIframe.classList.add('visible');
            this.activePlayerIsA = !this.activePlayerIsA;

            clearTimeout(this.clipTimeoutId);
            this.clipTimeoutId = setTimeout(() => this.playNextClip(), this.CLIP_DURATION_SECONDS * 1000);
        }
    }

    async togglePlayback() {
        if (!this.pauseButtonId) return;

        const activePlayer = this.activePlayerIsA ? this.playerA : this.playerB;
        if (!activePlayer) return;

        const button = document.getElementById(this.pauseButtonId);
        const icon = button.querySelector('span');
        const playerState = await activePlayer.getPlayerState();

        if (playerState === 1) { // 1 is PLAYING
            activePlayer.pauseVideo();
            clearTimeout(this.clipTimeoutId);
            icon.className = 'icon-play';
            button.setAttribute('aria-label', 'Play Video');
        } else { // Paused or another state
            activePlayer.playVideo();
            // Restart the timer based on the clip's remaining time
            const currentTime = await activePlayer.getCurrentTime();
            const videoUrl = await activePlayer.getVideoUrl();
            const startMatch = videoUrl.match(/start=(\d+)/);
            const start = startMatch ? parseInt(startMatch[1]) : 0;
            const timePlayed = currentTime - start;
            const remainingTime = (this.CLIP_DURATION_SECONDS - timePlayed) * 1000;

            this.clipTimeoutId = setTimeout(() => this.playNextClip(), remainingTime > 0 ? remainingTime : 1);
            icon.className = 'icon-pause';
            button.setAttribute('aria-label', 'Pause Video');
        }
    }
}