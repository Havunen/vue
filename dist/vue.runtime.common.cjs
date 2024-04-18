if (process.env.NODE_ENV === 'production') {
  module.exports = require('./vue.runtime.common.prod.cjs')
} else {
  module.exports = require('./vue.runtime.common.dev.cjs')
}
