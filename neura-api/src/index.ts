import { env } from "@/config/env"; // loads .env first
import app from "@/app";
import { startNotificationScheduler } from "@/modules/notifications/notifications.dispatch";

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  startNotificationScheduler();
});

export default app;
