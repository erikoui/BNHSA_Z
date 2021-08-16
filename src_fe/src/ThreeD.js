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
import { PerspectiveCamera, Vector3 } from "three";


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

// makes a box. set dimensions using scale property
const Box = (props) => {
    // This reference will give us direct access to the mesh
    const mesh = useRef();

    // Set up state for the hovered and active state 
    const [active, setActive] = useState(false);
    const [hovered, setHover] = useState(false);
    // Rotate mesh every frame, this is outside of React without overhead
    useFrame(() => {
        //this is for local animation of the box
        //mesh.current.rotation.x = mesh.current.rotation.y += 0.01;
    });

    // Load texture
    const texture_sanid = useMemo(() => new THREE.TextureLoader().load(sanid), []);

    return (
        <mesh
            {...props}
            ref={mesh}
            onClick={(e) => setActive(!active)}
            onPointerOver={(event) => setHover(true)}
            onPointerOut={(event) => setHover(false)}
        >
            <boxBufferGeometry args={[1, 1, 1]} />
            <meshBasicMaterial attach="material" transparent side={THREE.DoubleSide}>
                <primitive attach="map" object={texture_sanid} />
            </meshBasicMaterial>
        </mesh>
    );
}

const ConcreteMember = (props) => {
    const texture_sanid = useMemo(() => new THREE.TextureLoader().load(sanid), []);
    const shp = useMemo(() => {
        const rectShape = new THREE.Shape()
            .moveTo(0, 0)
            .lineTo(props.d, 0)
            .lineTo(props.d, props.w)
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
            <meshBasicMaterial attach="material" transparent side={THREE.DoubleSide}>
                <primitive attach="map" object={texture_sanid} />
            </meshBasicMaterial>
        </mesh>
    )
}

const makeBoxesArray = (modelDb) => {
    // Populate boxes array (each box is an element of the model)
    let boxes = [];
    // Columns first
    for (let i = 0; i < modelDb.cols.length; i++) {
        let col = modelDb.cols[i];
        boxes.push(<ConcreteMember start={col.start} end={col.end} w={col.size.w} d={col.size.l} />)
    }

    // Now do beams
    for (let i = 0; i < modelDb.beams.length; i++) {
        let beam = modelDb.beams[i];
        boxes.push(<ConcreteMember start={beam.start} end={beam.end} w={beam.size.w} d={beam.size.h} />)
    }
    return boxes;
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


const ThreeD = (modelDb) => {
    THREE.Object3D.DefaultUp.set(0, 0, 1);
    let md = modelDb.modelDb;//idk why this is nescessary but dont remove it
    return (
        <Canvas>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            {makeBoxesArray(md)}
            <CameraControls />
            <Viewcube />
        </Canvas>
    );
}

export default ThreeD;