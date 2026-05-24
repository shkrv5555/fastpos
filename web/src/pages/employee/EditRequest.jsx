import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { productsAPI, employeeAPI } from '@api/endpoints';
import EmployeeNav from '@components/employee/EmployeeNav';
import { SendHorizontal, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import './Employee.css';

const EDITABLE_FIELDS = [
  { value: 'name',        label: 'Məhsulun adı' },
  { value: 'description', label: 'Təsvir' },
  { value: 'base_price',  label: 'Qiymət (₼)' },
  { value: 'segment',     label: 'Seqment' },
];

const SEGMENT_OPTIONS = ['simple', 'fast', 'premium'];

export default function EditRequest() {
  const [products, setProducts] = useState([]);
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

  const selectedField = watch('field');

  useEffect(() => {
    productsAPI.getAll().then(({ data }) => setProducts(data));
  }, []);

  async function onSubmit({ productId, field, newValue, comment }) {
    setLoading(true);
    try {
      await employeeAPI.requestEdit({
        productId,
        requestedChanges: { [field]: field === 'base_price' ? parseFloat(newValue) : newValue },
        comment,
      });
      toast.success('Sorğu sahib tərəfinə göndərildi');
      setSent(true);
      reset();
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="emp-dashboard">
      <EmployeeNav />

      <div className="emp-content">
        <h1 className="emp-page-title">Məhsul Redaktə İcazəsi</h1>

        <div style={{ maxWidth: 560 }}>
          <div className="card p-3" style={{ marginBottom: '1rem', background: '#FFF3CD', borderColor: '#FFC300' }}>
            <p style={{ fontSize: '.9rem', color: '#856404' }}>
              ⚠️ Məhsul məlumatlarını redaktə etmək üçün müəssisə sahibinin onayı tələb olunur.
              Sorğunuz bildiriş kimi sahibə göndəriləcək.
            </p>
          </div>

          {sent && (
            <div className="card p-2" style={{ background: '#D4EDDA', borderColor: '#2DC653', marginBottom: '1rem' }}>
              <p style={{ color: '#155724', fontSize: '.9rem' }}>
                ✅ Sorğunuz uğurla göndərildi. Sahib onayladıqdan sonra dəyişiklik tətbiq olunacaq.
              </p>
            </div>
          )}

          <div className="card p-3">
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Məhsul</label>
                <select {...register('productId', { required: 'Məhsul seçilməlidir' })} className="input">
                  <option value="">— Məhsul seçin —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.productId && <span className="form-error">{errors.productId.message}</span>}
              </div>

              <div className="form-group">
                <label>Dəyişdiriləcək sahə</label>
                <select {...register('field', { required: 'Sahə seçilməlidir' })} className="input">
                  <option value="">— Sahə seçin —</option>
                  {EDITABLE_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                {errors.field && <span className="form-error">{errors.field.message}</span>}
              </div>

              <div className="form-group">
                <label>Yeni dəyər</label>
                {selectedField === 'segment' ? (
                  <select {...register('newValue', { required: true })} className="input">
                    <option value="">— Seqment seçin —</option>
                    {SEGMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    {...register('newValue', { required: 'Yeni dəyər daxil edilməlidir' })}
                    type={selectedField === 'base_price' ? 'number' : 'text'}
                    step={selectedField === 'base_price' ? '0.01' : undefined}
                    min={selectedField === 'base_price' ? '0' : undefined}
                    className="input"
                    placeholder={
                      selectedField === 'base_price' ? 'Yeni qiymət (₼)' :
                      selectedField === 'name'        ? 'Yeni ad' :
                      selectedField === 'description' ? 'Yeni təsvir' : 'Dəyər...'
                    }
                  />
                )}
                {errors.newValue && <span className="form-error">{errors.newValue.message}</span>}
              </div>

              <div className="form-group">
                <label>Şərh — <em style={{ fontWeight: 400, color: 'var(--tx-2)' }}>niyə bu dəyişiklik lazımdır?</em></label>
                <textarea
                  {...register('comment', {
                    required: 'Şərh tələb olunur',
                    minLength: { value: 10, message: 'Ən az 10 simvol yazın' },
                    maxLength: { value: 500, message: 'Maks 500 simvol' },
                  })}
                  className="input"
                  rows={3}
                  placeholder="Məsələn: Qiymət xərc artımına görə yenilənməlidir..."
                  style={{ resize: 'vertical' }}
                />
                {errors.comment && <span className="form-error">{errors.comment.message}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                <SendHorizontal size={16} />
                {loading ? 'Göndərilir...' : 'Sorğu Göndər'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
