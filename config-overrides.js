const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "constants": require.resolve("constants-browserify"),
    "module": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "dns": false
  });
  config.resolve.fallback = fallback;
  
  // Add alias for process/browser
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser.js')
  };
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]);
  
  config.ignoreWarnings = [/Failed to parse source map/];
  
  // Handle .mjs files properly
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  });
  
  // Exclude problematic modules from source-map-loader
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOfRule => {
        if (oneOfRule.use && oneOfRule.use.find(u => u.loader && u.loader.includes('source-map-loader'))) {
          oneOfRule.exclude = [
            ...(oneOfRule.exclude || []),
            /node_modules\/hume/,
            /node_modules\/node-fetch/
          ];
        }
      });
    }
  });
  
  return config;
}
