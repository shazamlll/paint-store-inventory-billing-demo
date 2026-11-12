import { appNavigation, homeCopy } from "../src/ux-copy.js";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="commerce-hero px-5 py-7 md:px-8 md:py-10">
        <h1 className="max-w-4xl text-5xl font-light md:text-7xl">{homeCopy.title}</h1>
        <p className="commerce-muted mt-5 max-w-3xl text-base leading-7 md:text-lg">
          {homeCopy.intro}
        </p>
      </header>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <h2 className="text-2xl font-semibold">业务入口</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{homeCopy.entrySummary}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {appNavigation.groups.map((group) => (
          <article key={group.id} className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-5">
            <h2 className="text-xl font-semibold">{group.label}</h2>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
              {group.items.map((item) => (
                <li key={item.href}>{item.label}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
