import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import iconv from 'iconv-lite';

const IMG_PATH = '_img/';

function getFileName(href) {
    const url = new URL(href);
    return url.pathname.replace(/\//g, '_');
}

async function loadFile(href) {
    const res = await fetch(href);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const fileName = IMG_PATH + getFileName(href);
    await fs.writeFile(fileName, new Uint8Array(buffer));
    return fileName;
}

async function reviseMessages(dom) {
    const links = dom.window.document.querySelectorAll('.attachment__link');
    if (links.length === 0) {
        return;
    }

    const hrefs = [...links].map(link => link.getAttribute('href'));

    const fileNames = await Promise.all(hrefs.map(href => loadFile(href)));

    fileNames.forEach((fileName, i) => {
        const el = dom.window.document.createElement('img');
        el.setAttribute('src', fileName);
        links[i].innerHTML = '';
        links[i].appendChild(el);
    });
}

async function revisePhotos(dom) {
    const links = dom.window.document.querySelectorAll('img');
    if (links.length === 0) {
        return;
    }
    const hrefs = [...links].map(link => link.getAttribute('src'));

    const fileNames = await Promise.all(hrefs.map(href => loadFile(href)));

    fileNames.forEach((fileName, i) => {
        links[i].src = fileName;
    });

}

export async function reviseFile(filePath, mode) {
    const content = await fs.readFile(filePath);
    const dom = new JSDOM(iconv.decode(content, 'windows-1251'));

    switch (mode) {
        case 'messages':
            await reviseMessages(dom);
            break;
        case 'photos':
            await revisePhotos(dom);
            break;
        default:
            throw new Error('Unknown revise mode');
    }


    await fs.writeFile(filePath, iconv.encode(dom.serialize(), 'windows-1251'));
}
