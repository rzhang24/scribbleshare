const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

// Create an object to store drawing history for each room
const roomHistories = {};

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        
        // If the room already has drawing history, send it to the new user immediately
        if (roomHistories[roomId]) {
            socket.emit('load-history', roomHistories[roomId]);
        } else {
            roomHistories[roomId] = []; // Initialize history array if it's a new room
        }
        
        socket.on('drawing', (data) => {
            // Save the new line data into the room's history array
            if (roomHistories[roomId]) {
                roomHistories[roomId].push(data);
            }
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
