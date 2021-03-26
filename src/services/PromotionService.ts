import Service from './Service';
import Validator from 'validatorjs';
import DB from '../utilities/DB';
import * as clean from '../utilities/Clean';
import * as WebView from '../utilities/WebView';
import moment from 'moment';
import uuid from 'is-uuid';
import * as redis from '../utilities/Redis';
require('dotenv').config();

class PromotionService extends Service {

    // List
    public async getList(req: any) {
        try {

            let lang: string = req.headers['accept-language'];
            
            if (!['th', 'en', 'ms-MY', 'en-MY'].includes(lang)) {
                this.setRes(false, 400, {
                    'accept-language': [
                        'The accept-language field is invalid.'
                    ]
                });
                throw null;
            }
            if (lang === 'ms-MY') {
                lang = 'th';
            }
            if (lang === 'en-MY') {
                lang = 'en';
            }
            
            // Validation
            const validated = new Validator(req.query, {
                type: 'string|in:CATALOG,EVENT',
                limit: 'required|numeric|between:-1,100',
                offset: 'required|numeric|min:0',
            });
            if (await validated.fails()) {
                this.setRes(false, 400, validated.errors.errors);
                throw null;
            }

            const limit: number = req.query.limit;
            const offset: number = req.query.offset;
            const currentTime: string = moment().format('YYYY-MM-DD HH:mm:ss');

            let command: string = "SELECT P.SHORT_DESCRIPTION_TH, P.SHORT_DESCRIPTION_EN, P.CREATED_AT, P.PROMOTION_ID, P.START_DATE, P.EXPIRED_DATE, P.TITLE_TH, P.TITLE_EN, P.TYPE_CODE, C.URL FROM PROMOTIONS P INNER JOIN( SELECT PROMOTION_ID, CONCAT(SAVED_PATH, '/', NEW_FILE_NAME) URL FROM COVER_IMAGES WHERE LANG_CODE = UPPER('" + lang + "') ) C ON C.PROMOTION_ID = P.PROMOTION_ID WHERE P.IS_ACTIVE = TRUE AND ('" + currentTime + "' >= P.START_DATE AND '" + currentTime + "' <= P.EXPIRED_DATE) ";
            if (req.query.type && clean.str(req.query.type) != null) {
                command += "AND P.TYPE_CODE = '" + req.query.type + "' ";
            }
            const count = await DB.query("SELECT COUNT(A.*) TOTAL FROM (" + command + ") A");
            command += "ORDER BY P.START_DATE DESC, P.EXPIRED_DATE ASC ";
            if (limit > 0) {
                command += "LIMIT " + limit + " OFFSET " + offset + " ";
            }            

            const rawData = await DB.query(command);

            let fetchData: any = [];

            rawData.rows.forEach((arr: any) => {
                fetchData.push({
                    promotion_id: arr.promotion_id,
                    type_code: arr.type_code,
                    subject: lang === 'th' ? clean.str(arr.title_th) : clean.str(arr.title_en),
                    short_description: lang === 'th' ? clean.str(arr.short_description_th) : clean.str(arr.short_description_en),
                    start_date: moment(arr.start_date).format('YYYY-MM-DD HH:mm:ss'),
                    expired_date: moment(arr.expired_date).format('YYYY-MM-DD HH:mm:ss'),
                    created_at: moment(arr.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    cover_image_url: process.env.S3_HOST + arr.url
                });
            });

            // Response
            this.setRes(true, 200, {
                count: count.rows[0].total,
                list: fetchData
            });
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

    // Detail
    public async getDetail(req: any) {
        try {

            let lang: string = req.headers['accept-language'];
            
            if (!['th', 'en', 'ms-MY', 'en-MY'].includes(lang)) {
                this.setRes(false, 400, {
                    'accept-language': [
                        'The accept-language field is invalid.'
                    ]
                });
                throw null;
            }
            if (lang === 'ms-MY') {
                lang = 'th';
            }
            if (lang === 'en-MY') {
                lang = 'en';
            }

            const validated = new Validator(req.params, {
                id: 'required|string|size:36'
            });
            if (await validated.fails() || await uuid.anyNonNil(req.params.id) === false) {
                this.setRes(false, 400, {
                    'id': [
                        "The id must be uuid."
                    ]
                });
                throw null;
            }

            // Redis
            const indexRedis = 'promotion-' + lang + '-' + req.params.id;
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }

            const promoData = await DB.query('SELECT * FROM PROMOTIONS WHERE PROMOTION_ID = $1 AND IS_ACTIVE = TRUE', [req.params.id]);
            if (promoData.rowCount !== 1) {
                this.setRes(false, 403, null);
                throw null;
            }
            const coverData = await DB.query("SELECT CONCAT(SAVED_PATH, '/', NEW_FILE_NAME) URL FROM COVER_IMAGES WHERE PROMOTION_ID = $1 AND LANG_CODE = $2", [req.params.id, lang.toUpperCase()]);
            const itemData = await DB.query('SELECT * FROM PROMOTION_ITEMS WHERE PROMOTION_ID = $1 AND LANG_CODE = $2 ORDER BY NO ASC', [req.params.id, lang.toUpperCase()]);

            let resData: any = {
                type_code: promoData.rows[0].type_code,
                title: lang === 'th' ? promoData.rows[0].title_th : promoData.rows[0].title_en,
                short_description: lang === 'th' ? promoData.rows[0].short_description_th : promoData.rows[0].short_description_en,
                link_url: promoData.rows[0].link_url,
                start_date: moment(promoData.rows[0].start_date).format('YYYY-MM-DD'),
                expired_date: moment(promoData.rows[0].expired_date).format('YYYY-MM-DD'),
                cover_image_url: process.env.S3_HOST + coverData.rows[0].url
            };

            if (promoData.rows[0].type_code === 'CATALOG') {
                resData.catalog_image_url = process.env.S3_HOST + itemData.rows[0].saved_path + '/' + itemData.rows[0].new_file_name;
            } else {
                resData.event_image_url = [];
                itemData.rows.forEach((arr: any) => {
                    resData.event_image_url.push({
                        url: process.env.S3_HOST + arr.saved_path + '/' + arr.new_file_name,
                        description: arr.description != null ? WebView.wrap(arr.description) : null
                    });
                });
            }

            // Response
            this.setRes(true, 200, resData);
            await redis.set(indexRedis, resData, 86400);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }    

};

export default PromotionService;