// Matthew Musselman
/*jslint browser: true,
         plusplus: true
         white: true */
/*global canvas, transform, requestAnimationFrame */
"use strict";

var COLORS = { "-x": BLUE, "+x": GREEN, "-y": WHITE,
        "+y": YELLOW, "-z": ORANGE, "+z": RED };

var SQUARE_VERTICES = [
        -0.5, -0.5, 0,
         0.5, -0.5, 0,
        -0.5,  0.5, 0,
         0.5,  0.5, 0 ];

var rotate = true, move = true, inner = true; 
var xRot = 20, yRot = 20, rot = 20;

var main = function () {
    var cv, tf, buffer, subCube, subCubes, x, y, z, frame, animateScene;

    cv = canvas("canvas", DARKBLUE);
    cv.setupShaders("/js/cube/vertexShader.js", "/js/cube/fragmentShader.js", "transform",
            "position", "color");

    buffer = cv.copyVertexDataToBuffer(SQUARE_VERTICES);

    // Initialize transform with perspective normalization
    // and viewing transformations.
    tf = transform();
    tf.perspectiveNormalization(2, 1.5, 10, 30);
    tf.translate(0, 0, -20);
    //tf.rotateX(20);
    //tf.rotateY(-30);
    
    // x - Initial x position of sub cube (-1, 0 or 1).
    // y - Initial y position of sub cube (-1, 0 or 1).
    // z - Initial z position of sub cube (-1, 0 or 1).
    //
    // Create sub cube object (but don't call this with "new")
    // that remembers its transform and colors.
    subCube = function (x, y, z) {
        var pb = {}, pv = {}, temp;
		pv.x = x;
		pv.y = y;
		pv.z = z;

        pv.transform = transform();
        pv.transform.translate(x, y, z);

        pv.colors = {};

        if      (x === -1) { pv.colors["-x"] = COLORS["-x"]; }
        else if (x ===  1) { pv.colors["+x"] = COLORS["+x"]; }

        if      (y === -1) { pv.colors["-y"] = COLORS["-y"]; }
        else if (y ===  1) { pv.colors["+y"] = COLORS["+y"]; }

        if      (z === -1) { pv.colors["-z"] = COLORS["-z"]; }
        else if (z ===  1) { pv.colors["+z"] = COLORS["+z"]; }

        // color - 3-value array representing the color of the
        //         inner square.  If undefined, only the black
        //         outer square will be drawn.
        //
        // Draw outer black square, and if color is not undefined,
        // inner (slightly in front) colored square.  Assumes
        // initial transform puts it at the center of a cube,
        // where this square should be a face 0.5 away from the
        // center in the z direction.  (Initial transform is
        // restored at the end of this function.)
        pv.drawSquare = function (color) {
            pv.transform.push();
            pv.transform.translate(0, 0, 0.5);
            cv.setTransform(pv.transform);
            cv.setColor(BLACK);
            if(inner) {
            	cv.drawFromBuffer(buffer, 0, 4);
            }

            if (color !== undefined) {
                pv.transform.translate(0, 0, 0.01);
                pv.transform.scale(0.9);
                cv.setTransform(pv.transform);
                cv.setColor(color);
                cv.drawFromBuffer(buffer, 0, 4);
            }

            pv.transform.pop();
        };

        // Draw the six faces of the sub cube.
        pb.draw = function () {
            pv.transform.push();
        
            // Make this sub cube's transform come after whatever
            // is the current overall transform for the scene.
            pv.transform.preMultiplyBy(tf);
           	pv.drawSquare(pv.colors["+z"]);
            pv.transform.rotateY(90);           
           	pv.drawSquare(pv.colors["+x"]);
            pv.transform.rotateY(90);
           	pv.drawSquare(pv.colors["-z"]);
            pv.transform.rotateY(90);            
           	pv.drawSquare(pv.colors["-x"]);
            pv.transform.rotateX(90);          
           	pv.drawSquare(pv.colors["-y"]);
            pv.transform.rotateX(180);
            pv.drawSquare(pv.colors["+y"]);
            pv.transform.pop();
        };
		
		pb.rotateX = function () {
			pv.transform.preRotateX(90);
			temp = pv.y;
			pv.y = -pv.z;
			pv.z = temp;
		};
		
		pb.rotateY = function () {
			pv.transform.preRotateY(90);
			temp = pv.x;
			pv.x = pv.z;
			pv.z = -temp;
		};
		
		pb.rotateZ = function () {
			pv.transform .preRotateZ(90);
			temp = pv.x;
			pv.x = -pv.y;
			pv.y = temp;
		};
		
		pb.getX = function() {
			return pv.x;
		}

		pb.getY = function() {
			return pv.y;
		}
		
		pb.getZ = function() {
			return pv.z;
		}

        return pb;
    };

    // Create 3D array of sub cubes.
    subCubes = [];

    for (x = -1; x <= 1; x++) {
        subCubes[x] = [];

        for (y = -1; y <= 1; y++) {
            subCubes[x][y] = [];

            for (z = -1; z <= 1; z++) {
                subCubes[x][y][z] = subCube(x, y, z);
            }
        }
    }

	frame = 0;
    // Draw full cube, composed of sub cubes.
    animateScene = function() {
   	    cv.clear();

		for (x = -1; x <= 1; x++) {
			for (y = -1; y <= 1; y++) {
				for (z = -1; z <= 1; z++) {
  					if(move && subCubes[x][y][z].getX() === 1 && frame >= 0 && frame < 90 ) {
 						tf.push();
						tf.rotateX(frame);
						subCubes[x][y][z].draw();
						tf.pop();
						
						if(frame === 89) { //Last frame, update "stickers"
							subCubes[x][y][z].rotateX();
						}
 					} else if((move && subCubes[x][y][z].getY() === 1) && (frame >= 90 && frame < 180) ) {
 						tf.push();
 						tf.rotateY(frame - 90);
 						subCubes[x][y][z].draw();
 						tf.pop();
						
						if(frame === 179) { //Last frame, update "stickers"
							subCubes[x][y][z].rotateY();
						}
 					} else if(move && subCubes[x][y][z].getZ() === 1 && frame >= 180 && frame < 270) {
 						tf.push();
 						tf.rotateZ(frame - 180);
 						subCubes[x][y][z].draw();
 						tf.pop();
						
						if(frame === 269) { //Last frame, update "stickers"
							subCubes[x][y][z].rotateZ();
						}
					} else {
						subCubes[x][y][z].draw();
					}
				}
			}
		} 
		
		var tempRot = 5;
		if(rotate) {
			tf.rotateX(Math.cos(frame / 500) / rot);
			tf.rotateY(-Math.cos(frame / 500) / rot);
			tf.rotateZ(Math.cos(frame / 500) / rot);	
		}
				
		frame = (frame + 1) % 270;
		requestAnimationFrame(animateScene);
    };
    
    animateScene();
 
};

// Get the value of a GET value passed NOT USED
var getUrlVars = function () {
	var vars = {};
	var parts = window.location.href.replace(
		/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		
		vars[key] = value;
	});
	return vars;
};

function rotToggle() {
	if (rotate) {
		rotate = false;
	} else {
		rotate = true;	
	}
	console.log("Rot: " + rotate);
}

function movToggle() {
	if (move) {
		move = false;
	} else {
		move = true;	
	}
	console.log("Mov: " + move);
}

function innerToggle() {
	if (inner) {
		inner = false;
	} else {
		inner = true;	
	}
	console.log("Inner: " + inner);
}

function faster() {
	rotate = true;
	rot *= (3/4);
	console.log("rot: " + rot);
};

function slower() {
	rotate = true;
	rot *= (4/3);
	console.log("rot: " + rot);
};

