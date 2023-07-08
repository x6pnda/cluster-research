import { ipcRenderer } from 'electron';

(window as any).ipcRenderer = ipcRenderer;

const openLinkInBrowser = () => {
    const allLinks = document.querySelectorAll('a.link');
    if (allLinks && allLinks.length) {
        allLinks.forEach((a) => {
            a.addEventListener('click', (e) => {
                if (e.target) {
                    e.preventDefault();
                    const link = (e.target as HTMLLinkElement).href;
                    require('electron').shell.openExternal(link);
                }
            });
        });
    }
};

setTimeout(() => {
    openLinkInBrowser();
}, 100);
