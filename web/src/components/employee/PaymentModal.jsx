import { useState } from 'react';
import { Banknote, CreditCard, X } from 'lucide-react';
import './PaymentModal.css';

export default function PaymentModal({ order, onClose, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    await onConfirm(selected);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-modal card p-3" onClick={e => e.stopPropagation()}>
        <div className="payment-modal__header">
          <h2>Ödəniş növü seçin</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="payment-order-num">Sifariş #{order.order_number}</p>
        <p className="payment-total">Məbləğ: <strong>{parseFloat(order.total_amount).toFixed(2)} ₼</strong></p>

        <div className="payment-options">
          <button
            className={`payment-option ${selected === 'cash' ? 'selected' : ''}`}
            onClick={() => setSelected('cash')}
          >
            <Banknote size={32} />
            <span>Nağd</span>
          </button>
          <button
            className={`payment-option ${selected === 'card' ? 'selected' : ''}`}
            onClick={() => setSelected('card')}
          >
            <CreditCard size={32} />
            <span>Kart</span>
          </button>
        </div>

        <button
          className="btn btn-primary btn-full btn-lg"
          disabled={!selected || loading}
          onClick={handleConfirm}
        >
          {loading ? 'Təsdiqlənir...' : 'Təsdiqlə'}
        </button>
      </div>
    </div>
  );
}
