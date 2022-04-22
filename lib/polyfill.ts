// @ts-nocheck

if(!window.AudioContext) window.AudioContext = window.webkitAudioContext
if(!window.OfflineAudioContext) window.OfflineAudioContext = window.webkitOfflineAudioContext

const proto = AudioContext && AudioContext.prototype

if(window.webkitAudioContext){
    function fixSetTarget(param){
        if(!param) return
        if(!param.setTargetAtTime) param.setTargetAtTime = param.setTargetValueAtTime
    }

    if(!proto.createGain) proto.createGain = proto.createGainNode
    if(!proto.createDelay) proto.createDelay = proto.createDelayNode
    if(!proto.createScriptProcessor)  proto.createScriptProcessor = proto.createJavaScriptNode
    if(!proto.createPeriodicWave) proto.createPeriodicWave = proto.createWaveTable

    const createGain = proto.createGain
    proto.createGain = function(){
        const node = createGain.apply(this, arguments)
        fixSetTarget(node.gain)
        return node
    }

    const createDelay = proto.createDelay
    proto.createDelay = function(){
        const node = createDelay.apply(this, arguments)
        fixSetTarget(node.delayTime)
        return node
    }

    const createBufferSource = proto.createBufferSource
    proto.createBufferSource = function(){
        const node = createBufferSource.apply(this, arguments)
        if(!node.start)
            node.start = function(when, offset, duration){
                if(offset || duration) this.noteGrainOn(when || 0, offset, duration)
                else this.noteOn(when || 0)
            }
        else{
            const start = node.start
            node.start = function(when, offset, duration){
                if(typeof duration !== 'undefined')  start.call(this, when || 0, offset, duration)
                else start.call(this, when || 0, offset || 0)
            }
        }

        if(!node.stop)
            node.stop = function(when){
                this.noteOff(when || 0)
            }
        else{
            const stop = node.stop
            node.stop = function(when){
                stop.call(this, when || 0)
            }
        }

        fixSetTarget(node.playbackRate)
        return node
    }

    const createDynamicsCompressor = proto.createDynamicsCompressor
    proto.createDynamicsCompressor = function(){
        const node = createDynamicsCompressor.apply(this, arguments)
        fixSetTarget(node.threshold)
        fixSetTarget(node.knee)
        fixSetTarget(node.ratio)
        fixSetTarget(node.reduction)
        fixSetTarget(node.attack)
        fixSetTarget(node.release)
        return node
    }

    const createBiquadFilter = proto.createBiquadFilter
    proto.createBiquadFilter = function(){
        const node = createBiquadFilter.apply(this, arguments)
        fixSetTarget(node.frequency)
        fixSetTarget(node.detune)
        fixSetTarget(node.Q)
        fixSetTarget(node.gain)
        return node
    }

    if(proto.createOscillator){
        const createOscillator = proto.createOscillator
        proto.createOscillator = function(){
            const node = createOscillator.apply(this, arguments)
            if(!node.start)
                node.start = function(when){
                    this.noteOn(when || 0)
                }
            else{
                const start = node.start
                node.start = function(when){
                    start.call(this, when || 0)
                }
            }
            if(!node.stop)
                node.stop = function(when){
                    this.noteOff(when || 0)
                }
            else{
                const stop = node.stop
                node.stop = function(when){
                    stop.call(this, when || 0)
                }
            }
            if(!node.setPeriodicWave) node.setPeriodicWave = node.setWaveTable
            fixSetTarget(node.frequency)
            fixSetTarget(node.detune)
            return node
        }
    }
}

const decodeAudioData = proto.decodeAudioData
proto.decodeAudioData = function(buffer){
    return new Promise((resolve, reject) => decodeAudioData.call(this, buffer, resolve, reject))
}

function defineAudioParam(prototype, property, initial, update){
    const internal = '_'+property
    Object.defineProperty(prototype, property, {
        get: function(){
            const node = this
            if(!this[internal]) this[internal] = {
                _v: initial,
                get value(){ return this._v },
                set value(value){ update.call(node, this._v = value) }
            }
            return this[internal]
        }
    })
}

if(!PannerNode.prototype.hasOwnProperty('positionX')){
    const proto = PannerNode.prototype
    function setPosition(this: PannerNode){
        this.setPosition(this.positionX.value, this.positionY.value, this.positionZ.value)
    }
    function setOrientation(this: PannerNode){
        this.setOrientation(this.orientationX.value, this.orientationY.value, this.orientationZ.value)
    }
    defineAudioParam(proto, 'positionX', 0, setPosition)
    defineAudioParam(proto, 'positionY', 0, setPosition)
    defineAudioParam(proto, 'positionZ', 0, setPosition)
    defineAudioParam(proto, 'orientationX', 1, setOrientation)
    defineAudioParam(proto, 'orientationY', 0, setOrientation)
    defineAudioParam(proto, 'orientationZ', 0, setOrientation)
}
if(!AudioListener.prototype.hasOwnProperty('positionX')){
    const proto = AudioListener.prototype
    function setPosition(this: AudioListener){
        this.setPosition(this.positionX.value, this.positionY.value, this.positionZ.value)
    }
    function setOrientation(this: AudioListener){
        this.setOrientation(this.forwardX.value, this.forwardY.value, this.forwardZ.value, this.upX.value, this.upY.value, this.upZ.value)
    }
    defineAudioParam(proto, 'positionX', 0, setPosition)
    defineAudioParam(proto, 'positionY', 0, setPosition)
    defineAudioParam(proto, 'positionZ', 0, setPosition)
    defineAudioParam(proto, 'forwardX', 0, setOrientation)
    defineAudioParam(proto, 'forwardY', 0, setOrientation)
    defineAudioParam(proto, 'forwardZ', -1, setOrientation)
    defineAudioParam(proto, 'upX', 0, setOrientation)
    defineAudioParam(proto, 'upY', 1, setOrientation)
    defineAudioParam(proto, 'upZ', 0, setOrientation)
}