// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./stimulus-setup"

import { setBasePath } from '@shoelace-style/shoelace'
setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.60/dist/")
