import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Grid,
  TableCell,
} from "@mui/material";
import { Theme, makeStyles, styled } from "@mui/material/styles";
import {
  URLParseResponse,
  VideoInfo,
  IpcEventMsg,
  VideoDownloadJobMap,
} from "../types";
import VideoList from "./componets/videoList";
import { EVENT_NAME } from "../enum";
import DownloadTasksDialog from "./componets/dlTasksDialog";

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: unknown) => void;
      on: (channel: string, func: (response: IpcEventMsg) => void) => void;
      removeListener: (
        channel: string,
        func: (response: IpcEventMsg) => void
      ) => void;
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
const StyledGrid = styled(Grid)({
  // 应用样式以确保文本不会超出容器宽度
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [videoList, setVideoList] = useState([] as VideoInfo[]);
  const [downloadJobMap, setDownloadJobMap] = useState(
    {} as VideoDownloadJobMap
  );
  const [openJobList, setOpenJobList] = useState(false);
  const handleOpenJobList = () => {
    setOpenJobList(true);
  };

  const handleCloseJobList = () => {
    setOpenJobList(false);
  };

  const handleParse = () => {
    // 发送解析的请求给主进程处理
    console.log("url", url);
    electronAPI.send(EVENT_NAME.ParseUrl, url);
  };

  useEffect(() => {
    const handleUrlParsed = (msg: IpcEventMsg) => {
      console.log("Response msg:", msg);
      const response = msg as URLParseResponse;
      if (response.status === "success") {
        if (response.data?.videoList) {
          setVideoList(response.data.videoList);
        }
      }
    };
    const handleDownloadJobMapUpdate = (msg: IpcEventMsg) => {
      const response = msg as VideoDownloadJobMap;
      console.log("Download job map updated:", response);
      setDownloadJobMap(response);
    };

    // 注册事件监听
    window.electronAPI.on(EVENT_NAME.UrlParsedResp, handleUrlParsed);
    window.electronAPI.on(
      EVENT_NAME.DownloadJobMapUpdate,
      handleDownloadJobMapUpdate
    );

    // 清理函数，组件卸载时移除事件监听
    return () => {
      // 假设有一个removeListener方法用于移除监听，具体实现依赖于electronAPI的设计
      window.electronAPI.removeListener(
        EVENT_NAME.UrlParsedResp,
        handleUrlParsed
      );
      window.electronAPI.removeListener(
        EVENT_NAME.DownloadJobMapUpdate,
        handleDownloadJobMapUpdate
      );
    };
  }, []);

  return (
    <>
      <div style={{ position: "absolute", top: 0, right: 0, padding: "10px" }}>
        <Button variant="contained" color="primary" onClick={handleOpenJobList}>
          Downloads ({Object.keys(downloadJobMap).length})
        </Button>
      </div>
      <DownloadTasksDialog
        setOpenJobList={setOpenJobList}
        openJobList={openJobList}
        downloadJobMap={downloadJobMap}
      />
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
    </>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
