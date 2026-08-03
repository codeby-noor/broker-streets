function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">{title}</h2>
        {description && <p className="mt-4 text-base leading-7 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default SectionHeading;