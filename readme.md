# Circuit

---

### Quick Start

```sh
npm i @hisorange/circuit
# or
yarn add @hisorange/circuit
```

---

Easy to implement message bus with various transport layer support.

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

##### 0.0.1

- Initiale release with in memory transport support for further development
