import { clamp } from '../AudioParameter'
import { IAudioEffect } from '../AudioChannel'

export interface CompressionOptions {
    threshold: number
    knee: number
    ratio: number
    attack: number
    release: number
}

export class CompressionEffect implements IAudioEffect {
    private compressor: DynamicsCompressorNode | null = null
    private readonly options: CompressionOptions
    constructor(options?: Partial<CompressionOptions>){
        const {
            threshold = -24,
            knee = 30,
            ratio = 12,
            attack = 0.003,
            release = 0.25
        } = options || {}
        this.options = { threshold, knee, ratio, attack, release }
    }
    public get threshold(): number { return this.options.threshold }
    public get knee(): number { return this.options.knee }
    public get ratio(): number { return this.options.ratio }
    public get attack(): number { return this.options.attack }
    public get release(): number { return this.options.release }
    public set threshold(value: number){
        this.options.threshold = value
        this.update()
    }
    public set knee(value: number){
        this.options.knee = value
        this.update()
    }
    public set ratio(value: number){
        this.options.ratio = value
        this.update()
    }
    public set attack(value: number){
        this.options.attack = value
        this.update()
    }
    public set release(value: number){
        this.options.release = value
        this.update()
    }
    private update(): void {
        if(!this.compressor) return
        const { threshold, knee, ratio, attack, release } = this.compressor
        threshold.value = clamp(this.options.threshold, threshold.minValue, threshold.maxValue)
        knee.value = clamp(this.options.knee, knee.minValue, knee.maxValue)
        ratio.value = clamp(this.options.ratio, ratio.minValue, ratio.maxValue)
        attack.value = clamp(this.options.attack, attack.minValue, attack.maxValue)
        release.value = clamp(this.options.release, release.minValue, release.maxValue)
    }
    wire(output: AudioNode | null): AudioNode | null {
        this.compressor?.disconnect()
        if(output){
            if(this.compressor?.context !== output.context) this.compressor = output.context.createDynamicsCompressor()
            this.compressor.connect(output)
            this.update()
        }
        return output && this.compressor
    }
}