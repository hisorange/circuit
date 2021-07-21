## ![Circuit Logo](https://user-images.githubusercontent.com/3441017/126361006-5272a10e-d123-404d-90ea-60a832258eec.png)

## Circuit - Versatile Messaging written in Typescript

[![Version](https://badge.fury.io/gh/hisorange%2Fcircuit.svg)](https://badge.fury.io/gh/hisorange%2Fcircuit)
[![Build](https://github.com/hisorange/circuit/actions/workflows/actions.yml/badge.svg?branch=main)](https://github.com/hisorange/circuit/actions/workflows/actions.yml)
[![Coverage Status](https://coveralls.io/repos/github/hisorange/circuit/badge.svg)](https://coveralls.io/github/hisorange/circuit)
[![GitHub license](https://img.shields.io/github/license/hisorange/circuit)](https://github.com/hisorange/circuit/blob/main/LICENSE)

### Quick Start

```sh
npm i @hisorange/circuit
# or
yarn add @hisorange/circuit
```

---

Easy to implement message bus with various transport layer support.

### Transport Support

- InMemory
- IORedis

### RPC

```ts
// Create any transport
const transport = new InMemoryTransport();

// Initialize the nodes (different machines IRL)
const node1 = new Circuit('node1', transport);
const node2 = new Circuit('node1', transport);

// Acquire the connections
await node1.connect();
await node2.connect();

await node1.respond('sum' (msg) => msg.content.a + msg.content.b);

assert(await node2.request('sum', { a: 2, b: 2}) === 4);
```

### PubSub

```ts
const node = new Circuit();

node.publish('events', 'aye!');
node.subscribe('events', msg => console.log(msg.content)); // Prints "aye!"
```

### Whats with the name?

---

This package is part of a theme where I am trying to reuse the hardware solutions in code and let the programers build on well known solutions. The circuit represents the circuit board similiar to what we have on a PCB the listeners connect to lines and the board is simply handling the connections between them.

### Changelog

---

##### 0.2.0

- Decouple the serializer from the IORedis transport

##### 0.1.0

- RPC is now handled on a single channel with a reply router!
- Small bugfixes

##### 0.0.4

- Use round robin when chosing the responder

##### 0.0.2

- Experimental IO Redis transport

##### 0.0.1

- Initiale release with in memory transport support for further development
