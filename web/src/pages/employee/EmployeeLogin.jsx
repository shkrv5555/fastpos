import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { employeeLogin } from '@store/slices/authSlice';
import { KeyRound, Hash } from 'lucide-react';
import './Employee.css';

export default function EmployeeLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (user?.role === 'employee') navigate('/employee/orders', { replace: true });
  }, [user]);

  async function onSubmit(data) {
    const result = await dispatch(employeeLogin(data));
    if (employeeLogin.fulfilled.match(result)) {
      navigate('/employee/orders');
    }
  }

  return (
    <div className="emp-login-page">
      <div className="emp-login-card card p-3">
        <h1 className="emp-login-title">İşçi Girişi</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="emp-login-form">
          <div className="form-group">
            <label>HR Kodu</label>
            <div className="input-wrap">
              <Hash size={16} className="input-icon" />
              <input
                {...register('hrCode', { required: true })}
                className="input input-with-icon"
                placeholder="EMP001"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Şifrə</label>
            <div className="input-wrap">
              <KeyRound size={16} className="input-icon" />
              <input
                {...register('password', { required: true })}
                type="password"
                className="input input-with-icon"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Giriş edilir...' : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
