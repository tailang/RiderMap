const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path')   //调用路径

module.exports = {
  mode: 'development',    //开发模式
  entry: './src/index.js',    //入口文件
  output: {
    filename: 'index.js',    //输出文件名
  },

  module: {
    rules: [
      {
        test:/\.css$/,    //css配置
        use: [ 'style-loader', 'css-loader' ]  //注意
      }
    ]
  },

  plugins: [
    // html 
    new HtmlWebpackPlugin({
      template:'./src/index.html', //文件模板
      filename:'index.html',  //输出文件名
    }),
  ]
}