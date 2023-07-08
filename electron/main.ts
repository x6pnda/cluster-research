import 'babel-polyfill';
import path from 'path';
import v8 from 'v8';
import dotenv from 'dotenv';
import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from 'electron';
import cluster from 'cluster';
import { initDirWorker } from './test/test';

const remoteMain = require('@electron/remote/main');

dotenv.config();

// NOTE: Platform stuff
const koiProtocol = 'caspian';
const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const iconName = isMac ? 'logo512.icns' : isWin ? 'logo512.ico' : 'logo512.png';

// NOTE: Init global variables
global.isMac = isMac;
global.isWindows = isWin;
global.appPath = app.getPath('userData');
global.isPackaged = app.isPackaged;
global.filterSites = app.isPackaged;

if (!app.requestSingleInstanceLock()) {
    app.quit();
}

let installExtension: (arg0: any) => Promise<any>, REACT_DEVELOPER_TOOLS: any, REDUX_DEVTOOLS: any;

installExtension = require('electron-devtools-installer').default;
REACT_DEVELOPER_TOOLS = require('electron-devtools-installer').REACT_DEVELOPER_TOOLS;
REDUX_DEVTOOLS = require('electron-devtools-installer').REDUX_DEVTOOLS;

v8.setFlagsFromString('--no-lazy');

let mainWindow: BrowserWindow;
function createWindow() {
    remoteMain.initialize();
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1280,
        minHeight: 720,
        resizable: true,
        transparent: true,
        show: false,
        frame: false,
        title: `Cluster Research ${app.getVersion()}`,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            zoomFactor: 1,
            nodeIntegrationInWorker: true,
            devTools: true,
            preload: __dirname + '/preload.js',
        },
        icon: !app.isPackaged ? path.join(process.cwd(), `public/${iconName}`) : path.join(__dirname, `../build/${iconName}`),
    });

    cluster.setupPrimary({
        exec: __dirname + '/TestWorker.js',
        args: [''],
        silent: false,
    });
    cluster.fork({ UV_THREADPOOL_SIZE: 1024 });
    cluster.on('exit', () => app.quit());
    initDirWorker();

    // NOTE: Init listeners
    !app.isPackaged ? mainWindow.loadURL('http://localhost:3000') : mainWindow.loadFile(`${__dirname}/../build/index.html`);

    // mainWindow.webContents.on('devtools-opened', () => {
    //     mainWindow.webContents.closeDevTools();
    // });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.closeDevTools();
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }

            mainWindow.focus();
        }
    });

    if ((process.defaultApp && process.argv.length >= 2) || (app.isPackaged && process.argv.length === 1)) {
        app.setAsDefaultProtocolClient(koiProtocol, process.execPath, [path.resolve(process.argv[1] ?? process.argv[0])]);
    }

    remoteMain.enable(mainWindow.webContents);
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.whenReady().then(() => {
    installExtension(REDUX_DEVTOOLS)
        .then((name: any) => console.info(`INFO: Added Extension:  ${name}`))
        .catch((err: any) => console.error('ERR: An error occurred: ', err));
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((name: any) => console.info(`INFO: Added Extension:  ${name}`))
        .catch((err: any) => console.error('ERR: An error occurred: ', err));
});

Menu.setApplicationMenu(ElectronWindowMenuTemplate(app.getName(), isMac));

export function ElectronWindowMenuTemplate(appName: string, isMac: boolean): Menu {
    const template: MenuItemConstructorOptions[] = [];

    if (isMac) {
        template.push({
            label: appName,
            submenu: [{ role: 'about' }, { role: 'hide' }, { role: 'quit' }],
        });
    }

    template.push({
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }, { type: 'separator' }]
                : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
        ] as MenuItemConstructorOptions[],
    });

    template.push({
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'zoom' }],
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
    });

    return Menu.buildFromTemplate(template);
}
