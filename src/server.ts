import 'dotenv/config';
import http from 'http';
import app from './app';
import { myDB } from './Utils/ConnectDB';

const port = Number(process.env.PORT ?? 3000);

myDB.getDB();

http.createServer(app).listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
