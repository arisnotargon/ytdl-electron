import { BrowserWindow, app } from 'electron';

const mainURL = `file://${__dirname}/index.html`;
let mainWindow: BrowserWindow | null = null;

// アプリ起動後にWindowを立ち上げる
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 450,
    webPreferences: { nodeIntegration: true }
  });

  mainWindow.loadURL(mainURL);
  // 開発者ツールも同時に開く
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// アプリの起動と終了
app.on('ready', createWindow);
app.on('window-all-closed', () => {
  app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
