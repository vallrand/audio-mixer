export function trimBuffer(buffer: AudioBuffer, threshold: number = 0): { start: number, end: number } {
    const { numberOfChannels, length, duration } = buffer

    let min = length, max = 0
    for(let channel = 0; channel < numberOfChannels; channel++){
        const data = buffer.getChannelData(channel)
        let start = 0, end = data.length - 1
        while(start <= end && data[start] > threshold) start++
        while(end >= start && data[end] > threshold) end--
        min = Math.min(min, start)
        max = Math.max(max, end)
    }
    return {
        start: min * duration / length,
        end: max * duration / length
    }
}