/* DesignWindow.js: React component for the window under the toolbar where all the rendering
*  and editing will be done.
*
*  Copyright (C) 2021 erikoui
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.

*    You should have received a copy of the GNU General Public License
*    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React, { Component } from 'react';
import ToolBar from './ToolBar.js';
import './DesignWindow.css';
import ThreeD from './ThreeD.js';
const { ipcRenderer } = window.require("electron");

class DesignWindow extends Component {
    render() {
        console.log(this.props.frontendsBackend);
        return (
            <div className="design-window">
                <ToolBar frontendsBackend={this.props.frontendsBackend} />
                <ThreeD febe={this.props.frontendsBackend} />
            </div>
        );
    }

    componentDidMount = () => {
        ipcRenderer.on('modelChanged', () => {
            this.forceUpdate();
        });
    }
}
export default DesignWindow;