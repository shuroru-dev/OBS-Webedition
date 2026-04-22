const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const addMenu = document.getElementById('addMenu');

// 解像度を1280x720に固定！これで画面独占を防ぐみょん
canvas.width = 1280;
canvas.height = 720;

let sources = [];
let selectedSource = null;
let isDragging = false;

// メイン描画ループ
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sources.forEach(s => {
        if (s.element) {
            ctx.drawImage(s.element, s.x, s.y, s.w, s.h);
        }
        if (s === selectedSource) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.strokeRect(s.x, s.y, s.w, s.h);
        }
    });
    requestAnimationFrame(draw);
}
draw();

// ソース追加メニューの制御
document.getElementById('addBtn').onclick = (e) => {
    e.stopPropagation();
    addMenu.classList.toggle('hidden');
};

window.onclick = () => addMenu.classList.add('hidden');

async function addScreen() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        createSource(stream, '画面共有');
    } catch (e) { console.error(e); }
}

async function addCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        createSource(stream, 'カメラ');
    } catch (e) { console.error(e); }
}

function createSource(stream, name) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    // 初期位置とサイズ
    const s = { 
        element: video, 
        x: 100, y: 100, 
        w: 640, h: 360, 
        name: name + " " + (sources.length + 1) 
    };
    sources.push(s);
    selectedSource = s;
    updateList();
}

// マウス位置の計算（Canvas内の座標に変換するみょん）
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.onmousedown = (e) => {
    const pos = getMousePos(e);
    // 重なりを考えて逆順からチェック
    selectedSource = [...sources].reverse().find(s => 
        pos.x > s.x && pos.x < s.x + s.w && pos.y > s.y && pos.y < s.y + s.h
    );
    if (selectedSource) isDragging = true;
    updateList();
};

window.onmousemove = (e) => {
    if (isDragging && selectedSource) {
        const pos = getMousePos(e);
        selectedSource.x = pos.x - (selectedSource.w / 2);
        selectedSource.y = pos.y - (selectedSource.h / 2);
    }
};

window.onmouseup = () => isDragging = false;

function updateList() {
    sourceList.innerHTML = '';
    sources.forEach(s => {
        const item = document.createElement('div');
        item.textContent = s.name;
        item.style.padding = '5px';
        item.style.fontSize = '12px';
        if (s === selectedSource) item.style.background = '#4a90e2';
        sourceList.appendChild(item);
    });
}

// 設定モーダル
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');