// be.cpp: Back end entry point for BNHSA_Z.
// Copyright (C) 2021  erikoui

// Possible enhancement: render stuff in the terminal with this
// https://github.com/Victormeriqui/Consol3

#include <iostream>
#include <stdlib.h>
// I dont know how to setup include directories
#include "C:/eigen/Eigen/Dense"
#include "json.hpp"
#include <iomanip>
#include <fstream>
#include <vector>
#include <math.h>
#include "C:/eigen/Eigen/StdVector"

using namespace Eigen;
using json = nlohmann::json;

int main(int argc, char* argv[])
{
    json modelDb;
    int i, j;

    // Show about box and exit with no arguments
    if (argc == 1) {
        std::cout << std::endl
            << std::endl
            << "               BNHSA_Z Copyright (C) 2021 erikoui" << std::endl
            << "         This program comes with ABSOLUTELY NO WARRANTY;" << std::endl
            << "     This is free software, and you are welcome to redistribute it" << std::endl
            << "               under the conditions of GNU GPL 3.0." << std::endl
            << std::endl
            << std::endl;
        exit(0);
    }

    // Read entire file into memory
    std::cout << "Loading file " << argv[1] << std::endl;
    std::string jsonRaw;
    std::ifstream file(argv[1]);
    if (file.is_open()) {
        // Allocate memory
        file.seekg(0, std::ios::end);
        jsonRaw.reserve(file.tellg());
        file.seekg(0, std::ios::beg);
        // Save the datat in jsonRaw
        jsonRaw.assign((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    }
    else {
        std::cout << "Error opening file." << std::endl;
        exit(1);
    }

    // Parse jsonRaw to json object
    try {
        modelDb = json::parse(jsonRaw);
        jsonRaw.clear();
        if (modelDb["FEnodes"].size() == 0) {
            throw std::runtime_error("No nodes defined.");
        }
    }
    catch (const std::exception& e) {
        std::cout << "Error in file data: " << e.what() << std::endl;
        exit(1);
    }

    // Convert json data to matrices
    std::cout << "File loaded. Converting to Eigen matrices..." << std::endl;

    // Node matrix
    int nNodes = modelDb["FEnodes"].size();
    MatrixXd N(nNodes, 3);//this could also be a std::vector
    for (i = 0;i < nNodes;i++) {
        for (j = 0;j < 3;j++) {
            N(i, j) = modelDb["FEnodes"][i]["coords"][j];
        }
    }
    std::cout << std::endl << "Node matrix:" << std::endl << N << std::endl;

    // Connectivity matrix
    int nMembers = modelDb["FEmembers"].size();
    MatrixXd C(nMembers, 2);//this could also be a std::vector
    for (i = 0;i < nMembers;i++) {
        C(i, 0) = modelDb["FEmembers"][i]["from"];
        C(i, 1) = modelDb["FEmembers"][i]["to"];
    }
    std::cout << std::endl << "Connectivity matrix:" << std::endl << C << std::endl;

    // Material properties
    VectorXd E(nMembers);
    VectorXd Ix(nMembers);
    VectorXd Iy(nMembers);
    VectorXd J(nMembers);
    VectorXd A(nMembers);
    VectorXd L(nMembers);
    std::vector<MatrixXd> Rx(nMembers);
    std::vector<MatrixXd> Ry(nMembers);
    std::vector<MatrixXd> Rz(nMembers);
    VectorXd G(nMembers);
    // For now, we only store the area of the member as material info.
    for (i = 0;i < nMembers;i++) {
        // TODO[Critical]: Need to store E,I,A,L with the member in modelDb
        E(i) = 30000;
        Ix(i) = 0.25 * 0.5 * 0.5 * 0.5 / 12;
        Iy(i) = 0.25 * 0.25 * 0.25 * 0.5 / 12;
        J(i) = 0.25 * 0.5 * (0.5 * 0.5 + 0.25 * 0.25) / 12;
        A(i) = 0.25 * 0.5;
        L(i) = 3;
        G(i) = 10000;//shear modulus

        // Calculate rotations
        double x1=N(C(i,0),0);
        double x2=N(C(i,1),0);
        double y1=N(C(i,0),1);
        double y2=N(C(i,1),1);
        double z1=N(C(i,0),2);
        double z2=N(C(i,1),2);
        double thetax = 0;// axial rotation, could be user-defined in future
        double thetay = atan2(x2-x1, z2-z1);// rotation in strong axis (think up-down on a standard I-beam)
        double thetaz = atan2(x2-x1, y2-y1);// rotation in weak axis (left-right)
        Rx[i].resize(3, 3);
        Ry[i].resize(3, 3);
        Rz[i].resize(3, 3);
        Rx[i] << 1, 0, 0, 0, cos(thetax), -sin(thetax), 0, sin(thetax), cos(thetax);
        Ry[i] << cos(thetay), 0, sin(thetay), 0, 1, 0, -sin(thetay), 0, cos(thetay);
        Rz[i] << cos(thetaz), -sin(thetaz), 0, sin(thetax), cos(thetaz), 0, 0, 0, 1;

    }
    std::cout << std::endl << "Material Properties:" << std::endl << E << std::endl << Ix << std::endl << Iy << std::endl << A << std::endl << L << std::endl << G << std::endl;

    // TODO: Check data is correct and ready to process
    // check for no zero length things
    // Check for zero Jacobian derivatives at each quadrature point in each element

    // local stiffness matrices
    std::vector<MatrixXd> K_local;
    std::vector<MatrixXd> K_rotated_local;
    K_local.resize(nMembers);
    K_rotated_local.resize(nMembers);
    // For now, we only store the area of the member as material info.
    for (i = 0;i < nMembers;i++) {
        double e, a, l, ix, iy, jj, g;
        g = G(i);
        e = E(i);
        a = A(i);
        l = L(i);
        ix = Ix(i);
        iy = Iy(i);
        jj = J(i);
        K_local[i].resize(12, 12);
        //in order:
        // axial (fx)
        // force in strong direction (fz)
        // force in weak direction (fy)
        // torsion (local mx)
        // bending in strong direction (my)
        // bending in weak direction (mz)

        K_local[i] << e * a / l, 0, 0, 0, 0, 0, -e * a / l, 0, 0, 0, 0, 0,
            0, 12 * e * ix / l / l / l, 0, 0, 0, 6 * e * ix / l / l, 0, -12 * e * ix / l / l / l, 0, 0, 0, 6 * e * ix / l / l,
            0, 0, 12 * e * iy / l / l / l, 0, -6 * e * iy / l / l, 0, 0, 0, -12 * e * iy / l / l / l, 0, -6 * e * iy / l, 0,
            0, 0, 0, g* jj / l, 0, 0, 0, 0, 0, -g * jj / l, 0, 0,
            0, 0, -6 * e * iy / l / l, 0, 4 * e * iy / l, 0, 0, 0, 6 * e * iy / l / l, 0, 2 * e * iy / l, 0,
            0, 6 * e * ix / l / l, 0, 0, 0, 4 * e * iy / l, 0, -6 * e * ix / l / l, 0, 0, 0, 2 * e * ix / l,
            0, 0, 0, 0, 0, 0, e* a / l, 0, 0, 0, 0, 0,
            -e * a / l, -12 * e * ix / l / l / l, 0, 0, 0, -6 * e * ix / l / l, 0, 12 * e * ix / l / l / l, 0, 0, 0, -6 * e * ix / l / l,
            0, 0, -12 * e * iy / l / l / l, 0, 6 * e * iy / l / l, 0, 0, 0, 12 * e * iy / l / l / l, 0, 6 * e * iy / l / l, 0,
            0, 0, 0, -g * jj / l, 0, 0, 0, 0, 0, g* jj / l, 0, 0,
            0, 0, -6 * e * iy / l / l, 0, 2 * e * iy / l, 0, 0, 0, 6 * e * iy / l / l, 0, 4 * e * iy / l, 0,
            0, 6 * e * ix / l / l, 0, 0, 0, 2 * e * ix / l, 0, -6 * e * ix / l / l, 0, 0, 0, 4 * e * ix / l;
        std::cout << std::endl << "Local stiffness:" << i << std::endl << K_local[i] << std::endl;
        
        MatrixXd ChonkeR(12,12);// this is the big rotation matrix 12x12
        Matrix3d R=Rx[i]*Ry[i]*Rz[i];
        Matrix3d zeros;
        zeros<<0,0,0,0,0,0,0,0,0;
        ChonkeR<<R,zeros,zeros,zeros,zeros,R,zeros,zeros,zeros,zeros,R,zeros,zeros,zeros,zeros,R;
        std::cout << std::endl << "Rotation matrix " << i << std::endl;
        std::cout<<ChonkeR;
        K_rotated_local[i]=K_local[i]*ChonkeR;
    }


    //Make global matrices
    //https://www.youtube.com/watch?v=vmjPL33Gugo&list=PLQVMpQ7G7XvHrdHLJgH8SeZQsiy2lQUcV&index=48
    //     local_nodes=2;
    // global_nodes=nNodes;
    // elems=nMembers;

// K=zeros(9);

// for rect=1:elems
//     K(:,:,rect)=zeros(9);
// end

// for i=1:local_nodes
//     for j=1:local_nodes
//         for k=1:elems
//             if(k>1)
//                 if(i<5)&&(j<5)
//                     K(i,j,k)=i*100+j*10+k;
//                 end
//             else 
//                 K(i,j,k)=i*100+j*10+k;
//             end
//         end
//     end
// end




// C=[0,0,0,0,0,4,0,0,0;0,0,0,4,0,0,0,0,0;4,0,0,0,0,0,0,0,0]

// K_global=zeros(max(max(C)));
// K_global=string(K_global);

// for e=1:elems
//     for i=1:local_nodes
//         for j=1:local_nodes
//             p=C(e,i);
//             q=C(e,j);
//             if ((p~=0)&&(q~=0))
//                 K_global(p,q)=strcat(strcat(num2str(K_global(p,q)),"+"),num2str(K(i,j,e)));
//             end
//         end
//     end
// end
// K_global


}