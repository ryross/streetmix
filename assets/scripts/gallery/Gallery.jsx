import React from 'react'
import StreetThumbnail from '../streets/StreetThumbnail'
import { msg } from '../app/messages'
import Scrollable from '../ui/Scrollable'
import Avatar from '../app/Avatar'
import { getSignInData, isSignedIn } from '../users/authentication'
import { updateToLatestSchemaVersion, getStreetUrl } from '../streets/data_model'
import { URL_NEW_STREET, URL_NEW_STREET_COPY_LAST } from '../app/routing'
import { fetchGalleryStreet } from './fetch_street'
import { API_URL } from '../app/config'
import { getAuthHeader } from '../users/authentication'
import { MODES, processMode, getMode, setMode } from '../app/mode'
import { updatePageUrl } from '../app/page_url'
import { showError, ERRORS } from '../app/errors'

export default class Gallery extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      visible: this.props.visible,
      userId: this.props.userId,
      selectedStreetId: this.props.selectedStreetId,
      streetLoaded: this.props.streetLoaded,
      loading: false,
      errorLoading: false,
      signInPromo: false,
      streets: this.props.streets
    }

    this.streetCountText = this.streetCountText.bind(this)
    this.onGalleryStreetClick = this.onGalleryStreetClick.bind(this)
    this.switchGalleryStreet = this.switchGalleryStreet.bind(this)
    this.fetchGalleryData = this.fetchGalleryData.bind(this)
    this.receiveGalleryData = this.receiveGalleryData.bind(this)
    this.errorReceiveGalleryData = this.errorReceiveGalleryData.bind(this)
    this.show = this.show.bind(this)
    this.hide = this.hide.bind(this)
  }

  //TODO on props update, set state


  componentDidMount () {
    window.addEventListener('stmx:show_gallery', this.show)
    window.addEventListener('stmx:hide_gallery', this.hide)
  }

  componentWillUnmount () {
    window.removeEventListener('stmx:show_gallery', this.show)
    window.removeEventListener('stmx:hide_gallery', this.hide)
  }

  // TODO add event for deleting a street
  // then listen for it here and reset the selectedStreetId if necessary

  render () {

    let classes = []
    if (!this.state.signInPromo) {
      if (!this.state.userId) {
        classes.push('all-streets')
      } else if (isSignedIn() && (this.state.userId === getSignInData().userId)) {
        // no special classes
      } else {
        classes.push('another-user')
      }
    }
    console.log(classes)

    let userId = null
    let avatar = null
    if (this.state.userId) {
      userId = <div className="user-id">
        {this.state.userId}
        <a className="twitter-profile" target='_blank' href={'https://twitter.com/'+this.state.userId}>Twitter profile »</a>
      </div>
      avatar = <Avatar userId={this.state.userId} />
    } else {
      userId = <div className="user-id">
        {'All streets'}
      </div>
    }
    return (
      <div id="gallery" className={classes.join(' ')}>
        <div className={this.state.loading ? 'loading visible' : 'loading'} data-i18n='msg.loading'>
          Loading…
        </div>

        <div className={this.state.errorLoading ? 'error-loading visible': 'error-loading'} data-i18n='gallery.fail'>
          <span>Failed to load the gallery.</span>
          <button id="gallery-try-again" data-i18n='btn.try-again'>
            Try again
          </button>
        </div>

        <div className={this.state.signInPromo ? 'sign-in-promo visible': 'sign-in-promo'}>
          <a href='/twitter-sign-in?redirectUri=/just-signed-in'>Sign in with Twitter</a> for your personal street gallery
        </div>

        {avatar}
        {userId}
        <div className="street-count">{this.streetCountText()}</div>

        <a href={'/' + URL_NEW_STREET} target="_blank" className="button-like" id="new-street" data-i18n='btn.create'>Create new street</a>
        <a href={'/' + URL_NEW_STREET_COPY_LAST} target="_blank" className="button-like" id="copy-last-street" data-i18n='btn.copy'>Make a copy</a>

        <Scrollable className="streets" setRef={() => { /* no op */ }}>
          {this.state.streets.map((street, i) => {
            return <div className='gallery-street' key={street.id}>
              <StreetThumbnail
                isSelected={this.state.selectedStreetId == street.id}
                href={getStreetUrl(street)}
                onClick={this.onGalleryStreetClick}
                street={street}
              />
            </div>
          })}
        </Scrollable>
      </div>
    )
  }

  onGalleryStreetClick (event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      return
    }
    this.switchGalleryStreet(event.currentTarget.dataset.streetId);
    event.preventDefault()
  }

  switchGalleryStreet (id) {
    this.setState({
      selectedStreetId: id
    });

    fetchGalleryStreet(id)
  }

  streetCountText () {
    let text

    if (this.state.userId) {
      const streetCount = this.state.streets.length
      switch (streetCount) {
        case 0:
          text = msg('STREET_COUNT_0')
          break
        case 1:
          text = msg('STREET_COUNT_1')
          break
        default:
          text = msg('STREET_COUNT_MANY', { streetCount: streetCount })
          break
      }
    } else {
      text = ''
    }
    return text
  }

  fetchGalleryData () {
    let url = API_URL + 'v1/' + (this.state.userId ? 'users/' + this.state.userId + '/streets' : 'streets?count=200');
    const options = {}
    if (this.state.userId) {
      options.headers = {'Authorization': getAuthHeader()}
    }

    window.fetch(url, options).then(function (response) {
      if (!response.ok) {
        throw response
      }
      return response.json()
    })
    .then(this.receiveGalleryData)
    .catch(this.errorReceiveGalleryData)
  }

  receiveGalleryData (transmission) {
    let updatedStreets = [];
    for (var i in transmission.streets) {
      var galleryStreet = transmission.streets[i]
      // There is a bug where sometimes street data is non-existent for an unknown reason
      // Skip over so that the rest of gallery will display
      if (!galleryStreet.data) continue

      updateToLatestSchemaVersion(galleryStreet.data.street)
      updatedStreets[i] = galleryStreet
    }

    let selectedStreetId = null;

    var streetCount = updatedStreets.length
    if (((getMode() === MODES.USER_GALLERY) && streetCount) || (getMode() === MODES.GLOBAL_GALLERY)) {
      selectedStreetId = transmission.streets[0].id
    }

    this.setState({
      loading: false,
      errorLoading: false,
      streets: updatedStreets,
      selectedStreetId: selectedStreetId
    });

    /*
    //TODO Implement
    const galleryEl = document.getElementById('gallery')
    const selectedEl = galleryEl.querySelector('.selected')
    if (selectedEl) {
      selectedEl.scrollIntoView()
      galleryEl.scrollTop = 0
    }
    */
  }

  errorReceiveGalleryData (data) {
    if ((getMode() === MODES.USER_GALLERY) && (data.status === 404)) {
      setMode(MODES.NOT_FOUND)
      processMode()
      this.hide();
      // hideGallery(true)
    } else {
      this.setState({
        loading: false,
        errorLoading: true
      });
    }
  }

  show (event) {
    console.log(arguments);
    // debugger;

    const data = event.detail

    this.setState({
      signInPromo: false
    })

      // visible: this.props.visible,
      // userId: this.props.userId,
      // selectedStreetId: this.props.selectedStreetId,
      // streetLoaded: this.props.streetLoaded,
      // loading: false,
      // errorLoading: false,
    this.setState(data)

    if (data.instant) {
      document.body.classList.add('gallery-no-move-transition')
    }
    document.body.classList.add('gallery-visible')

    if (data.instant) {
      window.setTimeout(function () {
        document.body.classList.remove('gallery-no-move-transition')
      }, 0)
    }

    if ((getMode() === MODES.USER_GALLERY) || (getMode() === MODES.GLOBAL_GALLERY)) {
      // Prevents showing old street before the proper street loads
      showError(ERRORS.NO_STREET, false)
    }

    if (!data.signInPromo) {
      this.fetchGalleryData()
      updatePageUrl(true)
    } else {
      // document.querySelector('#gallery .sign-in-promo').classList.add('visible')
      this.setState({
        signInPromo: true
      })
    }
  }

  hide (event) {
    console.log(arguments);
    debugger;
  }
}

Gallery.propTypes = {
  streets: React.PropTypes.array,
  userId: React.PropTypes.string,
  visible: React.PropTypes.bool,
  streetLoaded: React.PropTypes.bool,
  selectedStreetId: React.PropTypes.string,
}


