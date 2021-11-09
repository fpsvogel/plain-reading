// Import and register all your controllers from the importmap under controllers/*

import { application } from "controllers/application"

// Eager load all controllers defined in the import map under controllers/**/*_controller
import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading"
eagerLoadControllersFrom("controllers", application)

// Lazy load controllers as they appear in the DOM (remember not to preload controllers in import map!)
// import { lazyLoadControllersFrom } from "@hotwired/stimulus-loading"
// lazyLoadControllersFrom("controllers", application)

import { setBasePath } from '@shoelace-style/shoelace'
setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.57/dist/")

// from https://www.betterstimulus.com/turbolinks/teardown.html
document.addEventListener('turbo:before-cache', () => {
  application.controllers.forEach(controller => {
    if (typeof controller.teardown === 'function') {
      console.log("tearing down")
      controller.teardown()
    }
  })
})
