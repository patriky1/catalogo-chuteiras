import { Link, NavLink } from 'react-router-dom';
import { STORE_NAME, STORE_WHATSAPP } from '../config';
import { whatsappLink } from '../utils/format';
import { BootIcon, WhatsAppIcon } from './Icons';

export default function Header() {
  const contact = whatsappLink(STORE_WHATSAPP);
  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo" aria-label={`${STORE_NAME} — página inicial`}>
          <span className="logo__mark"><BootIcon width={22} height={22} /></span>
          <span className="logo__text">{STORE_NAME}</span>
        </Link>
        <nav className="header__nav">
          <NavLink to="/" end className="header__link">Catálogo</NavLink>
          {contact && (
            <a href={contact} target="_blank" rel="noopener noreferrer" className="btn btn--whatsapp btn--sm">
              <WhatsAppIcon width={16} height={16} />
              <span className="hide-xs">Fale conosco</span>
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
