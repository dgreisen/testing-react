/*! (c) 2015 | Apache 2.0 licensed */
/** @jsx React.DOM */
if (typeof module !== 'undefined' && module.exports) {
  var React = require('react/addons');
}

var Image = React.createClass({
  render: function() {
    return (
      <div className={"icon icon-" + this.props.src}></div>
    );
  }
})

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Image;
}

else if (typeof window !== 'undefined') {
  window.Image = Image;
}
