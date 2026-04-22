const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280; canvas.height = 720;

let sources = [];
let addMenu = document.getElementById('addMenu');

// マイク許可を求める魔法だみょん！
async function addMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        alert("マイクが許可されたみょん！音声ミキサーが動くようになるみょん🌸");
        // ここに音声を処理するコードを繋げられるみょん
    } catch (err) {
        alert("マイクの許可が拒否されたみょん...設定から許可してね！");
    }
}

// 他のカメラ、画面共有、描画ループは前回のままでOKだけど、
// IDの整合性を合わせて再実装だみょん！

document.getElementById('addBtn').onclick = () => addMenu.classList.toggle('hidden');

async function addScreen() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    addSource(stream, '画面');
}

async function addCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    addSource(stream, 'カメラ');
}

function addSource(stream, name) {
    const video = document.createElement('video');
    video.srcObject = stream; video.play();
    sources.push({ element: video, x: 50, y: 50, w: 400, h: 225, name: name });
    addMenu.classList.add('hidden');
}

function loop() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sources.forEach(s => ctx.drawImage(s.element, s.x, s.y, s.w, s.h));
    requestAnimationFrame(loop);
}
loop();

// 設定の開閉
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');