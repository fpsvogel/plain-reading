import { Controller } from "@hotwired/stimulus"

console.log("controllers.")

// Connects to data-controller="configs"
export default class extends Controller {
  static targets = [ "tabGroup" ]

  connect() {
    document.delayFooterAppearance()
    this.goToAnchor()
  }

  teardown() {
    document.querySelector("sl-tab-group").style.visibility = "hidden"
  }

  // shows the config tab indicated by the URL's anchor (if any).
  goToAnchor() {
    let anchor = window.location.hash.substr(1)
    this.tabGroupTarget.show(anchor)
  }
}
