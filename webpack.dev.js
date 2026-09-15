const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    static: {
      directory: "./dist",
    },
    watchFiles: {
      paths: ["src/**/*"],
      options: {
        usePolling: true,
      },
    },
    hot: true,
    allowedHosts: 'all',
    client: {
      webSocketURL: {
        hostname: '8080-firebase-cenac-ui-1776569860820.cluster-lr6dwlc2lzbcctqhqorax5zmro.cloudworkstations.dev',
        pathname: '/ws',
        port: 443,
        protocol: 'wss',
      },
    },
    historyApiFallback: true,
  },
});
