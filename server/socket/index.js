const { Room } = require('../db/models')

// const rooms = Room.getRoomsForSockets()
const onlineUsers = {}

module.exports = io => {
  io.on("connection", socket => {
    console.log(socket.id, " has made a persistent connection to the server!");
    console.log("online users are ", onlineUsers);

    socket.on("ADD_MESSAGE", message => {
      console.log("SERVER: socket got message: " + message);
      console.log('SERVER: message was sent to room ', message.roomId)
      io.to(message.roomId).emit("ADD_MESSAGE", message);
    });

    socket.on("ADD_BUDDY_TO_ROOM", buddy => {
      console.log("socket on server: about to add buddy to room ", buddy);
      io.emit("ADD_BUDDY_TO_ROOM", buddy);
      // handle so that those that are added are connected to new room
      const userId = buddy._id;
      console.log("client socket is ", socket, socket.id);
      if(userId in onlineUsers) {
        io.to(onlineUsers[userId]).emit('GET_ROOMS', userId)
        io.to(onlineUsers[userId]).emit('JOIN_ROOMS', buddy)
        const addedBuddySocket = onlineUsers[userId]
        addedBuddySocket
      }
    });

    socket.on("GET_USER", user => {
      console.log("server socket got user ", user);
      if (!(user._id in onlineUsers)) {
        onlineUsers[user._id] = socket.id;
      }
      console.log("socket online users show as ", onlineUsers);
      user.rooms.forEach(room => {
        console.log('user is in room ', room)
        socket.join(room)
        socket.emit('JOINED_ROOM', room)
        console.log(user.userName, ' has joined rooms ', socket.rooms)
      })

    });

    socket.on('disconnect', () => {
      const onlineIds = Object.values(onlineUsers)
      console.log('online users are ', onlineUsers)
      const clientId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id)
      console.log('found client id is', clientId)
      delete onlineUsers[clientId]
      console.log('deleted last user.  online users are ', onlineUsers)
    })

    socket.on("new-channel", channel => {
      socket.broadcast.emit("new-channel", channel);
    });
  });
};