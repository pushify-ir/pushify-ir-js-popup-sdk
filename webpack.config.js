const path = require("path");
const CopyPlugin = require("copy-webpack-plugin"); // <-- missing before

module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
        library: "pushify-ir",
        libraryTarget: "umd",
        globalObject: "this",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "pushify-ir-sw.js",
                    to: path.resolve(__dirname, "dist"),
                },
            ],
        }),
    ],
};
