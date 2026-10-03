import { useState } from 'react';
import { FilterIcon, SearchIcon } from './Icons';

export const EMPTY_FILTERS = {
  q: '',
  brand: '',
  size: '',
  minPrice: '',
  maxPrice: '',
  status: '',
  sort: 'recent',
};

export default function Filters({ value, onChange, meta }) {
  const [open, setOpen] = useState(false);
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const active = ['brand', 'size', 'minPrice', 'maxPrice', 'status'].filter((k) => value[k]).length;

  return (
    <div className="filters">
      <div className="filters__top">
        <label className="search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Buscar por nome, marca..."
            value={value.q}
            onChange={set('q')}
            aria-label="Buscar chuteiras"
          />
        </label>
        <button
          type="button"
          className="btn btn--outline filters__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <FilterIcon /> <span className="filters__label">Filtros</span> {active > 0 && <span className="pill">{active}</span>}
        </button>
      </div>

      <div className={`filters__panel ${open ? 'is-open' : ''}`}>
        <label className="field">
          <span>Marca</span>
          <select value={value.brand} onChange={set('brand')}>
            <option value="">Todas</option>
            {meta?.brands?.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tamanho</span>
          <select value={value.size} onChange={set('size')}>
            <option value="">Todos</option>
            {meta?.sizes?.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Preço mín.</span>
          <input type="number" inputMode="decimal" min="0" placeholder="R$ 0" value={value.minPrice} onChange={set('minPrice')} />
        </label>
        <label className="field">
          <span>Preço máx.</span>
          <input type="number" inputMode="decimal" min="0" placeholder="R$ 9999" value={value.maxPrice} onChange={set('maxPrice')} />
        </label>
        <label className="field">
          <span>Disponibilidade</span>
          <select value={value.status} onChange={set('status')}>
            <option value="">Todas</option>
            <option value="disponivel">Disponíveis</option>
            <option value="vendida">Vendidas</option>
          </select>
        </label>
        <label className="field">
          <span>Ordenar por</span>
          <select value={value.sort} onChange={set('sort')}>
            <option value="recent">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </label>
        <button type="button" className="btn btn--ghost filters__clear" onClick={() => onChange(EMPTY_FILTERS)}>
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
