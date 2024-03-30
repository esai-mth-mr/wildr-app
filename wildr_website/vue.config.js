
const { siteMapRoutes } = require('./src/router/index.js');
module.exports = {
  pluginOptions: {
    sitemap: {
      baseURL: 'https://wildr.com',
      routes: siteMapRoutes,
    }
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.md$/i,
          loader: "raw-loader",
        },
      ],
    },
    output: {
      filename: '[name].[hash].bundle.js'
    }
  },
  transpileDependencies: [
    'vuetify'
  ],

}
