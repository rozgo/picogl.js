///////////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Tarek Sherif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///////////////////////////////////////////////////////////////////////////////////

(function() {
    "use strict";

    /**
        Storage for uniform data. Data is stored in std140 layout.

        @class
        @prop {WebGLRenderingContext} gl The WebGL context.
        @prop {WebGLBuffer} buffer Allocated buffer storage.
        @prop {Float32Array} floatView Floating point view of the buffer data.
        @prop {Int32Array} intView Integer view of the buffer data.
        @prop {Array} offsets Offsets into the array for each item in the buffer.
        @prop {Array} sizes Size of the item at the given offset.
        @prop {Array} integer Whether or not the item at the given offset is an integer.
        @prop {number} size The size of the buffer (in 4-byte items).
        @prop {GLEnum} usage Usage pattern of the buffer.
    */
    PicoGL.UniformBuffer = function UniformBuffer(gl, layout, usage) {
        this.gl = gl;
        this.buffer = gl.createBuffer();
        this.floatView = null;
        this.intView = null;
        this.offsets = new Array(layout.length);
        this.sizes = new Array(layout.length);
        this.integer = new Array(layout.length);
        this.size = 0;
        this.usage = usage || gl.DYNAMIC_DRAW;

        for (var i = 0, len = layout.length; i < len; ++i) {
            var type = layout[i];
            switch(type) { 
                case PicoGL.FLOAT:
                case PicoGL.INT:
                case PicoGL.BOOL:
                    this.offsets[i] = this.size;
                    this.sizes[i] = 1;
                    this.integer[i] = type === PicoGL.INT;

                    this.size++;
                    break;
                case PicoGL.FLOAT_VEC2:
                case PicoGL.INT_VEC2:
                case PicoGL.BOOL_VEC2:
                    this.size += this.size % 2;
                    this.offsets[i] = this.size;
                    this.sizes[i] = 2;
                    this.integer[i] = type === PicoGL.INT_VEC2;

                    this.size += 2;
                    break;
                case PicoGL.FLOAT_VEC3:
                case PicoGL.INT_VEC3:
                case PicoGL.BOOL_VEC3:
                case PicoGL.FLOAT_VEC4:
                case PicoGL.INT_VEC4:
                case PicoGL.BOOL_VEC4:
                    this.size += (4 - this.size % 4) % 4;
                    this.offsets[i] = this.size;
                    this.sizes[i] = 4;
                    this.integer[i] = type === PicoGL.INT_VEC4;

                    this.size += 4;
                    break;
                case PicoGL.FLOAT_MAT2:
                    this.size += (4 - this.size % 4) % 4;
                    this.offsets[i] = this.size;
                    this.sizes[i] = 8;

                    this.size += 8;
                    break;
                case PicoGL.FLOAT_MAT3:
                    this.size += (4 - this.size % 4) % 4;
                    this.offsets[i] = this.size;
                    this.sizes[i] = 12;

                    this.size += 12;
                    break;
                case PicoGL.FLOAT_MAT4:
                    this.size += (4 - this.size % 4) % 4;
                    this.offsets[i] = this.size;
                    this.sizes[i] = 16;

                    this.size += 16;
                    break;
                default:
                    console.error("Unsupported type for uniform buffer.");
            }
        }

        this.size += (4 - this.size % 4) % 4;

        this.floatView = new Float32Array(this.size);
        this.intView = new Int32Array(this.floatView.buffer);

        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.buffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, this.size * 4, this.usage);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, null);
    };

    /**
        Update data for a given item in the buffer. NOTE: Data is not 
        sent the the GPU until the update() method is called!

        @method
        @param {number} index Location in the layout to update.
        @param {ArrayBufferView} value Value to store at the layout location.
    */
    PicoGL.UniformBuffer.prototype.set = function(index, value) {
        var view = this.integer[index] ? this.intView : this.floatView;

        if (this.sizes[index] === 1)  {
            view[this.offsets[index]] = value;
        } else {
            view.set(value, this.offsets[index]);
        }
        
        return this;
    };

    /**
        Send stored buffer data to the GPU.

        @method
    */
    PicoGL.UniformBuffer.prototype.update = function() {
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, this.buffer);
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, 0, this.floatView);
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, 0, null);

        return this;
    };

    /**
        Bind this uniform buffer to the given base.

        @method
        @param {number} base Buffer base to bind to.
    */
    PicoGL.UniformBuffer.prototype.bind = function(base) {
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, base, this.buffer);

        return this;
    };

    /**
        Delete this uniform buffer.

        @method
    */
    PicoGL.UniformBuffer.prototype.delete = function() {
        if (this.buffer) {
            this.gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }
    };

})();
