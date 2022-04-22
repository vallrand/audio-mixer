import { IAudioEffect } from '../AudioChannel'

type vec3 = [number, number, number]
type mat4x4 = [
    number,number,number,number,
    number,number,number,number,
    number,number,number,number,
    number,number,number,number
]

const vec3 = (x: number, y: number, z: number): vec3 => vec3.set(x, y, z, new Float32Array(3) as any)
vec3.set = (x: number, y: number, z: number, out: vec3): vec3 => {
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}
vec3.copy = (vec: vec3, out: vec3): vec3 => {
    out[0] = vec[0]
    out[1] = vec[1]
    out[2] = vec[2]
    return out
}

export class ListenerTransform {
    private readonly _position: vec3 = vec3(0,0,0)
    private readonly _up: vec3 = vec3(0,1,0)
    private readonly _forward: vec3 = vec3(0,0,-1)
    constructor(private readonly ctx: AudioContext){}
    public get position(): vec3 { return this._position }
    public get up(): vec3 { return this._up }
    public get forward(): vec3 { return this._forward }
    public set position(value: vec3){
        this.ctx.listener.positionX.value = this._position[0] = value[0]
        this.ctx.listener.positionY.value = this._position[1] = value[1]
        this.ctx.listener.positionZ.value = this._position[2] = value[2]
    }
    public set up(value: vec3){
        this.ctx.listener.upX.value = this._up[0] = value[0]
        this.ctx.listener.upY.value = this._up[1] = value[1]
        this.ctx.listener.upZ.value = this._up[2] = value[2]
    }
    public set forward(value: vec3){
        this.ctx.listener.forwardX.value = this._forward[0] = value[0]
        this.ctx.listener.forwardY.value = this._forward[1] = value[1]
        this.ctx.listener.forwardZ.value = this._forward[2] = value[2]
    }
    public update(matrix: mat4x4): void {
        this.position = vec3.set(matrix[12], matrix[13], matrix[14], this._position)
        this.up = vec3.set(matrix[4], matrix[5], matrix[6], this._up)
        this.forward = vec3.set(-matrix[8], -matrix[9], -matrix[10], this._forward)
    }
}

export interface SpatialOptions {
    panningModel: PanningModelType
    distanceModel: DistanceModelType
    refDistance: number
    maxDistance: number
    rolloffFactor: number
    coneInnerAngle: number
    coneOuterAngle: number
    coneOuterGain: number
}

export class SpatialEffect implements IAudioEffect {
    private panner: PannerNode | null = null
    private readonly _position: vec3 = vec3(0,0,0)
    private readonly _orientation: vec3 = vec3(1,0,0)
    private readonly options: SpatialOptions
    constructor(options?: Partial<SpatialOptions>){
        const {
            panningModel = 'equalpower',
            distanceModel = 'inverse',
            refDistance = 1,
            maxDistance = 10000,
            rolloffFactor = 1,
            coneOuterGain = 0,
            coneInnerAngle = 360,
            coneOuterAngle = 0
        } = options || {}
        this.options = {
            panningModel, distanceModel, refDistance, maxDistance,
            rolloffFactor, coneOuterGain, coneInnerAngle, coneOuterAngle
        }
    }
    public get position(): vec3 { return this._position }
    public set position(value: vec3){
        vec3.copy(value, this._position)
        if(!this.panner) return
        this.panner.positionX.value = value[0]
        this.panner.positionY.value = value[1]
        this.panner.positionZ.value = value[2]
    }
    public get orientation(): vec3 { return this._orientation }
    public set orientation(value: vec3){
        vec3.copy(value, this._orientation)
        if(!this.panner) return
        this.panner.orientationX.value = value[0]
        this.panner.orientationY.value = value[1]
        this.panner.orientationZ.value = value[2]
    }
    private update(): void {
        if(!this.panner) return
        this.panner.panningModel = this.options.panningModel
        this.panner.distanceModel = this.options.distanceModel
        this.panner.refDistance = this.options.refDistance
        this.panner.maxDistance = this.options.maxDistance
        this.panner.rolloffFactor = this.options.rolloffFactor
        this.panner.coneOuterGain = this.options.coneOuterGain
        this.panner.coneInnerAngle = this.options.coneInnerAngle
        this.panner.coneOuterAngle = this.options.coneOuterAngle
    }
    wire(output: AudioNode | null): AudioNode | null {
        this.panner?.disconnect()
        if(output){
            if(this.panner?.context !== output.context) this.panner = output.context.createPanner()
            this.panner.connect(output)
            this.update()
            this.position = this.position
            this.orientation = this.orientation
        }
        return output && this.panner
    }
}