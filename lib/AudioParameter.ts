import { Callable } from './common/Callable'

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

export type IEase = 'step' | 'linear' | 'exponential'

export interface AudioParameter<T extends AudioNode> {
    (value?: number, delay?: number, ease?: IEase): number
    update(node: T, param: AudioParam): void
    update(node: null): void
}

export class AudioParameter<T extends AudioNode> extends Callable {
    private static readonly min: number = 1e-3
    private context?: BaseAudioContext
    private param?: AudioParam

    private startTime: number = 0
    private endTime: number = 0
    private startValue: number
    private endValue: number
    private ease?: IEase

    protected get currentTime(): number { return this.context ? this.context.currentTime : 0 }
    protected get value(): number {
        const elapsedTime = Math.max(0, this.currentTime - this.startTime)
        const duration = this.endTime - this.startTime
        const fraction = duration && Math.min(1, elapsedTime / duration)
        switch(this.ease){
            case 'linear': return this.startValue + (this.endValue - this.startValue) * fraction
            case 'exponential':
                if(this.endValue === this.startValue) return this.endValue
                const k = Math.abs((this.endValue || AudioParameter.min) / (this.startValue || AudioParameter.min)) - 1
                const f = k == 0 ? fraction : (Math.pow(1+k, fraction) - 1) / k
                return this.startValue + (this.endValue - this.startValue) * f
                // if(!this.startValue || this.startValue * this.endValue < 0) return this.startValue
                // return this.startValue && this.startValue * Math.pow(this.endValue / (this.startValue), fraction)
            case 'step':
            default: return fraction >= 1 ? this.endValue : this.startValue
        }
    }
    constructor(initial: number){
        super(AudioParameter.prototype.schedule)
        this.startValue = this.endValue = initial
    }
    update(node: T | null, param?: AudioParam): void {
        if(this.context && this.param){
            this.param.cancelScheduledValues(0)
            this.startTime -= this.currentTime
            this.endTime -= this.currentTime
        }
        this.context = this.param = undefined
        if(!node) return
        this.context = node.context
        this.param = param

        const { endValue, endTime, ease } = this

        this.schedule(this.startValue, this.startTime)
        this.schedule(endValue, endTime, ease)
    }
    schedule(value?: number, delay: number = 0, ease?: IEase): number {
        if(value == null) return this.value

        if(this.endTime < this.currentTime + delay){
            this.startTime = this.endTime
            this.startValue = this.endValue
        }else{
            this.startTime = this.currentTime + delay
            this.startValue = value
        }

        this.endTime = this.currentTime + delay
        this.endValue = value
        this.ease = ease

        if(!this.context || !this.param) return this.value
        const startValue = clamp(this.value, this.param.minValue, this.param.maxValue) || AudioParameter.min
        const endValue = clamp(this.endValue, this.param.minValue, this.param.maxValue) || AudioParameter.min

        this.param.cancelScheduledValues(0)
        this.param.setValueAtTime(startValue, 0)
        switch(this.endTime > this.currentTime ? ease : undefined){
            case 'linear':
                this.param.linearRampToValueAtTime(endValue, this.endTime)
                break
            case 'exponential':
                this.param.exponentialRampToValueAtTime(endValue, this.endTime)
                break
            case 'step':
            default:
                this.param.setValueAtTime(endValue, this.endTime)
        }
        return this.value
    }
}