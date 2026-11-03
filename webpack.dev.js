const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    static: { directory: __dirname },
    proxy: [{ context: ["/api"], target: "http://localhost/sistema-inventario-gasolinera/", changeOrigin: true, cookiePathRewrite: "/" }],
    watchFiles: ["src/**/*"],
    hot: true,
  },
});
