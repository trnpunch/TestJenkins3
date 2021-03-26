import httpContext from 'express-http-context';
import Log from '../utilities/Log';

import { v4 as uuidv4 } from 'uuid';

export default function middleware(req: any, res: any, next: any) {

    const startHrTime = process.hrtime();
    const xRequestId = req.headers['x-request-id'] === undefined ? uuidv4() : req.headers['x-request-id'].toString();
    httpContext.set('xRequestId', xRequestId);

    // Config
    const log = new Log();
    const body = JSON.stringify(req.body) === '{}' ? '' : req.body;

    // Start
    log.generateLogTemplate('Begin Processing');
    log.generateLogTemplate(`Request ${req.method} ${req.originalUrl}`);
    if (body) { log.generateLogTemplate(body); }

    // Finish
    res.on('finish', () => {

        const log = new Log();
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
        log.generateLogTemplate(`Processing time ${elapsedTimeInMs} ms`);

    })

    next();

}
