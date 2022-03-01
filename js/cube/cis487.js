// By David Owen
// Used by permission for CIS 487
// Modified by Matthew Musselman
/*jslint browser: true,
         devel: true,
         bitwise: true,
         plusplus: true,
         white: true */
/*global Float32Array */

//Some Colors
var RED       = [1.0,  0.2,  0.1],
	ORANGE    = [1.0,  0.6,  0.1],
 	YELLOW    = [1.0,  0.9,  0.1],
 	GREEN     = [0.2,  0.7,  0.3],
	BLUE      = [0.1,  0.3,  0.9],
 	PURPLE    = [0.5,  0.0,  0.5],
 	GRAY      = [0.5,  0.5,  0.5],
 	CYAN      = [0.1,  1.0,  1.0],
 	MAGENTA   = [1.0,  0.1,  1.0],
 	WHITE     = [1.0,  1.0,  1.0],
 	BLACK     = [0.0,  0.0,  0.0],
 	DARKBLUE  = [0.1,  0.2,  0.3],
 	LIGHTGRAY = [0.95, 0.95, 0.95];

// id - HTML file canvas element's id.
// clearColor (optional) - Color to use when clearing the canvas.
//         (If not specified, will be black.)
//
// Create a canvas object--a wrapper providing simplified access
// to WebGL.  (The structure of this function represents an
// attempt to create something which, from the outside is as
// class-like as possible but internally uses Javascript
// prototype-style objects.  And, based on Crockford's advice,
// it's defined in such a way that you don't use "new" when
// you create an instance.)
var canvas = function (id, clearColor) {
    "use strict";

    // Empty container objects, for public and private members.
    var pb = {}, pv = {};

    // Add a private field to reference the canvas element's
    // WebGL context.
    pv.gl = document.getElementById(id).getContext(
            "experimental-webgl");

    // Draw objects back to front, not first to last.
    pv.gl.enable(pv.gl.DEPTH_TEST);

    // If this function ("Canvas") was called with just one
    // argument, clearColor will be undefined.  In that case use
    // the default--black.
    if (clearColor === undefined) {
        pv.gl.clearColor(0, 0, 0, 1);

    // If this function ("Canvas") was called with two arguments,
    // clearColor won't be undefined, so we'll come here and use
    // the specified clear color.
    } else {
        pv.gl.clearColor(
                clearColor[0], clearColor[1], clearColor[2], 1);
    }

    // Add a private method...
    //
    // url - URL (from same domain) to read from.
    //
    // Returns text from URL (or server error message text).
    pv.readFromUrl = function (url) {
        var request = new XMLHttpRequest();

        request.open("GET", url, false);   // "false" here means
        request.send();                    // the request is
                                           // synchronous.
        return request.responseText;
    };

    // shaderProgram - Shader program object returned by
    //         gl.createProgram.
    // shader - Shader object returned by gl.createShader.
    // url - Shader source code URL (from same domain).
    //
    // Reports compilation errors in console.
    pv.attachShader = function (shaderProgram, shader, url) {
        pv.gl.shaderSource(shader, pv.readFromUrl(url));
        pv.gl.compileShader(shader);

        if (pv.gl.getShaderParameter(shader,
                pv.gl.COMPILE_STATUS) === false) {
            console.log("Error compiling shader " + url + ": " +
                    pv.gl.getShaderInfoLog(shader));
        } else {
            pv.gl.attachShader(shaderProgram, shader);
        }
    };

    // Add a public method...
    //
    // vertexShaderUrl - URL (from same domain) for vertex shader
    //         source code.
    // fragmentShaderUrl - URL (from same domain) for fragment
    //         shader source code.
    // transformUniformVarName - Name of transformation uniform
    //         variable in vertex shader.
    // positionAttributeVarName - Name of position attribute
    //         variable in vertex shader.
    // colorUniformVarName - Name of color uniform variable in
    //         fragment shader.
    //
    // Creates private fields transformUniform, positionAttribute,
    // and colorUniform.
    pb.setupShaders = function (vertexShaderUrl,
            fragmentShaderUrl, transformUniformVarName,
            positionAttributeVarName, colorUniformVarName) {
        var shaderProgram = pv.gl.createProgram();

        pv.attachShader(shaderProgram,
                pv.gl.createShader(pv.gl.VERTEX_SHADER),
                vertexShaderUrl);
        pv.attachShader(shaderProgram,
                pv.gl.createShader(pv.gl.FRAGMENT_SHADER),
                fragmentShaderUrl);
        pv.gl.linkProgram(shaderProgram);
        pv.gl.useProgram(shaderProgram);

        pv.transformUniform = pv.gl.getUniformLocation(
                shaderProgram, transformUniformVarName);
        pv.positionAttribute = pv.gl.getAttribLocation(
                shaderProgram, positionAttributeVarName);
        pv.gl.enableVertexAttribArray(pv.positionAttribute);
        pv.colorUniform = pv.gl.getUniformLocation(
                shaderProgram, colorUniformVarName);
    };

    // vertexData - Array with vertex coordinates (three values
    //         per vertex).
    //
    // Returns reference to buffer.
    pb.copyVertexDataToBuffer = function (vertexData) {
        var buffer = pv.gl.createBuffer();

        pv.gl.bindBuffer(pv.gl.ARRAY_BUFFER, buffer);
        pv.gl.bufferData(pv.gl.ARRAY_BUFFER,
                new Float32Array(vertexData), pv.gl.STATIC_DRAW);

        return buffer;
    };

    // Clears the canvas (using clear color set above).
    pb.clear = function () {
        pv.gl.clear(pv.gl.COLOR_BUFFER_BIT |
                pv.gl.DEPTH_BUFFER_BIT);
    };

    // transform - Transformation matrix, as either Javascript
    //         array or transform object, as defined below.
    //
    // Sets transformation matrix.  (Assumes setupShaders has
    // already been called.)
    pb.setTransform = function (transform) {

        if (transform.getValues === undefined) {
            pv.gl.uniformMatrix4fv(pv.transformUniform, false,
                    new Float32Array(transform));
        } else {
            pv.gl.uniformMatrix4fv(pv.transformUniform, false,
                    new Float32Array(transform.getValues()));
        }
    };

    // r - Red component of new color.
    // g - Green component of new color.
    // b - Blue component of new color.
    //
    // Sets color.  (Assumes setupShaders has already been called.)
    pb.setColor = function (r, g, b) {

        if (g === undefined) {
            pv.gl.uniform3f(pv.colorUniform, r[0], r[1], r[2]);
        } else {
            pv.gl.uniform3f(pv.colorUniform, r, g, b);
        }
    };

    // buffer - Buffer object returned by copyVertexDatatoBuffer.
    // offset - How many vertices from the beginning of the buffer
    //         is the first vertex?
    // numberOfVertices - How many vertices in the shape?
    // modeString (optional) - "TRIANGLE_STRIP", "TRIANGLE_FAN",
    //         etc.  (Will be "TRIANGLE_STRIP" if not specified.)
    //
    // Draws shapes represented by vertices in the buffer.
    // (Assumes setupShaders has already been called.)
    pb.drawFromBuffer = function (buffer, offset,
            numberOfVertices, modeString) {
        var mode = pv.gl.TRIANGLE_STRIP;

        if (modeString === "LINE_LOOP") {
            mode = pv.gl.LINE_LOOP;
        } else if (modeString === "TRIANGLE_FAN") {
            mode = pv.gl.TRIANGLE_FAN;
        }

        pv.gl.bindBuffer(pv.gl.ARRAY_BUFFER, buffer);
        pv.gl.vertexAttribPointer(pv.positionAttribute, 3,
                pv.gl.FLOAT, false, 12, 0);
        pv.gl.drawArrays(mode, offset, numberOfVertices);
    };

    // Return a reference to the container object holding public
    // members.  Note that, if a method from pb is called via
    // the reference returned here, it will have access to
    // per-object copies of the private members in the pv
    // container object.
    return pb;
};

