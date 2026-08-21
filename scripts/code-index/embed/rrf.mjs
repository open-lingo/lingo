export function rrfFuse(lists, { k = 60 } = {}) {
  // Map each id to { totalScore, bestRank }
  const idData = new Map();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank++) {
      const id = list[rank];
      const score = 1 / (k + rank);
      
      if (idData.has(id)) {
        const data = idData.get(id);
        data.totalScore += score;
        data.bestRank = Math.min(data.bestRank, rank);
      } else {
        idData.set(id, {
          totalScore: score,
          bestRank: rank
        });
      }
    }
  }

  // Convert to array and sort
  const result = Array.from(idData.entries()).map(([id, { totalScore, bestRank }]) => ({
    id,
    score: totalScore,
    bestRank
  }));

  // Sort by score DESC, then bestRank ASC, then id ASC (lexicographically)
  result.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.bestRank !== b.bestRank) {
      return a.bestRank - b.bestRank;
    }
    return a.id.localeCompare(b.id);
  });

  // Return only id and score
  return result.map(({ id, score }) => ({ id, score }));
}
