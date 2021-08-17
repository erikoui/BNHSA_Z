// be.cpp: Back end entry point for BNHSA_Z.
// Copyright (C) 2021  erikoui

#include <iostream>
#include <stdlib.h>
// I dont know how to setup include directories
#include "C:/eigen/Eigen/Dense"
#include "json.hpp"
#include <iomanip>
#include <fstream>

using Eigen::MatrixXd;
using json = nlohmann::json;

int main(int argc, char* argv[])
{
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
        json modelDb = json::parse(jsonRaw);
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
}