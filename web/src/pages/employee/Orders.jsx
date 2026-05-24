import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { employeeAPI } from '@api/endpoints';
import { setActiveOrders } from '@store/slices/ordersSlice';
import { useSocket } from '@hooks/useSocket';
import EmployeeNav from '@components/employee/EmployeeNav';
import PaymentModal from '@components/employee/PaymentModal';
import toast from 'react-hot-toast';
import './Employee.css';

const STATUS_LABEL = {
  pending:   'Gözləyir',
  confirmed: 'Təsdiqləndi',
  preparing: 'Hazırlanır',
  ready:     'Hazır',
};

const NEXT_STATUS = {
  confirmed: { status: 'preparing',  label: 'Hazırlamağa başla' },
  preparing: { status: 'ready',      label: 'Hazır et' },
  ready:     { status: 'completed',  label: 'Tamamla' },
};

export default function Orders() {
  const dispatch = useDispatch();
  const orders   = useSelector(s => s.orders.activeOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processing,    setProcessing]    = useState({});
  useSocket();

  useEffect(() => {
    employeeAPI.getActiveOrders()
      .then(({ data }) => dispatch(setActiveOrders(data)))
      .catch(() => toast.error('Sifarişlər yüklənmədi'));
  }, []);

  async function handleStatusUpdate(orderId, status) {
    setProcessing(p => ({ ...p, [orderId]: true }));
    try {
      await employeeAPI.updateStatus(orderId, { status });
      // Tamamlanan/ləğv edilənlər siyahıdan çıxarılır
      if (['completed', 'cancelled'].includes(status)) {
        dispatch(setActiveOrders(orders.filter(o => o.id !== orderId)));
      } else {
        dispatch(setActiveOrders(orders.map(o => o.id === orderId ? { ...o, status } : o)));
      }
      toast.success('Status yeniləndi');
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setProcessing(p => ({ ...p, [orderId]: false }));
    }
  }

  async function handleConfirm(paymentType) {
    if (!selectedOrder) return;
    setProcessing(p => ({ ...p, [selectedOrder.id]: true }));
    try {
      await employeeAPI.confirmOrder(selectedOrder.id, { paymentType });
      dispatch(setActiveOrders(
        orders.map(o => o.id === selectedOrder.id
          ? { ...o, status: 'confirmed', payment_type: paymentType }
          : o
        )
      ));
      toast.success('Sifariş təsdiqləndi');
      setSelectedOrder(null);
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setProcessing(p => ({ ...p, [selectedOrder.id]: false }));
    }
  }

  return (
    <div className="emp-dashboard">
      <EmployeeNav />

      <div className="emp-content">
        <h1 className="emp-page-title">
          Aktiv Sifarişlər
          <span className="order-count">{orders.length}</span>
        </h1>

        {orders.length === 0 ? (
          <div className="emp-empty">
            <p>Hal-hazırda aktiv sifariş yoxdur</p>
            <span>Yeni sifariş gəldikdə avtomatik görünəcək</span>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order.id} className={`order-card card order-card--${order.status}`}>
                <div className="order-card__header">
                  <div>
                    <strong className="order-number">#{order.order_number}</strong>
                    <span className="order-time">
                      {new Date(order.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`badge badge-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                </div>

                <ul className="order-card__items">
                  {order.items?.map((item, i) => (
                    <li key={i} className="order-card__item">
                      <span>{item.product_name} <b>× {item.quantity}</b></span>
                      <span>{parseFloat(item.subtotal).toFixed(2)} ₼</span>
                    </li>
                  ))}
                </ul>

                {order.notes && (
                  <p className="order-notes">📝 {order.notes}</p>
                )}

                <div className="order-card__total">
                  <span>Cəmi</span>
                  <span className="total-amount">{parseFloat(order.total_amount).toFixed(2)} ₼</span>
                </div>

                {order.payment_type && (
                  <p className="order-payment">
                    {order.payment_type === 'cash' ? '💵 Nağd' : '💳 Kart'}
                  </p>
                )}

                <div className="order-card__actions">
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedOrder(order)}
                      disabled={processing[order.id]}
                    >
                      Ödəniş seç və Təsdiqlə
                    </button>
                  )}

                  {NEXT_STATUS[order.status] && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate(order.id, NEXT_STATUS[order.status].status)}
                      disabled={processing[order.id]}
                    >
                      {NEXT_STATUS[order.status].label}
                    </button>
                  )}

                  {!['completed', 'cancelled'].includes(order.status) && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        if (confirm('Sifarişi ləğv etmək istəyirsiniz?')) {
                          handleStatusUpdate(order.id, 'cancelled');
                        }
                      }}
                      disabled={processing[order.id]}
                    >
                      Ləğv et
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onConfirm={handleConfirm}
          loading={processing[selectedOrder.id]}
        />
      )}
    </div>
  );
}
