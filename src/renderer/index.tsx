import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Paper, Typography, TextField, Button } from "@mui/material";
import { Theme, makeStyles, styled } from "@mui/material/styles";
import { URLParseResponse, VideoInfo } from "../types";
import VideoList from "./componets/videoList";

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: unknown) => void;
      on: (channel: string, func: (response: URLParseResponse) => void) => void;
    };
  }
}
const electronAPI = window.electronAPI;

// 適用するCSSクラスの定義
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));
const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [videoList, setVideoList] = useState([] as VideoInfo[]);

  const handleParse = () => {
    // 这里是解析逻辑，暂时为空
    console.log("url", url);
    electronAPI.send("parse-url", url);
  };
  // 组册一个监听事件，用于接收主进程的响应
  electronAPI.on("url-parsed", (response) => {
    console.log("Response received:", response);
    if (response.status === "success") {
      if (response.data?.videoList) {
        setVideoList(response.data.videoList);
      }
    }
  });

  return (
    <StyledPaper>
      <Typography variant="h5" component="h3">
        YouTube Video Downloader
      </Typography>
      <StyledTextField
        label="YouTube URL"
        variant="outlined"
        fullWidth
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleParse}>
        Parse
      </Button>

      <div>
        <VideoList videoList={videoList}></VideoList>
      </div>
    </StyledPaper>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
