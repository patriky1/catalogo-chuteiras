import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../services/api';
import { compressImage } from '../utils/image';

const MAX_MB = 25; // tamanho máximo da foto original (ela é comprimida antes do envio)
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const toForm = (p) => ({
  name: p?.name ?? '',
  price: p?.price != null ? String(p.price) : '',
  description: p?.description ?? '',
  size: p?.size != null ? String(p.size) : '',
  brand: p?.brand ?? '',
  condition: p?.condition ?? 'nova',
  status: p?.status ?? 'disponivel',
  sellerName: p?.sellerName ?? '',
  sellerPhone: p?.sellerPhone ?? '',
});

/** Validação no navegador (espelha as regras da API). */
function validate(v, { hasImage }) {
  const e = {};
  if (v.name.trim().length < 2 || v.name.trim().length > 120) e.name = 'Informe o nome (2 a 120 caracteres).';
  const rawPrice = String(v.price).trim();
  const price = Number(rawPrice.includes(',') ? rawPrice.replace(/\./g, '').replace(',', '.') : rawPrice);
  if (!Number.isFinite(price) || price <= 0) e.price = 'Informe um preço válido maior que zero.';
  if (v.description.trim().length < 10) e.description = 'A descrição deve ter pelo menos 10 caracteres.';
  const size = Number(v.size);
  if (!Number.isInteger(size) || size < 20 || size > 50) e.size = 'Tamanho inteiro entre 20 e 50.';
  if (v.brand.trim().length < 2) e.brand = 'Informe a marca.';
  if (v.sellerName.trim().length < 2) e.sellerName = 'Informe o nome do vendedor.';
  const phone = v.sellerPhone.replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 15) e.sellerPhone = 'WhatsApp com DDI e DDD (ex.: 5511999999999).';
  if (!hasImage) e.image = 'Envie a foto principal da chuteira.';
  return e;
}

export default function ProductForm({ initial, brands = [], onSubmit, submitLabel = 'Salvar' }) {
  const [values, setValues] = useState(() => toForm(initial));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : assetUrl(initial?.image)), [file, initial]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type && !ACCEPTED.includes(f.type)) {
      setErrors((er) => ({ ...er, image: 'Use uma imagem JPG, PNG ou WEBP.' }));
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrors((er) => ({ ...er, image: `A foto deve ter no máximo ${MAX_MB} MB.` }));
      return;
    }
    setProcessing(true);
    try {
      const optimized = await compressImage(f);
      setFile(optimized);
      setErrors((er) => ({ ...er, image: undefined }));
    } catch (err) {
      setErrors((er) => ({ ...er, image: err.message }));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const clientErrors = validate(values, { hasImage: Boolean(file || initial?.image) });
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setFormError('Verifique os campos destacados.');
      return;
    }

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v.trim() : v));
    if (file) fd.append('image', file);

    setSubmitting(true);
    try {
      await onSubmit(fd);
    } catch (err) {
      setFormError(err.message || 'Não foi possível salvar.');
      if (err.details) setErrors(err.details);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (k) => `field ${errors[k] ? 'field--error' : ''}`;
  const Err = ({ k }) => (errors[k] ? <small className="field__error">{errors[k]}</small> : null);

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}

      <div className="product-form__grid">
        <section className="panel">
          <h2 className="panel__title">Foto principal</h2>
          <label className={`upload ${errors.image ? 'upload--error' : ''}`}>
            {processing ? (
              <span className="upload__hint">Otimizando foto...</span>
            ) : preview ? (
              <img src={preview} alt="Pré-visualização" />
            ) : (
              <span className="upload__hint">Clique para selecionar<br /><small>JPG, PNG ou WEBP · a foto é otimizada automaticamente</small></span>
            )}
            <input type="file" accept="image/*" onChange={handleFile} disabled={processing} />
          </label>
          {preview && !processing && (
            <p className="muted small">
              Clique na imagem para trocar a foto.{file ? ` (${Math.round(file.size / 1024)} KB após otimização)` : ''}
            </p>
          )}
          <Err k="image" />
        </section>

        <section className="panel">
          <h2 className="panel__title">Informações</h2>
          <label className={fieldClass('name')}>
            <span>Nome *</span>
            <input value={values.name} onChange={set('name')} maxLength={120} placeholder="Ex.: Nike Mercurial Superfly 9" />
            <Err k="name" />
          </label>

          <div className="row">
            <label className={fieldClass('brand')}>
              <span>Marca *</span>
              <input value={values.brand} onChange={set('brand')} list="brand-options" maxLength={60} placeholder="Ex.: Nike" />
              <datalist id="brand-options">{brands.map((b) => <option key={b} value={b} />)}</datalist>
              <Err k="brand" />
            </label>
            <label className={fieldClass('size')}>
              <span>Tamanho *</span>
              <input type="number" inputMode="numeric" min="20" max="50" value={values.size} onChange={set('size')} placeholder="41" />
              <Err k="size" />
            </label>
          </div>

          <div className="row">
            <label className={fieldClass('price')}>
              <span>Preço (R$) *</span>
              <input inputMode="decimal" value={values.price} onChange={set('price')} placeholder="899,90" />
              <Err k="price" />
            </label>
            <label className={fieldClass('condition')}>
              <span>Condição *</span>
              <select value={values.condition} onChange={set('condition')}>
                <option value="nova">Nova</option>
                <option value="usada">Usada</option>
              </select>
              <Err k="condition" />
            </label>
            <label className={fieldClass('status')}>
              <span>Status *</span>
              <select value={values.status} onChange={set('status')}>
                <option value="disponivel">Disponível</option>
                <option value="vendida">Vendida</option>
              </select>
              <Err k="status" />
            </label>
          </div>

          <label className={fieldClass('description')}>
            <span>Descrição *</span>
            <textarea rows={5} value={values.description} onChange={set('description')} maxLength={2000} placeholder="Estado de conservação, tipo de solado, detalhes..." />
            <small className="muted">{values.description.length}/2000</small>
            <Err k="description" />
          </label>
        </section>

        <section className="panel">
          <h2 className="panel__title">Contato do vendedor</h2>
          <div className="row">
            <label className={fieldClass('sellerName')}>
              <span>Nome *</span>
              <input value={values.sellerName} onChange={set('sellerName')} maxLength={80} />
              <Err k="sellerName" />
            </label>
            <label className={fieldClass('sellerPhone')}>
              <span>WhatsApp *</span>
              <input inputMode="tel" value={values.sellerPhone} onChange={set('sellerPhone')} placeholder="5511999999999" />
              <Err k="sellerPhone" />
            </label>
          </div>
        </section>
      </div>

      <div className="form-actions">
        <Link to="/admin" className="btn btn--ghost">Cancelar</Link>
        <button type="submit" className="btn btn--primary" disabled={submitting || processing}>
          {submitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
