import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="configs"
export default class extends Controller {
  static targets = [ "tabGroup" ]

  connect() {
    this.goToAnchor()
  }

  disconnect() {
    // this.tabGroupTarget.style.visibility = "hidden"
    document.querySelector("main.container").display = "none"
    document.querySelector("footer").display = "none"
  }

  // shows the config tab indicated by the URL's anchor (if any).
  goToAnchor() {
    let anchor = window.location.hash.substr(1)
    this.tabGroupTarget.show(anchor)
  }
}
