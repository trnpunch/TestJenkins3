import Service from './Service';
import DB from '../utilities/DB';
import nf from 'node-fetch';
import * as redis from '../utilities/Redis';
import * as WebView from '../utilities/WebView';
require('dotenv').config();

class InfoService extends Service {

    // Province
    public async getAddress() {

        try {

            const indexRedis = 'province';
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }

            let data: any = await nf(process.env.S3_HOST + 'province.json', {
                method: 'get'
            }).then(res => res.json()).then((json) => { return json; });

            this.setRes(true, 200, data);
            await redis.set(indexRedis, data, 7776000);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }

    }

    // URL
    public async getSetting() {

        try {

            // Redis
            const indexRedis = 'app-url';
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }

            const data: any = await DB.query("SELECT KEY, VALUE_TH, VALUE_EN FROM APP_SETTINGS WHERE IS_ACTIVE = TRUE AND CATEGORY = 'URL'");

            let fetch: any = {
                th: {
                    about_clubcard_url: null,
                    app_feedback_url: null,
                    faq_url: null,
                    contact_us_phone: null,
                    term_of_use_url: null,
                    privacy_policy_url: null
                },
                en: {
                    about_clubcard_url: null,
                    app_feedback_url: null,
                    faq_url: null,
                    contact_us_phone: null,
                    term_of_use_url: null,
                    privacy_policy_url: null
                }
            };

            data.rows.forEach((arr: any) => {
                switch (arr.key) {
                    case 'ABOUT': 
                        fetch.th.about_clubcard_url = arr.value_th;
                        fetch.en.about_clubcard_url = arr.value_en;
                        break;
                    case 'FEEDBACK': 
                        fetch.th.app_feedback_url = arr.value_th;
                        fetch.en.app_feedback_url = arr.value_en;
                        break;
                    case 'FAQ': 
                        fetch.th.faq_url = arr.value_th;
                        fetch.en.faq_url = arr.value_en;
                        break;
                    case 'CONTACT': 
                        fetch.th.contact_us_phone = arr.value_th;
                        fetch.en.contact_us_phone = arr.value_en;
                        break;
                    case 'TERMS': 
                        fetch.th.term_of_use_url = arr.value_th;
                        fetch.en.term_of_use_url = arr.value_en;
                        break;
                    case 'POLICY': 
                        fetch.th.privacy_policy_url = arr.value_th;
                        fetch.en.privacy_policy_url = arr.value_en;
                        break;
                }
            });

            this.setRes(true, 200, fetch);
            await redis.set(indexRedis, fetch, 7776000);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }

    }

    // Voucher
    public async getVoucher() {

        try {

            // Redis
            const indexRedis = 'voucher-detail';
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }

            const data: any = await DB.query("SELECT KEY, VALUE_TH, VALUE_EN FROM APP_SETTINGS WHERE IS_ACTIVE = TRUE AND CATEGORY = 'VOUCHER'");

            let fetch: any = {
                th: {
                    detail_voucher: null,
                    condition_voucher: null,
                    detail_coupon: null,
                    condition_coupon: null
                },
                en: {
                    detail_voucher: null,
                    condition_voucher: null,
                    detail_coupon: null,
                    condition_coupon: null
                }
            };

            data.rows.forEach((arr: any) => {
                switch (arr.key) {
                    case 'VC_DETAIL': 
                        fetch.th.detail_voucher = WebView.wrap(arr.value_th);
                        fetch.en.detail_voucher = WebView.wrap(arr.value_en);
                        break;
                    case 'VC_CONDI': 
                        fetch.th.condition_voucher = WebView.wrap(arr.value_th);
                        fetch.en.condition_voucher = WebView.wrap(arr.value_en);
                        break;
                    case 'CP_DETAIL': 
                        fetch.th.detail_coupon = WebView.wrap(arr.value_th);
                        fetch.en.detail_coupon = WebView.wrap(arr.value_en);
                        break;
                    case 'CP_CONDI': 
                        fetch.th.condition_coupon = WebView.wrap(arr.value_th);
                        fetch.en.condition_coupon = WebView.wrap(arr.value_en);
                        break;
                }
            });

            this.setRes(true, 200, fetch);
            await redis.set(indexRedis, fetch, 7776000);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }

    }

    // Feature
    public async checkCashVoucherFeature() {

        try {

            // Redis
            const indexRedis = 'cash-feature';
            const valueRedis: any = await redis.get(indexRedis);
            if (valueRedis) {
                this.setRes(true, 200, JSON.parse(valueRedis));
                throw null;    
            }

            let fetch: any = {
                is_show_feature: null,
                is_opt_in: null
            };
            const data: any = await DB.query("SELECT IS_ACTIVE, KEY FROM APP_SETTINGS WHERE CATEGORY = 'CASH_FEATURE'");
            data.rows.forEach((arr: any) => {
                if (arr.key === 'CASH_FEATURE') {
                    fetch.is_show_feature = arr.is_active;
                } else {
                    fetch.is_opt_in = arr.is_active;
                }
            });            
            this.setRes(true, 200, fetch);
            await redis.set(indexRedis, fetch, 7776000);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }

    }

};

export default InfoService;