from flask import Flask, request, jsonify
from ytmusicapi import YTMusic
from flask_cors import CORS
import yt_dlp
import requests

app = Flask(__name__)
CORS(app)
yt = YTMusic()

@app.route('/')
def home():
    return "Backend is running!"


@app.route('/search')
def search():
    query = request.args.get('q')
    if not query: return jsonify([])
    try:
        search_results = yt.search(query, filter="songs")
        results = []
        for item in search_results[:5]:
            img_url = item['thumbnails'][-1]['url']
            results.append({
                "title": item['title'],
                "artist": item['artists'][0]['name'],
                "videoId": item['videoId'],
                "artwork": img_url
            })
        return jsonify(results)
    except Exception as e:
        return str(e), 500

@app.route('/get_audio')
def get_audio():
    video_id = request.args.get('id')
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'nocheckcertificate': True,
        'extractor_args': {'youtube': {'player_client': ['android', 'web']}}
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            return jsonify({"url": info['url']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_lyrics')
def get_lyrics():
    track = request.args.get('track')
    artist = request.args.get('artist')
    try:
        url = f"https://lrclib.net/api/get?artist_name={artist}&track_name={track}"
        r = requests.get(url)
        if r.status_code == 200:
            return jsonify(r.json())
        return jsonify({"plainLyrics": "Lyrics not found."})
    except:
        return jsonify({"plainLyrics": "Error fetching lyrics."})

# NEW: Smart Autoplay Route
@app.route('/get_suggestions')
def get_suggestions():
    video_id = request.args.get('id')
    try:
        # Fetches related "Up Next" songs from YouTube Music
        watch_playlist = yt.get_watch_playlist(videoId=video_id)
        suggestions = []
        # We take the top 5 similar tracks
        for item in watch_playlist['tracks'][1:6]:
            suggestions.append({
                "title": item['title'],
                "artist": item['artists'][0]['name'],
                "videoId": item['videoId'],
                "artwork": item['thumbnails'][-1]['url']
            })
        return jsonify(suggestions)
    except Exception as e:
        print(f"Suggestion Error: {e}")
        return jsonify([])

# Vercel will look for the 'app' object and run it automatically.
# This block ensures it only runs manually when you are on Termux/Local.
if __name__ == '__main__':
    app.run(debug=True)
    
