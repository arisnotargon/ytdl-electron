import type { videoFormat } from "ytdl-core";

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  videoFormats: videoFormat[];
  watchUrl: string;
}

interface URLParseResponse {
  status: "success" | "error";
  errorMsg?: string | null;
  data?: {
    videoList: VideoInfo[];
  };
}

export { URLParseResponse, VideoInfo };
