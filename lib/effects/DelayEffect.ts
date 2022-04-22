import { IAudioEffect } from '../AudioChannel'
import { AudioParameter } from '../AudioParameter'

export class DelayEffect implements IAudioEffect {
    private delay: DelayNode | null = null
    public readonly delayTime = new AudioParameter<DelayNode>(0)
    constructor(private readonly maxDelayTime: number = 1){}
    wire(output: AudioNode | null): AudioNode | null {
        this.delay?.disconnect()
        if(output){
            if(this.delay?.context !== output.context) this.delay = output.context.createDelay(this.maxDelayTime)
            this.delay.connect(output)
            this.delayTime.update(this.delay, this.delay.delayTime)
        }else{
            this.delayTime.update(null)
        }
        return output && this.delay
    }
}