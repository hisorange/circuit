import { Resistor } from '@hisorange/resistor';
import { TimeoutException } from './exceptions';
import {
  IRequestHandler,
  IRespondOptions,
  ISubscription,
  ITransport,
} from './interfaces';
import { Message } from './messaging/message';
import { Subscription } from './messaging/subscription';

type ForwardHandler = (response: Message) => void;

export class Router {
  protected readonly forwardHandlers = new Map<
    string,
    [NodeJS.Timeout, ForwardHandler]
  >();

  protected readonly replyTo: string;
  protected readonly replySub: ISubscription;

  constructor(
    protected readonly circuitId: string,
    protected readonly transport: ITransport,
  ) {
    this.replyTo = this.calculateReplyToChannel();
    this.replySub = this.registerReceiver();
  }

  disconnect(): void {
    for (const [timer] of this.forwardHandlers.values()) {
      if (timer) {
        clearTimeout(timer);
      }
    }

    // Destroy the sub here...
  }

  protected registerReceiver(): ISubscription {
    const subscription = new Subscription(this.dispatch.bind(this));
    this.transport.subscribe(this.replyTo, subscription);

    return subscription;
  }

  protected calculateReplyToChannel(): string {
    return `$router.${this.circuitId}`;
  }

  protected dispatch(message: Message): void {
    if (message.replyFor && this.forwardHandlers.has(message.replyFor)) {
      const [timer, handler] = this.forwardHandlers.get(message.replyFor);

      if (timer) {
        clearTimeout(timer);
      }

      handler(message);
    } else {
      // Message is a reply for an earlier instance with the same reply channel or a duped response~
    }
  }

  createRequestHandler<I, O>(
    request: Message<I>,
    ttl = 60_000,
  ): Promise<Message<O>> {
    // Change or assign the reply channel to the router.
    request.replyTo = this.replyTo;
    request.timeToLive = ttl;

    const replyHandler = new Promise<Message<O>>(async (resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        // Clear the timeout handler.
        if (timeoutHandler) {
          clearTimeout(timeoutHandler);
        }

        // Clear the forward handler.
        this.forwardHandlers.delete(request.id);

        // Reject the request.
        reject(new TimeoutException());
      }, request.timeToLive);

      this.forwardHandlers.set(request.id, [
        timeoutHandler,
        (response: Message<O>) => {
          // Clear the timeout handler.
          if (timeoutHandler) {
            clearTimeout(timeoutHandler);
          }

          // Clear the forward handler.
          this.forwardHandlers.delete(request.id);

          // Resolve the response.
          resolve(response);
        },
      ]);

      // Start the journey!
      await this.transport.publish(
        request.recipient + '.' + request.channel,
        request,
      );
    });

    return replyHandler;
  }

  /**
   * @description Wrap a request handler into a request execution and response handler logic.
   */
  createResponder<I, O>(
    handler: IRequestHandler<I, O>,
    options: Partial<IRespondOptions> = {},
  ): IRequestHandler<I, void> {
    const messageProcessor = async (request: Message<I>) => {
      const response = new Message();
      response.sender = this.circuitId;
      response.channel = request.replyTo;
      response.replyFor = request.id;
      response.recipient = request.sender;
      response.content = await handler(request);

      this.transport.publish(request.replyTo, response);
    };

    // Limit the handler's concurrency with the resistor package.
    if (
      options.concurrency &&
      options.concurrency > 0 &&
      options.concurrency !== Infinity
    ) {
      const resistor = new Resistor(
        (message: Message<I>) => messageProcessor(message),
        {
          threads: options.concurrency,
          buffer: {
            size: 1,
          },
          autoFlush: false,
        },
      );

      return async (request: Message<I>) => resistor.push(request);
    }

    return messageProcessor;
  }
}
