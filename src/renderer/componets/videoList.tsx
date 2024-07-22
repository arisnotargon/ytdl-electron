import React, { useState } from "react";
import { VideoInfo } from "../../types";
import type { videoFormat } from "ytdl-core";
import {
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { EVENT_NAME } from "../../enum";

interface VideoListProps {
  videoList: VideoInfo[];
}

interface VidFormatIdMap {
  [key: string]: string;
}

const VideoList: React.FC<VideoListProps> = ({ videoList }) => {
  // 添加到下载队列的函数（示例，需要根据实际情况实现）
  const addToDownloadQueue = (video: VideoInfo) => {
    const electronAPI = window.electronAPI;
    const format = video.videoFormats.find(
      (format) => String(format.itag) === selectedFormat[video.videoId]
    );
    if (format === undefined) {
      return;
    }

    console.log(
      `Adding ${video.title} with format ${format} to download queue.`,
      format
    );

    electronAPI.send(EVENT_NAME.AddDlQueue, video.videoId + "/" + format.itag);

    // 实现添加到下载队列的逻辑
  };
  const [selectedFormat, setSelectedFormat] = useState({} as VidFormatIdMap);

  return (
    <Grid container spacing={2}>
      {videoList.map((video, index) => {
        if (selectedFormat[video.videoId] === undefined) {
          if (video.videoFormats[0]) {
            selectedFormat[video.videoId] = String(video.videoFormats[0].itag);
          }
        }
        return (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <h3>{video.title}</h3>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              style={{ width: "100%", height: "auto" }}
            />
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={8}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    label="Format"
                    defaultValue=""
                    placeholder="选择清晰度"
                    onChange={(e) => {
                      console.log("e===>", e);
                      const [vid, itag] = e.target.value.split("-");

                      setSelectedFormat({
                        ...selectedFormat,
                        [vid]: itag,
                      });
                    }}
                  >
                    {video.videoFormats.map((format, formatIndex) => (
                      <MenuItem
                        key={formatIndex}
                        value={`${video.videoId}-${format.itag}`}
                      >
                        {format.qualityLabel}-{format.container}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => addToDownloadQueue(video)}
                >
                  Add to Download Queue
                </Button>
              </Grid>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default VideoList;
