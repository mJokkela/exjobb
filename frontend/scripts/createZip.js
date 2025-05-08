import { createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import archiver from 'archiver';
import { join } from 'path';

const output = createWriteStream('project.zip');
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  console.log('Project has been zipped successfully!');
  console.log('Total bytes:', archive.pointer());
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add all project files except node_modules, dist, .git and .bolt
archive.glob('**/*', {
  ignore: ['node_modules/**', 'dist/**', '.git/**', '.bolt/**'],
  dot: true
});

archive.finalize();