
import { AudioChannel } from './AudioChannel'
import { Signal } from './common/Signal'

export interface IAudioClip {
    readonly buffer: AudioBuffer
    readonly start: number
    readonly end: number
    readonly loop: number
}

export class AudioSource extends AudioChannel {
    private startTime: number | void = undefined
    private endTime: number | void = Infinity
    private startOffset: number = this.clip.start

    private source?: AudioBufferSourceNode

    public readonly end = new Signal<void>()

    private _loop: boolean = false
    private _rate: number = 1

    protected get currentTime(): number { return this.input ? this.input.context.currentTime : 0 }

    constructor(private readonly clip: IAudioClip){super()}
    public play(delay: number = 0, offset: number = this.playhead): void {
        if(this.source) this.stop(0)

        this.startOffset = this.wrap(this.clip.start + offset + Math.max(0, -delay) * this.rate)
        this.startTime = this.currentTime + Math.max(0, delay)
        const duration = Math.max(0, this.clip.end - this.startOffset)
        this.endTime = this.loop ? undefined : this.startTime + duration / this.rate

        if(!this.input) return
        const source = this.source = this.input.context.createBufferSource()
        this.source.buffer = this.clip.buffer
        this.source.loopStart = this.clip.start + this.clip.loop
        this.source.loopEnd = this.clip.end
        this.source.loop = this.loop
        this.source.playbackRate.value = this.rate
        this.source.connect(this.input)

        this.source.onended = event => {
            if(this.source !== source) return
            this.startOffset = this.clip.start + this.playhead
            this.source = undefined
            this.startTime = undefined
            this.endTime = this.currentTime
            this.end.dispatch()
        }

        this.source.start(this.startTime, this.startOffset, this.loop ? undefined : duration)
    }
    public stop(delay: number = 0): void {
        if(this.startTime == null) return
        this.endTime = this.currentTime + delay
        this.source?.stop(this.endTime)
    }
    public get rate(): number { return this._rate }
    public set rate(value: number){
        const { startTime, playhead } = this
        this._rate = value
        if(startTime != null) this.play(0, playhead)
    }
    public get loop(): boolean { return this._loop }
    public set loop(value: boolean){
        const { startTime, playhead } = this
        this._loop = value
        if(startTime != null) this.play(0, playhead)
    }
    protected attach(output: AudioNode | null): void {
        if(this.startTime != null) this.startTime -= this.currentTime
        if(this.endTime != null) this.endTime -= this.currentTime
        this.source = void this.source?.disconnect()

        super.attach(output)
        if(!output) return
        
        const { startTime, endTime } = this
        if(startTime != null) this.play(startTime, this.startOffset - this.clip.start)
        if(startTime != null && endTime != null) this.stop(endTime)
    }
    public get duration(): number { return this.clip.end - this.clip.start }
    public get playhead(): number {
        const currentTime = Math.min(this.currentTime, this.endTime || Infinity)
        const elapsedTime = this.startTime == null ? 0 : Math.max(0, currentTime - this.startTime)
        let offset = this.wrap(this.startOffset + elapsedTime * this.rate)
        return offset - this.clip.start
    }
    public set playhead(value: number){
        if(this.startTime == null){
            this.startOffset = this.clip.start + value
            this.endTime = this.currentTime
        }else this.play(0, value)
    }
    private wrap(offset: number): number {
        const mod = this.clip.end - (this.clip.start + this.clip.loop)
        if(this.loop) while(offset > this.clip.end) offset -= mod
        else offset = Math.min(offset, this.clip.end)
        return offset
    }
}