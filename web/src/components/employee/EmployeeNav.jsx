import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@store/slices/authSlice';
import { ClipboardList, PackagePlus, PenLine, LogOut } from 'lucide-react';

export default function EmployeeNav() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  return (
    <nav className="emp-navbar">
      <span className="emp-navbar__name">👋 {user?.name}</span>
      <div className="emp-nav-links">
        <NavLink to="/employee/orders" className={({ isActive }) => `emp-nav-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={15} />
          Sifarişlər
        </NavLink>
        <NavLink to="/employee/stock" className={({ isActive }) => `emp-nav-link ${isActive ? 'active' : ''}`}>
          <PackagePlus size={15} />
          Stok
        </NavLink>
        <NavLink to="/employee/edit-request" className={({ isActive }) => `emp-nav-link ${isActive ? 'active' : ''}`}>
          <PenLine size={15} />
          Redaktə
        </NavLink>
        <button className="emp-nav-link" onClick={() => dispatch(logout())}>
          <LogOut size={15} />
          Çıxış
        </button>
      </div>
    </nav>
  );
}
