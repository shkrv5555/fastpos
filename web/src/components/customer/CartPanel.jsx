import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import {
  addItem, removeItem, deleteItem, clearCart,
  selectCartTotal, selectCartCount,
} from '@store/slices/cartSlice';
import { closeCart } from '@store/slices/uiSlice';
import { createOrder } from '@store/slices/ordersSlice';
import toast from 'react-hot-toast';
import './CartPanel.css';

export default function CartPanel() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isOpen    = useSelector(s => s.ui.cartOpen);
  const items     = useSelector(s => s.cart.items);
  const sessionId = useSelector(s => s.cart.sessionId);
  const total     = useSelector(selectCartTotal);
  const count     = useSelector(selectCartCount);
  const loading   = useSelector(s => s.orders.loading);

  async function handleCheckout() {
    if (!items.length) return;
    const result = await dispatch(createOrder({
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      sessionId,
    }));
    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      dispatch(closeCart());
      navigate(`/order/${result.payload.id}/status`);
      toast.success('Sifarişiniz qəbul edildi!');
    } else {
      toast.error(result.payload === 'STOCK_INSUFFICIENT'
        ? 'Bəzi məhsulların stoku çatmır'
        : 'Sifariş göndərilmədi');
    }
  }

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={() => dispatch(closeCart())} />}

      <aside className={`cart-panel ${isOpen ? 'open' : ''}`}>
        <div className="cart-panel__header">
          <h2>
            Səbət
            {count > 0 && <span className="count">{count}</span>}
          </h2>
          <button className="btn btn-ghost" onClick={() => dispatch(closeCart())}>
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={48} />
            <p>Səbət boşdur</p>
            <span>Menyüdən məhsul seçin</span>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map(item => (
                <li key={item.productId} className="cart-item">
                  <div className="cart-item__info">
                    <span className="cart-item__name">{item.name}</span>
                    <span className="cart-item__price">
                      {(item.final_price * item.quantity).toFixed(2)} ₼
                    </span>
                  </div>
                  <div className="cart-item__controls">
                    <button
                      className="qty-btn"
                      onClick={() => dispatch(removeItem(item.productId))}
                      aria-label="Azalt"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => dispatch(addItem({
                        id: item.productId,
                        name: item.name,
                        image_url: item.image_url,
                        base_price: item.unit_price,
                        final_price: item.final_price,
                        discount_id: item.final_price < item.unit_price ? 1 : null,
                      }))}
                      aria-label="Artır"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="qty-btn delete"
                      onClick={() => dispatch(deleteItem(item.productId))}
                      aria-label="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-panel__footer">
              <div className="cart-total">
                <span>Cəmi</span>
                <strong>{total.toFixed(2)} ₼</strong>
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Göndərilir...' : 'Sifarişi Tamamla'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
