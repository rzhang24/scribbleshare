const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.on('drawing', (data) => {
            socket.to(roomId).emit('drawing', data);
        });
        socket.on('mouse-move', (data) => {
            socket.to(roomId).emit('mouse-move', { id: socket.id, x: data.x, y: data.y });
        });
        socket.on('disconnect', () => {
            io.to(roomId).emit('user-disconnected', socket.id);
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`ScribbleShare running at http://localhost:${PORT}`);
});
