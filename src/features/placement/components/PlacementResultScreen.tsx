import { Icon } from "@/shared/components/Icon";

type Props = {
  passedModules: string[];
  skippedLessonCount: number;
  seededAtomCount: number;
  isTestOut: boolean;
  testOutModuleLabel?: string;
  onContinue: () => void;
};

export function PlacementResultScreen({
  passedModules,
  skippedLessonCount,
  seededAtomCount,
  isTestOut,
  testOutModuleLabel,
  onContinue,
}: Props) {
  const passed = passedModules.length > 0;

  if (isTestOut) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <Icon
            name={passed ? "check" : "close"}
            size={48}
            className={passed ? "text-accent" : "text-error"}
          />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {passed ? "Module cleared!" : "Not quite yet"}
        </h1>
        <p className="max-w-md text-text-secondary">
          {passed
            ? `You tested out of ${testOutModuleLabel ?? passedModules[0]}. ${seededAtomCount} vocab items are now in your review queue for a quick refresher.`
            : `You need 100% to test out. Keep practicing and try again when you're ready.`}
        </p>
        <button
          onClick={onContinue}
          className="rounded-xl bg-accent px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-accent-hover active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <Icon name="graduationCap" size={48} className="text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">
        {passed ? "Placement complete!" : "Starting from the top"}
      </h1>
      {passed ? (
        <>
          <p className="max-w-md text-text-secondary">
            You demonstrated mastery of{" "}
            <span className="font-semibold text-text-primary">
              {passedModules.length} module{passedModules.length !== 1 ? "s" : ""}
            </span>
            . We skipped {skippedLessonCount} lessons and added {seededAtomCount} vocab
            items to your review queue for a quick refresher.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {passedModules.map((m) => (
              <span
                key={m}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
              >
                {m.toUpperCase()}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="max-w-md text-text-secondary">
          No worries — you'll start with the fundamentals. The course will build
          your skills step by step.
        </p>
      )}
      <button
        onClick={onContinue}
        className="rounded-xl bg-accent px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-accent-hover active:scale-[0.98]"
      >
        Start learning
      </button>
    </div>
  );
}
