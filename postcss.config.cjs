const presetEnv = require('postcss-preset-env')

module.exports = {
  plugins: [
    presetEnv({
      features: {
        'nesting-rules': true,
      },
    }),
  ],
}
