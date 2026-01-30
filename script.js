const BASE_URL = "https://goku-beep-github-io.vercel.app"; // Double-check this matches Vercel!
let currentQueue = [];
let currentIndex = -1;
let nextSuggestedSong = null;
let playbackHistory = [];

// Helper to show detailed errors on the screen
function showDebug(msg, error = null) {
    const statusDiv = document.getElementById('debugStatus');
    let detailedError = msg;
    if (error) {
        // Captures network errors like CORS or DNS issues
        detailedError += ` | Details: ${error.message || error}`;
    }
    statusDiv.innerText = detailedError;
    console.error("DEBUG:", detailedError);
}

async function searchSong() {
    const query = document.getElementById('searchBar').value;
    const resultsDiv = document.getElementById('results');
    const statusDiv = document.getElementById('debugStatus');
    
    if(!query) return;

    resultsDiv.innerHTML = "Searching...";
    statusDiv.innerText = ""; // Clear previous errors

    try {
        const response = await fetch(`${BASE_URL}/search?q=${query}`);
        
        // If the server answered but with an error (404, 500, etc.)
        if (!response.ok) {
            showDebug(`Server Error: ${response.status} ${response.statusText}`);
            resultsDiv.innerHTML = "";
            return;
        }

        currentQueue = await response.json();
        resultsDiv.innerHTML = "";

        if (currentQueue.length === 0) {
            showDebug("No results found. Try a different name.");
        }

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
    } catch (e) {
        // This triggers if the URL is wrong, the server is down, or CORS blocks it
        showDebug("Network Failure. Check if URL is correct or if CORS is enabled.", e);
        resultsDiv.innerHTML = "";
    }
}

async function playAtIndex(index, isObject = false) {
    let song = isObject ? index : currentQueue[index];
    if (!isObject) currentIndex = index;

    document.getElementById('nowPlaying').innerText = "Loading...";
    document.getElementById('nowArtist').innerText = song.artist;
    document.getElementById('trackArt').src = song.artwork;
    document.getElementById('debugStatus').innerText = "";

    try {
        const response = await fetch(`${BASE_URL}/get_audio?id=${song.videoId}`);
        
        if (!response.ok) {
            throw new Error(`Audio Fetch Failed (${response.status})`);
        }

        const data = await response.json();
        if (data.url) {
            const player = document.getElementById('audioPlayer');
            player.src = data.url;
            player.play();
            
            document.getElementById('playBtn').innerText = "❚❚";
            document.getElementById('nowPlaying').innerText = song.title;
            
            if (playbackHistory.length === 0 || playbackHistory[playbackHistory.length - 1].videoId !== song.videoId) {
                playbackHistory.push(song);
            }
            
            prepareAutoplay(song.videoId);
            fetchLyrics(song.title, song.artist);
        }
    } catch (e) {
        showDebug("Playback Error", e);
        document.getElementById('nowPlaying').innerText = "Error Loading Audio";
    }
}

// ... Keep your other functions (prepareAutoplay, playNext, playPrevious, togglePlay, etc.) ...
e');
}
