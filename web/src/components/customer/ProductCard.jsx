import { useState } from 'react';
import { Plus, Info } from 'lucide-react';
import './ProductCard.css';

export default function ProductCard({ product, onAdd }) {
  const [showIngredients, setShowIngredients] = useState(false);

  const hasDiscount = product.discount_id != null;
  const finalPrice  = parseFloat(product.final_price);
  const basePrice   = parseFloat(product.base_price);

  return (
    <div className={`product-card card segment-${product.segment}`}>
      {/* Şəkil */}
      <div className="product-card__img-wrap">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} loading="lazy" />
          : <div className="product-card__no-img">🍽</div>
        }
        {hasDiscount && (
          <span className="discount-badge">
            {product.discount_type === 'percentage'
              ? `-${product.discount_value}%`
              : `-${product.discount_value} ₼`
            }
          </span>
        )}
        {product.stock_qty === 0 && (
          <div className="out-of-stock">Stokda yoxdur</div>
        )}
      </div>

      {/* Məlumat */}
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        {product.description && (
          <p className="product-card__desc">{product.description}</p>
        )}

        {/* İnqredientlər */}
        {product.ingredients?.length > 0 && (
          <div className="product-card__ingredients">
            <button
              className="ingredients-toggle"
              onClick={() => setShowIngredients(v => !v)}
            >
              <Info size={14} />
              <span>İnqredientlər ({product.ingredients.length})</span>
            </button>
            {showIngredients && (
              <ul className="ingredients-list">
                {product.ingredients.map((ing, i) => (
                  <li key={i}>{ing.name} — {ing.quantity} {ing.unit}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Qiymət + Əlavə et */}
        <div className="product-card__footer">
          <div className="price-block">
            {hasDiscount && (
              <span className="price-old">{basePrice.toFixed(2)} ₼</span>
            )}
            <span className="price-final">{finalPrice.toFixed(2)} ₼</span>
          </div>
          <button
            className="btn btn-primary btn-sm add-btn"
            onClick={onAdd}
            disabled={product.stock_qty === 0}
          >
            <Plus size={16} />
            Əlavə et
          </button>
        </div>
      </div>
    </div>
  );
}
