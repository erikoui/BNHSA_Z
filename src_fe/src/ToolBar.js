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
const { dialog } = remote

let filenames;
class ToolBar extends Component {
    render() {
        return (<div className="tool-bar">
            <button onClick={this.open}>Open</button>
            <button onClick={this.reopen}>Reopen</button>
            <button onClick={this.save}>Save</button>
            <button onClick={this.genFEM}>Gen FE</button>
            <button onClick={this.togFEM}>toggle FE</button>
            <button onClick={this.togConc}>toggle C</button>
            <button onClick={this.togSol}>toggle S</button>
        </div>
        );
    }
    open = () => {
        filenames = dialog.showOpenDialogSync({ title: "Open file" });
        if (filenames) {
            this.props.frontendsBackend.open(filenames[0]);
        }
    }
    reopen = () => {
        if (filenames) {
            this.props.frontendsBackend.open(filenames[0]);
        }
    }
    save = () => {
        let filename = dialog.showSaveDialogSync({ title: "Save file" });
        if (filename) {
            this.props.frontendsBackend.save(filename);
        }
    }
    genFEM = () => {
        // TODO[Enhancement]: Ask to confirm if the user made changes to the FEModel
        // Also maybe remember which ones were edited and only update the new ones.
        // This is not a critical task.
        this.props.frontendsBackend.generateFEModel();
    }
    togFEM = () => {
        this.props.frontendsBackend.toggleFEM();
    }
    togConc = () => {
        this.props.frontendsBackend.toggleConc();
    }
    togSol = () => {
        this.props.frontendsBackend.toggleSol();
    }
}

export default ToolBar;