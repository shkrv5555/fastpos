// Real-time sifariş event handler-ləri
export function registerOrderHandlers(io, socket) {
  // İşçi qoşulanda cari aktiv sifarişləri istəyə bilər
  socket.on('orders:request-active', async () => {
    if (socket.userRole !== 'employee') return;
    // Controller-dən ayrı yüngül sorğu
    socket.emit('orders:active-loaded', { message: 'USE_REST_API' });
  });

  // Müştəri — sifariş statusunu izlə (sessionId-ə join)
  socket.on('order:track', ({ sessionId }) => {
    if (!sessionId) return;
    socket.join(`session:${sessionId}`);
  });
}
