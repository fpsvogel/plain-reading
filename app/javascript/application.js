// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"

import { setBasePath } from '@shoelace-style/shoelace'
setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.60/dist/")

// from https://github.com/ParamagicDev/shoelace-rails-importmaps/issues/2#issuecomment-961356638
const tagsUsed = ['sl-icon', 'sl-alert', 'sl-tab-panel', 'sl-tab-group', 'sl-tab', 'sl-details']

Promise.all(tagsUsed.map(tag => customElements.whenDefined(tag))).then(() => {
  console.log("Done.")
});
