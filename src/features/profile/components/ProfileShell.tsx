import type { ReactNode } from "react";

/** Fallback shell for loading / not-found / private / error states. */
export function ProfileShell({
  heading,
  children,
}: {
  heading: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
        {heading}
      </h1>
      {children && <div className="mt-4">{children}</div>}
    </main>
  );
}
