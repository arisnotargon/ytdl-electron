// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const main = {
  mode: "development",
  target: "electron-main",
  entry: path.join(__dirname, "src", "main.ts"),
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // 匹配 .ts 或 .tsx 文件
        use: "ts-loader", // 使用 ts-loader
        exclude: /node_modules/, // 排除 node_modules 目录
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  // ...
};

const preload = {
  mode: "development",
  entry: path.join(__dirname, "src", "preload.ts"),
  output: {
    filename: "preload.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // 匹配 .ts 或 .tsx 文件
        use: "ts-loader", // 使用 ts-loader
        exclude: /node_modules/, // 排除 node_modules 目录
      },
    ],
  },
  // 解析配置
  resolve: {
    extensions: [".ts", ".js"],
  },
  // 目标配置
  target: "electron-preload",
};

// レンダラープロセスの設定
const renderer = {
  mode: "development",
  target: "electron-renderer",
  devtool: "inline-source-map",
  entry: path.join(__dirname, "src", "renderer", "index.tsx"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "scripts"),
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // 匹配 .ts 或 .tsx 文件
        use: "ts-loader", // 使用 ts-loader
        exclude: /node_modules/, // 排除 node_modules 目录
      },
    ],
  },
};

module.exports = [main, renderer, preload];
