import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductImage from '../components/ProductImage';
import WhatsAppButton from '../components/WhatsAppButton';
import { ConditionBadge, StatusBadge } from '../components/Badges';
import { ErrorMessage, Loader } from '../components/Feedback';
import { ArrowLeftIcon } from '../components/Icons';
import { CONDITION_LABEL, STATUS_LABEL, formatPhone, formatPrice } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useDocumentTitle(product?.name);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    productService
      .get(id, ctrl.signal)
      .then(setProduct)
      .catch((err) => { if (err.name !== 'AbortError') setError(err); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    window.scrollTo(0, 0);
    return () => ctrl.abort();
  }, [id, reloadKey]);

  const back = (
    <Link to="/" className="back-link"><ArrowLeftIcon width={18} height={18} /> Voltar ao catálogo</Link>
  );

  if (loading) return <div className="container page">{back}<Loader label="Carregando chuteira..." /></div>;

  if (error) {
    return (
      <div className="container page">
        {back}
        {error.status === 404 ? (
          <div className="state">
            <p className="state__title">Chuteira não encontrada</p>
            <p className="muted">Ela pode ter sido removida do catálogo.</p>
          </div>
        ) : (
          <ErrorMessage message={error.message} onRetry={() => setReloadKey((k) => k + 1)} />
        )}
      </div>
    );
  }

  const sold = product.status === 'vendida';
  const specs = [
    ['Marca', product.brand],
    ['Tamanho', product.size],
    ['Condição', CONDITION_LABEL[product.condition]],
    ['Disponibilidade', STATUS_LABEL[product.status]],
  ];

  return (
    <div className="container page">
      {back}
      <article className="detail">
        <div className={`detail__media ${sold ? 'is-sold' : ''}`}>
          <ProductImage src={product.image} alt={product.name} eager />
        </div>

        <div className="detail__info">
          <div className="detail__badges">
            <StatusBadge status={product.status} />
            <ConditionBadge condition={product.condition} />
          </div>
          <span className="eyebrow">{product.brand}</span>
          <h1 className="detail__title">{product.name}</h1>
          <p className="detail__price">{formatPrice(product.price)}</p>

          <dl className="specs">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className="detail__section">
            <h2>Descrição</h2>
            <p className="detail__description">{product.description}</p>
          </div>

          <div className="contact-box">
            <div>
              <span className="muted small">Vendedor</span>
              <strong>{product.sellerName}</strong>
              <span className="muted small">{formatPhone(product.sellerPhone)}</span>
            </div>
            {sold ? (
              <p className="contact-box__sold">Esta chuteira já foi vendida. Fale com o vendedor para saber de modelos parecidos.</p>
            ) : null}
            <WhatsAppButton
              product={product}
              label={sold ? 'Falar com o vendedor' : 'Tenho interesse — WhatsApp'}
              size="lg"
              className="btn--block"
            />
          </div>
        </div>
      </article>
    </div>
  );
}
