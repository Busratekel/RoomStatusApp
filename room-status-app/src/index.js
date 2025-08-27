import 'es5-shim/es5-shim';
import 'es5-shim/es5-sham';
import 'es6-promise/auto';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import RoomDisplay from './RoomDisplay';

// Samsung TV için basit render
ReactDOM.render(
  React.createElement(RoomDisplay),
  document.getElementById('root')
);
