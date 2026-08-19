import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

function ContactModal({ open, onClose, data = {}, title }) {
  const { t, getPropertyDisplayTitle } = useLanguage();
  const displayTitle = title || t('buy.contactSeller');
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const fullName = data.sellerName || data.ownerName || data.userName || data.name || t('contact.modalName');
  const mobile = data.sellerPhone || data.ownerMobile || data.mobile || data.userMobile || '';
  const email = data.sellerEmail || data.ownerEmail || data.email || data.userEmail || '';
  const cleanedMobile = String(mobile).replace(/\D/g, '');
  const hasMobile = Boolean(cleanedMobile);
  const hasEmail = Boolean(email);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 px-4 py-4 sm:px-6 sm:py-8" onClick={onClose}>
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-xl sm:rounded-[20px] sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 id="contact-modal-title" className="text-lg font-semibold text-ink">{displayTitle}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('contact.modalDescription')}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">{t('contact.modalName')}</p>
              <p className="mt-2 text-base font-semibold text-ink">{fullName}</p>
            </div>

            <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{t('contact.modalMobile')}</p>
                <p className="mt-2 text-base font-semibold text-ink">{mobile || t('common.notAvailable')}</p>
              </div>
              {email ? (
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t('contact.modalEmail')}</p>
                  <p className="mt-2 text-base font-semibold text-ink">{email}</p>
                </div>
              ) : null}
              {data.propertyTitle || data.propertyType || data.city || data.district ? (
                <div>
                  <p className="text-sm font-semibold text-slate-500">{t('contact.modalProperty')}</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {data.propertyTitle ? getPropertyDisplayTitle(data.propertyTitle) : (data.propertyType ? t(data.propertyType) : t('propertyDetails.propertyNotUploaded'))}
                    {data.city || data.district ? ` • ${[t(data.city), t(data.district)].filter(Boolean).join(', ')}` : ''}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              {hasMobile ? (
                <a
                  href={`tel:+91${cleanedMobile}`}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-sage px-4 py-4 text-base font-semibold text-white transition hover:bg-sage-dark"
                >
                  {t('common.call')}
                </a>
              ) : null}
              {hasMobile ? (
                <a
                  href={`https://wa.me/91${cleanedMobile}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {t('common.whatsapp')}
                </a>
              ) : null}
              {hasEmail ? (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {t('common.email')}
                </a>
              ) : null}
              {!hasMobile && !hasEmail ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
                  {t('contact.modalNoContact')}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
