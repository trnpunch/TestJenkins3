import * as objectHelper from './Object';
import httpContext from 'express-http-context';
// @ts-ignore
import { maskPhone } from 'maskdata'

const LOGINFORMATION = '{LogInformation}';
const MASKING_LIST: any = {};
const HIDE_LIST: any = [];

class Log {

    generateLogTemplate(logInformation: any, level: string = 'INFO') {

        const xClientRequestId: string = '';
        const userId: string = '';
        const utcDate = new Date().toISOString();
        const xRequestId = httpContext.get('xRequestId');
        const logTemplate = `${utcDate} | ${xRequestId} | ${xClientRequestId} | ${userId} | ${level} | ONEAPP-BFF ${LOGINFORMATION}`;
        this.addLog(logTemplate, logInformation);

    }

    addLog(logTemplate: string, logInformation: any) {

        let logMessage: any;
        
        if (logInformation && objectHelper.isExactObject(logInformation)) {
            logMessage = JSON.parse(JSON.stringify(logInformation));
            logMessage = this.maskNestedObject(logMessage);
            this.logData(logTemplate, logMessage);
        } else {
            logMessage = logInformation;
            this.logData(logTemplate, logMessage);
        }

    }

    logData(logTemplate: string, logInformation: any) {
        const logData = logTemplate ? logTemplate.replace(LOGINFORMATION, JSON.stringify(logInformation)) : '';
        console.log(logData);
    }

    private maskNestedObject(object: any) {
        for (const i in object) {
            if (objectHelper.isExactObject(object[i])) {

                object[i] = this.maskNestedObject(object[i]);
                
            } else if (MASKING_LIST[i] && typeof object[i] === 'string') {

                object[i] = this.mask(object[i], i);

            } else if (HIDE_LIST.includes(i) && typeof object[i] === 'string') {

                object[i] = 'HIDE';

            }
        }
        return object;
    }

    private mask(value: string, maskingType: string) {
        return maskPhone(value, MASKING_LIST[maskingType]);
    }

}

export default Log;
