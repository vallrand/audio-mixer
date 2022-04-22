export class Callable extends Function {
    // @ts-ignore
    constructor(method: Function){
        const instance = function(){return method.apply(instance, arguments)}
        return Object.setPrototypeOf(instance, new.target.prototype)
    }
}