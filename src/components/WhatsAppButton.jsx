import { whatsappLink } from '../utils/format';
import { WhatsAppIcon } from './Icons';

export default function WhatsAppButton({ product, label = 'Chamar no WhatsApp', className = '', size }) {
  const href = whatsappLink(product?.sellerPhone, product);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn btn--whatsapp ${size ? `btn--${size}` : ''} ${className}`}
      aria-label={`${label} sobre ${product.name}`}
    >
      <WhatsAppIcon width={18} height={18} />
      <span>{label}</span>
    </a>
  );
}
