const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const recordBtn = document.getElementById('recordBtn');
const resSelect = document.getElementById('resSelect');
const micMeter = document.getElementById('micMeter');

let sources = [];
let mediaRecorder;
let recordedChunks = [];
let audioCtx;
let mainAudioDestination;

/**
 * 1. キャンバスサイズの更新
 */
function updateCanvasSize() {
    if (resSelect.value === 'portrait') {
        canvas.width = 1080;
        canvas.height = 1920;
    } else {
        canvas.width = 1920;
        canvas.height = 1080;
    }
}
resSelect.onchange = updateCanvasSize;

/**
 * 2. 音声コンテキストの初期化
 */
function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mainAudioDestination = audioCtx.createMediaStreamDestination();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * 3. 各種ソースの追加
 */
async function addMic() {
    initAudioContext();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        source.connect(mainAudioDestination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function updateMeter() {
            analyser.getByteFrequencyData(dataArray);
            let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            micMeter.style.width = Math.min(avg * 2.5, 100) + "%";
            requestAnimationFrame(updateMeter);
        }
        updateMeter();
        addSourceToList("🎤 マイク入力");
    } catch (e) { alert("マイクが使えないみたいだみょん！"); }
}

async function addCamera() {
    try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        registerSource(s, "📷 映像キャプチャデバイス");
    } catch (e) { alert("カメラが見つからないみょん！"); }
}

async function addScreen() {
    initAudioContext();
    try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (s.getAudioTracks().length > 0) {
            const screenAudioSource = audioCtx.createMediaStreamSource(s);
            screenAudioSource.connect(mainAudioDestination);
        }
        registerSource(s, "🖥️ 画面キャプチャ");
    } catch (e) { alert("画面共有がキャンセルされたみょん！"); }
}

function registerSource(stream, label) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;      // 👈 ハウリング防止
    video.playsInline = true;
    
    // 👈 映像が届いたら強制的に再生を開始する
    video.onloadedmetadata = () => {
        video.play().catch(err => console.error("再生エラー:", err));
    };

    sources.push({ video, label });
    addSourceToList(label);
}

function addSourceToList(label) {
    const div = document.createElement('div');
    div.className = "source-item";
    div.textContent = label;
    sourceList.appendChild(div);
    document.getElementById('addMenu').classList.add('hidden');
}

/**
 * 4. 録画ロジック
 */
recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        initAudioContext();
        const fps = parseInt(document.getElementById('fpsSelect').value) || 30;
        const bps = (parseInt(document.getElementById('bitrateInput').value) || 2500) * 1000;
        const videoStream = canvas.captureStream(fps);
        
        const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...mainAudioDestination.stream.getAudioTracks()
        ]);

        mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm',
            videoBitsPerSecond: bps
        });

        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shuroru_rec_${Date.now()}.webm`;
            a.click();
            recordedChunks = [];
        };

        mediaRecorder.start(1000);
        recordBtn.textContent = "録画停止";
        recordBtn.classList.add('btn-active');
    } else {
        mediaRecorder.stop();
        recordBtn.textContent = "録画開始";
        recordBtn.classList.remove('btn-active');
    }
};

/**
 * 5. 描画ループ
 */
function render() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    sources.forEach(src => {
        // 👈 映像の準備ができているか確認してから描画
        if (src.video.readyState >= 2) {
            ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height);
        }
    });
    requestAnimationFrame(render);
}

// UIイベント
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');
document.getElementById('saveSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');

window.showTab = (name) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tabBtn-${name}`).classList.add('active');
};

updateCanvasSize();
render();