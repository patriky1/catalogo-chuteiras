import { useState } from 'react';
import { assetUrl } from '../services/api';
import { BootIcon } from './Icons';

export default function ProductImage({ src, alt, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(src);

  if (!url || failed) {
    return (
      <div className={`img-placeholder ${className}`} role="img" aria-label={alt}>
        <BootIcon width={64} height={64} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
