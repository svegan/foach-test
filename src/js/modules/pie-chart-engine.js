export default class PieChart {
  constructor(elem, params) {
    this.container = elem;
    this.data = params;
    this._renderSegment = this._renderSegment.bind(this);
    this._init();
  }

  _init() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.size = {
      width: this.container.width || 400,
      height: this.container.height || 200,
      radius: 100
    };
    this.center = {
      x: Math.floor(this.size.width / 2),
      y: Math.floor(this.size.height / 2)
    };
    this.canvas.width = this.size.width;
    this.canvas.height = this.size.height;
    this.container.appendChild(this.canvas);
    this._drawSegments();
  }

  _drawSegments(segments) {
    this.segments = this._prepareSegments(this.data);
    this.segments.forEach(this._renderSegment);
  }

  _renderSegment(segment, index, arr) {
    const startAngle = !index ? 0 : arr.slice(0, index).reduce((acc, item) => {
      return acc + item.angle;
    }, 0);

    const endAngle = startAngle + segment.angle;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.center.x, this.center.y);
    this.ctx.arc(
        this.center.x,
        this.center.y,
        this.size.radius,
        this._degToRad(startAngle),
        this._degToRad(endAngle),
        false);
    this.ctx.closePath();

    this.ctx.fillStyle = segment.color;
    this.ctx.fill();

    this.ctx.restore();
  }

  _degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  _prepareSegments(data) {
    return data.parts.map((part, index, array) => {
      return {
        color: part.color,
        angle: Math.round(part.size * 360 / data.total)
      };
    });
  }
}
