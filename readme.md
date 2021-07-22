## ![Circuit Logo](https://user-images.githubusercontent.com/3441017/126361006-5272a10e-d123-404d-90ea-60a832258eec.png)

## Circuit - Versatile Messaging Solution written in Typescript

[![Version](https://badge.fury.io/gh/hisorange%2Fcircuit.svg)](https://badge.fury.io/gh/hisorange%2Fcircuit)
[![Build](https://github.com/hisorange/circuit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/hisorange/circuit/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/hisorange/circuit/badge.svg)](https://coveralls.io/github/hisorange/circuit)
[![GitHub license](https://img.shields.io/github/license/hisorange/circuit)](https://github.com/hisorange/circuit/blob/main/LICENSE)

Easy to use package to manage asynchronous messaging through multiple medium. Supports the most common publish / subscribe, and RPC (Remote Procedure Call) methodologies.

Why should you use it? Because it's **built for progression**!

It's written for projects where the transporting medium will change overtime; There are solutions with support a single medium and all of it's advantages.

But as far as we aware, most of the project **starts small** and hopefully they **grow** requirements over time, so it would be utmost wasteful to start your micro application on a high throughput
messaging medium like kafka.

Out of the box the package starts with a simple in-memory transport, with this you can kickstart your project without external requirements.
And as time goes you can easily upgrade to better transports like redis, amqp, etc... with just a single line of code, so no need for refactoring!

### Getting Started

---

```sh
npm i @hisorange/circuit
# or
yarn add @hisorange/circuit
```

### Example: Remote Procedure Call

---

```ts
// Initialize your transport driver
const transport = new IoRedisTransport();

// Initialize the nodes (different machines IRL)
const node1 = new Circuit('node1', transport);
const node2 = new Circuit('node2', transport);

// Estabilize the connections
await node1.connect();
await node2.connect();

// Create a responder
await node1.respond<SumAction>('sum' (msg) => msg.content.a + msg.content.b);

// Request the responder to execute the call
assert(await node2.request<SumAction>('sum', { a: 2, b: 2}) === 4);
```

**Request options**

| Key     | Default | Description                                     |
| ------- | ------- | ----------------------------------------------- |
| **ttl** | 60000   | Maximum wait time before the message is ignored |

**Response options**

| Key             | Default  | Description                  |
| --------------- | -------- | ---------------------------- |
| **concurrency** | Infinity | Maximum concurrent execution |

### Example: Publish / Subscribe

---

```ts
const node = new Circuit();

// Simply publish the event you want to broadcast
node.publish<UserCreatedEvent>('user.created', user);

// And receive it on every listening node ^.^
node.subscribe<UserCreatedEvent>('user.created', sendWelcomeEmailToUser);
```

### Technicalities

---

**TypeScript**: Everything is written in typescript from the get go, so You can have the best DX possible :)

**Response Routing**: When You are using the RPC request/respond model, the package manages the responses on a single channel to reduce the load on the messaging queue, with this small solution the queue does not have to open and close channels on every single RPC call.

**Network Mapping**: Before You send a request the circuit checks if there is anyone to serve it, this helps to prevent hanging requests. Each circuits on the network communicates their services to every other circuit, so the requests can be routed to specific actors.

### Supported Transport Mediums

| Transport    | Dependency                                       |   Support   | Notes                                 |
| :----------- | ------------------------------------------------ | :---------: | ------------------------------------- |
| **InMemory** | -                                                |      ✓      | Emulates an external queue's behavior |
| **Redis**    | [ioredis](https://www.npmjs.com/package/ioredis) |      ✓      | Excellent for smaller installations   |
| **RabbitMQ** | [amqplib](https://www.npmjs.com/package/ioredis) | Coming Soon | Purpose designed messaging platform   |
| **NATS**     | -                                                | Coming Soon | Fast and small messaging platform     |
| **Kafka**    | -                                                |      -      | High throughput scalable solution     |

### Links

---

- [GitHub](https://github.com/hisorange/circuit)
- [NPM](https://www.npmjs.com/package/@hisorange/circuit)
- [GPM](https://github.com/hisorange/circuit/packages/907960)

### What's with the weird name?

---

This package is part of a theme where I am trying to reuse the hardware namings in code and let the programers build on familiar known solutions. The circuit represents the circuit board similar to what we have on a PCB the listeners connect to lines and the board is simply handling the connections between them.

### Changelog

---

Track changes in the [Changelog](./changelog.md)
