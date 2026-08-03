function Pagination({ currentPage, pageCount, onChange }) {
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onChange(currentPage - 1)}
        className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      {pageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={`rounded-3xl px-4 py-2 text-sm font-semibold ${page === currentPage ? 'bg-primary text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={currentPage === pageCount}
        onClick={() => onChange(currentPage + 1)}
        className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
