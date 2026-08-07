function LargeButton({ children, type = 'button', className = '', disabled = false, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg transition duration-200 focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 ${disabled ? 'opacity-70' : 'hover:-translate-y-0.5 hover:bg-primary-dark'} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default LargeButton;
