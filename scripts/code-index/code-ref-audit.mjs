import { fileURLToPath } from 'url';

// Helper: extract basename stem (filename without extension)
function getBasenameStem(path) {
  const lastSlash = path.lastIndexOf('/');
  const filename = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? filename : filename.slice(0, dotIndex);
}

// Helper: compute longest common suffix length (including extension)
function longestCommonSuffixLen(a, b) {
  let i = a.length - 1;
  let j = b.length - 1;
  let count = 0;
  while (i >= 0 && j >= 0 && a[i] === b[j]) {
    count++;
    i--;
    j--;
  }
  return count;
}

export function extractCodeRefs(text) {
  // Step a) Strip triple-backtick fenced blocks
  let cleaned = text.replace(/```[\s\S]*?```/g, " ");
  
  // Step b) Find inline code spans (no newlines inside)
  const inlineCodeRegex = /`([^`\n]+)`/g;
  const refs = [];
  const seen = new Set();
  
  let match;
  while ((match = inlineCodeRegex.exec(cleaned)) !== null) {
    const span = match[1];
    // Step c) Split on whitespace
    const words = span.split(/\s+/);
    for (const word of words) {
      // Step d) Trim surrounding punctuation and check if it's a valid path
      // Trim only surrounding SENTENCE punctuation — never `_ - / < > *`, which
      // are valid in paths (\p{Punctuation} wrongly includes `_`, mangling
      // _archive / _consonantRowHelpers). Trailing `.` is stripped (sentence end).
      const trimmed = word.trim().replace(/^[`'"(),;:!?[\]{}]+|[`'"(),;:!?[\]{}.]+$/g, '');
      if (/^[\w./*<>-]+\.(ts|tsx|mjs|js|cjs|py|css)$/i.test(trimmed)) {
        if (!seen.has(trimmed)) {
          seen.add(trimmed);
          refs.push(trimmed);
        }
      }
    }
  }
  
  return refs;
}

export function isCodePlaceholder(ref) {
  // Check for glob chars or angle brackets
  if (/[<>*\[\]]/.test(ref)) {
    return true;
  }
  
  // Check for mN or mX as standalone tokens or in specific patterns
  // Pattern: /\bm[NX]\b/ (standalone), /\/m[NX]-/ (path segment), /mN-/ (filename stem)
  const mNPattern = /\b(mN|mX)\b/;
  const pathSegmentPattern = /\/m[NX]-/;
  const filenameStemPattern = /^m[NX]-/;
  
  if (mNPattern.test(ref) || pathSegmentPattern.test(ref) || filenameStemPattern.test(ref)) {
    return true;
  }
  
  // Also check if ref is exactly "mN.ir.yaml" or similar (mN as filename stem)
  const basename = ref.slice(ref.lastIndexOf('/') + 1);
  if (basename === 'mN.ir.yaml' || basename === 'mX.ir.yaml') {
    return true;
  }
  
  return false;
}

export function auditCodeRefs({ docText, repoFiles, siblingRepos }) {
  const refs = extractCodeRefs(docText);
  const ok = [];
  const missing = [];
  const crossRepo = [];
  const placeholders = [];
  
  // Preprocess repoFiles for suffix matching
  const repoFilesSet = new Set(repoFiles);
  
  // Helper: check if ref resolves in-repo (exact or suffix match)
  function resolveInRepo(ref) {
    if (repoFilesSet.has(ref)) {
      return true;
    }
    // Check suffix match: some repoFile ends with "/" + ref
    for (const file of repoFiles) {
      if (file.endsWith("/" + ref)) {
        return true;
      }
    }
    return false;
  }
  
  // Helper: check if ref resolves in a sibling repo
  function resolveInSiblingRepo(ref) {
    for (const [repoName, files] of Object.entries(siblingRepos)) {
      const filesSet = new Set(files);
      
      // Case 1: ref is exactly repoName or starts with repoName + "/"
      if (ref === repoName || ref.startsWith(repoName + "/")) {
        const remainder = ref === repoName ? "" : ref.slice(repoName.length + 1);
        if (remainder && (filesSet.has(remainder) || files.some(f => f.endsWith("/" + remainder)))) {
          return { repo: repoName, resolvedRef: remainder };
        }
      }
      
      // Case 2: suffix match without repo prefix
      if (filesSet.has(ref) || files.some(f => f.endsWith("/" + ref))) {
        return { repo: repoName, resolvedRef: ref };
      }
    }
    return null;
  }
  
  // Helper: find nearest match in repoFiles
  function findNearest(ref) {
    const refBasename = ref.slice(ref.lastIndexOf('/') + 1);
    const refStem = getBasenameStem(refBasename);
    
    let bestMatch = null;
    let maxSuffixLen = 0;
    
    for (const file of repoFiles) {
      const fileBasename = file.slice(file.lastIndexOf('/') + 1);
      const fileStem = getBasenameStem(fileBasename);
      
      // Compare full basenames (including extension)
      const suffixLen = longestCommonSuffixLen(refBasename, fileBasename);
      
      if (suffixLen >= 6 && suffixLen > maxSuffixLen) {
        maxSuffixLen = suffixLen;
        bestMatch = file;
      }
    }
    
    return bestMatch;
  }
  
  for (const ref of refs) {
    if (isCodePlaceholder(ref)) {
      placeholders.push({ ref });
    } else if (resolveInRepo(ref)) {
      ok.push({ ref });
    } else {
      const siblingMatch = resolveInSiblingRepo(ref);
      if (siblingMatch) {
        crossRepo.push({ ref, repo: siblingMatch.repo });
      } else {
        const nearest = findNearest(ref);
        missing.push({ ref, nearest });
      }
    }
  }
  
  return { ok, missing, crossRepo, placeholders };
}
