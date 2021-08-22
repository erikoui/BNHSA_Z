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

const fs = window.require('fs');
const { ipcRenderer } = window.require("electron");

class FrontendsBackend {
    constructor() {
        this.filename = "";
        // All dimensions in meters, all forces in newtons
        this.modelDb = { raw: "" };
        this.modelDb.cols = [];
        this.modelDb.beams = [];
        this.modelDb.FEnodes = [];
        this.modelDb.FEmembers = [];
        this.modelDb.nodeLoads = [];
        this.modelDb.nodeMoments = [];

        this.FEenabled = false;
        this.concEnabled = false;
        this.solEnabled = false;
    }

    // Function open
    // Args: filename{String}: the path to the model file
    // Loads a model file into the modelDb.
    open(filename) {
        this.filename = filename;
        this.modelDb.raw = fs.readFileSync(filename, { flag: 'r' });
        this.modelDb = { ...JSON.parse(this.modelDb.raw) };
        // Send event to electron.js where it can be used or bounced back
        ipcRenderer.send('modelChanged');
    }

    save(filename) {
        this.filename = filename;
        fs.writeFileSync(filename, JSON.stringify(this.modelDb));
    }

    dist3d(p1, p2) {
        return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]) + (p1[2] - p2[2]) * (p1[2] - p2[2]));
    }

    generateFEModel() {
        console.log("Generating FE model")
        // nodes always pass through the center of columns
        // l:x
        // w:y
        // h:z
        for (let i = 0; i < this.modelDb.cols.length; i++) {
            let c = this.modelDb.cols[i];
            let x1 = parseFloat(c.start[0]) + parseFloat(c.size.x) / 2;
            let y1 = parseFloat(c.start[1]) + parseFloat(c.size.y) / 2;
            let z1 = parseFloat(c.start[2]);
            let x2 = parseFloat(c.end[0]) + parseFloat(c.size.x) / 2;
            let y2 = parseFloat(c.end[1]) + parseFloat(c.size.y) / 2;
            let z2 = parseFloat(c.end[2]);
            this.modelDb.FEnodes.push({ colIndex: i, name: (i * 2), coords: [x1, y1, z1] }, { colIndex: i, name: (i * 2 + 1), coords: [x2, y2, z2] });
            this.modelDb.FEmembers.push({ from: (i * 2), to: (i * 2 + 1) });
        }
        console.log(this.modelDb)
        // TODO: Rewrite beam to member conversion system
        // this one is filled with hacks and works as follows:
        // ```
        // for beams, need to find which beams touch which nodes
        // check distance from edge of beam to edge of column, if d<=colwidth/2, then touching.
        // if there are problems with model generation, this is where you should check first.
        // special cases: columns changing size, columns on transfer beams <- not implemented yet
        // check if column i touches beam j
        // ```
        // Alternatively, let the user input this info
        for (let j = 0; j < this.modelDb.beams.length; j++) {
            let i;
            let i1 = undefined;
            let i2 = undefined;
            for (i = 0; i < this.modelDb.FEnodes.length; i++) {
                let b = this.modelDb.beams[j];
                let x1 = parseFloat(b.start[0]) + parseFloat(b.size.x) / 2;
                let y1 = parseFloat(b.start[1]);
                let z1 = parseFloat(b.start[2]) + parseFloat(b.size.z) / 2;;
                let beam_edge1 = [x1, y1, z1];
                let d1 = this.dist3d(this.modelDb.FEnodes[i].coords, beam_edge1);
                let limit = Math.max(this.modelDb.cols[this.modelDb.FEnodes[i].colIndex].size.x, this.modelDb.cols[this.modelDb.FEnodes[i].colIndex].size.y);

                if (d1 < limit) {
                    console.log("touches start"+ i)
                    i1 = i;
                    break;
                }
            }
            for (i=0; i < this.modelDb.FEnodes.length; i++) {
                let b = this.modelDb.beams[j];
                let x2 = parseFloat(b.end[0]) + parseFloat(b.size.x) / 2;
                let y2 = parseFloat(b.end[1]);
                let z2 = parseFloat(b.end[2]) + parseFloat(b.size.z) / 2;;
                let beam_edge2 = [x2, y2, z2];

                let d2 = this.dist3d(this.modelDb.FEnodes[i].coords, beam_edge2);
                let limit = Math.max(this.modelDb.cols[this.modelDb.FEnodes[i].colIndex].size.x, this.modelDb.cols[this.modelDb.FEnodes[i].colIndex].size.y)+0.2

                if (d2 < limit) {
                    console.log("touches end"+i)
                    i2 = i;
                    break;
                }
            }
            if (i1 && i2) {
                this.modelDb.FEmembers.push({ from: (i1), to: (i2) });
            }
        }
        // TODO: check if there are other beam nodes e.g cantilever beams
        ipcRenderer.send('modelChanged');
    }

    toggleFEM(){
        this.FEenabled=!this.FEenabled;
        ipcRenderer.send('modelChanged');
    }
    toggleConc(){
        this.concEnabled=!this.concEnabled;
        ipcRenderer.send('modelChanged');
    }
    toggleSol(){
        this.solEnabled=!this.solEnabled;
        ipcRenderer.send('modelChanged');
    }
}

export default FrontendsBackend;