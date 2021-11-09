import { Application } from "@hotwired/stimulus"

const application = Application.start()
application.warnings = true
application.debug    = false
window.Stimulus      = application
export { application }

// globs work because of https://github.com/excid3/esbuild-rails
import controllers from "./controllers/*_controller.js"
controllers.forEach(controller => {
  application.register(controller.name, controller.module.default)
})

// hides the content so that Shoelace components don't flicker on page load.
// based on https://www.betterstimulus.com/turbolinks/teardown.html
document.addEventListener('turbo:before-cache', () => {
  application.controllers.forEach(controller => {
    document.querySelector("main.container").style.visibility = "hidden"
    document.querySelector("footer").style.visibility = "hidden"
  })
})

// called in each controller's connect().
// without this, the footer appears at the top of the page for a moment.
document.delayFooterAppearance = () => {
  document.querySelector("footer").style.visibility = "hidden"
  let aWhile = 10; // 10 ms
  let resetFooter = function() {
    document.querySelector("footer").style.visibility = "visible"
  }
  setTimeout( resetFooter, aWhile );
}