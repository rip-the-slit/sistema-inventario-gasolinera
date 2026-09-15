const HtmlWebpackPluging = require("html-webpack-plugin")
const Dotenv = require('dotenv-webpack');
const path = require("path")

module.exports = {
    entry: "./src/index.js",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPluging({
            template: "./src/template.html",
        }),
        new Dotenv({ systemvars: true })
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
        ],
    },
}
