// const webpack = require('webpack');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, options) => {
  const isProduction = options.mode === 'production';

  const config = {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'eval' : 'source-map',
    watch: !isProduction,
    entry: ['./src/index.js', './src/styles/style.scss'],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '',
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/,
          use: [
            {
              loader: 'file-loader',
            },
          ],
        },
        {
          test: /\.html$/,
          loader: 'html-loader',
        },
      ],
    },

    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        cache: false,
      }),
      // new CopyPlugin({
      //   patterns: [
      //     {
      //       from: 'src/assets/',
      //       to: 'assets/[path][name].[ext]',
      //       toType: 'template',
      //       globOptions: {
      //         ignore: [
      //           '/*.ico',
      //           '/subdir/**',
      //         ],
      //       },
      //     },
      //   ],
      // }),
    ],
  };
  return config;
};
