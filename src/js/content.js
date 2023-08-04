import React, { createRef } from "react"
import browser from "webextension-polyfill"
import { createRoot } from "react-dom/client"
import Bubble from "./components/Bubble"
import Popup from "components/Popup"
import { createServiceFinder } from "utils/urlMatcher"
import remoteServices from "./remoteServices"
import { sendMessage, onMessage } from "webext-bridge/content-script"
import { getSettings } from "./utils/browser"
import "../css/content.scss"

const popupRef = createRef()

let bubbleRoot, popupRoot

let findService
getSettings().then((settings) => {
  findService = createServiceFinder(remoteServices, settings.hostOverrides)(document)
})

function clickHandler(event) {
  if (event.target.closest(".moco-bx-bubble")) {
    event.stopPropagation()
    sendMessage("togglePopup", null, "background")
  }

//Futureweb
  if (event.target.closest(".tst-new-expense")) {
    getSettings().then((settings) => {
      event.stopPropagation();
      const url = window.location.href;
      const project_id = url.match(/\/(\d+)\//)[1];
      const overlay = document.createElement("div");
      overlay.id = "overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "50%";
      overlay.style.left = "50%";
      overlay.style.transform = "translate(-50%, -50%)";
      overlay.style.width = "95%";
      overlay.style.height = "90%";
      overlay.style.maxWidth = "1300px";
      overlay.style.zIndex = "9999";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.border = "2px solid #000";
      overlay.style.overflow = "hidden";
      overlay.style.transition = "opacity 0.3s ease-in-out";
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.backgroundColor = "#fff";
      const bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const closeButton = document.createElement("button");
      closeButton.id = "closeButton";
      closeButton.innerText = "Schließen";
      closeButton.style.position = "absolute";
      closeButton.style.top = "10px";
      closeButton.style.right = "15px";
      closeButton.style.padding = "5px 10px";
      closeButton.style.backgroundColor = "#fff";
      closeButton.style.border = "none";
      closeButton.style.cursor = "pointer";
      closeButton.addEventListener("click", () => {
        closeOverlay();
      });
      const iframe = document.createElement("iframe");
      iframe.src = "https://dashboard.fweb.at/pages/article/add/" + project_id + "?hash=" + settings.apiKey;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.backgroundColor = "#fff";
      iframe.setAttribute("scrolling", "no");
      overlay.appendChild(closeButton);
      overlay.appendChild(iframe);
      document.body.appendChild(overlay);
      // Add the element under the overlay
      const elementUnderOverlay = document.createElement("div");
      elementUnderOverlay.style.position = "fixed";
      elementUnderOverlay.style.top = "0";
      elementUnderOverlay.style.left = "0";
      elementUnderOverlay.style.width = "100%";
      elementUnderOverlay.style.height = "100%";
      elementUnderOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)"; // Reduced visibility to 25%
      elementUnderOverlay.style.zIndex = "9998";
      document.body.appendChild(elementUnderOverlay);
      setTimeout(() => {
        overlay.style.opacity = "1";
        overlay.style.pointerEvents = "auto";
      }, 100);

      // Function to close the overlay
      function closeOverlay() {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = bodyOverflow;
          elementUnderOverlay.remove(); // Remove the elementUnderOverlay
        }, 300);
      }

      // Listen for message from the HTML page
      window.addEventListener('message', (event) => {
          const msgdata = event.data;
          switch (msgdata.event) {
            case 'closeOverlay':
              closeOverlay();
              break;
            case 'load':
              window.location.href = msgdata.url;
              // Perform actions for the 'load' event
              break;
            default:
              // Handle unrecognized events
              console.log("No Event exists: "+msgdata.event);
              break;
          }
      });
    })
  }

}

function updateBubble({ service, bookedSeconds, settingTimeTrackingHHMM, timedActivity } = {}) {
  if (!document.getElementById("moco-bx-root")) {
    window.removeEventListener("click", clickHandler, true)

    const domRoot = document.createElement("div")
    domRoot.setAttribute("id", "moco-bx-root")
    document.body.appendChild(domRoot)

    window.addEventListener("click", clickHandler, true)
  }

  if (!bubbleRoot) {
    const container = document.getElementById("moco-bx-root")
    bubbleRoot = createRoot(container)
  }

  if (service) {
    bubbleRoot.render(
      <div className="moco-bx-bubble" style={{ ...service.position }}>
        <Bubble
          key={service.url}
          bookedSeconds={bookedSeconds}
          settingTimeTrackingHHMM={settingTimeTrackingHHMM}
          timedActivity={timedActivity}
        />
      </div>,
    )
  } else {
    bubbleRoot.render(null)
  }
}

function openPopup(payload) {
  if (!document.getElementById("moco-bx-popup-root")) {
    const domRoot = document.createElement("div")
    domRoot.setAttribute("id", "moco-bx-popup-root")
    document.body.appendChild(domRoot)
  }

  if (!popupRoot) {
    const container = document.getElementById("moco-bx-popup-root")
    popupRoot = createRoot(container)
  }

  popupRoot.render(<Popup ref={popupRef} data={payload} onRequestClose={closePopup} />)
}

function closePopup() {
  if (popupRoot) {
    popupRoot.render(null)
  }
}

onMessage("requestService", (message) => {
  const service = findService(window.location.href)
  return { isPopupOpen: !!popupRef.current, service }
})

onMessage("showBubble", (message) => {
  updateBubble(message.data)
})

onMessage("hideBubble", () => {
  updateBubble()
})

onMessage("openPopup", (message) => {
  openPopup(message.data)
})

onMessage("closePopup", (_message) => {
  closePopup()
})
