import { useCallback, useEffect, useMemo, useState } from 'react';
import { productService } from '../services/productService';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import Filters, { EMPTY_FILTERS } from '../components/Filters';
import { EmptyState, ErrorMessage, SkeletonGrid } from '../components/Feedback';
import { STORE_NAME, STORE_SLOGAN } from '../config';

export default function Home() {
  useDocumentTitle();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const q = useDebounce(filters.q, 350);
  const minPrice = useDebounce(filters.minPrice, 450);
  const maxPrice = useDebounce(filters.maxPrice, 450);
  const query = useMemo(
    () => ({ ...filters, q, minPrice, maxPrice }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, minPrice, maxPrice, filters.brand, filters.size, filters.status, filters.sort]
  );

  // Metadados (marcas, tamanhos, totais) e destaques
  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      productService.meta(ctrl.signal),
      productService.list({ status: 'disponivel', sort: 'recent', limit: 3 }, ctrl.signal),
    ])
      .then(([m, f]) => { setMeta(m); setFeatured(f); })
      .catch((err) => { if (err.name !== 'AbortError') setMeta(null); });
    return () => ctrl.abort();
  }, [reloadKey]);

  // Catálogo com filtros
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    productService
      .list(query, ctrl.signal)
      .then(setProducts)
      .catch((err) => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [query, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);
  const scrollToCatalog = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <span className="eyebrow">{STORE_NAME}</span>
            <h1>Sua próxima chuteira está aqui.</h1>
            <p>{STORE_SLOGAN}. Escolha o modelo, confira o tamanho e fale direto com o vendedor pelo WhatsApp.</p>
            <div className="hero__cta">
              <button type="button" className="btn btn--primary btn--lg" onClick={scrollToCatalog}>Ver catálogo</button>
              {meta && (
                <span className="hero__stat"><strong>{meta.available}</strong> {meta.available === 1 ? 'chuteira disponível' : 'chuteiras disponíveis'}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container section">
          <div className="section__head">
            <h2>Destaques disponíveis</h2>
            <span className="muted">Chegaram recentemente</span>
          </div>
          <div className="grid grid--featured">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="container section" id="catalogo">
        <div className="section__head">
          <h2>Catálogo</h2>
          {!loading && !error && <span className="muted">{products.length} {products.length === 1 ? 'resultado' : 'resultados'}</span>}
        </div>

        <Filters value={filters} onChange={setFilters} meta={meta} />

        {error ? (
          <ErrorMessage message={error} onRetry={retry} />
        ) : loading ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          <EmptyState title="Nenhuma chuteira encontrada">
            <p className="muted">Tente ajustar a busca ou limpar os filtros.</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setFilters(EMPTY_FILTERS)}>Limpar filtros</button>
          </EmptyState>
        ) : (
          <div className="grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
