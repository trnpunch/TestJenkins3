import express from 'express';
import cors from 'cors';
import router from './routes';
import httpContext from 'express-http-context';
import logging from './middleware/LogMiddleware';
require('dotenv').config();

const app = express();
app.use(express.json());

// Log
app.use(httpContext.middleware);
app.use(logging);

app.use((err: any, req: any, res: any, next: any) => {
    if (err) {
        res.status(400).json({
            code: 400,
            error: {
                input: [
                    'The input is incorrect.'
                ]
            }
        });
    } else {
        next();
    }
});

app.use(cors());
app.use('/resources', express.static('src/resources'));
app.use(router);

app.listen(process.env.PORT, () => {
    console.log('Server listening at ' + process.env.PORT);
});