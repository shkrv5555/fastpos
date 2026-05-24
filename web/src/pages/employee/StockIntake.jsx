import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { productsAPI, employeeAPI } from '@api/endpoints';
import EmployeeNav from '@components/employee/EmployeeNav';
import { PackagePlus, History } from 'lucide-react';
import toast from 'react-hot-toast';
import './Employee.css';
import './StockIntake.css';

export default function StockIntake() {
  const [products, setProducts] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  const selectedProductId = watch('productId');
  const selectedProduct   = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    productsAPI.getAll()
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Məhsullar yüklənmədi'));
  }, []);

  async function onSubmit({ productId, quantity, notes }) {
    setLoading(true);
    try {
      await employeeAPI.addStock({ productId, quantity: parseInt(quantity), notes: notes || undefined });
      toast.success(`Stok daxil edildi: +${quantity} ədəd`);

      // Siyahıda stoku güncəllə
      setProducts(prev =>
        prev.map(p => p.id === productId
          ? { ...p, stock_qty: p.stock_qty + parseInt(quantity) }
          : p
        )
      );
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const { data } = await employeeAPI.getStockHistory({ limit: 20 });
      setHistory(data);
    } catch {
      toast.error('Tarixçə yüklənmədi');
    }
  }

  return (
    <div className="emp-dashboard">
      <EmployeeNav />

      <div className="emp-content">
        <h1 className="emp-page-title">Stok Daxil et</h1>

        <div className="stock-grid">
          {/* Form */}
          <div className="card p-3">
            <form onSubmit={handleSubmit(onSubmit)} className="stock-form">
              <div className="form-group">
                <label>Məhsul seçin</label>
                <select
                  {...register('productId', { required: 'Məhsul seçilməlidir' })}
                  className="input"
                >
                  <option value="">— Məhsul seçin —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (cari stok: {p.stock_qty})
                    </option>
                  ))}
                </select>
                {errors.productId && <span className="form-error">{errors.productId.message}</span>}
              </div>

              {selectedProduct && (
                <div className="stock-info">
                  <span>Cari stok: <strong>{selectedProduct.stock_qty}</strong></span>
                  <span>Qiymət: <strong>{parseFloat(selectedProduct.final_price).toFixed(2)} ₼</strong></span>
                </div>
              )}

              <div className="form-group">
                <label>Daxil edilən miqdar</label>
                <input
                  {...register('quantity', {
                    required: 'Miqdar daxil edilməlidir',
                    min: { value: 1, message: 'Miqdar ən az 1 olmalıdır' },
                    max: { value: 10000, message: 'Miqdar çox böyükdür' },
                  })}
                  type="number" min="1"
                  className="input"
                  placeholder="0"
                />
                {errors.quantity && <span className="form-error">{errors.quantity.message}</span>}
              </div>

              <div className="form-group">
                <label>Qeyd (isteğe bağlı)</label>
                <textarea
                  {...register('notes', { maxLength: { value: 500, message: 'Maks 500 simvol' } })}
                  className="input"
                  rows={2}
                  placeholder="Stok daxiletmə haqqında qeyd..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                <PackagePlus size={16} />
                {loading ? 'Daxil edilir...' : 'Stok Daxil et'}
              </button>
            </form>
          </div>

          {/* Tarixçə */}
          <div className="card p-3">
            <div className="stock-history-header">
              <h3>Son daxiletmələr</h3>
              <button className="btn btn-outline btn-sm" onClick={loadHistory}>
                <History size={14} />
                Yüklə
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem 0' }}>
                Tarixçəni yükləmək üçün "Yüklə" düyməsinə basın
              </p>
            ) : (
              <ul className="stock-history-list">
                {history.map(h => (
                  <li key={h.id} className="stock-history-item">
                    <div>
                      <strong>{h.product_name}</strong>
                      <span className="text-muted text-sm"> +{h.quantity} ədəd</span>
                    </div>
                    <div className="text-sm text-muted">
                      {h.employee_name} · {new Date(h.created_at).toLocaleString('az-AZ')}
                    </div>
                    {h.notes && <div className="text-sm" style={{ color: 'var(--tx-2)' }}>📝 {h.notes}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
