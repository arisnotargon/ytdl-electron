import React, { useState } from "react";
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
  DialogActions,
} from "@mui/material";
import { VideoDownloadJobMap } from "../../types";
import StyledGrid from "./longTextGrid";

interface Props {
  setOpenJobList: React.Dispatch<React.SetStateAction<boolean>>;
  openJobList: boolean;
  downloadJobMap: VideoDownloadJobMap;
}

const evenRowStyle = { backgroundColor: "#f7f7f7" };
const oddRowStyle = { backgroundColor: "#ffffff" };

const DownloadTasksDialog: React.FC<Props> = ({
  setOpenJobList,
  openJobList,
  downloadJobMap,
}) => {
  const handleCloseJobList = () => {
    setOpenJobList(false);
  };
  return (
    <Dialog
      open={openJobList}
      onClose={handleCloseJobList}
      PaperProps={{
        style: {
          width: "90vw",
          maxWidth: "none",
          height: "90vh",
        },
      }}
    >
      <DialogTitle>Download Tasks</DialogTitle>
      <DialogContent>
        <List>
          <ListItem key={"header"} style={{ backgroundColor: "primary" }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <div>Title</div>
              </Grid>
              <Grid item xs={3}>
                <div>File</div>
              </Grid>
              <Grid item xs={3}>
                <div>Progress</div>
              </Grid>
              <Grid item xs={3}>
                <div>Status</div>
              </Grid>
            </Grid>
          </ListItem>
          {Object.entries(downloadJobMap).map(([jobId, jobDetails], index) => (
            <ListItem
              key={jobId}
              style={index % 2 === 0 ? evenRowStyle : oddRowStyle}
            >
              <Grid container spacing={2}>
                <Grid item xs={5}>
                  <StyledGrid text={jobDetails.videoInfo.title} />
                </Grid>
                <Grid item xs={5}>
                  <StyledGrid text={jobDetails.filename} />
                </Grid>
                <Grid item xs={1}>
                  <div>{jobDetails.progress}%</div>
                </Grid>
                <Grid item xs={1}>
                  <div>{jobDetails.status}</div>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions style={{ justifyContent: "center" }}>
        <Button color="error" onClick={handleCloseJobList}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DownloadTasksDialog;
