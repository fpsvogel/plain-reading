// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"

import { setBasePath } from '@shoelace-style/shoelace'
// setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.57/dist/")
setBasePath("./shoelace/dist/")

// // from https://github.com/ParamagicDev/shoelace-rails-importmaps/issues/2#issuecomment-961356638
// // but I have no idea what to put inside the function below.
// // Place all the custom elements you're using here
// const tagsUsed = ['sl-icon', 'sl-alert', 'sl-tab-panel', 'sl-tab-group', 'sl-tab', 'sl-details'];

// Promise.all(tagsUsed.map(tag => customElements.whenDefined(tag))).then(() => {
//   // All components have loaded now, transition in and show the UI here
// });