// tf (optional) - transform object providing initial values.
//         (If not specified, new transform will start with
//         identity matrix.)
//
// Create a transform object:  a wrapper around a 16-value array
// representing a 4x4 transformation matrix with various functions
// for conveniently modifying the transformation.
var transform = function (tf) {
    "use strict";

    var pb = {}, pv = {};  // Container objects for public and
                           // private members.

    if (tf === undefined) {
        pv.values = [ 1, 0, 0, 0,
                      0, 1, 0, 0,
                      0, 0, 1, 0,
                      0, 0, 0, 1 ];
    } else {
        pv.values = tf.getValues();
    }

    pv.history = [];

    // Save a copy of the current transformation matrix on the
    // matrix stack.
    pb.push = function () {
        pv.history.push(pv.values.slice(0));
    };

    // Undo changes since last push.  (And pop last push, so
    // that another pop would retrieve what had been pushed
    // before that.)
    pb.pop = function () {
        pv.values = pv.history.pop();
    };

    // b - transform object (or array with 16 values) to multiply
    //         pv.values by.
    // pre - If true, flip the order of the operands, so that the
    //       matrices are pre-multiplied rather than post-multiplied.
    //
    // Multiply the 4x4 matrix represented by pv.values by the
    // matrix represented by b.  Copy the result to pv.values.
    pb.multiplyBy = function (b, pre) {
        var result, i, j, k, aVals, bVals;

        aVals = pv.values;

        if (b.getValues === undefined) {
            bVals = b;
        } else {
            bVals = b.getValues();
        }

        result = [ 0, 0, 0, 0,
                   0, 0, 0, 0,
                   0, 0, 0, 0,
                   0, 0, 0, 0 ];

        for (i = 0; i < 4; i++) {
            for (j = 0; j < 4; j++) {
                for (k = 0; k < 4; k++) {
                    if (pre === undefined) {
                        result[i * 4 + j] +=
                                aVals[i * 4 + k] * bVals[k * 4 + j];
                    } else {
                         result[i * 4 + j] +=
                                bVals[i * 4 + k] * aVals[k * 4 + j];
                    }
                }
            }
        }

        for (i = 0; i < 16; i++) {
            aVals[i] = result[i];
        }
    };
    pb.preMultiplyBy = function (b) {
        pb.multiplyBy(b, true);
    };

    // tx - x translation amount.
    // ty - y translation amount.
    // tz - z translation amount.
    // pre - If true, create composite transformation with
    //       translation preceding current transformation.
    //
    // Start with current transformation, add a translation.
    pb.translate = function (tx, ty, tz, pre) {
        pb.multiplyBy([ 1, 0, 0, tx,
                        0, 1, 0, ty,
                        0, 0, 1, tz,
                        0, 0, 0, 1 ], pre);
    };
    pb.preTranslate = function (tx, ty, tz) {
        pb.translate(tx, ty, tz, true);
    };

    // sx - x translation amount.
    // sy - y translation amount.
    // sz - z translation amount.
    // pre - If true, create composite transformation with scale
    //       preceding current transformation.
    //
    // Start with current transformation, add a scale.  (If only
    // one argument, it will be used for sx, sy and sz.  But if
    // you want to use pre, you need all three.  Or you can use
    // preScale, defined below.)
    pb.scale = function (sx, sy, sz, pre) {

        if (sy === undefined) {
            pb.multiplyBy([ sx, 0,  0,  0,
                            0,  sx, 0,  0,
                            0,  0,  sx, 0,
                            0,  0,  0,  1 ]);
        } else {
            pb.multiplyBy([ sx, 0,  0,  0,
                            0,  sy, 0,  0,
                            0,  0,  sz, 0,
                            0,  0,  0,  1 ], pre);
        }
    };
    pb.preScale = function (sx, sy, sz) {

        if (sy === undefined) {
            pb.scale(sx, sx, sx, true);
        } else {
            pb.scale(sx, sy, sz, true);
        }
    };

    // a - Rotation angle in degrees.
    // pre - If true, create composite transformation with rotation
    //         preceding current transformation.
    //
    // Start with current transformation, add a counter-clockwise
    // rotation about the x axis.
    pb.rotateX = function (a, pre) {
        var r, s, c;

        r = Math.PI * a / 180;
        s = Math.sin(r);
        c = Math.cos(r);

        pb.multiplyBy([ 1, 0,  0, 0,
                        0, c, -s, 0,
                        0, s,  c, 0,
                        0, 0,  0, 1 ], pre);
    };
    pb.preRotateX = function (a) {
        pb.rotateX(a, true);
    };

    // a - Rotation angle in degrees.
    // pre - If true, create composite transformation with rotation
    //         preceding current transformation.
    //
    // Start with current transformation, add a counter-clockwise
    // rotation about the z axis.
    pb.rotateY = function (a, pre) {
        var r, s, c;

        r = Math.PI * a / 180;
        s = Math.sin(r);
        c = Math.cos(r);

        pb.multiplyBy([ c, 0, s, 0,
                        0, 1, 0, 0,
                       -s, 0, c, 0,
                        0, 0, 0, 1 ], pre);
    };
    pb.preRotateY = function (a) {
        pb.rotateY(a, true);
    };

    // a - Rotation angle in degrees.  
    // pre - If true, create composite transformation with rotation
    //         preceding current transformation.
    //
    // Start with current transformation, add a counter-clockwise
    // rotation about the z axis.
    pb.rotateZ = function (a, pre) {
        var r, s, c;

        r = Math.PI * a / 180;
        s = Math.sin(r);
        c = Math.cos(r);

        pb.multiplyBy([ c, -s, 0, 0,
                        s,  c, 0, 0,
                        0,  0, 1, 0,
                        0,  0, 0, 1 ], pre);
    };
    pb.preRotateZ = function (a) {
        pb.rotateZ(a, true);
    };

    // r - Distance, on near plane, from center to RIGHT side
    //     clipping plane.
    // t - Distance, on near plane, from center to TOP clipping
    //     plane.
    // n - Distance from origin (i.e., view point) to NEAR plane.
    // f - Distance from origin (i.e., view point) to FAR plane.
    //
    // Start with current transformation, add a transformation
    // to get from right-handed (not necessarily square)
    // rectangular frustum to left-handed WebGL canonical view
    // volume.
    pb.perspectiveNormalization = function (r, t, n, f) {
        pb.multiplyBy(
                [ n/r, 0,   0,           0,
                  0,   n/t, 0,           0,
                  0,   0,   (n+f)/(n-f), 2*n*f/(n-f),
                  0,   0,  -1,           0 ]);
    };

    // Return copy of values representing current transformation
    // matrix.
    pb.getValues = function () {
        return pv.values.slice(0);  // slice(0) makes a copy of
                                    // the array.
    };

    // Print matrix values to Javascript console (for testing).
    pb.printValues = function (d) {
        var i;

        if (d === undefined) {
            d = 2;
        }

        for (i = 0; i < 4; i++) {
            console.log(pv.values[i * 4].toFixed(d) + "  " +
                    pv.values[i * 4 + 1].toFixed(d) + "  " +
                    pv.values[i * 4 + 2].toFixed(d) + "  " +
                    pv.values[i * 4 + 3].toFixed(d));
        }

        console.log("");
    };

    return pb;
};
