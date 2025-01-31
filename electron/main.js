import { app, ipcMain, globalShortcut, dialog } from 'electron';
import { createWindow, createTray, startApiServer, stopApiServer, registerShortcut, playStartupSound, createLyricsWindow } from './appServices.js';
import Store from 'electron-store';
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const { initialize, enable } = require('@electron/remote/main');

let mainWindow = null;
const store = new Store();

app.on('ready', () => {
    // 初始化 @electron/remote
    // initialize();
    
    startApiServer().then(() => {
        try {
            mainWindow = createWindow();
            // enable(mainWindow.webContents);
            createTray(mainWindow);
            playStartupSound();
            registerShortcut();
        } catch (error) {
            console.log('初始化应用时发生错误:', error);
            createTray(null);
            dialog.showMessageBox({
                type: 'error',
                title: '错误',
                message: '初始化应用时发生错误。',
                buttons: ['确定']
            }).then(result => {
                if (result.response === 0) {
                    app.isQuitting = true;
                    app.quit();
                }
            });
        }
    }).catch((error) => {
        console.log('API 服务启动失败:', error);
        createTray(null);
        dialog.showMessageBox({
            type: 'error',
            title: '错误',
            message: 'API 服务启动失败，请检查！',
            buttons: ['确定']
        }).then(result => {
            if (result.response === 0) {
                app.isQuitting = true;
                app.quit();
            }
            return;
        });
    });
});

// 即将退出
app.on('before-quit', () => {
    if (mainWindow) {
        const windowBounds = mainWindow.getBounds();
        store.set('windowState', windowBounds);
    }
    stopApiServer();
});
// 关闭所有窗口
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.isQuitting = true;
        app.quit(); // 非 macOS 系统上关闭所有窗口后退出应用
    }
});
// 图标被点击
app.on('activate', () => {
    if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
    } else if (!mainWindow) {
        mainWindow = createWindow();
    }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('Unhandled Exception:', error);
});

// 监听渲染进程发送的免责声明结果
ipcMain.on('disclaimer-response', (event, accepted) => {
    if (accepted) {
        store.set('disclaimerAccepted', true);
    } else {
        app.quit();
    }
});

ipcMain.on('window-control', (event, action) => {
    switch (action) {
        case 'close':
            mainWindow.close();
            break;
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
            break;
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
ipcMain.on('save-settings', (event, settings) => {
    store.set('settings', settings);
});
ipcMain.on('custom-shortcut', (event) => {
    registerShortcut();
});

ipcMain.on('update-current-time', (event, time) => {
    const lyricsWindow = mainWindow.lyricsWindow;
    if (lyricsWindow) {
        lyricsWindow.webContents.send('update-current-time', time);
    }
});

ipcMain.on('lyrics-data', (event, lyricsData) => {
    const lyricsWindow = mainWindow.lyricsWindow;
    if (lyricsWindow) {
        lyricsWindow.webContents.send('lyrics-data', lyricsData);
    }
});

ipcMain.on('lyrics-font-size', (event, fontSize) => {
    const lyricsWindow = mainWindow.lyricsWindow;
    if (lyricsWindow) {
        lyricsWindow.webContents.send('lyrics-font-size', fontSize);
    }
});

// 监听桌面歌词操作
ipcMain.on('desktop-lyrics-action', (event, action) => {
    switch (action) {
        case 'previous-song':
            mainWindow.webContents.send('play-previous-track');
            break;
        case 'next-song':
            mainWindow.webContents.send('play-next-track');
            break;
        case 'toggle-play':
            mainWindow.webContents.send('toggle-play-pause');
            break;
        case 'close-lyrics':
            const lyricsWindow = mainWindow.lyricsWindow;
            if (lyricsWindow) {
                lyricsWindow.close();
            }
            break;
        case 'display-lyrics':
            createLyricsWindow();
            break;
    }
});

ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    const lyricsWindow = mainWindow.lyricsWindow;
    if (lyricsWindow) {
        lyricsWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
});