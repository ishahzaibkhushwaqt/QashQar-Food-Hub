/**
 * Socket.io helper for real-time synchronization across Customer, KDS, and Driver views.
 * The custom server stores the initialized Socket.io instance on global.io.
 */

export function getIO() {
  return global.io || null;
}

export function broadcastOrderEvent(eventName, payload) {
  const io = getIO();
  if (!io) {
    console.log(`[Socket] IO not initialized yet. Skipping broadcast: ${eventName}`);
    return;
  }

  // Broadcast to global channel
  io.emit(eventName, payload);

  // If specific restaurant channel
  if (payload.restaurantId) {
    io.to(`restaurant_${payload.restaurantId}`).emit(eventName, payload);
  }

  // If specific order channel
  if (payload.orderId || payload._id) {
    const orderId = payload.orderId || payload._id;
    io.to(`order_${orderId}`).emit(eventName, payload);
  }

  console.log(`📡 [Socket Broadcast] ${eventName} ->`, {
    orderNumber: payload.orderNumber || payload._id,
    status: payload.status,
  });
}
