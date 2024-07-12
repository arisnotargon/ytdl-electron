import { BrowserWindow, app, ipcMain } from "electron";
import { URLParseResponse } from "./types";
import axios from "axios";
import cheerio from "cheerio";
import { createContext, runInContext } from "vm";
import ytdl from "ytdl-core";

const mainURL = `file://${__dirname}/index.html`;
let mainWindow: BrowserWindow | null = null;

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
  // 開発者ツールも同時に開く
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

// 监听页面发送的url
ipcMain.on("parse-url", async (event, url) => {
  const response: URLParseResponse = {
    status: "success",
  };
  const urlObj = new URL(url);

  // 判断输入的url是观看页面还是列表页面
  if (urlObj.pathname === "/watch" && urlObj.searchParams.has("v")) {
    console.log("单个视频观看");
    // 获取视频的format
    // 不一定每个视频都有声音或图像,所以返回列表只给出视频的部分,然后挑选出音频质量最高的一个
    const info = await ytdl.getInfo(url);
    // console.log("info===>", info);
    const title = info.videoDetails.title;
    const thumbnails = info.videoDetails.thumbnails;
    // 缩略图取列表最后一张
    const thumbnailUrl = thumbnails[thumbnails.length - 1].url;
    const videoFormats = info.formats.filter((format) => format.hasVideo);
    response.data = {
      videoList: [
        {
          videoId: info.videoDetails.videoId,
          title,
          thumbnailUrl,
          videoFormats,
          watchUrl: `https://www.youtube.com/watch?v=${info.videoDetails.videoId}`,
        },
      ],
    };
  } else if (
    urlObj.pathname === "/playlist" &&
    urlObj.searchParams.has("list")
  ) {
    // 在这里处理播放列表页面的解析逻辑
    try {
      const sandbox = {};
      const context = createContext(sandbox);
      const pageResponse = await axios.get(url);
      const htmlContent = pageResponse.data;
      // 使用cheerio加载HTML内容
      const $ = cheerio.load(htmlContent);
      // const scriptTags: string[] = [];
      // 提取所有的<script>标签并获取其内容
      const script = $("script");
      // console.log("script===>", script);
      for (let i = 0; i < script.length; i++) {
        const scriptContent = $(script[i]).html() || "";
        // console.log(`script[${i}]===>`, script[i]);
        if (scriptContent.includes("ytInitialData")) {
          runInContext(scriptContent, context);
          const ytInitialData = context.ytInitialData;
          console.log("ytInitialData===>", ytInitialData);
          // 这里是播放列表
          const contents =
            ytInitialData?.contents?.twoColumnWatchNextResults?.playlist
              ?.playlist?.contents;
          if (contents) {
          }
        } // scriptTags.push($(script[i]).html() || "");
      }
    } catch (error) {
      console.error("Error parsing playlist:", error);
      response.status = "error";
      response.errorMsg = "Error parsing playlist";
    }
  } else {
    response.status = "error";
    response.errorMsg = "Invalid URL";
  }

  // 向渲染进程发送响应
  event.reply("url-parsed", response);
});
