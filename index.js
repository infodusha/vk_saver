import { promises as fs } from 'fs';
import { reviseFile } from './revise.js';

const folders = await fs.readdir('archive/messages');

for (const folder of folders) {
    const path = `archive/messages/${folder}`;
    const stat = await fs.lstat(path);
    if (!stat.isDirectory()) {
        continue;
    }
    const files = await fs.readdir(path);
    for (const file of files) {
        const stat = await fs.lstat(`${path}/${file}`);
        if (!stat.isFile()) {
            continue;
        }
        await reviseFile(`${path}/${file}`, 'messages', path)
    }
}

console.log('done');
