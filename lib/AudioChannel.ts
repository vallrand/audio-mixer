import { AudioParameter } from './AudioParameter'

export interface IAudioEffect {
    next?: IAudioEffect
    prev?: IAudioEffect
    wire(output: AudioNode | null): AudioNode | null
}

export class AudioChannel implements IAudioEffect {
    next?: IAudioEffect
    private readonly nodes: AudioChannel[] = []
    protected parent: AudioChannel | null = null
    protected output: GainNode | null = null
    protected input: AudioNode | null = null

    public readonly volume = new AudioParameter<GainNode>(1.0)

    public extend<T extends IAudioEffect>(effect: T): T {
        let first: IAudioEffect = effect
        while(first.prev) first = first.prev
        if(first instanceof AudioChannel) first.eject(effect)

        let last: IAudioEffect = this
        while(last.next) last = last.next

        effect.prev = last
        effect.prev.next = effect

        this.attach(this.output)

        return effect
    }
    public eject<T extends IAudioEffect>(effect: T): T | void {
        let first: IAudioEffect = effect
        while(first.prev) first = first.prev
        if(effect === this as IAudioEffect) throw new Error(`Incompatible effect type`)
        if(first !== this) return

        if(effect.next) effect.next.prev = effect.prev
        if(effect.prev) effect.prev.next = effect.next
        effect.next = effect.prev = undefined
        effect.wire(null)

        this.attach(this.output)

        return effect
    }
    protected attach(output: AudioNode | null): void {
        this.input = this.output === output ? this.output : this.wire(output)
        for(let node: IAudioEffect | void = this.next; node; node = node.next)
            this.input = node.wire(this.input)
        for(let i = this.nodes.length - 1; i >= 0; i--)
            this.nodes[i].attach(this.input)
    }
    wire(output: AudioNode | null): AudioNode | null {
        this.output?.disconnect()
        if(output){
            if(this.output?.context !== output.context) this.output = output.context.createGain()
            this.output.connect(output)
            this.volume.update(this.output, this.output.gain)
        }else{
            this.volume.update(null)
        }
        return output && this.output
    }
    public add<T extends AudioChannel>(node: T): T {
        if(node.parent === this) return node
        else if(node.parent) node.parent.remove(node)

        this.nodes.push(node)
        node.parent = this
        if(this.input) node.attach(this.input)
        return node
    }
    public remove<T extends AudioChannel>(node: T): T | void {
        const index = this.nodes.indexOf(node)
        if(index === -1) return
        else if(index === this.nodes.length - 1) this.nodes.length--
        else this.nodes[index] = this.nodes.pop()!

        if(this.input) node.attach(null)
        node.parent = null
        return node
    }
    protected get root(): AudioChannel {
        let node: AudioChannel = this
        while(node.parent) node = node.parent
        return node
    }
    public get connected(): boolean { return !!this.input }
    public delete(): void {
        while(this.nodes.length)
            this.remove(this.nodes[0])!.delete()
        if(this.parent)
            this.parent.remove(this)
        while(this.next) this.eject(this.next)
    }
}