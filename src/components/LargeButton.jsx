function LargeButton({ children, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`w-full rounded-3xl bg-primary px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:opacity-95 focus-visible:ring-4 focus-visible:ring-primary/25 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default LargeButton;
