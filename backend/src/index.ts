import "dotenv/config";
import { creatApi } from "./createApi";

const app = creatApi();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  console.log(`Server is on http://localhost:${port}`);
});
