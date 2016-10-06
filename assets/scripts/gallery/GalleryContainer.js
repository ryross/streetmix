

export function showGallery (userId, instant, signInPromo) {
  if (app.readOnly) {
    return
  }

  trackEvent('INTERACTION', 'OPEN_GALLERY', userId, null, false)

  galleryState.visible = true
  galleryState.streetLoaded = true
  galleryState.streetId = getStreet().id
  setGalleryUserId(userId)

  // TODO set userId Prop in Gallery

  if (!signInPromo) {

    // TODO no class, but type?
    if (!userId) {
      document.querySelector('#gallery').classList.add('all-streets')
      document.querySelector('#gallery').classList.remove('another-user')
    } else if (isSignedIn() && (userId === getSignInData().userId)) {
      document.querySelector('#gallery').classList.remove('another-user')
      document.querySelector('#gallery').classList.remove('all-streets')
    } else {
      document.querySelector('#gallery').classList.add('another-user')
      document.querySelector('#gallery').classList.remove('all-streets')
    }
  }

  hideControls()
  hideStatusMessage()
  document.querySelector('#gallery .sign-in-promo').classList.remove('visible')

  if (instant) {
    document.body.classList.add('gallery-no-move-transition')
  }
  document.body.classList.add('gallery-visible')

  if (instant) {
    window.setTimeout(function () {
      document.body.classList.remove('gallery-no-move-transition')
    }, 0)
  }

  if ((getMode() === MODES.USER_GALLERY) || (getMode() === MODES.GLOBAL_GALLERY)) {
    // Prevents showing old street before the proper street loads
    showError(ERRORS.NO_STREET, false)
  }

  if (!signInPromo) {
    loadGalleryContents()
    updatePageUrl(true)
  } else {
    document.querySelector('#gallery .sign-in-promo').classList.add('visible')
  }
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


