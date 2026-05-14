import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export interface CoTourParticipant {
  userId: string
  name:   string
  color:  string
}

export interface CoTourRoomState {
  roomId:       string
  leaderId:     string | null
  locationId:   string | null
  participants: CoTourParticipant[]
}

export interface ChatMessage {
  userId: string
  name:   string
  color:  string
  text:   string
  ts:     number
}

export interface CameraEvent {
  userId: string
  scene:  string
  yaw:    number
  pitch:  number
  hfov:   number
  ts:     number
}

interface UseCoTourArgs {
  roomId:     string | null
  userId:     string
  userName:   string
  locationId: string | null
  enabled:    boolean
}

export function useCoTour({ roomId, userId, userName, locationId, enabled }: UseCoTourArgs) {
  const socketRef = useRef<Socket | null>(null)
  const [room,  setRoom]     = useState<CoTourRoomState | null>(null)
  const [chat,  setChat]     = useState<ChatMessage[]>([])
  const [peerCameras, setPeerCameras] = useState<Map<string, CameraEvent>>(new Map())
  const [connected, setConnected] = useState(false)
  const [color, setColor] = useState<string>('#FF6B1A')

  useEffect(() => {
    if (!enabled || !roomId) return
    const socket = io(`${SOCKET_URL}/cotour`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join', { roomId, userId, name: userName, locationId })
    })

    socket.on('joined', (data: { color: string }) => {
      setColor(data.color)
    })

    socket.on('room:state', (data: CoTourRoomState) => setRoom(data))

    socket.on('camera', (data: CameraEvent) => {
      setPeerCameras(prev => {
        const next = new Map(prev)
        next.set(data.userId, data)
        return next
      })
    })

    socket.on('location:set', (_data: { locationId: string }) => {
      // Consumer handles navigation via room.locationId change.
    })

    socket.on('chat', (data: ChatMessage) => {
      setChat(prev => [...prev.slice(-49), data])
    })

    socket.on('disconnect', () => setConnected(false))

    return () => {
      socket.disconnect()
      socketRef.current = null
      setRoom(null)
      setConnected(false)
      setPeerCameras(new Map())
      setChat([])
    }
  }, [enabled, roomId, userId, userName, locationId])

  const sendCamera = useCallback((cam: Omit<CameraEvent, 'userId' | 'ts'>) => {
    socketRef.current?.emit('camera', { ...cam, userId, ts: Date.now() })
  }, [userId])

  const claimLeader = useCallback(() => {
    socketRef.current?.emit('leader:claim')
  }, [])

  const setLocation = useCallback((newLocationId: string) => {
    socketRef.current?.emit('location:set', { locationId: newLocationId })
  }, [])

  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return
    socketRef.current?.emit('chat', { text })
  }, [])

  return {
    connected, room, chat, peerCameras, color,
    sendCamera, claimLeader, setLocation, sendChat,
  }
}
