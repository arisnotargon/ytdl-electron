import { BrowserWindow, app, ipcMain } from "electron";
import { VideoDownloadJobMap, AppConfig } from "./types";
import axios from "axios";
import cheerio from "cheerio";
import { createContext, runInContext } from "vm";
import ytdl, { videoFormat } from "ytdl-core";
import fs from "fs";
import { parseUrl, getSingleVideoInfo } from "./lib/utils";
import { EVENT_NAME } from "./enum";

const mainURL = `file://${__dirname}/index.html`;
let mainWindow: BrowserWindow | null = null;

const configFilePath = `${__dirname}/config.json`;
// 初始化应用配置
console.log("out configFilePath==>", configFilePath);
let appConfig = {} as AppConfig;
try {
  // 检查 config.json 文件是否存在
  if (fs.existsSync(configFilePath)) {
    // 读取并解析 config.json 文件
    const configFileContent = fs.readFileSync(configFilePath, "utf8");
    appConfig = JSON.parse(configFileContent);
  } else {
    throw new Error("File does not exist");
  }
} catch (error) {
  // 解析失败或文件不存在，创建一个新的 config.json 文件
  console.error(
    "Failed to load or parse config.json, creating a new one:",
    error
  );
  appConfig = {
    downloadPath: `${__dirname}/downloads`,
  };
  console.log("configFilePath==>", configFilePath);
  fs.writeFileSync(configFilePath, JSON.stringify(appConfig, null, 2));
}

// 全局的下载任务Map
const videoDownloadJobMap: VideoDownloadJobMap = {};

// アプリ起動後にWindowを立ち上げる
console.log("preload.js :", `${__dirname}/preload.js`);
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: `${__dirname}/preload.js`,
    },
  });

  mainWindow.loadURL(mainURL);
  // 開発者ツールも同時に開く 发布前需要注释掉
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// アプリの起動と終了
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  app.quit();
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// interface URLParseResponse {
//   status: "success" | "error";
//   errorMsg: string | null;
// }
// 周杰伦 https://www.youtube.com/watch?v=6lZLArh60YU
// 《道詭異仙！》 https://www.youtube.com/playlist?list=PLrmmHXb-JMJDR0WctpU0VYYf2w0UnL9Bi

// 监听页面发送的url
ipcMain.on(EVENT_NAME.ParseUrl, async (event, url) => {
  const urlObj = new URL(url);

  const response = await parseUrl(urlObj);

  // 向渲染进程发送响应
  event.reply(EVENT_NAME.UrlParsedResp, response);
});

// 收到添加下载队列的事件
ipcMain.on(EVENT_NAME.AddDlQueue, async (event, videoIdAndItag: string) => {
  console.log("Adding to download queue:", videoIdAndItag);
  // 实现添加到下载队列的逻辑
  const [vid, itag] = videoIdAndItag.split("/");
  console.log({ vid, itag });
  const videoInfo = await getSingleVideoInfo(vid);
  let format = videoInfo.videoFormats.find((f) => String(f.itag) === itag);
  let audioFormat: ytdl.videoFormat | undefined = undefined;
  format = format ? format : ({} as videoFormat);
  if (!format.hasAudio) {
    videoInfo.videoFormats.forEach((vf) => {
      if (vf.hasAudio) {
        console.log("vf===>", vf);
        if (audioFormat?.audioSampleRate == undefined) {
          audioFormat = vf;
        } else if (
          vf.audioSampleRate &&
          parseInt(vf.audioSampleRate) > parseInt(audioFormat.audioSampleRate)
        ) {
          audioFormat = vf;
        }
      }
    });
  }
  console.log("audioFormat===>", audioFormat);
  videoDownloadJobMap[vid] = {
    vid,
    formatItag: itag,
    status: "pending",
    progress: 0,
    filename: `${appConfig.downloadPath}/${videoInfo.title}.${format?.container}`,
    videoFormat: format ? format : ({} as videoFormat),
    audioFormat: audioFormat,
    videoInfo: videoInfo,
  };

  // 开始下载

  // 先测试一下sendDownloadJobMapUpdate
  sendDownloadJobMapUpdate();
});

function sendDownloadJobMapUpdate() {
  console.log("Sending download job map update", videoDownloadJobMap);
  mainWindow?.webContents.send(
    EVENT_NAME.DownloadJobMapUpdate,
    videoDownloadJobMap
  );
}
