// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
// import "@hotwired/turbo-rails"
// import "controllers"

// import { setBasePath } from '@shoelace-style/shoelace'
// setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.57/dist/")

alert("Initial load.")

// from https://github.com/ParamagicDev/shoelace-rails-importmaps/issues/2#issuecomment-961356638
const tagsUsed = ['sl-icon', 'sl-alert', 'sl-tab-panel', 'sl-tab-group', 'sl-tab', 'sl-details']

Promise.all(tagsUsed.map(tag => customElements.whenDefined(tag))).then(() => {
  // all components have loaded now, transition in and show the UI here.
  document.querySelector("nav").style.display = "none"
  console.log("Done loading.")
});
