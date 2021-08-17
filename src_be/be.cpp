// be.cpp: Back end entry point for BNHSA_Z.
// Copyright (C) 2021  erikoui

#include <iostream>
#include <stdlib.h>
// I dont know how to setup include directories
#include "C:/eigen/Eigen/Dense"

using Eigen::MatrixXd;
 
int main(int argc, char *argv[])
{
    // Show about box and exit with no arguments
    if (argc == 1)
    {
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

    
}