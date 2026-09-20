import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { resolveSocketUrl } from '../services/api';

export function useRealtime(onEvent) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const socket = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    const events = ['node:updated', 'failure:detected', 'recovery:completed', 'health:checked', 'monitor:cycle'];
    events.forEach((name) => {
      socket.on(name, (payload) => handlerRef.current?.(name, payload));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
