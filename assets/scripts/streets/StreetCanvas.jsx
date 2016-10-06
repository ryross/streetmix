import React from 'react'
import { system } from '../preinit/system_capabilities'
import { drawStreetThumbnail } from '../gallery/thumbnail'

const THUMBNAIL_WIDTH = 180
const THUMBNAIL_HEIGHT = 110
const THUMBNAIL_MULTIPLIER = 0.1 * 2

export default class StreetCanvas extends React.Component {
    componentDidMount () {
        this.updateCanvas();
    }

    updateCanvas () {
        var ctx = this.refs.canvas.getContext('2d')
        drawStreetThumbnail(ctx, this.props.street, THUMBNAIL_WIDTH * 2, THUMBNAIL_HEIGHT * 2, THUMBNAIL_MULTIPLIER,
                this.props.silhouette, this.props.bottomAligned, this.props.transparentSky, this.props.segmentNamesAndWidths,
                this.props.streetName)
    }

    render () {
        const width = THUMBNAIL_WIDTH * system.hiDpi * 2
        const height = THUMBNAIL_HEIGHT * system.hiDpi * 2

        return (
                <canvas ref="canvas" width={width} height={height}/>
        )
    }
}

StreetCanvas.propTypes = {
    silhouette: React.PropTypes.bool,
    bottomAligned: React.PropTypes.bool,
    transparentSky: React.PropTypes.bool,
    segmentNamesAndWidths: React.PropTypes.bool,
    streetName: React.PropTypes.bool,
    street: React.PropTypes.any
}


