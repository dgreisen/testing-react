/** @jsx React.DOM */
if (typeof module !== 'undefined' && module.exports) {
  var React = require('react/addons');
  var Image = require('./Image');
  var CheckBoxWithLabel = require('/CheckBoxWithLabel');
}

var Example = React.createClass({
  render: function() {
    return (
      <div>
        <p>This is a sample react component.</p>
        <p><CheckboxWithLabel labelOn="On" labelOff="Off" /></p>
        <Image src="test1" />
        <p><CheckboxWithLabel labelOn="Yes" labelOff="No" /></p>
        <Image src="test3" />
      </div>
    );
  }
})


if (typeof module !== 'undefined' && module.exports) {
  module.exports = Example;
}

if (typeof document != 'undefined' && document.getElementById) {
  React.render(
    <Example />,
    document.getElementById('react-app')
  )
}
