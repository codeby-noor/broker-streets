import { useEffect } from 'react';
import { X } from 'lucide-react';

function ContactModal({ open, onClose, data = {}, title = 'Contact Seller' }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [open, onClose]);

  if (!open) return null;

  const fullName = data.sellerName || data.ownerName || data.userName || data.name || 'Contact';
  const mobile = data.sellerPhone || data.ownerMobile || data.mobile || data.userMobile || '';
  const email = data.sellerEmail || data.ownerEmail || data.email || data.userEmail || '';
  const cleanedMobile = String(mobile).replace(/\D/g, '');
  const hasMobile = Boolean(cleanedMobile);
  const hasEmail = Boolean(email);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 id="contact-modal-title" className="text-lg font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-muted">Reach out directly to the contact listed for this property.</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Name</p>
            <p className="mt-1 text-ink">{fullName}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Mobile</p>
            <p className="mt-1 text-ink">{mobile || 'Not available'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Email</p>
            <p className="mt-1 text-ink">{email || 'Not available'}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {hasMobile ? (
              <a href={`tel:+91${cleanedMobile}`} className="inline-flex items-center justify-center rounded-full bg-sage px-4 py-3 text-sm font-semibold text-white">Call</a>
            ) : null}
            {hasMobile ? (
              <a href={`https://wa.me/91${cleanedMobile}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-700">WhatsApp</a>
            ) : null}
            {hasEmail ? (
              <a href={`mailto:${email}`} className="inline-flex items-center justify-center rounded-full border border-stone-200 px-4 py-3 text-sm font-semibold text-slate-700">Email</a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
