# BNHSA_Z

*This project has been moved to erikoui/structure_optimizer*

Used to be a 3-d Finite element solver for structures (Euler-bernoulli beam) including 3d representation in the frontend.

## Running the frontend
Navigate to frontend directory: `cd src_fe`

Install dependencies: `npm i`

Development run
```
npm run start
```

Production build
```
npm run build
```

Main entry point is: `src_fe/public/electron.js`

React files are in: `src_fe/src`


## Running the backend
It's supposed to be ran by the front end, but for now:
```
./be.exe <input file>
```
