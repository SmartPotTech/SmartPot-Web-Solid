import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  console.log('Directorio dist/ no encontrado, omitiendo pre-compresión.');
  process.exit(0);
}

const compressExtensions = new Set(['.js', '.css', '.html', '.svg', '.json', '.webmanifest']);

function compressDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      compressDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (compressExtensions.has(ext)) {
        const fileContent = fs.readFileSync(fullPath);
        const gzipped = zlib.gzipSync(fileContent, { level: 9 });
        fs.writeFileSync(`${fullPath}.gz`, gzipped);
      }
    }
  }
}

compressDirectory(distDir);
console.log('Pre-compresión estática (gzip nivel 9) completada con éxito.');
