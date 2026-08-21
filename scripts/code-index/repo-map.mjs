import Parser from "tree-sitter";
import TS from "tree-sitter-typescript";

const parser = new Parser();

function walk(node, visitFn) {
  visitFn(node);
  for (const child of node.namedChildren) {
    walk(child, visitFn);
  }
}

function extractSymbols(source, lang) {
  parser.setLanguage(lang === "tsx" ? TS.tsx : TS.typescript);
  // node-tree-sitter throws "Invalid argument" on sources over ~32KB with the
  // default buffer; size it to the source (files like AdminOperationsPage are 40KB+).
  const tree = parser.parse(source, undefined, { bufferSize: Math.max(32 * 1024, source.length + 1024) });
  const defs = [];
  const refsSet = new Set();
  const importsSet = new Set();

  // Collect top-level exported declarations
  for (const node of tree.rootNode.namedChildren) {
    if (node.type === "export_statement") {
      const declaration = node.childForFieldName("declaration");
      if (!declaration) continue;

      let kind, name;

      switch (declaration.type) {
        case "function_declaration":
          kind = "function";
          name = declaration.childForFieldName("name").text;
          break;
        case "class_declaration":
          kind = "class";
          name = declaration.childForFieldName("name").text;
          break;
        case "interface_declaration":
          kind = "interface";
          name = declaration.childForFieldName("name").text;
          break;
        case "type_alias_declaration":
          kind = "type";
          name = declaration.childForFieldName("name").text;
          break;
        case "enum_declaration":
          kind = "enum";
          name = declaration.childForFieldName("name").text;
          break;
        case "lexical_declaration":
          kind = declaration.children[0].text; // "const", "let", or "var"
          // Collect all variable declarators
          for (const declarator of declaration.namedChildren) {
            if (declarator.type === "variable_declarator") {
              const varName = declarator.childForFieldName("name").text;
              defs.push({
                name: varName,
                kind,
                line: declarator.startPosition.row + 1
              });
            }
          }
          continue;
        default:
          continue;
      }

      if (name) {
        defs.push({
          name,
          kind,
          line: declaration.startPosition.row + 1
        });
      }
    }
  }

  // Collect references
  walk(tree.rootNode, (node) => {
    if (node.type === "call_expression") {
      const func = node.childForFieldName("function");
      if (func && func.type === "identifier") {
        refsSet.add(func.text);
      } else if (func && func.type === "import") {
        // dynamic import("./x") — a call whose callee is the import keyword.
        // Its first string argument is the module specifier (lazy routes).
        const args = node.childForFieldName("arguments");
        const strArg = args && args.namedChildren.find((c) => c.type === "string");
        if (strArg) importsSet.add(strArg.text.replace(/^['"`]|['"`]$/g, ""));
      }
    } else if (node.type === "jsx_opening_element" || node.type === "jsx_self_closing_element") {
      const nameNode = node.childForFieldName("name");
      if (nameNode && nameNode.type === "identifier") {
        refsSet.add(nameNode.text);
      }
    } else if (node.type === "import_statement" || node.type === "export_statement") {
      // module specifier of an import or a re-export (`export … from "./x"`);
      // the source field is a string node — strip its quotes.
      const source = node.childForFieldName("source");
      if (source) importsSet.add(source.text.replace(/^['"`]|['"`]$/g, ""));
    }
  });

  return {
    defs,
    refs: Array.from(refsSet),
    imports: Array.from(importsSet)
  };
}

function rankFiles(files) {
  // Build a map of def name -> file
  const defMap = new Map();
  for (const file of files) {
    for (const def of file.defs) {
      defMap.set(def.name, file);
    }
  }

  // Build adjacency list: file -> [files it points to]
  const graph = new Map();
  for (const file of files) {
    graph.set(file, new Set());
  }

  // Add edges
  for (const file of files) {
    for (const ref of file.refs) {
      const targetFile = defMap.get(ref);
      if (targetFile && targetFile !== file) {
        graph.get(file).add(targetFile);
      }
    }
  }

  // PageRank
  const N = files.length;
  const damping = 0.85;
  const teleport = (1 - damping) / N;
  let ranks = new Map();
  for (const file of files) {
    ranks.set(file, 1.0 / N);
  }

  // Convert graph to array for iteration
  const fileArray = Array.from(files);

  for (let iter = 0; iter < 30; iter++) {
    const newRanks = new Map();
    let danglingSum = 0;

    // First, compute dangling node contribution
    for (const file of fileArray) {
      const outEdges = graph.get(file);
      if (!outEdges || outEdges.size === 0) {
        danglingSum += ranks.get(file);
      }
    }

    // Distribute dangling rank uniformly
    const danglingContribution = damping * danglingSum / N;

    for (const file of fileArray) {
      let incoming = 0;

      // Sum contributions from files that point to this file
      for (const otherFile of fileArray) {
        const outEdges = graph.get(otherFile);
        if (outEdges && outEdges.size > 0 && outEdges.has(file)) {
          incoming += damping * ranks.get(otherFile) / outEdges.size;
        }
      }

      // Add teleport + dangling contribution
      newRanks.set(file, teleport + damping * incoming + danglingContribution);
    }

    ranks = newRanks;
  }

  // Attach scores and sort
  const result = files.map(file => ({
    ...file,
    score: ranks.get(file)
  }));

  // Sort by score descending, then path ascending for stability
  result.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.path.localeCompare(b.path);
  });

  return result;
}

function buildRepoMap(ranked, { budgetChars }) {
  const lines = [];
  lines.push("<!-- generated by code-index (scripts/code-index/repo-map-cli.mjs); do not hand-edit -->");
  // No wall-clock stamp here: it would make the committed CODE_MAP.md churn on every
  // regeneration. The map changes only when the ranked symbols do, which is the point.

  let totalChars = lines.join("\n").length + 1; // +1 for newline after header

  let droppedCount = 0;
  let includedCount = 0;

  for (const file of ranked) {
    const fileHeader = `### ${file.path}`;
    let fileLines = [fileHeader];

    for (const def of file.defs) {
      const line = `- ${def.name} (${def.kind})`;
      fileLines.push(line);
    }

    const fileContent = fileLines.join("\n");
    const fileLength = fileContent.length + 1; // +1 for newline

    // If adding this file would exceed budget and we've already included at least one file
    if (includedCount > 0 && totalChars + fileLength > budgetChars) {
      droppedCount++;
      continue;
    }

    lines.push(fileContent);
    totalChars += fileLength;
    includedCount++;
  }

  if (droppedCount > 0) {
    lines.push(`_… ${droppedCount} more files omitted (budget)._`);
  }

  return lines.join("\n");
}

export { extractSymbols, rankFiles, buildRepoMap };
