import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format';
import ProductImage from './ProductImage';
import { ConditionBadge, StatusBadge } from './Badges';
import WhatsAppButton from './WhatsAppButton';

function ProductCard({ product }) {
  const sold = product.status === 'vendida';
  return (
    <article className={`card ${sold ? 'card--sold' : ''}`}>
      <Link to={`/produto/${product.id}`} className="card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image} alt={product.name} />
        <div className="card__badges">
          {sold ? <StatusBadge status="vendida" /> : <ConditionBadge condition={product.condition} />}
        </div>
      </Link>
      <div className="card__body">
        <div className="card__meta">
          <span>{product.brand}</span>
          <span>Tam. {product.size}</span>
        </div>
        <h3 className="card__title">
          <Link to={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__price">{formatPrice(product.price)}</p>
        <div className="card__actions">
          <Link to={`/produto/${product.id}`} className="btn btn--outline btn--sm">
            Ver detalhes
          </Link>
          {!sold && <WhatsAppButton product={product} label="Contato" size="sm" />}
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
