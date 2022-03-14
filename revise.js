import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import iconv from 'iconv-lite';

const IMG_DIR = '_img';
const ATTACHMENT_PHOTO = 'Фотография';

function getFileName(href) {
    const url = new URL(href);
    return url.pathname.replace(/\//g, '_');
}

async function loadFile(href, path) {
    try {
        await fs.mkdir(`${path}/${IMG_DIR}`);
    } catch {}
    const res = await fetch(href);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const fileName = getFileName(href);
    const filePath = `${path}/${IMG_DIR}/${getFileName(href)}`;
    await fs.writeFile(filePath, new Uint8Array(buffer));
    return fileName;
}

async function reviseMessages(dom, path) {
    const links = dom.window.document.querySelectorAll('.attachment__link');
    if (links.length === 0) {
        return;
    }

    const hrefs = [...links]
        .filter(link => link.parentNode.querySelector('.attachment__description').textContent === ATTACHMENT_PHOTO)
        .map(link => link.getAttribute('href'));

    if (hrefs.length === 0) {
        return;
    }

    const fileNames = await Promise.all(hrefs.map(href => loadFile(href, path)));

    fileNames.forEach((fileName, i) => {
        const el = dom.window.document.createElement('img');
        el.setAttribute('src', `${IMG_DIR}/${fileName}`);
        links[i].innerHTML = '';
        links[i].appendChild(el);
    });
}

async function revisePhotos(dom, path) {
    const links = dom.window.document.querySelectorAll('img');
    if (links.length === 0) {
        return;
    }
    const hrefs = [...links].map(link => link.getAttribute('src'));

    const fileNames = await Promise.all(hrefs.map(href => loadFile(href, path)));

    fileNames.forEach((fileName, i) => {
        links[i].src = `${IMG_DIR}/${fileName}`;
    });
}

export async function reviseFile(filePath, mode, path) {
    const content = await fs.readFile(filePath);
    const dom = new JSDOM(iconv.decode(content, 'windows-1251'));

    switch (mode) {
        case 'messages':
            await reviseMessages(dom, path);
            break;
        case 'photos':
            await revisePhotos(dom, path);
            break;
        default:
            throw new Error('Unknown revise mode');
    }

    await fs.writeFile(filePath, iconv.encode(dom.serialize(), 'windows-1251'));
}
