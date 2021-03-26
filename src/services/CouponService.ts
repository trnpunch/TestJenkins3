import Service from './Service';
import DB from '../utilities/DB';
import moment from 'moment';
import Validator from 'validatorjs';
import uuid from 'is-uuid';
import jose from 'jose';
import fetch from'node-fetch';
import { URLSearchParams } from 'url';
import * as WebView from '../utilities/WebView';
require('dotenv').config();

class CouponService extends Service {

    private customer: any = null;
    private latteToken: any = null;

    // Middleware
    private async customerValidate(headers: any) {

        try {

            // Verify 
            if (headers.authorization == null || headers.authorization == '' || headers.authorization == undefined) {
                throw null;
            }
            const file: any = await fetch(<string> process.env.COUPON_JWKS_URL).then(res => res.json()).then((json) => { return json; });
            const data: any = await jose.JWT.verify(headers.authorization, jose.JWKS.asKeyStore(file));

            // Config
            this.customer = <string> data['cognito:username'];
            return true;
            
        } catch (err) {

            this.setRes(false, 401, {
                msg: err
            });
            return false;

        }
    }

    // Latte barcode
    private async validateLatte(barcode: string) {
        
        try {
            const data: any = await fetch(<string> process.env.LATTE_STATUS_URL + barcode, {
                headers: {
                    'Authorization': this.latteToken
                }
            }).then(res => res.json()).then((json) => { return json; });
            if (data == [] || data == null || data == '') {
                throw null;
            }
            
            var result: any = [];
            data.forEach((arr: any) => {
                if (arr.coupon_status == 0) {
                    result.push(arr.coupon_number);
                }
            });
            return result;
        } catch (err) {
            return [];
        }
        
    }

