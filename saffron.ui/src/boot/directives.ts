import { boot } from 'quasar/wrappers'
import formatDate from 'src/directives/format-date'

export default boot(({ app }) => {
  app.directive('format-date', formatDate)
})
