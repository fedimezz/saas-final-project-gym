// src/lib/sse.ts
//
// In-memory Server-Sent Events hub.
//
// IMPORTANT CAVEAT (read before deploying anywhere but a single long-running
// Node process): this Map lives in process memory. It works correctly for
// local dev and for a traditional VPS/Docker deployment with ONE server
// instance. It will NOT work correctly:
//   - on Vercel serverless (each request can hit a different, short-lived
//     instance, so a connection registered in one invocation is invisible
//     to another) — SSE itself also gets cut off by the platform's request
//     timeout there regardless of this hub.
//   - with multiple server instances behind a load balancer (a member
//     connected to instance A will never see a broadcast triggered on
//     instance B).
// If you outgrow a single instance, swap the body of `broadcastToUser` /
// `broadcastToAll` for a pub/sub backend (Redis pub/sub, Postgres LISTEN/
// NOTIFY, Pusher, etc.) — the function signatures below are written so
// that swap doesn't require touching any of the calling code.

type Client = {
  userId: string;
  controller: ReadableStreamDefaultController;
};

// Multiple tabs/devices per user are supported — each gets its own entry.
const clients = new Set<Client>();

export function registerClient(
  userId: string,
  controller: ReadableStreamDefaultController
): Client {
  const client: Client = { userId, controller };
  clients.add(client);
  return client;
}

export function unregisterClient(client: Client) {
  clients.delete(client);
}

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  try {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(payload));
  } catch {
    // Controller is already closed (client disconnected mid-broadcast).
    // The disconnect's own cleanup (in the route's cancel handler) is
    // responsible for removing it from `clients` — nothing to do here.
  }
}

/** Push an event to every connection belonging to one specific user. */
export function broadcastToUser(userId: string, event: string, data: unknown) {
  for (const client of clients) {
    if (client.userId === userId) {
      send(client.controller, event, data);
    }
  }
}

/** Push an event to every connected client, regardless of user. */
export function broadcastToAll(event: string, data: unknown) {
  for (const client of clients) {
    send(client.controller, event, data);
  }
}

/** Push an event to a specific list of user IDs (e.g. "all members"). */
export function broadcastToUsers(userIds: string[], event: string, data: unknown) {
  const idSet = new Set(userIds);
  for (const client of clients) {
    if (idSet.has(client.userId)) {
      send(client.controller, event, data);
    }
  }
}

export function getConnectedClientCount() {
  return clients.size;
}
