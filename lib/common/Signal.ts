type IListener<T> = (value: T) => void

export class Signal<T> {
    private readonly _listeners: IListener<T>[] = []
    public dispatch(value: T): void {
        for(let i = this._listeners.length - 1; i >= 0; i--)
            this._listeners[i].call(this, value)
    }
    public addListener(listener: IListener<T>): this {
        this._listeners.push(listener)
        return this
    }
    public removeListener(listener: IListener<T>): this {
        const index = this._listeners.indexOf(listener)
        if(index != -1) this._listeners.splice(index, 1)
        return this
    }
}