    // Get token for using with latte checker
    private async accessTokenLatte() {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('scope', 'service-api/coupon');
            const data: any = await fetch(<string> process.env.LATTE_TOKEN_URL, {
                method: 'post',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(<string> process.env.LATTE_USER + ':' + <string> process.env.LATTE_PASS).toString('base64')
                }
            }).then(res => res.json()).then((json) => { return json; });
            this.latteToken = data.access_token;
            return true;
        } catch (err) {
            this.latteToken = null;
            return false;
        }
    }

    public async list(req: any) {
        try {

            if (await this.customerValidate(req.headers) == false) {
                throw null;
            }

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

            // Query
            const data = await DB.query("SELECT B.CODE, C.USAGE_TYPE, B.BARCODE_ID, C.COUPON_NAME_TH, C.COUPON_NAME_EN, C.START_DATE, C.EXPIRED_DATE, CONCAT(C.SAVED_PATH, '/', C.NEW_FILE_NAME_TH) URL_TH, CONCAT(C.SAVED_PATH, '/', C.NEW_FILE_NAME_EN) URL_EN FROM BARCODES B INNER JOIN COUPONS C ON B.COUPON_ID = C.COUPON_ID INNER JOIN CAMPAIGNS CP ON CP.CAMPAIGN_ID = C.CAMPAIGN_ID WHERE B.CUSTOMER = $1 AND $2 > C.START_DATE AND $2 < C.EXPIRED_DATE AND( B.IS_REDEEMED = FALSE OR( B.IS_REDEEMED = TRUE AND B.EXPIRED_IN > $2)) AND CP.IS_ACTIVE = TRUE ORDER BY C.EXPIRED_DATE ASC, C.CREATED_AT ASC", [
                this.customer,
                moment().format('YYYY-MM-DD HH:mm:ss')
            ]);
            let fetchData: any = [];

            if (data.rowCount > 0) {

                // Latte config
                let barcodeArr: any = [];
                data.rows.forEach((arr) => { barcodeArr.push(arr.code); });
                await this.accessTokenLatte();
                const availableCode = await this.validateLatte(barcodeArr.toString());

                // Fetching
                data.rows.forEach(async (arr) => {

                    if (arr.usage_type != 'CLICK') {
                        fetchData.push({
                            barcode_id: arr.barcode_id,
                            title: lang === 'th' ? arr.coupon_name_th : arr.coupon_name_en,
                            start_date: moment(arr.start_date).format('YYYY-MM-DD HH:mm:ss'),
                            expired_date: arr.expired_date == null ? null : moment(arr.expired_date).format('YYYY-MM-DD HH:mm:ss'),
                            img_url: lang === 'th' ? (process.env.S3_HOST + arr.url_th) : (process.env.S3_HOST + arr.url_en),
                            coupon_type: arr.usage_type
                        });
                    } else {

                        // Latte
                        if (availableCode.includes(arr.code) == true) {
                            fetchData.push({
                                barcode_id: arr.barcode_id,
                                title: lang === 'th' ? arr.coupon_name_th : arr.coupon_name_en,
                                start_date: moment(arr.start_date).format('YYYY-MM-DD HH:mm:ss'),
                                expired_date: arr.expired_date == null ? null : moment(arr.expired_date).format('YYYY-MM-DD HH:mm:ss'),
                                img_url: lang === 'th' ? (process.env.S3_HOST + arr.url_th) : (process.env.S3_HOST + arr.url_en),
                                coupon_type: arr.usage_type
                            });
                        } else {
                            // Update
                            await DB.query("UPDATE BARCODES SET IS_REDEEMED = TRUE, REDEEMED_AT = $1 WHERE BARCODE_ID = $2", [
                                moment().format('YYYY-MM-DD HH:mm:ss'),
                                arr.barcode_id
                            ]);
                        }

                    }
    
                });
            }

            this.setRes(true, 200, fetchData);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

    public async detail(req: any) {
        try {

            if (await this.customerValidate(req.headers) == false) {
                throw null;
            }
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

            if (await uuid.anyNonNil(req.params.id) === false) {
                this.setRes(false, 400, {
                    'id': [
                        "The id must be uuid."
                    ]
                });
                throw null;
            }

            const data = await DB.query("SELECT B.EXPIRED_IN, C.*, B.CODE, B.IS_REDEEMED, B.BARCODE_ID, CONCAT(C.SAVED_PATH, '/', C.NEW_FILE_NAME_TH) URL_TH, CONCAT(C.SAVED_PATH, '/', C.NEW_FILE_NAME_EN) URL_EN FROM BARCODES B INNER JOIN COUPONS C ON B.COUPON_ID = C.COUPON_ID WHERE B.CUSTOMER = $1 AND $2 > C.START_DATE AND $2 < C.EXPIRED_DATE AND B.BARCODE_ID = $3 LIMIT 1", [
                this.customer,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                req.params.id
            ]);
            if (data.rowCount !== 1) {
                this.setRes(false, 403, null);
                throw null;    
            }
            
            let leftTime: any = null;
            if (data.rows[0].expired_in != null) {
                let timeCurrent: any = moment();
                let timeOut: any = moment(data.rows[0].expired_in);
                leftTime = timeOut.diff(timeCurrent, 'seconds');
                leftTime = (leftTime < 0) ? 0 : leftTime;
            }            

            let agentName: string = 'Tesco';
            switch (lang) {
                case 'th': agentName = "เทสโก้ โลตัส"; break;
                case 'en': agentName = "Tesco Lotus"; break;
                case 'ms-MY': agentName = "Lotus's Malaysia"; break;
                case 'en-MY': agentName = "Lotus's Malaysia"; break;
            }
            this.setRes(true, 200, {
                barcode_id: req.params.id,
                title: lang === 'th' ? data.rows[0].coupon_name_th : data.rows[0].coupon_name_en,
                start_date: moment(data.rows[0].start_date).format('YYYY-MM-DD HH:mm:ss'),
                expired_date: data.rows[0].expired_date == null ? null : moment(data.rows[0].expired_date).format('YYYY-MM-DD HH:mm:ss'),
                img_url: lang === 'th' ? (process.env.S3_HOST + data.rows[0].url_th) : (process.env.S3_HOST + data.rows[0].url_en),
                agent_name: agentName,
                detail: lang === 'th' ? WebView.wrap(data.rows[0].detail_th) : WebView.wrap(data.rows[0].detail_en), 
                condition: lang === 'th' ? WebView.wrap(data.rows[0].condition_th) : WebView.wrap(data.rows[0].condition_en), 
                barcode: data.rows[0].code,
                coupon_type: data.rows[0].usage_type,
                countdown_time: (data.rows[0].expired_in != null) ? leftTime : data.rows[0].countdown_time,
                is_redeemed: data.rows[0].is_redeemed
            });
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

    public async redeem(req: any) {
        try {            
            
            if (await this.customerValidate(req.headers) == false) {
                throw null;
            }
            if (await uuid.anyNonNil(req.body.barcode_id) === false) {
                this.setRes(false, 400, {
                    'id': [
                        "The id must be uuid."
                    ]
                });
                throw null;
            }

            const existData = await DB.query("SELECT A.*, C.USAGE_TYPE, C.COUNTDOWN_TIME FROM BARCODES A INNER JOIN COUPONS C ON A.COUPON_ID = C.COUPON_ID WHERE A.BARCODE_ID = $1 AND A.CUSTOMER = $2 AND A.IS_REDEEMED = FALSE", [
                req.body.barcode_id,
                this.customer
            ]);
            if (existData.rowCount !== 1) {
                this.setRes(false, 403, null);
                throw null;    
            }

            if (existData.rows[0].usage_type === 'COUNT') {
                await DB.query("UPDATE BARCODES SET IS_REDEEMED = TRUE, REDEEMED_AT = $1, EXPIRED_IN = $2 WHERE BARCODE_ID = $3", [
                    moment().format('YYYY-MM-DD HH:mm:ss'),
                    moment().add(Number(existData.rows[0].countdown_time), 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                    req.body.barcode_id
                ]);
            } else {
                await DB.query("UPDATE BARCODES SET IS_REDEEMED = TRUE, REDEEMED_AT = $1 WHERE BARCODE_ID = $2", [
                    moment().format('YYYY-MM-DD HH:mm:ss'),
                    req.body.barcode_id
                ]);
            }
            
            this.setRes(true, 200, null);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

};

export default CouponService;