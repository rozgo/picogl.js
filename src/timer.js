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
        Rendering timer.

        @class
        @prop {WebGLRenderingContext} gl The WebGL context.
        @prop {Object} cpuTimer Timer for CPU. Will be window.performance, if available, or window.Date.
        @prop {EXTDisjointTimerQueryWebGL2} gpuTimer Timer for GPU. Only available if 
                EXT_disjoint_timer_query_webgl2 is supported.
        @prop {WebGLQuery} gpuTimerQuery Timer query object for GPU. Only available if 
                EXT_disjoint_timer_query_webgl2 is supported. 
        @prop {boolean} gpuTimerQueryInProgress Whether a gpu timer query is currently in progress.    
        @prop {number} cpuStartTime When the last CPU timing started.
        @prop {number} cpuTime Time spent on the CPU during the last timing. Only valid if ready() returns true.
        @prop {number} gpuTime Time spent on the GPU during the last timing. Only valid if ready() returns true.
    */
    PicoGL.Timer = function(gl) {
        this.gl = gl;
        this.cpuTimer = window.performance || window.Date;
        this.gpuTimer = this.gl.getExtension("EXT_disjoint_timer_query_webgl2") || null;
        this.gpuTimerQuery = null;
        if (this.gpuTimer) {
            this.gpuTimerQuery = this.gl.createQuery();
        }
        this.gpuTimerQueryInProgress = false;
        this.cpuStartTime = 0;
        this.cpuTime = 0;
        this.gpuTime = 0;
    };

    /** 
        Start the rendering timer.

        @method
    */
    PicoGL.Timer.prototype.start = function() {
        if (this.gpuTimer) {
            if (!this.gpuTimerQueryInProgress) {
                this.gl.beginQuery(this.gpuTimer.TIME_ELAPSED_EXT, this.gpuTimerQuery);
                this.cpuStartTime = this.cpuTimer.now();
            }
        } else {
            this.cpuStartTime = this.cpuTimer.now();
        }
    };

    /** 
        Stop the rendering timer.

        @method
    */
    PicoGL.Timer.prototype.end = function() {
        if (this.gpuTimer) {
            if (!this.gpuTimerQueryInProgress) {
                this.gl.endQuery(this.gpuTimer.TIME_ELAPSED_EXT);
                this.cpuTime = this.cpuTimer.now() - this.cpuStartTime;
                this.gpuTimerQueryInProgress = true;
            }
        } else {
            this.cpuTime = this.cpuTimer.now() - this.cpuStartTime;
        }
    };

    /** 
        Check if the rendering time is available. If
        this method returns true, the cpuTime and
        gpuTime properties will be set to valid 
        values.

        @method
    */
    PicoGL.Timer.prototype.ready = function() {
        if (this.gpuTimer) {
            if (!this.gpuTimerQueryInProgress) {
                return false;
            }

            var gpuTimerAvailable = this.gl.getQueryParameter(this.gpuTimerQuery, this.gl.QUERY_RESULT_AVAILABLE);
            var gpuTimerDisjoint = this.gl.getParameter(this.gpuTimer.GPU_DISJOINT_EXT);

            if (gpuTimerAvailable) {
                this.gpuTimerQueryInProgress = false;
            }

            if (gpuTimerAvailable && !gpuTimerDisjoint) {
                this.gpuTime = this.gl.getQueryParameter(this.gpuTimerQuery, this.gl.QUERY_RESULT)  / 1000000;
                return true;
            } else {
                return false;
            }
        } else {
            return !!this.cpuStartTime;
        }
    };

})();
