/**
 * Yatra360 co-tour Socket.IO namespace.
 *
 * Room model: roomId == "co-{slug}" (any string). Participants join, broadcast
 * their camera state (yaw/pitch/scene/cursor), and follow a designated leader.
 */
import type { Server as HTTPServer } from 'http'
import { Server, type Socket } from 'socket.io'

interface Participant {
  userId:   string
  name:     string
  socketId: string
  color:    string
}

interface RoomState {
  roomId:      string
  leaderId:    string | null
  locationId:  string | null
  participants: Map<string, Participant>   // userId → participant
}

interface CameraPayload {
  userId: string
  scene:  string
  yaw:    number
  pitch:  number
  hfov:   number
  ts:     number
}

interface CursorPayload {
  userId: string
  yaw:    number
  pitch:  number
}

const COLORS = ['#FF6B1A', '#D4A017', '#F5EDD8', '#8FD4A7', '#D946EF', '#5DADE2']

const rooms = new Map<string, RoomState>()

function pickColor(room: RoomState): string {
  const used = new Set([...room.participants.values()].map(p => p.color))
  for (const c of COLORS) if (!used.has(c)) return c
  return COLORS[room.participants.size % COLORS.length]
}

function roomSummary(room: RoomState) {
  return {
    roomId:     room.roomId,
    leaderId:   room.leaderId,
    locationId: room.locationId,
    participants: [...room.participants.values()].map(p => ({
      userId: p.userId, name: p.name, color: p.color,
    })),
  }
}

export function installCoTour(httpServer: HTTPServer): void {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  })

  const ns = io.of('/cotour')

  ns.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null
    let currentUserId: string | null = null

    socket.on('join', (data: { roomId: string; userId: string; name?: string; locationId?: string }) => {
      const { roomId, userId, name = 'Explorer', locationId } = data
      if (!roomId || !userId) return

      let room = rooms.get(roomId)
      if (!room) {
        room = {
          roomId,
          leaderId:     userId,
          locationId:   locationId ?? null,
          participants: new Map(),
        }
        rooms.set(roomId, room)
      }
      const participant: Participant = {
        userId, name, socketId: socket.id, color: pickColor(room),
      }
      room.participants.set(userId, participant)
      if (locationId && !room.locationId) room.locationId = locationId

      currentRoomId = roomId
      currentUserId = userId
      socket.join(roomId)

      ns.to(roomId).emit('room:state', roomSummary(room))
      socket.emit('joined', { ok: true, color: participant.color })
    })

    socket.on('camera', (data: CameraPayload) => {
      if (!currentRoomId || !currentUserId) return
      socket.to(currentRoomId).emit('camera', data)
    })

    socket.on('cursor', (data: CursorPayload) => {
      if (!currentRoomId || !currentUserId) return
      socket.to(currentRoomId).emit('cursor', data)
    })

    socket.on('leader:claim', () => {
      if (!currentRoomId || !currentUserId) return
      const room = rooms.get(currentRoomId)
      if (!room) return
      room.leaderId = currentUserId
      ns.to(currentRoomId).emit('room:state', roomSummary(room))
    })

    socket.on('location:set', (data: { locationId: string }) => {
      if (!currentRoomId || !currentUserId) return
      const room = rooms.get(currentRoomId)
      if (!room || room.leaderId !== currentUserId) return
      room.locationId = data.locationId
      ns.to(currentRoomId).emit('room:state', roomSummary(room))
      ns.to(currentRoomId).emit('location:set', { locationId: data.locationId })
    })

    socket.on('chat', (data: { text: string }) => {
      if (!currentRoomId || !currentUserId) return
      const room = rooms.get(currentRoomId)
      const p = room?.participants.get(currentUserId)
      if (!p || !data?.text?.trim()) return
      ns.to(currentRoomId).emit('chat', {
        userId: currentUserId,
        name:   p.name,
        color:  p.color,
        text:   data.text.trim().slice(0, 300),
        ts:     Date.now(),
      })
    })

    socket.on('disconnect', () => {
      if (!currentRoomId || !currentUserId) return
      const room = rooms.get(currentRoomId)
      if (!room) return
      room.participants.delete(currentUserId)
      if (room.leaderId === currentUserId) {
        room.leaderId = room.participants.size > 0
          ? [...room.participants.keys()][0]
          : null
      }
      if (room.participants.size === 0) {
        rooms.delete(currentRoomId)
      } else {
        ns.to(currentRoomId).emit('room:state', roomSummary(room))
      }
    })
  })
}
