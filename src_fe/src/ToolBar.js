/* ToolBar.js: React component for the toolbar
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
import './ToolBar.css'

const electron = window.require('electron');
const remote = electron.remote
const {dialog} = remote

class ToolBar extends Component {
    render() {
        return (<div className="tool-bar">
            <button onClick={this.open}>Open</button>
        </div>
        );
    }
    open=()=> {
        let filenames=dialog.showOpenDialogSync({title:"Open file"});
        this.props.frontendsBackend.open(filenames[0]);
        //console.log(this.props.frontendsBackend.modelDb.raw);
    }
}

export default ToolBar;