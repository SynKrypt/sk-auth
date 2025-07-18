import "dotenv/config";
import app from "./server.ts";
import config from "./config/env-config.ts";

const PORT = config.app.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
