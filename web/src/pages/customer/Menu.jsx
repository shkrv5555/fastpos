import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productsAPI } from '@api/endpoints';
import { setSegment } from '@store/slices/uiSlice';
import { addItem } from '@store/slices/cartSlice';
import CartPanel from '@components/customer/CartPanel';
import ProductCard from '@components/customer/ProductCard';
import SegmentTabs from '@components/customer/SegmentTabs';
import { ShoppingCart } from 'lucide-react';
import { selectCartCount } from '@store/slices/cartSlice';
import { openCart } from '@store/slices/uiSlice';
import toast from 'react-hot-toast';
import './Menu.css';

export default function Menu() {
  const dispatch   = useDispatch();
  const segment    = useSelector(s => s.ui.activeSegment);
  const cartCount  = useSelector(selectCartCount);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = { segment };
    if (activeCategory) params.category_id = activeCategory;

    productsAPI.getAll(params)
      .then(({ data }) => {
        setProducts(data);
        // Unikal kateqoriyalar
        const cats = [...new Map(data
          .filter(p => p.category_id)
          .map(p => [p.category_id, { id: p.category_id, name: p.category_name }])
        ).values()];
        setCategories(cats);
      })
      .catch(() => toast.error('Menyü yüklənmədi'))
      .finally(() => setLoading(false));
  }, [segment, activeCategory]);

  // Sıralama backend tərəfindən edilir (fast → total_sold, premium → total_revenue)
  const displayProducts = products;

  return (
    <div className="menu-page">
      {/* Başlıq */}
      <header className="menu-header">
        <div className="menu-header__logo">FastPOS</div>
        <button className="menu-header__cart btn btn-primary" onClick={() => dispatch(openCart())}>
          <ShoppingCart size={18} />
          <span>Səbət</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </header>

      {/* Seqment tablar */}
      <div className="container">
        <SegmentTabs
          active={segment}
          onChange={(seg) => dispatch(setSegment(seg))}
        />

        {/* Premium seqment xüsusi mesaj */}
        {segment === 'premium' && (
          <div className="premium-banner">
            AI analitikaya əsasən sizin üçün seçilmiş ən yaxşı məhsullar
          </div>
        )}

        {/* Kateqoriya filter */}
        {categories.length > 0 && (
          <div className="category-filter">
            <button
              className={`category-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              Hamısı
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Məhsullar */}
        {loading ? (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : (
          <div className="products-grid">
            {displayProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => {
                  dispatch(addItem(product));
                  toast.success(`${product.name} səbətə əlavə edildi`);
                }}
              />
            ))}
            {displayProducts.length === 0 && (
              <p className="empty-message">Bu seqmentdə məhsul tapılmadı</p>
            )}
          </div>
        )}
      </div>

      {/* Səbət panel */}
      <CartPanel />
    </div>
  );
}
