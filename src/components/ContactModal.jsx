import { useEffect } from 'react';
import { X, Phone, MessageCircle, Mail, Building2, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatSellerNameWithType } from '../utils/format';

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
  const sellerType = data.sellerType || data.seller?.type || data.seller?.sellerType || '';
  const formattedFullName = formatSellerNameWithType(fullName, sellerType, t);
  const mobile = data.sellerPhone || data.ownerMobile || data.mobile || data.userMobile || '';
  const email = data.sellerEmail || data.ownerEmail || data.email || data.userEmail || '';
  const cleanedMobile = String(mobile).replace(/\D/g, '');
  const hasMobile = Boolean(cleanedMobile);
  const hasEmail = Boolean(email);

  const propertyTitleText = data.propertyTitle
    ? getPropertyDisplayTitle(data.propertyTitle)
    : data.propertyType
    ? t(data.propertyType)
    : null;
  const propertyLocation = [t(data.city || data.taluka), t(data.district)]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-[calc(100%-32px)] max-w-[440px] max-h-[85vh] flex flex-col rounded-2xl bg-[#FDFDFD] shadow-xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 bg-slate-50/60">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1D5CA9]">
              <Building2 size={12} /> Broker Streets
            </span>
            <h3 id="contact-modal-title" className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {displayTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('contact.modalDescription')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition active:scale-95 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY (SCROLLABLE IF NEEDED) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SELLER & PROPERTY INFO LAYOUT */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
            {/* NAME */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium text-slate-500">{t('contact.modalName')}</span>
              <span className="font-bold text-slate-900 truncate max-w-[220px]">{formattedFullName}</span>
            </div>

            {/* MOBILE NUMBER */}
            {hasMobile ? (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-slate-500">{t('contact.modalMobile')}</span>
                <span className="font-bold text-[#1D5CA9] select-all">+91 {mobile}</span>
              </div>
            ) : null}

            {/* EMAIL */}
            {hasEmail ? (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-slate-500">{t('contact.modalEmail')}</span>
                <span className="font-semibold text-slate-700 truncate max-w-[200px] select-all">{email}</span>
              </div>
            ) : null}

            {/* PROPERTY (SECONDARY) */}
            {propertyTitleText || propertyLocation ? (
              <div className="pt-2 border-t border-slate-200/60 space-y-0.5 text-xs">
                <span className="font-medium text-slate-400 block text-[11px] uppercase tracking-wider">
                  {t('contact.modalProperty')}
                </span>
                <p className="font-bold text-slate-800 truncate">
                  {propertyTitleText || t('propertyDetails.propertyNotUploaded')}
                </p>
                {propertyLocation ? (
                  <p className="font-medium text-slate-500 flex items-center gap-1 text-[11px]">
                    <MapPin size={11} className="text-[#1D5CA9] flex-shrink-0" />
                    <span className="truncate">{propertyLocation}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ACTION BUTTONS (BROKER STREETS BLUE #1D5CA9 & WHITE #FDFDFD ONLY) */}
          <div className="space-y-2.5 pt-1">
            {hasMobile ? (
              <a
                href={`tel:+91${cleanedMobile}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D5CA9] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#FDFDFD] shadow-sm transition hover:bg-[#1D5CA9]/90 active:scale-[0.98]"
              >
                <Phone size={15} />
                <span>{t('common.call')}</span>
              </a>
            ) : null}

            {hasMobile ? (
              <a
                href={`https://wa.me/91${cleanedMobile}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1D5CA9] bg-[#FDFDFD] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1D5CA9] shadow-2xs transition hover:bg-[#1D5CA9]/10 active:scale-[0.98]"
              >
                <MessageCircle size={15} />
                <span>{t('common.whatsapp')}</span>
              </a>
            ) : null}

            {hasEmail ? (
              <a
                href={`mailto:${email}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1D5CA9] bg-[#FDFDFD] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1D5CA9] shadow-2xs transition hover:bg-[#1D5CA9]/10 active:scale-[0.98]"
              >
                <Mail size={15} />
                <span>{t('common.email')}</span>
              </a>
            ) : null}

            {!hasMobile && !hasEmail ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-600">
                {t('contact.modalNoContact')}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactModal;
