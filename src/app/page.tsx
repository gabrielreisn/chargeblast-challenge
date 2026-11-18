export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-20 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="w-full max-w-xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Ready to build
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Chargeblast Challenge</h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Next.js, TypeScript, and Tailwind CSS. Checked with Oxlint, formatted with Oxfmt, and
          tested with Vitest.
        </p>
        <a
          className="inline-flex rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-4 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          href="https://nextjs.org/docs"
        >
          Next.js documentation
        </a>
      </div>
    </main>
  );
}
