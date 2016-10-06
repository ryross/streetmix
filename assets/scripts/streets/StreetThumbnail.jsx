import React from 'react'
import StreetName from '../streets/StreetName'
import StreetCanvas from '../streets/StreetCanvas'
import { formatDate } from '../util/date_format'
import { msg } from '../app/messages'
import { DEFAULT_NAME } from '../streets/data_model'
import { getSignInData, isSignedIn } from '../users/authentication'
import { getGalleryUserId } from '../app/page_url'
import { sendDeleteStreetToServer } from '../streets/xhr'

export default class StreetThumbnail extends React.Component {

  constructor (props) {
    super(props)
    this.onDeleteGalleryStreet = this.onDeleteGalleryStreet.bind(this)
  }

  render () {
    const date = formatDate(this.props.street.updatedAt)
    let creatorSpan = null
    let removeButton = null

    let creatorId = (this.props.street.creator && this.props.street.creator.id)
    // let streetName = this.props.street.name || DEFAULT_NAME
    if (!getGalleryUserId()) {
      let creatorName = creatorId || msg('USER_ANONYMOUS')
      creatorSpan = <span className="creator">{creatorName}</span>
    }

    // Only show delete links if you own the street
    if (isSignedIn() && (creatorId === getSignInData().userId)) {
      removeButton = <button
        className="remove"
        onClick={this.onDeleteGalleryStreet}
        title={msg('TOOLTIP_DELETE_STREET')}
      >
        {msg('UI_GLYPH_X')}
     </button>
    }
    return (
      <a href={this.props.href} onClick={this.props.onClick} data-street-name={this.props.street.name} data-street-id={this.props.street.id} className={this.props.isSelected ? 'selected' : ''}>
        <StreetCanvas
          street={this.props.street.data.street}
          silhouette={true}
          bottomAligned={false}
          transparentSky={true}
          segmentNamesAndWidths={false}
          streetName={false}
        />
        <StreetName street={this.props.street} />
        <span className="date">{date}</span>
        {creatorSpan}
        {removeButton}
      </a>
    )
  }

  onDeleteGalleryStreet (event) {
    var el = event.target.parentNode
    var name = el.streetName

    /*
    // TODO escape name
    if (window.confirm(msg('PROMPT_DELETE_STREET', { name: name }))) {
      if (el.getAttribute('streetId') === getStreet().id) {
        // galleryState.noStreetSelected = true
        showError(ERRORS.NO_STREET, false)
      }

      sendDeleteStreetToServer(el.getAttribute('streetId'))

      removeElFromDOM(el.parentNode)
      updateGalleryStreetCount()
    }
    */

    event.preventDefault()
    event.stopPropagation()
  }

}

StreetThumbnail.propTypes = {
  street: React.PropTypes.any,
  href: React.PropTypes.string,
  onClick: React.PropTypes.func,
  isSelected: React.PropTypes.bool,
}




