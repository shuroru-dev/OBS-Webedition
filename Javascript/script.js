const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280; canvas.height = 720;

let sources = [];
let addMenu = document.getElementById('addMenu');

// ★マイク許可を強制的に呼び出すみょん！
async function askMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        alert("マイク許可成功だみょん！🎤✨");
        addMenu.classList.add('hidden');
    } catch (err) {
        alert("マイクが拒否されちゃったみょん...ブラウザの設定（URL横の鍵マーク）から許可してね！");
    }
}

// ソース追加（画面・カメラ）
async function addScreen() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    pushSource(stream, "画面共有");
}

async function addCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    pushSource(stream, "カメラ");
}

function pushSource(stream, name) {
    const v = document.createElement('video');
    v.srcObject = stream; v.play();
    sources.push({ el: v, x: 50, y: 50, w: 400, h: 225, name: name });
    addMenu.classList.add('hidden');
}

// 描画ループ
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sources.forEach(s => ctx.drawImage(s.el, s.x, s.y, s.w, s.h));
    requestAnimationFrame(draw);
}
draw();

// UI操作
document.getElementById('addBtn').onclick = (e) => {
    e.stopPropagation();
    addMenu.classList.toggle('hidden');
};
window.onclick = () => addMenu.classList.add('hidden');

document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');