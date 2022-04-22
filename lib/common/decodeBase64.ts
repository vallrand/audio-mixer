export function decodeBase64(dataURI: string): ArrayBuffer {
    const [ metaData, base64 ] = dataURI.split(',')
    const bytes = atob(base64)
    const array = new Uint8Array(bytes.length)
    for(let i = 0; i < array.length; i++) array[i] = bytes.charCodeAt(i)
    return array.buffer
}