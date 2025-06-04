import { boot } from 'quasar/wrappers'
import decimal from 'src/directives/decimal'
import formatDate from 'src/directives/format-date'

export default boot(({ app }) => {
  app.directive('format-date', formatDate)
  app.directive('decimal', decimal)
})
