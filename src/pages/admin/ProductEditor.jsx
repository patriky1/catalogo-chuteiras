import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ProductForm from '../../components/ProductForm';
import { ErrorMessage, Loader } from '../../components/Feedback';
import { ArrowLeftIcon } from '../../components/Icons';
import { STORE_WHATSAPP } from '../../config';

export default function ProductEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Editar chuteira' : 'Nova chuteira');
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    productService.meta().then((m) => setBrands(m.brands)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    productService
      .get(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (formData) => {
    if (isEdit) await productService.update(id, formData);
    else await productService.create(formData);
    navigate('/admin', { replace: true });
  };

  return (
    <div className="container page">
      <Link to="/admin" className="back-link"><ArrowLeftIcon width={18} height={18} /> Voltar aos produtos</Link>
      <div className="page__head">
        <h1>{isEdit ? 'Editar chuteira' : 'Nova chuteira'}</h1>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <ProductForm
          key={product?.id || 'new'}
          initial={product || { sellerPhone: STORE_WHATSAPP }}
          brands={brands}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? 'Salvar alterações' : 'Cadastrar chuteira'}
        />
      )}
    </div>
  );
}
