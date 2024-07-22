import type { videoFormat } from "ytdl-core";

interface AppConfig {
  proxy?: string;
  downloadPath?: string;
}

interface IpcEventMsg {}

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  videoFormats: videoFormat[];
  audioFormats: videoFormat[];
  watchUrl: string;
}

interface URLParseResponse extends IpcEventMsg {
  status: "success" | "error";
  errorMsg?: string | null;
  data?: {
    videoList: VideoInfo[];
  };
}

interface VideoDownloadJob {
  vid: string;
  formatItag: string;
  status: "pending" | "downloading" | "combining" | "completed" | "error";
  progress: number;
  filename: string;
  videoFormat: videoFormat;
  audioFormat?: videoFormat;
  videoInfo: VideoInfo;
}

// Map of video ID to VideoDownloadJob
interface VideoDownloadJobMap {
  [key: string]: VideoDownloadJob;
}

interface UpdateVideoDownloadProgress {
  vid: string;
  status: "pending" | "downloading" | "completed" | "error";
  progress: number;
  videoPath: string;
  audioPath?: string;
}

export {
  URLParseResponse,
  VideoInfo,
  VideoDownloadJob,
  VideoDownloadJobMap,
  IpcEventMsg,
  AppConfig,
  UpdateVideoDownloadProgress,
};
