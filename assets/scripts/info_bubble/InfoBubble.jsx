import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import RemoveButton from './RemoveButton'
import Variants from './Variants'
import WidthControl from './WidthControl'
import BuildingHeightControl from './BuildingHeightControl'
import Warnings from './Warnings'
import Description from './Description.jsx'
import { infoBubble } from './info_bubble'
import { getDescriptionData } from './description'
import { resumeFadeoutControls } from '../segments/resizing'
import { getStreet } from '../streets/data_model'
// import { trackEvent } from '../app/event_tracking'
import { BUILDING_VARIANTS, BUILDING_VARIANT_NAMES } from '../segments/buildings'
import { SEGMENT_INFO } from '../segments/info'
import { loseAnyFocus } from '../util/focus'
import { setInfoBubbleMouseInside } from '../store/actions/infoBubble'
import { t } from '../app/locale'

const INFO_BUBBLE_TYPE_SEGMENT = 1
const INFO_BUBBLE_TYPE_LEFT_BUILDING = 2
const INFO_BUBBLE_TYPE_RIGHT_BUILDING = 3

class InfoBubble extends React.Component {
  static propTypes = {
    visible: PropTypes.bool.isRequired,
    dataNo: PropTypes.number,
    setInfoBubbleMouseInside: PropTypes.func
  }

  static defaultProps = {
    visible: false
  }

  constructor (props) {
    super(props)

    this.state = {
      type: null,
      street: null,
      segment: null,
      description: null
    }
  }

  componentDidMount () {
    // This listener hides the info bubble when the mouse leaves the
    // document area. Do not normalize it to a pointerleave event
    // because it doesn't make sense for other pointer types
    document.addEventListener('mouseleave', this.hide)

    // Listen for external triggers to update contents here
    window.addEventListener('stmx:force_infobubble_update', (e) => {
      this.updateInfoBubbleState()
    })
  }

  componentWillUnmount () {
    // Clean up event listener
    document.removeEventListener('mouseleave', this.hide)
  }

  hide = () => {
    infoBubble.hide()
  }

  onTouchStart (event) {
    resumeFadeoutControls()
  }

  // TODO: verify this continues to work with pointer / touch taps
  onMouseEnter = (event) => {
    if (infoBubble.segmentEl) {
      infoBubble.segmentEl.classList.add('hide-drag-handles-when-inside-info-bubble')
    }

    this.props.setInfoBubbleMouseInside(true)

    infoBubble.updateHoverPolygon()
  }

  onMouseLeave = (event) => {
    // TODO: Prevent pointer taps from flashing the drag handles
    if (infoBubble.segmentEl) {
      infoBubble.segmentEl.classList.remove('hide-drag-handles-when-inside-info-bubble')
    }

    this.props.setInfoBubbleMouseInside(false)

    // Returns focus to body when pointer leaves the info bubble area
    // so that keyboard commands respond to pointer position rather than
    // any focused buttons/inputs
    loseAnyFocus()
  }

  updateInfoBubbleState = () => {
    const street = getStreet()
    const segment = street.segments[this.props.dataNo]
    this.setState({
      type: infoBubble.type,
      street,
      segment,
      description: getDescriptionData(segment)
    })
  }

  /**
   * Retrieve name from segment data. It should also find the equivalent strings from the
   * translation files if provided.
   */
  getName = () => {
    let name

    switch (this.state.type) {
      case INFO_BUBBLE_TYPE_SEGMENT: {
        const segment = this.state.segment
        if (segment) {
          const segmentName = SEGMENT_INFO[segment.type].name
          const segmentVariantName = SEGMENT_INFO[segment.type].details[segment.variantString].name
          const segmentType = segment.type
          const segmentVariant = segment.variantString

          // Not all variants have custom names. If the custom segment variant name doesn't exist,
          // then it should use the default name for the segment.
          if (segmentVariantName) {
            name = t(`segments.${segmentType}.details.${segmentVariant}.name`, segmentVariantName, { ns: 'segment-info' })
          } else {
            name = t(`segments.${segmentType}.name`, segmentName, { ns: 'segment-info' })
          }
        }
        break
      }
      case INFO_BUBBLE_TYPE_LEFT_BUILDING: {
        const variantId = this.state.street.leftBuildingVariant
        const backupName = BUILDING_VARIANT_NAMES[BUILDING_VARIANTS.indexOf(variantId)]
        name = t(`buildings.${variantId}.name`, backupName, { ns: 'segment-info' })
        break
      }
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING: {
        const variantId = this.state.street.rightBuildingVariant
        const backupName = BUILDING_VARIANT_NAMES[BUILDING_VARIANTS.indexOf(variantId)]
        name = t(`buildings.${variantId}.name`, backupName, { ns: 'segment-info' })
        break
      }
      default:
        break
    }

    return name
  }

  render () {
    const type = this.state.type
    const canBeDeleted = (type === INFO_BUBBLE_TYPE_SEGMENT)
    const segmentEl = infoBubble.segmentEl
    const className = 'info-bubble' + ((this.props.visible) ? ' visible' : '')

    // Determine width or height control type
    let widthOrHeightControl
    switch (type) {
      case INFO_BUBBLE_TYPE_SEGMENT:
        widthOrHeightControl = <WidthControl segmentEl={segmentEl} position={this.props.dataNo} />
        break
      case INFO_BUBBLE_TYPE_LEFT_BUILDING:
        widthOrHeightControl = (
          <BuildingHeightControl position="left" />
        )
        break
      case INFO_BUBBLE_TYPE_RIGHT_BUILDING:
        widthOrHeightControl = (
          <BuildingHeightControl position="right" />
        )
        break
      default:
        widthOrHeightControl = null
        break
    }

    return (
      <div
        className={className}
        data-type={(type === INFO_BUBBLE_TYPE_SEGMENT) ? 'segment' : 'building'}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onTouchStart={this.onTouchStart}
      >
        <div className="info-bubble-triangle" />
        <header>
          {this.getName()}
          <RemoveButton enabled={canBeDeleted} segment={segmentEl} />
        </header>
        <div className="info-bubble-controls">
          <Variants type={type} segment={this.state.segment} street={this.state.street} dataNo={this.props.dataNo} />
          {widthOrHeightControl}
        </div>
        <Warnings segment={this.state.segment} />
        <Description description={this.state.description} type={this.state.segment && this.state.segment.type} />
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    visible: state.infoBubble.visible,
    dataNo: state.infoBubble.dataNo
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setInfoBubbleMouseInside: (value) => { dispatch(setInfoBubbleMouseInside(value)) }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoBubble)
