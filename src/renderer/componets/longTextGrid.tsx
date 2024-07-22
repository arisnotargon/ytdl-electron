import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import { Grid, Snackbar } from "@mui/material";

// 创建自定义的 StyledGrid 组件
const StyledGrid = styled(Grid)({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  cursor: "pointer",
});
interface Props {
  text: string;
}

const StyledTooltip = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper, // 使用主题中的背景色
  color: theme.palette.text.primary, // 使用主题中的文本颜色
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  maxWidth: "60vw",
  wordBreak: "break-all",
  whiteSpace: "normal",
  zIndex: 1000,
  position: "fixed",
}));

// 创建一个组件来显示长文本
const LongTextGrid: React.FC<Props> = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    setTooltipPosition({
      top: event.clientY,
      left: event.clientX,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const [openSnackbar, setOpenSnackbar] = useState(false); // 状态控制Snackbar的显示
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOpenSnackbar(true); // 显示Snackbar
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  return (
    <StyledGrid
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={copyToClipboard}
    >
      {text}
      {showTooltip && (
        <StyledTooltip
          style={{
            top: tooltipPosition.top + 10,
            left: tooltipPosition.left + 10,
          }}
        >
          {text}
        </StyledTooltip>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
        message="Text copied to clipboard"
      />
    </StyledGrid>
  );
};

export default LongTextGrid;
