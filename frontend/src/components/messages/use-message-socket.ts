import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

/** Maximum number of messages kept in each of the panels. */
const MAX_ENTRIES = 50

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface MessageEntry {
  /** Running number of the entry within its panel */
  index: number
  receivedAt: Date
  type: string | undefined
  data: Record<string, unknown>
}

/**
 * Returns a random UUID. `crypto.randomUUID()` is available in secure contexts
 * only, which does not include plain HTTP access from other hosts.
 */
function generateId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4),
    hex.slice(4, 6),
    hex.slice(6, 8),
    hex.slice(8, 10),
    hex.slice(10),
  ]
    .map((part) => part.join(''))
    .join('-')
}

function getType(data: Record<string, unknown>): string | undefined {
  const body = data.body as { type?: unknown } | undefined
  return typeof body?.type === 'string' ? body.type : undefined
}

/**
 * Connection to the Socket.IO channel of the server, collecting responses
 * and notifications in separate lists, newest first.
 */
export function useMessageSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [responses, setResponses] = useState<MessageEntry[]>([])
  const [notifications, setNotifications] = useState<MessageEntry[]>([])
  const counters = useRef({ responses: 0, notifications: 0 })

  useEffect(() => {
    // The Socket.IO server is mounted at the root of the HTTP server, not
    // under the mount point of the web UI
    const socket = io()
    socketRef.current = socket

    socket.on('connect', () => setStatus('connected'))
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('connect_error', () => setStatus('disconnected'))
    socket.on('fw', (data: Record<string, unknown>) => {
      const isResponse = 'refs' in data
      const key = isResponse ? 'responses' : 'notifications'
      const entry: MessageEntry = {
        index: ++counters.current[key],
        receivedAt: new Date(),
        type: getType(data),
        data,
      }
      const update = (entries: MessageEntry[]) =>
        [entry, ...entries].slice(0, MAX_ENTRIES)
      if (isResponse) {
        setResponses(update)
      } else {
        setNotifications(update)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const send = useCallback((body: Record<string, unknown>) => {
    socketRef.current?.emit('fw', {
      '$fw.version': '1.0',
      id: generateId(),
      body,
    })
  }, [])

  const connect = useCallback(() => {
    setStatus('connecting')
    socketRef.current?.connect()
  }, [])

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect()
  }, [])

  const clear = useCallback(() => {
    setResponses([])
    setNotifications([])
  }, [])

  return {
    status,
    responses,
    notifications,
    send,
    connect,
    disconnect,
    clear,
  }
}
