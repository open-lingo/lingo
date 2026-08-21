import Parser from "tree-sitter";
import TS from "tree-sitter-typescript";

function getSymbolName(node) {
  if (!node) return null;
  
  const declaration = node.type === 'export_statement' 
    ? node.childForFieldName("declaration") 
    : node;
  
  if (!declaration) return null;
  
  const nameNode = declaration.childForFieldName("name");
  if (nameNode) return nameNode.text;
  
  // For lexical_declaration (const/let), get the first variable_declarator's name
  if (declaration.type === 'lexical_declaration') {
    const declarator = declaration.namedChildren.find(c => c.type === 'variable_declarator');
    if (declarator) {
      const declaratorName = declarator.childForFieldName("name");
      if (declaratorName) return declaratorName.text;
    }
  }
  
  return null;
}

function isNamedDeclaration(node) {
  const namedDeclarations = [
    'function_declaration',
    'class_declaration',
    'interface_declaration',
    'type_alias_declaration',
    'enum_declaration',
    'lexical_declaration'
  ];
  return namedDeclarations.includes(node.type);
}

function getLines(text) {
  return text.split('\n');
}

function getLinesForRange(source, startLine, endLine) {
  const lines = getLines(source);
  return lines.slice(startLine - 1, endLine).join('\n');
}

function splitByLines(text, maxChars) {
  const lines = getLines(text);
  const chunks = [];
  let currentLines = [];
  let currentLength = 0;
  
  for (const line of lines) {
    const lineLength = line.length;
    if (currentLines.length > 0 && currentLength + lineLength + 1 > maxChars) {
      // Add current chunk
      chunks.push(currentLines.join('\n'));
      currentLines = [line];
      currentLength = lineLength;
    } else {
      currentLines.push(line);
      currentLength += (currentLines.length > 1 ? 1 : 0) + lineLength;
    }
  }
  
  if (currentLines.length > 0) {
    chunks.push(currentLines.join('\n'));
  }
  
  return chunks;
}

export function chunkSource(source, lang, { maxChars = 1200 } = {}) {
  const parser = new Parser();
  parser.setLanguage(lang === "tsx" ? TS.tsx : TS.typescript);
  const tree = parser.parse(source, undefined, { bufferSize: Math.max(32*1024, source.length + 1024) });
  
  const program = tree.rootNode;
  const candidates = [];
  
  // Get top-level named children
  for (const node of program.namedChildren) {
    if (node.type === 'module_item') {
      // For module_item, we need to get the actual statement
      if (node.namedChildren.length > 0) {
        for (const child of node.namedChildren) {
          candidates.push(child);
        }
      } else {
        candidates.push(node);
      }
    } else {
      candidates.push(node);
    }
  }
  
  // Process candidates to get symbol info and text
  const candidateChunks = candidates.map(node => {
    const startLine = node.startPosition.row + 1;
    const endLine = node.endPosition.row + 1;
    const text = getLinesForRange(source, startLine, endLine);
    // getSymbolName already unwraps export_statement and returns null for
    // non-declarations, so call it directly — gating on isNamedDeclaration(node)
    // wrongly nulls exported decls (top-level node is export_statement).
    const symbol = getSymbolName(node);
    
    return {
      text,
      startLine,
      endLine,
      symbol,
      length: text.length
    };
  });
  
  // Merge consecutive candidates if under maxChars
  const merged = [];
  let currentChunk = null;
  
  for (const candidate of candidateChunks) {
    if (!currentChunk) {
      currentChunk = { ...candidate };
      continue;
    }
    
    const combinedText = currentChunk.text + '\n' + candidate.text;
    if (combinedText.length <= maxChars) {
      currentChunk.text = combinedText;
      currentChunk.endLine = candidate.endLine;
      currentChunk.length = combinedText.length;
    } else {
      merged.push(currentChunk);
      currentChunk = { ...candidate };
    }
  }
  
  if (currentChunk) {
    merged.push(currentChunk);
  }
  
  // Split oversized chunks
  const finalChunks = [];
  
  for (const chunk of merged) {
    if (chunk.length <= maxChars) {
      finalChunks.push({
        text: chunk.text,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        symbol: chunk.symbol
      });
    } else {
      // Split the chunk by lines
      const lines = getLines(chunk.text);
      let currentLines = [];
      let currentLength = 0;
      let chunkStartLine = chunk.startLine;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLength = line.length;
        
        if (currentLines.length > 0 && currentLength + lineLength + 1 > maxChars) {
          // Create a chunk with current lines
          const chunkText = currentLines.join('\n');
          finalChunks.push({
            text: chunkText,
            startLine: chunkStartLine,
            endLine: chunkStartLine + currentLines.length - 1,
            symbol: i === 0 ? chunk.symbol : null
          });
          currentLines = [line];
          currentLength = lineLength;
          chunkStartLine += currentLines.length;
        } else {
          currentLines.push(line);
          currentLength += (currentLines.length > 1 ? 1 : 0) + lineLength;
        }
      }
      
      // Add remaining lines
      if (currentLines.length > 0) {
        finalChunks.push({
          text: currentLines.join('\n'),
          startLine: chunkStartLine,
          endLine: chunkStartLine + currentLines.length - 1,
          symbol: null
        });
      }
    }
  }
  
  return finalChunks;
}

export function chunkMarkdown(source, { maxChars = 1200 } = {}) {
  const lines = getLines(source);
  const chunks = [];
  let currentSection = [];
  let sectionStartLine = 1;
  const headingRegex = /^#{1,6}\s/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    if (headingRegex.test(line)) {
      // Save current section if non-empty
      if (currentSection.length > 0) {
        const sectionText = currentSection.join('\n');
        if (sectionText.length <= maxChars) {
          chunks.push({
            text: sectionText,
            startLine: sectionStartLine,
            endLine: lineNum - 1
          });
        } else {
          // Split by lines
          const splitSections = splitByLines(sectionText, maxChars);
          let currentStart = sectionStartLine;
          for (let j = 0; j < splitSections.length; j++) {
            const splitText = splitSections[j];
            const splitLines = getLines(splitText);
            chunks.push({
              text: splitText,
              startLine: currentStart,
              endLine: currentStart + splitLines.length - 1
            });
            currentStart += splitLines.length;
          }
        }
      }
      
      // Start new section with heading
      currentSection = [line];
      sectionStartLine = lineNum;
    } else {
      currentSection.push(line);
    }
  }
  
  // Add last section if non-empty
  if (currentSection.length > 0) {
    const sectionText = currentSection.join('\n');
    if (sectionText.length <= maxChars) {
      chunks.push({
        text: sectionText,
        startLine: sectionStartLine,
        endLine: lines.length
      });
    } else {
      // Split by lines
      const splitSections = splitByLines(sectionText, maxChars);
      let currentStart = sectionStartLine;
      for (let j = 0; j < splitSections.length; j++) {
        const splitText = splitSections[j];
        const splitLines = getLines(splitText);
        chunks.push({
          text: splitText,
          startLine: currentStart,
          endLine: currentStart + splitLines.length - 1
        });
        currentStart += splitLines.length;
      }
    }
  }
  
  return chunks;
}
