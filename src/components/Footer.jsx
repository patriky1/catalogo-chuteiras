import { Link } from 'react-router-dom';
import { STORE_NAME, STORE_SLOGAN, STORE_WHATSAPP } from '../config';
import { formatPhone } from '../utils/format';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <strong>{STORE_NAME}</strong>
          <p className="muted">{STORE_SLOGAN}</p>
        </div>
        <div className="footer__meta">
          {STORE_WHATSAPP && <span>WhatsApp: {formatPhone(STORE_WHATSAPP)}</span>}
          <span>© {new Date().getFullYear()} {STORE_NAME}</span>
          <Link to="/admin" className="footer__admin">Área administrativa</Link>
        </div>
      </div>
    </footer>
  );
}
