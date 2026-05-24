import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSocket } from '@hooks/useSocket';
import { CheckCircle, Clock, ChefHat, Package, XCircle } from 'lucide-react';
import './OrderStatus.css';

const STEPS = [
  { key: 'pending',    label: 'Sifariş alındı',    icon: Clock },
  { key: 'confirmed',  label: 'Təsdiqləndi',        icon: CheckCircle },
  { key: 'preparing',  label: 'Hazırlanır',         icon: ChefHat },
  { key: 'ready',      label: 'Hazır',              icon: Package },
  { key: 'completed',  label: 'Tamamlandı',         icon: CheckCircle },
];

export default function OrderStatus() {
  const { id } = useParams();
  const currentOrder = useSelector(s => s.orders.currentOrder);
  useSocket(); // Real-time status dinlə

  const status = currentOrder?.id === id ? currentOrder.status : null;
  const stepIdx = STEPS.findIndex(s => s.key === status);

  if (status === 'cancelled') {
    return (
      <div className="order-status-page">
        <div className="status-cancelled card p-3">
          <XCircle size={48} color="var(--danger)" />
          <h2>Sifariş ləğv edildi</h2>
          <Link to="/" className="btn btn-primary btn-lg mt-2">Geri qayıt</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-page">
      <div className="status-card card p-3">
        <h1>Sifarişiniz</h1>
        {currentOrder && (
          <p className="order-number">#{currentOrder.order_number}</p>
        )}

        <div className="status-steps">
          {STEPS.slice(0, 5).map((step, i) => {
            const Icon = step.icon;
            const done = i <= stepIdx;
            return (
              <div key={step.key} className={`step ${done ? 'done' : ''} ${i === stepIdx ? 'active' : ''}`}>
                <div className="step-icon"><Icon size={22} /></div>
                <div className="step-label">{step.label}</div>
                {i < 4 && <div className={`step-line ${done && i < stepIdx ? 'done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {status === 'ready' && (
          <div className="ready-banner">
            Sifarişiniz hazırdır! Zəhmət olmasa götürün.
          </div>
        )}

        <Link to="/" className="btn btn-outline mt-3">Menyüyə qayıt</Link>
      </div>
    </div>
  );
}
