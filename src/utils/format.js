const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatPrice = (value) => currency.format(Number(value) || 0);

export const CONDITION_LABEL = { nova: 'Nova', usada: 'Usada' };
export const STATUS_LABEL = { disponivel: 'Disponível', vendida: 'Vendida' };

export function formatPhone(digits = '') {
  const d = String(digits).replace(/\D/g, '');
  const m = d.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : d;
}

/** Link do WhatsApp com mensagem pronta sobre o produto. */
export function whatsappLink(phone, product) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  let text = 'Olá! Vi o catálogo de chuteiras e gostaria de mais informações.';
  if (product) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/produto/${product.id}` : '';
    text =
      `Olá! Tenho interesse na chuteira *${product.name}* ` +
      `(${product.brand}, tam. ${product.size}) por ${formatPrice(product.price)}. ` +
      `Ainda está disponível?${url ? `\n${url}` : ''}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
