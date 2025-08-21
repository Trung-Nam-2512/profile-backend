import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { analyticsService } from './AnalyticsService'
import { verifyAccessToken } from '../utils/jwt'

export class RealtimeService {
  private io: Server | null = null
  private adminSockets = new Set<string>()
  
  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    })

    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id)

      // Handle admin authentication
      socket.on('authenticate-admin', async (token: string) => {
        try {
          const decoded = verifyAccessToken(token)
          if (decoded && decoded.role === 'admin') {
            this.adminSockets.add(socket.id)
            socket.emit('authenticated', { success: true })
            
            // Send initial realtime stats
            const stats = await analyticsService.getRealtimeStats()
            socket.emit('realtime-stats', stats)
          } else {
            socket.emit('authenticated', { success: false, error: 'Invalid admin token' })
          }
        } catch (error) {
          socket.emit('authenticated', { success: false, error: 'Authentication failed' })
        }
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id)
        this.adminSockets.delete(socket.id)
      })
    })

    // Send periodic updates to admin clients
    setInterval(async () => {
      if (this.adminSockets.size > 0) {
        try {
          const stats = await analyticsService.getRealtimeStats()
          this.broadcastToAdmins('realtime-stats', stats)
        } catch (error) {
          console.error('Error sending realtime stats:', error)
        }
      }
    }, 5000) // Update every 5 seconds
  }

  // Broadcast new visitor activity
  broadcastVisitorActivity(data: any) {
    this.broadcastToAdmins('visitor-activity', data)
  }

  // Broadcast new page view
  broadcastPageView(data: any) {
    this.broadcastToAdmins('page-view', data)
  }

  // Broadcast new event
  broadcastEvent(data: any) {
    this.broadcastToAdmins('analytics-event', data)
  }

  private broadcastToAdmins(event: string, data: any) {
    if (!this.io) return
    
    this.adminSockets.forEach(socketId => {
      const socket = this.io?.sockets.sockets.get(socketId)
      if (socket) {
        socket.emit(event, data)
      }
    })
  }

  // Get current active visitors count
  getActiveVisitorsCount(): number {
    return this.io?.sockets.sockets.size || 0
  }
}

export const realtimeService = new RealtimeService()