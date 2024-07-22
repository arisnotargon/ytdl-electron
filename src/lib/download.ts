import { EVENT_NAME } from "../enum";
import { VideoDownloadJob, UpdateVideoDownloadProgress } from "../types";
import fs from "fs";
import ytdl from "ytdl-core";
import { Readable } from "stream";

const videoDownloadJobs: VideoDownloadJob[] = [];

process.on(EVENT_NAME.ChildProcessAddDl, (job: VideoDownloadJob) => {});

class Downloader {
  todoVideoDownloadJobs: VideoDownloadJob[] = [];
  runningJobs: Promise<void>[] = [];
  limit: number;
  running = false;
  constructor(limit: number) {
    this.limit = limit;
  }

  add(...jobs: VideoDownloadJob[]) {
    this.todoVideoDownloadJobs.push(...jobs);
    if (!this.running) {
      this.start();
    }
  }

  async download(job: VideoDownloadJob) {
    const vInfo = await ytdl.getInfo(job.vid);
    const videoStream = ytdl.downloadFromInfo(vInfo, {
      format: job.videoFormat,
    });
    let downloaded = 0;
    let totalSize = job.videoFormat.contentLength
      ? parseInt(job.videoFormat.contentLength, 10)
      : 0;
    let videoOutPath = `${__dirname}/cache/${job.filename}.${job.videoFormat.container}`;

    const dlProgress: UpdateVideoDownloadProgress = {
      vid: job.vid,
      status: "downloading",
      progress: 0,
      videoPath: videoOutPath,
    };

    // 准备视频下载
    const videoPromise = this.downloadStream(
      vInfo,
      job.videoFormat,
      videoOutPath,
      (size) => {
        totalSize += size;
      },
      (size) => {
        downloaded += size;
        const percentage = ((downloaded / totalSize) * 100).toFixed(2);
        console.log(`Overall progress: ${percentage}%`);
        dlProgress.progress = parseFloat(percentage);
        // TODO 发送更新下载进度消息
      }
    );

    let audioOutPath: string | undefined = undefined;
    let audioPromise: Promise<void> | undefined = undefined;
    if (job.audioFormat) {
      audioOutPath = `${__dirname}/cache/${job.filename}_audio_only.${job.audioFormat.container}`;
      audioPromise = this.downloadStream(
        vInfo,
        job.audioFormat,
        audioOutPath,
        (size) => {
          totalSize += size;
        },
        (size) => {
          downloaded += size;
          const percentage = ((downloaded / totalSize) * 100).toFixed(2);
          console.log(`Overall progress: ${percentage}%`);
          // TODO 发送更新下载进度消息
        }
      );
    }

    // 等待下载完成,只等待不为空的promise
    await Promise.all([videoPromise, audioPromise].filter(Boolean));

    // 如果需要分别下载视频和音频，下载后需要在此处合并
    if (job.audioFormat) {
      // TODO 发送更新下载进度消息 到合并中
    } else {
      // TODO 发送更新下载进度消息 到完成
    }
  }

  async downloadStream(
    vInfo: ytdl.videoInfo,
    format: ytdl.videoFormat,
    outputPath: string,
    updateTotalSize: (size: number) => void,
    updateDownloaded: (size: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(vInfo, { format: format });
      const writer = fs.createWriteStream(outputPath);

      stream.on("response", (res) => {
        const size = parseInt(res.headers["content-length"], 10);
        updateTotalSize(size);
      });

      stream.on("data", (chunk) => {
        updateDownloaded(chunk.length);
      });

      stream.pipe(writer);

      writer.on("finish", () => {
        console.log(`${outputPath} download completed.`);
        resolve();
      });

      writer.on("error", (err) => {
        console.error(`Error downloading ${outputPath}:`, err);
        reject(err);
      });
    });
  }

  start() {
    this.running = true;
    while (this.todoVideoDownloadJobs.length > 0) {
      if (videoDownloadJobs.length < this.limit) {
        const job = this.todoVideoDownloadJobs.shift()!;
        videoDownloadJobs.push(job);
        // process.emit(EVENT_NAME.ChildProcessAddDl, job);
      }
    }
  }
}
