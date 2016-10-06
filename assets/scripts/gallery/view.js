import { trackEvent } from '../app/event_tracking'
import { showError, ERRORS } from '../app/errors'
import { onWindowFocus } from '../app/focus'
import { getAbortEverything } from '../app/initialization'
import { MODES, getMode, setMode } from '../app/mode'
import { updatePageUrl } from '../app/page_url'
import { hideStatusMessage } from '../app/status_message'
import { app } from '../preinit/app_settings'
import { system } from '../preinit/system_capabilities'
import { hideControls } from '../segments/resizing'
import { getStreet } from '../streets/data_model'
import { getSignInData, isSignedIn } from '../users/authentication'
import { fetchGalleryData } from './fetch_data'
import React from 'react'

const galleryState = {
  visible: false,
  userId: null,
  streetId: null,
  streetLoaded: false,
  // set to true when the current street is deleted from the gallery
  // this prevents the gallery from being hidden while no street is shown
  noStreetSelected: false
}

export function attachGalleryViewEventListeners () {
  window.addEventListener('stmx:init', function () {

    document.querySelector('#gallery-try-again').addEventListener('pointerdown', repeatReceiveGalleryData)
    document.querySelector('#gallery-shield').addEventListener('pointerdown', onGalleryShieldClick)
  })

  window.addEventListener('stmx:everything_loaded', function () {
    updateGalleryShield()
  })
}

export function showGallery (userId, instant, signInPromo) {
  if (app.readOnly) {
    return
  }

  let eventDetail = {
    detail: {
      visible: true,
      streetLoaded: true,
      streetId: getStreet().id,
      userId: userId,
      signInPromo: signInPromo,
      instant: instant
    }
  }
  window.dispatchEvent(new CustomEvent('stmx:show_gallery', eventDetail))
  trackEvent('INTERACTION', 'OPEN_GALLERY', userId, null, false)

  // galleryState.visible = true
  // galleryState.streetLoaded = true
  // galleryState.streetId = getStreet().id
  // setGalleryUserId(userId)

  hideControls()
  hideStatusMessage()
}

export function hideGallery (instant) {
  // Do not hide the gallery if there is no street selected.
  if (galleryState.noStreetSelected === true) {
    return
  }

  if (galleryState.streetLoaded) {
    galleryState.visible = false

    if (instant) {
      document.body.classList.add('gallery-no-move-transition')
    }
    document.body.classList.remove('gallery-visible')

    if (instant) {
      window.setTimeout(function () {
        document.body.classList.remove('gallery-no-move-transition')
      }, 0)
    }

    onWindowFocus()

    if (!getAbortEverything()) {
      updatePageUrl()
    }

    setMode(MODES.CONTINUE)
  }
}


function repeatReceiveGalleryData () {
  loadGalleryContents()
}



function loadGalleryContents () {
  fetchGalleryData()
}

function onGalleryShieldClick (event) {
  hideGallery(false)
}

function updateGalleryShield () {
  document.querySelector('#gallery-shield').style.width = 0
  window.setTimeout(function () {
    document.querySelector('#gallery-shield').style.height = system.viewportHeight + 'px'
    document.querySelector('#gallery-shield').style.width = document.querySelector('#street-section-outer').scrollWidth + 'px'
  }, 0)
}

export function onMyStreetsClick (event) {
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    return
  }

  if (isSignedIn()) {
    showGallery(getSignInData().userId, false)
  } else {
    showGallery(false, false, true)
  }

  event.preventDefault()
}
