import { clamp } from '../AudioParameter'
import { IAudioEffect } from '../AudioChannel'

export interface FilterOptions {
    type: BiquadFilterType
    frequency: number
    detune: number
    quality: number
    gain: number
} 

export class FilterEffect implements IAudioEffect {
    private filter: BiquadFilterNode | null = null
    private readonly options: FilterOptions
    constructor(options?: Partial<FilterOptions>){
        const {
            type = 'lowpass',
            frequency = 350,
            detune = 0,
            quality = 1,
            gain = 0
        } = options || {}
        this.options = { type, frequency, detune, quality, gain }
    }
    public get frequency(): number { return this.options.frequency }
    public get detune(): number { return this.options.detune }
    public get quality(): number { return this.options.quality }
    public get gain(): number { return this.options.gain }
    public set frequency(value: number){
        this.options.frequency = value
        this.update()
    }
    public set detune(value: number){
        this.options.detune = value
        this.update()
    }
    public set quality(value: number){
        this.options.quality = value
        this.update()
    }
    public set gain(value: number){
        this.options.gain = value
        this.update()
    }
    private update(): void {
        if(!this.filter) return
        const { frequency, detune, Q, gain } = this.filter
        this.filter.type = this.options.type
        frequency.value = clamp(this.options.frequency, frequency.minValue, frequency.maxValue)
        detune.value = clamp(this.options.detune, detune.minValue, detune.maxValue)
        Q.value = clamp(this.options.quality, Q.minValue, Q.maxValue)
        gain.value = clamp(this.options.gain, gain.minValue, gain.maxValue)
    }
    wire(output: AudioNode | null): AudioNode | null {
        this.filter?.disconnect()
        if(output){
            if(this.filter?.context !== output.context) this.filter = output.context.createBiquadFilter()
            this.filter.connect(output)
            this.update()
        }
        return output && this.filter
    }
}