import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import AppRouter from './routes/AppRouter.jsx';
import { restoreAuth } from '@store/slices/authSlice';
import { setSessionId } from '@store/slices/cartSlice';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Auth state-i bərpa et
    dispatch(restoreAuth());

    // Anonim müştəri üçün sessiya ID yarat (yenidən yüklənsə saxla)
    let sessionId = localStorage.getItem('fp_session');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('fp_session', sessionId);
    }
    dispatch(setSessionId(sessionId));
  }, [dispatch]);

  return <AppRouter />;
}
