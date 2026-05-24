import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { addActiveOrder, updateOrderStatus } from '@store/slices/ordersSlice';
import toast from 'react-hot-toast';

export function useSocket() {
  const dispatch  = useDispatch();
  const { token, user } = useSelector(s => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || '';
    const auth = token
      ? { token }
      : { sessionId: localStorage.getItem('fp_session') };

    socketRef.current = io(socketUrl, { auth, transports: ['websocket'] });

    const socket = socketRef.current;

    // İşçi üçün — yeni sifariş gəldi
    if (user?.role === 'employee') {
      socket.on('order:new', (order) => {
        dispatch(addActiveOrder(order));
        toast.success(`Yeni sifariş: #${order.order_number}`);
      });
    }

    // Müştəri üçün — sifariş statusu dəyişdi
    socket.on('order:status-changed', ({ orderId, status }) => {
      dispatch(updateOrderStatus({ orderId, status }));
    });

    return () => socket.disconnect();
  }, [token, user?.role]);

  return socketRef;
}
