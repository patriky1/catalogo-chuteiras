import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ProductImage from '../../components/ProductImage';
import { ConditionBadge, StatusBadge } from '../../components/Badges';
import { EmptyState, ErrorMessage, Loader } from '../../components/Feedback';
import { PlusIcon, SearchIcon } from '../../components/Icons';
import { formatPrice } from '../../utils/format';
import { STORE_WHATSAPP } from '../../config';

export default function Dashboard() {
  useDocumentTitle('Painel administrativo');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    productService
      .list({ sort: 'recent' })
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!statusFilter || p.status === statusFilter) &&
        (!term || `${p.name} ${p.brand} ${p.size}`.toLowerCase().includes(term))
    );
  }, [products, search, statusFilter]);

  const stats = useMemo(() => {
    const available = products.filter((p) => p.status === 'disponivel');
    return {
      total: products.length,
      available: available.length,
      sold: products.length - available.length,
      stockValue: available.reduce((sum, p) => sum + p.price, 0),
    };
  }, [products]);

  const toggleStatus = async (p) => {
    const next = p.status === 'disponivel' ? 'vendida' : 'disponivel';
    setBusyId(p.id);
    try {
      const updated = await productService.setStatus(p.id, next);
      setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)));
      setNotice({ type: 'success', text: `"${p.name}" marcada como ${next === 'vendida' ? 'vendida' : 'disponível'}.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const loadExamples = async () => {
    setBusyId('seed');
    try {
      const { total } = await productService.seed({ sellerName: 'Vendedor', sellerPhone: STORE_WHATSAPP });
      setNotice({ type: 'success', text: `${total} chuteiras de exemplo adicionadas. Edite ou exclua como quiser.` });
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    setBusyId(p.id);
    try {
      await productService.remove(p.id);
      setProducts((list) => list.filter((x) => x.id !== p.id));
      setNotice({ type: 'success', text: `"${p.name}" excluída.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container page">
      <div className="page__head">
        <div>
          <h1>Produtos</h1>
          <p className="muted">Gerencie as chuteiras do catálogo.</p>
        </div>
        <Link to="/admin/produtos/novo" className="btn btn--primary">
          <PlusIcon width={18} height={18} /> Nova chuteira
        </Link>
      </div>

      {notice && <div className={`alert alert--${notice.type}`} role="status">{notice.text}</div>}

      <div className="stats">
        <div className="stat"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="stat"><span>Disponíveis</span><strong>{stats.available}</strong></div>
        <div className="stat"><span>Vendidas</span><strong>{stats.sold}</strong></div>
        <div className="stat"><span>Valor em estoque</span><strong>{formatPrice(stats.stockValue)}</strong></div>
      </div>

      <div className="admin-toolbar">
        <label className="search">
          <SearchIcon />
          <input type="search" placeholder="Buscar por nome, marca ou tamanho" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="disponivel">Disponíveis</option>
          <option value="vendida">Vendidas</option>
        </select>
      </div>

      {loading ? (
        <Loader label="Carregando produtos..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState title={products.length ? 'Nenhum produto corresponde à busca' : 'Nenhuma chuteira cadastrada'}>
          {!products.length && (
            <div className="empty-actions">
              <Link to="/admin/produtos/novo" className="btn btn--primary btn--sm">Cadastrar a primeira</Link>
              <button type="button" className="btn btn--outline btn--sm" onClick={loadExamples} disabled={busyId === 'seed'}>
                {busyId === 'seed' ? 'Adicionando...' : 'Adicionar 8 exemplos'}
              </button>
            </div>
          )}
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Marca</th>
                <th>Tam.</th>
                <th>Condição</th>
                <th>Preço</th>
                <th>Status</th>
                <th className="table__actions-col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className={busyId === p.id ? 'is-busy' : ''}>
                  <td data-label="Produto">
                    <div className="table__product">
                      <ProductImage src={p.image} alt={p.name} className="table__thumb" />
                      <Link to={`/produto/${p.id}`} target="_blank">{p.name}</Link>
                    </div>
                  </td>
                  <td data-label="Marca">{p.brand}</td>
                  <td data-label="Tamanho">{p.size}</td>
                  <td data-label="Condição"><ConditionBadge condition={p.condition} /></td>
                  <td data-label="Preço"><strong>{formatPrice(p.price)}</strong></td>
                  <td data-label="Status"><StatusBadge status={p.status} /></td>
                  <td className="table__actions">
                    <button type="button" className="btn btn--outline btn--sm" disabled={busyId === p.id} onClick={() => toggleStatus(p)}>
                      {p.status === 'disponivel' ? 'Marcar vendida' : 'Marcar disponível'}
                    </button>
                    <Link to={`/admin/produtos/${p.id}/editar`} className="btn btn--outline btn--sm">Editar</Link>
                    <button type="button" className="btn btn--danger btn--sm" disabled={busyId === p.id} onClick={() => remove(p)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
