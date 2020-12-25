const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000;

let LOGGED_IN_USERS = {};

app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/public/index.html');
});

const auth = (userid) => {
    // perform user authentication or check if user is logged in
    return userid;
}

const getallLoggedInUsers = () => {
    return LOGGED_IN_USERS;
}

// loop over all the users and send update if any
setInterval(() => {
    const allLoggedInUsers = getallLoggedInUsers();
    console.log('total all logged in users ', Object.keys(allLoggedInUsers).length);

    if (Object.keys(allLoggedInUsers).length) {
        for (const users in allLoggedInUsers) {
            const userSocket = allLoggedInUsers[users];

            // Business logic
                // query database or redis if there is any update
                // if there is update send to user

            console.log('sending upadate over the websocket to user :: ',userSocket.userId);
            userSocket.send('Mesaage from server for userid :: ' + userSocket.userId + ' at time :: ' + new Date().getTime());
        }
    } else {
        console.log('no user found, not sending any response over socket');
    }

}, 1000)


io.use((socket, next) => {
    const params = socket.handshake.query;
    console.log("received params :: ", params);
    if (params.userId && auth(params.userId)) {
        console.log("valid user with params :: ", params);

        // add userId to socket instance as well
        socket.userId = params.userId;

        // user is valid
        // add user to map
        LOGGED_IN_USERS[params.userId] = socket;

        return next();
    } else {
        console.log("invalid user with params :: ", params);
        return next(new Error("Invalid users"));
    }

});

io.on('connection', function(socket) {
    socket.on('join', function(message) {
        console.log('client joined websocket with userId :: ' , socket.userId, 'message :: ', message);
    });

    socket.on('messages', function(data) {
        socket.emit('broad', data);
        socket.broadcast.emit('broad',data);
    });

    // this event will be called on socket disconnect
    socket.on('disconnect', function() {
        console.log('client disconnected websocket with userId :: ' , socket.userId);
        // remove user from mapping
        if (LOGGED_IN_USERS[socket.userId]) {
            delete LOGGED_IN_USERS[socket.userId];
        }
    });

});

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})