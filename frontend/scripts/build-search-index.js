/**
 * Builds a search index from wiki markdown files.
 * Run: node scripts/build-search-index.js
 *
 * Reads all .md files from ../../wiki/ and generates
 * src/data/searchIndex.js as a JS module for Fuse.js consumption.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wikiDir = path.resolve(__dirname, '..', '..', 'wiki');
const outDir = path.resolve(__dirname, '..', 'src', 'data');
const outFile = path.join(outDir, 'searchIndex.js');

const PROJECT_NAMES = {
  'haney-cli': 'Haney CLI',
  'haney-gpt': 'Haney GPT',
  'vectorless-rag': 'Vectorless RAG',
  'traditional-rag': 'Traditional RAG',
  'ai-ecommerce': 'AI Ecommerce',
};

function extractTitle(markdown) {
  const match = markdown.match(/^# (.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function extractHeadings(markdown) {
  const headings = [];
  const regex = /^#{2,3}\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

function extractExcerpt(markdown) {
  // Get first meaningful paragraph after the title
  const lines = markdown.split('\n');
  let foundTitle = false;
  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('|')) {
      return line.trim().substring(0, 200);
    }
  }
  return '';
}

function buildIndex() {
  const entries = [];

  for (const [dirName, projectName] of Object.entries(PROJECT_NAMES)) {
    const projectDir = path.join(wikiDir, dirName);

    if (!fs.existsSync(projectDir)) {
      console.warn(`⚠ Directory not found: ${projectDir}`);
      continue;
    }

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const slug = file.replace('.md', '');
      const title = extractTitle(content);
      const headings = extractHeadings(content);
      const excerpt = extractExcerpt(content);

      // Strip title line for cleaner content indexing
      const contentWithoutTitle = content.replace(/^# .+\n\n?/, '').trim();

      entries.push({
        id: `${dirName}/${slug}`,
        project: projectName,
        projectSlug: dirName,
        slug,
        title,
        headings,
        excerpt,
        content: contentWithoutTitle,
      });
    }
  }

  // Also index the root index.md and log.md
  for (const rootFile of ['index.md', 'log.md']) {
    const filePath = path.join(wikiDir, rootFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const slug = rootFile.replace('.md', '');
      const title = extractTitle(content);
      const headings = extractHeadings(content);
      const excerpt = extractExcerpt(content);
      const contentWithoutTitle = content.replace(/^# .+\n\n?/, '').trim();

      entries.push({
        id: slug,
        project: 'Wiki',
        projectSlug: '',
        slug,
        title,
        headings,
        excerpt,
        content: contentWithoutTitle,
      });
    }
  }

  // Generate JS module
  const moduleContent = `// Auto-generated search index — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Entries: ${entries.length}

const searchIndex = ${JSON.stringify(entries, null, 2)};

export default searchIndex;
`;

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, moduleContent, 'utf-8');
  console.log(`✅ Search index built: ${outFile}`);
  console.log(`   ${entries.length} entries indexed`);
}

buildIndex();
