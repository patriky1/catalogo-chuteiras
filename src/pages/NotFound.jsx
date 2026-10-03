import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Página não encontrada');
  return (
    <div className="container page">
      <div className="state">
        <p className="state__title">Página não encontrada</p>
        <p className="muted">O endereço acessado não existe.</p>
        <Link to="/" className="btn btn--primary">Ir para o catálogo</Link>
      </div>
    </div>
  );
}
