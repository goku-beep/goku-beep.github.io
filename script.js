const BASE_URL = "https://goku-beep-github-io.vercel.app";
let currentQueue = [];
let currentIndex = -1;
let playbackHistory = []; 

async function searchSong() {
    const query = document.getElementById('searchBar').value;
    const resultsDiv = document.getElementById('results');
    if(!query) return;

    resultsDiv.innerHTML = "Searching...";
    try {
        const response = await fetch(`${BASE_URL}/search?q=${query}`);
        currentQueue = await response.json();
        resultsDiv.innerHTML = "";

        currentQueue.forEach((song, index) => {
            resultsDiv.innerHTML += `
                <div class="song-card">
                    <img src="${song.artwork}" class="result-art">
                    <div class="result-info">
                        <div style="font-weight:bold; font-size:14px;">${song.title}</div>
                        <div style="font-size:12px; color:#aaa;">${song.artist}</div>
                    </div>
                    <button class="play-item-btn" onclick="playAtIndex(${index})">▶</button>
                </div>`;
        });
    } catch (e) { resultsDiv.innerHTML = "Server Offline. Check Termux."; }
}

async function playAtIndex(index, isObject = false) {
    let song;
    if (isObject) {
        song = index; 
    } else {
        if (index < 0 || index >= currentQueue.length) return;
        currentIndex = index;
        song = currentQueue[index];
    }
    
    document.getElementById('nowPlaying').innerText = "Loading...";
    document.getElementById('nowArtist').innerText = song.artist;
    document.getElementById('trackArt').src = song.artwork;

    try {
        const response = await fetch(`${BASE_URL}/get_audio?id=${song.videoId}`);
        const data = await response.json();

        if (data.url) {
            const player = document.getElementById('audioPlayer');
            
            player.pause();
            player.src = data.url;
            player.load();
            player.play();
            
            document.getElementById('playBtn').innerText = "❚❚";
            document.getElementById('nowPlaying').innerText = song.title;
            
            if (playbackHistory.length === 0 || playbackHistory[playbackHistory.length - 1].videoId !== song.videoId) {
                playbackHistory.push(song);
            }
            
            fetchLyrics(song.title, song.artist);
        }
    } catch (e) {
        document.getElementById('nowPlaying').innerText = "Playback Error";
    }
}

function playNext() {
    // Just plays the next song in your search results
    if (currentIndex < currentQueue.length - 1) {
        playAtIndex(currentIndex + 1);
    }
}

function playPrevious() {
    if (playbackHistory.length > 1) {
        playbackHistory.pop(); 
        const prevSong = playbackHistory.pop(); 
        playAtIndex(prevSong, true); 
    } else {
        const player = document.getElementById('audioPlayer');
        player.currentTime = 0;
        player.play();
    }
}

function togglePlay() {
    const player = document.getElementById('audioPlayer');
    const btn = document.getElementById('playBtn');
    if (player.paused) {
        player.play();
        btn.innerText = "❚❚";
    } else {
        player.pause();
        btn.innerText = "▶";
    }
}

function updateProgress() {
    const player = document.getElementById('audioPlayer');
    const bar = document.getElementById('progressBar');
    if (player.duration) {
        const percentage = (player.currentTime / player.duration) * 100;
        bar.style.width = percentage + "%";
    }
}

function seek(event) {
    const player = document.getElementById('audioPlayer');
    const bar = event.currentTarget;
    const rect = bar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = offsetX / rect.width;
    player.currentTime = percentage * player.duration;
}

async function fetchLyrics(track, artist) {
    const content = document.getElementById('lyricsContent');
    content.innerText = "Loading lyrics...";
    try {
        const res = await fetch(`${BASE_URL}/get_lyrics?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`);
        const data = await res.json();
        content.innerText = data.plainLyrics || "Lyrics not found.";
    } catch(e) { content.innerText = "Lyrics offline."; }
}

function toggleLyrics() {
    document.getElementById('lyricsOverlay').classList.toggle('active');
}
