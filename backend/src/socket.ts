import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.user.email}`);

    // Join user-specific room for notifications
    socket.join(`user:${socket.data.user.id}`);

    // Join role-based rooms
    socket.join(`role:${socket.data.user.role}`);

    // Handle case updates subscription
    socket.on('subscribe:cases', () => {
      socket.join('cases:updates');
    });

    // Handle notifications subscription
    socket.on('subscribe:notifications', () => {
      socket.join('notifications');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.email}`);
    });
  });

  return io;
};

// Helper function to emit notifications
export const emitNotification = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Helper function to broadcast case updates
export const broadcastCaseUpdate = (io: Server, caseData: any) => {
  io.to('cases:updates').emit('case:update', caseData);
};
