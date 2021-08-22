/* ThreeD.js: React component where the model is rendered.
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

import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "react-three-fiber";
import * as THREE from "three";
import sanid from "./textures/sanid.png";
import { useThree, createPortal } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, useCamera } from '@react-three/drei'
import { Vector3 } from "three";

// TODO[Enhancement]: Fix lighting and shadows and textures
// maybe also write member name on the boxes

let keyCounter;
// Shows a viewCube on the top right
function Viewcube() {
    const { gl, scene, camera, size } = useThree()
    const virtualScene = useMemo(() => new THREE.Scene(), [])
    const virtualCam = useRef()
    const ref = useRef()
    const [hover, setH] = useState(null)
    const matrix = new THREE.Matrix4()

    useFrame(() => {
        matrix.copy(camera.matrix).invert()
        ref.current.quaternion.setFromRotationMatrix(matrix)
        gl.autoClear = true
        gl.render(scene, camera)
        gl.autoClear = false
        gl.clearDepth()
        gl.render(virtualScene, virtualCam.current)
    }, 1)

    // TODO[Enhancement]: set view on click of viewcube (top view, side view etc)
    return createPortal(
        <>
            <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} />
            <mesh
                ref={ref}
                raycast={useCamera(virtualCam)}
                position={[size.width / 2 - 80, size.height / 2 - 80, 0]}
                onPointerOut={(e) => setH(null)}
                onPointerMove={(e) => setH(Math.floor(e.faceIndex / 2))}>


                {[...Array(6)].map((_, index) => (
                    <meshLambertMaterial attachArray="material" key={index} color={hover === index ? 'hotpink' : 'white'} />
                ))}

                <boxGeometry args={[60, 60, 60]} />
            </mesh>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
        </>,
        virtualScene
    )
}

const ConcreteMember = (props) => {
    const texture_sanid = useMemo(() => new THREE.TextureLoader().load(sanid), []);
    const shp = useMemo(() => {
        const rectShape = new THREE.Shape()
            .moveTo(0, 0)
            .lineTo(-props.d, 0)
            .lineTo(-props.d, props.w)
            .lineTo(0, props.w);
        return rectShape;
    }, [props.d, props.w]);
    const ep = useMemo(() => {
        const path = new THREE.LineCurve3(
            new Vector3(props.start[0], props.start[1], props.start[2]),
            new Vector3(props.end[0], props.end[1], props.end[2])
        );
        return path;
    }, [props.start, props.end]);


    var extrudeSettings = {
        steps: 1,
        extrudePath: ep
    };

    return (
        <mesh>
            <extrudeGeometry attach="geometry" args={[shp, extrudeSettings]} />
            <meshStandardMaterial opacity={0.5} attach="material" transparent side={THREE.DoubleSide}>
                <primitive attach="map" object={texture_sanid} />
            </meshStandardMaterial>
        </mesh>
    )
}

// yeah this is ugly af
function makeLabelCanvas(size, name) {
    const borderSize = 50;
    const ctx = document.createElement('canvas').getContext('2d');
    const font = `20px arial`;
    ctx.font = font;
    // measure how long the name will be
    const doubleBorderSize = borderSize * 2;
    const width = ctx.measureText(name).width + doubleBorderSize;
    const height = size + doubleBorderSize;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = 'top';

    ctx.fillStyle = 'white';
    ctx.fillText(name, borderSize, borderSize);

    return ctx.canvas;
}

// makes a cube. with center and size
const FENode = (props) => {
    // Load texture
    //const texture_sanid = useMemo(() => new THREE.TextureLoader().load(sanid), []);

    let size = props.size;
    let pos = new THREE.Vector3(props.c[0], props.c[1], props.c[2]);// boxes are created on their center
    return (
        <mesh
            {...props}
            // here u can do stuff like onClick={(e) => ...}
            position={pos}
        >
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial attach="material" transparent side={THREE.DoubleSide} color={"red"}>
            </meshStandardMaterial>
        </mesh>
    );
}

const FERod = (props) => {
    const shp = useMemo(() => {
        const rectShape = new THREE.Shape()
            .moveTo(-parseFloat(props.d) / 2, -parseFloat(props.w) / 2)
            .lineTo(parseFloat(props.d) / 2, -parseFloat(props.w) / 2)
            .lineTo(parseFloat(props.d) / 2, parseFloat(props.w) / 2)
            .lineTo(-parseFloat(props.d) / 2, parseFloat(props.w) / 2);
        return rectShape;
    }, [props.d, props.w]);
    const ep = useMemo(() => {
        const path = new THREE.LineCurve3(
            new Vector3(props.start[0], props.start[1], props.start[2]),
            new Vector3(props.end[0], props.end[1], props.end[2])
        );
        return path;
    }, [props.start, props.end]);


    var extrudeSettings = {
        steps: 1,
        extrudePath: ep
    };

    return (
        <mesh>
            <extrudeGeometry attach="geometry" args={[shp, extrudeSettings]} />
            <meshStandardMaterial color={"blue"}>
            </meshStandardMaterial>
        </mesh>
    )
}

const FElabel = (props) => {
    const canvas = makeLabelCanvas(10, props.text);
    const texture = new THREE.CanvasTexture(canvas);
    return (
        <sprite
            {...props}>
            <planeBufferGeometry width={0.2} height={0.2} />
            <spriteMaterial map={texture} side={THREE.DoubleSide} transparent={true} opacity={1} depthWrite={false}></spriteMaterial>
        </sprite>
    )
}

const makeConcretesArray = (modelDb) => {
    // Populate boxes array (each box is an element of the model)
    let concretes = [];

    // Columns first
    for (let i = 0; i < modelDb.cols.length; i++) {
        let col = modelDb.cols[i];
        concretes.push(<ConcreteMember start={col.start} end={col.end} w={col.size.x} d={col.size.y} key={keyCounter++} />)
    }

    // Now do beams
    for (let i = 0; i < modelDb.beams.length; i++) {
        let beam = modelDb.beams[i];
        concretes.push(<ConcreteMember start={beam.start} end={beam.end} w={beam.size.x} d={beam.size.z} key={keyCounter++} />)
    }
    return concretes;
}

const makeFEArray = (modelDb) => {
    let nodesize = 0.3;
    let rodsize = 0.15;
    let mesh = [];
    let offset = -0.2;// how far from the node or member to put the 
    // Draw nodes
    for (let i = 0; i < modelDb.FEnodes.length; i++) {
        mesh.push(<FENode c={modelDb.FEnodes[i].coords} size={nodesize} key={keyCounter++} />)
        mesh.push(<FElabel text={"N" + i} position={[modelDb.FEnodes[i].coords[0] + offset, modelDb.FEnodes[i].coords[1] + offset, modelDb.FEnodes[i].coords[2] + offset]} />);
    }
    // Draw members
    for (let i = 0; i < modelDb.FEmembers.length; i++) {
        // find start,end
        let fromCoords = undefined;
        let toCoords = undefined;
        let found1 = false;
        let found2 = false;

        for (let j = 0; j < modelDb.FEnodes.length; j++) {
            if (modelDb.FEnodes[j].name === modelDb.FEmembers[i].from) {
                fromCoords = modelDb.FEnodes[j].coords;
                found1 = true;
            }
            if (modelDb.FEnodes[j].name === modelDb.FEmembers[i].to) {
                toCoords = modelDb.FEnodes[j].coords;
                found2 = true;
            }
            if (found1 && found2) {
                console.log("found start and fin")
                break;
            }
        }
        if (found1 && found2) {

            mesh.push(<FERod start={fromCoords} end={toCoords} w={rodsize} d={rodsize} key={keyCounter++} />)
            mesh.push(<FElabel text={"M" + i} position={[(fromCoords[0] + toCoords[0]) / 2 + offset, (fromCoords[1] + toCoords[1]) / 2 + offset, (fromCoords[2] + toCoords[2]) / 2 + offset]} />);
        }
    }
    return mesh;
}

const makeSolutionArray = (modelDb) => {
    let nodesize = 0.3;
    let rodsize = 0.15;
    let mesh = [];
    let offset = -0.2;// how far from the node or member to put the 
    // Draw nodes
    for (let i = 0; i < modelDb.FEnodes.length; i++) {
        mesh.push(<FENode c={modelDb.FEnodes[i].coords} size={nodesize} key={keyCounter++} />)
        mesh.push(<FElabel text={"N" + i} position={[modelDb.FEnodes[i].coords[0] + offset, modelDb.FEnodes[i].coords[1] + offset, modelDb.FEnodes[i].coords[2] + offset]} />);
    }
    // Draw members
    for (let i = 0; i < modelDb.FEmembers.length; i++) {
        // find start,end
        let fromCoords = undefined;
        let toCoords = undefined;
        let found1 = false;
        let found2 = false;

        for (let j = 0; j < modelDb.FEnodes.length; j++) {
            if (modelDb.FEnodes[j].name === modelDb.FEmembers[i].from) {
                fromCoords = modelDb.FEnodes[j].coords;
                found1 = true;
            }
            if (modelDb.FEnodes[j].name === modelDb.FEmembers[i].to) {
                toCoords = modelDb.FEnodes[j].coords;
                found2 = true;
            }
            if (found1 && found2) {
                console.log("found start and fin")
                break;
            }
        }
        if (found1 && found2) {

            mesh.push(<FERod start={fromCoords} end={toCoords} w={rodsize} d={rodsize} key={keyCounter++} />)
            mesh.push(<FElabel text={"M" + i} position={[(fromCoords[0] + toCoords[0]) / 2 + offset, (fromCoords[1] + toCoords[1]) / 2 + offset, (fromCoords[2] + toCoords[2]) / 2 + offset]} />);
        }
    }
    return mesh;
}

const CameraControls = () => {
    // Get a reference to the Three.js Camera, and the canvas html element.
    // We need these to setup the OrbitControls class.
    // https://threejs.org/docs/#examples/en/controls/OrbitControls

    const {
        camera,
        gl: { domElement },
    } = useThree();
    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef();
    useFrame((state) => controls.current.update());
    // TODO[Enhancement]: Calculate target similarly to how sketchup pan and rotate works
    // The target should be the object the mouse is on when rotating or zooming starts
    return (
        <OrbitControls
            ref={controls}
            target={[1, 1, 1.5]}
            args={[camera, domElement]}
        />
    );
};

const doNothing = () => {
    //xd
}
const ThreeD = (props) => {
    keyCounter = 0; 
    THREE.Object3D.DefaultUp.set(0, 0, 1);
    let md = props.febe.modelDb;
    console.log(md);
    let fe,c,s;
    if(props.febe.concEnabled){
        c=makeConcretesArray(md);
    }
    if(props.febe.FEenabled){
        fe=makeFEArray(md)
    }
    if(props.febe.solEnabled){
        s=makeSolutionArray(md);
    }
    return (
        <Canvas>
            <ambientLight intensity={0.1} />
            <pointLight position={[100, 150, 120]} />
            <axesHelper size={5} />
            {fe}
            {c}
            {s}
            <CameraControls />
            <Viewcube />
        </Canvas>
    );
}

export default ThreeD;