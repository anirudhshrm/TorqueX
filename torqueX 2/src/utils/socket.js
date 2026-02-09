/**
 * Socket.io handler for real-time communication
 */

module.exports = function(io) {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // User authentication
    socket.on('authenticate', (userData) => {
      if (userData && userData.userId) {
        connectedUsers.set(socket.id, userData.userId);
        
        // Join user-specific room
        socket.join(`user-${userData.userId}`);
        
        // Join role-specific room
        if (userData.role === 'ADMIN') {
          socket.join('admins');
        } else {
          socket.join('users');
        }
        
        console.log(`User ${userData.userId} authenticated`);
      }
    });
    
    // Admin broadcast message to all users
    socket.on('admin-broadcast', (data) => {
      if (data && data.message) {
        console.log(`Broadcasting: ${data.message}`);
        
        // Enhanced broadcast data
        const broadcastData = {
          id: data.id || `broadcast-${Date.now()}`,
          title: data.title || 'Admin Announcement',
          message: data.message,
          timestamp: new Date()
        };
        
        // Determine target audience based on userTarget
        if (data.userTarget === 'ADMIN') {
          // Broadcast only to admins
          io.to('admins').emit('broadcast', broadcastData);
          console.log('Broadcast sent to admins only');
        } else if (data.userTarget === 'USER') {
          // Broadcast only to regular users
          io.to('users').emit('broadcast', broadcastData);
          console.log('Broadcast sent to regular users only');
        } else {
          // Broadcast to all users (default)
          io.emit('broadcast', broadcastData);
          console.log('Broadcast sent to all users');
        }
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        console.log(`User ${userId} disconnected`);
        connectedUsers.delete(socket.id);
      } else {
        console.log('Client disconnected');
      }
    });
  });

  return io;
};