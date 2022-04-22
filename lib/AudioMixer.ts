import { decodeBase64 } from './common/decodeBase64'
import { trimBuffer } from './common/trimBuffer'
import { IAudioClip } from './AudioSource'
import { AudioChannel } from './AudioChannel'
import { ListenerTransform } from './effects/SpatialAudio'

export class AudioMixer extends AudioChannel {
    private static last: BaseAudioContext
    public static empty(duration: number, sampleRate = 44100, channels: number = 1): IAudioClip {
        const buffer = this.last.createBuffer(channels, sampleRate * duration, sampleRate)
        return { buffer, start: 0, loop: 0, end: buffer.duration }
    }
    public static async load(data: string | ArrayBuffer, options?: {
        trim: boolean
    }): Promise<IAudioClip> {
        if(typeof data === 'string') data = decodeBase64(data)
        const buffer: AudioBuffer = await this.last.decodeAudioData(data)
        const clip: IAudioClip = { buffer, loop: 0, start: 0, end: buffer.duration }
        if(options?.trim) return { ...clip, ...trimBuffer(buffer) }
        return clip
    }

    protected readonly context: AudioContext
    public readonly transform: ListenerTransform
    private _pause: boolean = false
    private locked: boolean
    public autoUnlock: boolean = true
    public autoPause: boolean = false

    constructor(sampleRate = 44100){
        super()
        AudioMixer.last = this.context = new AudioContext({ sampleRate, latencyHint: 'interactive' })
        this.transform = new ListenerTransform(this.context)
        this.attach(this.context.destination)

        this.locked = this.context.state !== 'running'
        const unlock = async (event: Event) => {
            if(!this.autoUnlock || this.context.state === 'running') return
            await this.context.resume()
            this.locked = false
            if(this.pause) this.context.suspend()
        }

        document.addEventListener('touchend', unlock, true)
        document.addEventListener('mousedown', unlock, true)

        document.addEventListener('visibilitychange', event => {
            if(this.autoPause) this.pause = document.hidden
        }, false)
    }
    public get pause(): boolean { return this._pause }
    public set pause(value: boolean){
        if(this._pause === value) return
        this._pause = value

        if(value) this.context.suspend()
        else if(!this.locked) this.context.resume()
    }
    public delete(): void {
        super.delete()
        this.context.close()
    }
}