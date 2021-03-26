import Service from './Service';
import DB from '../utilities/DB';
import moment from 'moment';
import * as redis from '../utilities/Redis';
require('dotenv').config();

class CardService extends Service {

    public async getCurrent() {
        try {

            // Redis
            const indexRedis = 'card-img';
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }
            
            const data: any = await DB.query("SELECT CONCAT(SAVED_PATH, '/', NEW_FILE_NAME) FILE_PATH, CASE WHEN MODIFIED_AT IS NULL THEN CREATED_AT ELSE MODIFIED_AT END LAST_MODIFIED FROM CARDS WHERE IS_ACTIVE=TRUE LIMIT 1");
            if (data.rowCount != 1) {
                this.setRes(false, 500, null);
                throw null;
            }

            let fetch: any = {
                image_url: process.env.S3_HOST + data.rows[0].file_path,
                last_modified: moment(data.rows[0].last_modified).format('YYYY-MM-DD HH:mm:ss')
            };

            this.setRes(true, 200, fetch);
            await redis.set(indexRedis, fetch, 604800);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

};

export default CardService;