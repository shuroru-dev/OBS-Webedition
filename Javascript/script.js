const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const streamBtn = document.getElementById('streamBtn');
const recordBtn = document.getElementById('recordBtn');
const resSelect = document.getElementById('resSelect');
const micMeter = document.getElementById('micMeter');

let sources = [];
let mediaRecorder;
let recordedChunks = [];

// 音声合成用のノード
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
 * すでに存在する場合は再利用するみょん！
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
        
        // 録画用とメーター用にそれぞれ接続
        source.connect(analyser);
        source.connect(mainAudioDestination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function updateMeter() {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            micMeter.style.width = Math.min(avg * 2.5, 100) + "%";
            requestAnimationFrame(updateMeter);
        }
        updateMeter();
        
        addSourceToList("🎤 マイク入力");
    } catch (e) { 
        console.error(e);
        alert("マイクが使えないみたいだみょん！"); 
    }
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
        const s = await navigator.mediaDevices.getDisplayMedia({ 
            video: true, 
            audio: true 
        });

        // 画面の音がある場合のみミックスに追加
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
    // mutedにしないと、自分のスピーカーから出た音をマイクが拾ってループしちゃうみょん！
    video.muted = true; 
    video.play();
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
        
        // 映像と音声を合体！
        const tracks = [
            ...videoStream.getVideoTracks(),
            ...mainAudioDestination.stream.getAudioTracks()
        ];
        const combinedStream = new MediaStream(tracks);

        const options = {
            mimeType: MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm',
            videoBitsPerSecond: bps
        };

        mediaRecorder = new MediaRecorder(combinedStream, options);

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: options.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shuroru_rec_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url); // メモリ解放
        };

        recordedChunks = [];
        mediaRecorder.start(1000); // 1秒ごとにデータを細切れにする（バグ対策）
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
        // 比率を維持して描画（必要ならここで調整してね！）
        ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height);
    });
    
    requestAnimationFrame(render);
}

// UIイベント設定
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
// ... その他のイベントは元のまま ...