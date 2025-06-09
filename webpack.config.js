const path = require('path');

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  devtool: 'source-map',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};

const mainConfig = {
  ...baseConfig,
  entry: './src/main.ts',
  target: 'electron-main',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    electron: 'commonjs2 electron',
  },
};

const preloadConfig = {
  ...baseConfig,
  entry: './src/preload.ts',
  target: 'electron-preload',
  output: {
    filename: 'preload.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    electron: 'commonjs2 electron',
  },
};

const rendererConfig = {
  ...baseConfig,
  entry: './src/renderer.tsx',
  target: 'electron-renderer',
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    electron: 'commonjs2 electron',
  },
};

module.exports = [mainConfig, preloadConfig, rendererConfig];