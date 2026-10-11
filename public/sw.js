self.addEventListener("push", (event) => {
  let data = { title: "Diablos Rojos", body: "Tienes una notificación nueva." };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // payload no era JSON, usar default
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      badge: "/logo.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});
