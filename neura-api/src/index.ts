import { env } from "@/config/env"; // loads .env first
import app from "@/app";

app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));

export default app;
