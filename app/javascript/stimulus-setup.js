import { Application } from "@hotwired/stimulus"

const application = Application.start()
application.warnings = true
application.debug    = false
window.Stimulus      = application
export { application }

// globs work because of https://github.com/excid3/esbuild-rails
namePrefix = "controllers--"
import controllers from `./controllers/*_controller.js`
controllers.forEach(controller => {
  application.register(controller.name.substring(namePrefix.length),
                      controller.module.default)
})

// fires just before navigating away from the page.
// hides the content so that Shoelace components don't flicker on page load.
// based on https://www.betterstimulus.com/turbolinks/teardown.html
document.addEventListener('turbo:before-cache', () => {
  if (document.querySelector("sl-tab-group")) {
    document.hideContentBeforeCache()
  }
})

document.hideContentBeforeCache = () => {
  document.querySelector("main.container").style.visibility = "hidden"
  document.querySelector("footer").style.visibility = "hidden"
}

// fires in early page load, before the cached preview is shown.
document.addEventListener('turbo:load', () => {
  document.adjustForShoelaceComponents()
})

document.adjustForShoelaceComponents = () => {
  if (document.querySelector("sl-tab-group")) {
    document.unhideContentOnRestoration()
    document.delayFooterAppearance()
  }
}

// without this, the page content is hidden after using browser back or forward.
document.unhideContentOnRestoration = () => {
  if (!document.isPreview()) {
    document.querySelector("main.container").style.visibility = "visible"
    document.querySelector("footer").style.visibility = "visible"
  }
}

document.isPreview = () => {
  return document.documentElement.hasAttribute("data-turbo-preview");
}

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