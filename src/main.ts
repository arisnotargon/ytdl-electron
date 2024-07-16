import { BrowserWindow, app, ipcMain } from "electron";
import { URLParseResponse, VideoInfo } from "./types";
import axios from "axios";
import cheerio from "cheerio";
import { createContext, runInContext } from "vm";
import ytdl from "ytdl-core";
import fs from "fs";
import { TaskRunner } from "./lib/utils";

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
    // https://www.youtube.com/playlist?list=PLrmmHXb-JMJDR0WctpU0VYYf2w0UnL9Bi
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
      let ytInitialDataJs = "";
      for (let i = 0; i < script.length; i++) {
        const scriptContent = $(script[i]).html() || "";
        // console.log(`script[${i}]===>`, script[i]);
        if (scriptContent.includes("ytInitialData")) {
          let ytInitialDataCode = String(script).match(
            /var ytInitialData = ({.*?});/
          );
          if (ytInitialDataCode) {
            ytInitialDataJs = ytInitialDataCode[1];
            ytInitialDataJs = `s=${ytInitialDataJs};s;`;
            fs.writeFileSync(`ytInitialData${i}.js`, ytInitialDataJs);
            // break;
          }
        }
      }
      if (!ytInitialDataJs) {
        throw new Error("Could not find ytInitialData");
      }

      const res = runInContext(ytInitialDataJs, context);
      // // // 这里是播放列表
      // 播放列表的处理可能会有多种情况,不一定能覆盖完全,慢慢补充吧

      let videoIds = [] as string[];
      // tabs的情况
      if (
        typeof res?.contents?.twoColumnBrowseResultsRenderer?.tabs !==
        "undefined"
      ) {
        const tabs = res?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        videoIds = searchByTabs(tabs);
        console.log("videoIds===>", videoIds);
      } else {
        console.error("Could not find ytInitialData.tabs");
        response.status = "error";
        response.errorMsg = "Could not find ytInitialData.tabs";
        // 非tabs的情况 后面慢慢补充
      }
      const taskRunner = new TaskRunner(5);
      const videoList: VideoInfo[] = [];
      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        taskRunner.add(async () => {
          const info = await ytdl.getInfo(videoId);
          const title = info.videoDetails.title;
          const thumbnails = info.videoDetails.thumbnails;
          // 缩略图取列表最后一张
          const thumbnailUrl = thumbnails[thumbnails.length - 1].url;
          const videoFormats = info.formats.filter((format) => format.hasVideo);
          videoList[i] = {
            videoId,
            title,
            thumbnailUrl,
            videoFormats,
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
          };
        });
      }

      const errList = await taskRunner.run();
      if (errList.length > 0) {
        console.error("Error parsing playlist:", errList);
        response.status = "error";
        response.errorMsg = "Error parsing playlist";
      }
      response.data = {
        videoList,
      };
      // 获取所有videoIds的信息,限制并发数
    } catch (error) {
      console.error("Error parsing playlist:", error);
      response.status = "error";
      response.errorMsg = "Error parsing playlist";
    }
    // 获取所有videoIds的信息,限制并发数
  } else {
    response.status = "error";
    response.errorMsg = "Invalid URL";
  }

  // 向渲染进程发送响应
  event.reply("url-parsed", response);
});

function searchByTabs(tabs: any): string[] {
  let videoIds: string[] = [];
  {
    for (let tabsi = 0; tabsi < tabs.length; tabsi++) {
      const tab = tabs[tabsi];
      if (typeof tab?.tabRenderer?.content != "undefined") {
        const tabContents =
          tab?.tabRenderer?.content?.sectionListRenderer?.contents;

        for (
          let tabContentsi = 0;
          tabContentsi < tabContents.length;
          tabContentsi++
        ) {
          const tabContent = tabContents[tabContentsi];

          if (typeof tabContent?.itemSectionRenderer?.contents != "undefined") {
            const itemSectionRendererContents =
              tabContent?.itemSectionRenderer?.contents;
            for (
              let itemSectionRendererContentsi = 0;
              itemSectionRendererContentsi < itemSectionRendererContents.length;
              itemSectionRendererContentsi++
            ) {
              const itemSectionRendererContent =
                itemSectionRendererContents[itemSectionRendererContentsi];

              if (
                typeof itemSectionRendererContent.playlistVideoListRenderer
                  .contents != "undefined"
              ) {
                const playlistVideoListRendererContents =
                  itemSectionRendererContent.playlistVideoListRenderer.contents;
                for (
                  let playlistVideoListRendererContentsi = 0;
                  playlistVideoListRendererContentsi <
                  playlistVideoListRendererContents.length;
                  playlistVideoListRendererContentsi++
                ) {
                  const playlistVideoListRendererContent =
                    playlistVideoListRendererContents[
                      playlistVideoListRendererContentsi
                    ];

                  if (
                    typeof playlistVideoListRendererContent.playlistVideoRenderer !=
                    "undefined"
                  ) {
                    const playlistVideoRenderer =
                      playlistVideoListRendererContent.playlistVideoRenderer;
                    if (typeof playlistVideoRenderer?.videoId === "string") {
                      videoIds.push(playlistVideoRenderer.videoId);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return videoIds;
}
