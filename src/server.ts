import 'dotenv/config';
import app from './app';
import http from 'http';

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer(app);
server.listen(port, () => {
    console.log(`we up in port ${port}`);
});