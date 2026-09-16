/** Section title with the neon underline and the small editorial aside. */
export default function SectionHeading({
  id,
  title,
  context,
}: {
  id: string;
  title: string;
  context?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2
          id={id}
          className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl"
        >
          {title}
        </h2>
        <span
          aria-hidden
          className="mt-2.5 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
        />
      </div>
      {context && (
        <p className="font-heading text-[11px] uppercase tracking-[0.3em] text-rave-muted sm:pb-2">
          {context}
        </p>
      )}
    </div>
  );
}
