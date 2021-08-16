/* FrontendsBackend.js: Here is where all the model data is stored. It provides functions 
*                       for rendering , editing, and preparing the data for processing by 
*                       the backend.
*    
*    Copyright (C) 2021 erikoui
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

const fs=window.require('fs');
const { ipcRenderer } = window.require("electron");

class FrontendsBackend{
    constructor(){
        this.filename="";
        this.modelDb={raw:""};
    }

    // Function open
    // Args: filename{String}: the path to the model file
    // Loads a model file into the modelDb.
    open(filename){
        // TODO: Make frontentsBackend.open parse the file and save it in a form the software can render and process.
        // This will require also designing a file format.
        
        // Store file info into this object.
        this.filename=filename;
        this.modelDb.raw=fs.readFileSync(filename,{flag:'r'});

        // Send event to electron.js where it can be used or bounced back
        ipcRenderer.send('modelChanged');
    }
}

export default FrontendsBackend;