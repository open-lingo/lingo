export function scanFiles(files, { locFloor, baseline }) {
  const offenders = files
    .filter((f) => f.loc > locFloor)
    .sort((a, b) => b.loc - a.loc);

  const grew = offenders.filter(
    (f) => baseline && baseline[f.path] !== undefined && f.loc > baseline[f.path]
  );

  const orphans = files.filter((f) => f.importedBy === 0);

  return { offenders, grew, orphans };
}
