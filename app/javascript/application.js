// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import { Turbo } from "@hotwired/turbo-rails"
import "controllers"
import mrujs from "mrujs"

// Turbo must be set before starting mrujs for proper compatibility with querySelectors.
window.Turbo = Turbo
mrujs.start()

import { setBasePath } from '@shoelace-style/shoelace'
setBasePath("https://unpkg.com/@shoelace-style/shoelace@2.0.0-beta.57/dist/")
