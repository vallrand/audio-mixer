# Audio Mixer

[![Build](https://github.com/vallrand/audio-mixer/workflows/publish/badge.svg)](https://github.com/vallrand/audio-mixer/actions)
[![npm version](https://badge.fury.io/js/@wault%2Faudio-mixer.svg)](https://www.npmjs.com/package/@wault/audio-mixer)

> **WARNING**: This project is under development. Current use is not recommended!

Lightweight Web Audio library.

- Synchronous API, which abstracts Web Audio.
- Pause / Resume - disconnected nodes are not playing.
- **base64** encoded audio files.
- Audo unlock context on user gesture.
- Auto pause / resume when out of focus.
- **Audio Sprites** `start, end, loop point` 

## Installation

With [NPM](https://www.npmjs.com/)
```sh
$ npm install --save @wault/audio-mixer
```

## API

```javascript
import {
    AudioMixer, AudioChannel, AudioSource
} from '@wault/audio-mixer'

const mixer = new AudioMixer()

const sfx = mixer.add(new AudioChannel())

const clip = await AudioMixer.load(base64)

const sound = sfx.add(new AudioSource(clip))

sound.play()
```

### Audio Effects

Nodes can be extended with additional effects in a compositional manner.

| Effect | Description |
| ------ | ------ |
| CompressionEffect | Attenuates signals above a threshold. |
| FilterEffect | Simple low-order filter. |
| DelayEffect | Delay. |
| SpatialEffect | 3D positional audio. |

```javascript
import { CompressionEffect, FilterEffect } from '@wault/audio-mixer'

const compressor = channel.extend(CompressionEffect({ threshold: -64 }))

const lowpass = channel.extend(FilterEffect({ type: 'lowpass', frequency: 1000 }))
```

### 3D Audio

```javascript
import { SpatialEffect } from '@wault/audio-mixer'

mixer.transform.update(cameraViewMatrix)

const transform = sound.extend(new SpatialEffect())
transform.position = [2,1,0]
```

### Volume Fade

Parameters, like volume, can be animated over time. Setter adds a new keyframe into a timeline.

```javascript
function fadeIn(sound, duration){
    sound.volume(0, 0)
    sound.volume(1, duration, 'linear')
}
function fadeOut(sound, duration){
    sound.volume(1, 1)
    sound.volume(0, duration, 'linear')
}
```