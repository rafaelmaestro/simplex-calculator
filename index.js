const { app, BrowserWindow } = require('electron')


let mainWindow


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        resizable: false
    })

    mainWindow.loadFile('index.html')
});