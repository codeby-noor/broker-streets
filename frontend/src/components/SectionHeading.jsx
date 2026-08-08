function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display-heading mt-2 text-2xl text-ink sm:mt-3 sm:text-3xl lg:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-sm leading-7 text-muted sm:mt-4 sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default SectionHeading;