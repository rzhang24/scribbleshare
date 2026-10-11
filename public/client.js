const socket = io();
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const cursorContainer = document.getElementById('cursor-container');

const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('room');
if (!roomId) {
    roomId = Math.random().toString(36).substring(2, 9);
    window.history.pushState({}, '', `?room=${roomId}`);
}
socket.emit('join-room', roomId);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let isDrawing = false;
let lastX = 0, lastY = 0, isEraser = false;

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const eraserBtn = document.getElementById('eraserBtn');
const exportBtn = document.getElementById('exportBtn');
const shareBtn = document.getElementById('shareBtn');
const clearBtn = document.getElementById('clearBtn');


eraserBtn.addEventListener('click', () => {
    isEraser = !isEraser;
    eraserBtn.style.background = isEraser ? '#ffcccb' : '';
    eraserBtn.innerText = isEraser ? 'Draw Mode' : 'Eraser';
});

function drawLine(x1, y1, x2, y2, color, size, emitData) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    if (emitData) socket.emit('drawing', { x1, y1, x2, y2, color, size });
}

function getCoords(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
}

function startDrawing(e) {
    isDrawing = true;
    const coords = getCoords(e);
    [lastX, lastY] = [coords.x, coords.y];
}

function executeMove(e) {
    const coords = getCoords(e);
    socket.emit('mouse-move', { x: coords.x, y: coords.y });
    if (!isDrawing) return;
    const color = isEraser ? '#FFFFFF' : colorPicker.value;
    drawLine(lastX, lastY, coords.x, coords.y, color, brushSize.value, true);
    [lastX, lastY] = [coords.x, coords.y];
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', executeMove);
window.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('touchstart', (e) => { startDrawing(e); });
canvas.addEventListener('touchmove', (e) => { executeMove(e); });
window.addEventListener('touchend', () => isDrawing = false);

socket.on('drawing', (data) => drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.size, false));

socket.on('mouse-move', (data) => {
    let cursor = document.getElementById(`cursor-${data.id}`);
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${data.id}`;
        cursor.className = 'remote-cursor';
        cursorContainer.appendChild(cursor);
    }
    cursor.style.left = `${data.x}px`;
    cursor.style.top = `${data.y}px`;
});

socket.on('load-history', (history) => {
    history.forEach(data => {
        drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.size, false);
    });
});

socket.on('user-disconnected', (id) => {
    const cursor = document.getElementById(`cursor-${id}`);
    if (cursor) cursor.remove();
});

exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `canvas-${roomId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

shareBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'));
});
