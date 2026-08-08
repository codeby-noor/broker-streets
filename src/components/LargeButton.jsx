function LargeButton({ children, type = 'button', className = '', disabled = false, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full rounded-2xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-lg transition duration-200 focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-3xl sm:px-6 sm:py-4 sm:text-lg ${disabled ? 'opacity-70' : 'hover:-translate-y-0.5 hover:bg-primary-dark'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default LargeButton;
