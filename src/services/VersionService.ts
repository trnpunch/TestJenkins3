import Service from './Service';
import Validator from 'validatorjs';
import DB from '../utilities/DB';
import compare from 'compare-versions';
import * as redis from '../utilities/Redis';

class VersionService extends Service {

    // Check
    public async check(req: any) {
        try {

            const validated = new Validator(req.body, {
                os: 'required|in:ANDROID,IOS',
                version: 'required|regex:/^[0-9]+\.[0-9]+\.[0-9]+$/'
            });

            if (validated.fails()) {
                this.setRes(false, 400, validated.errors.errors);
                throw null;
            }

            let data: any = null;
            const input: any = req.body.version.split('.').map(Number);
            let latest: any = null;
            let force: any = null;
            let concat: any = {
                latest: null,
                force: null
            };

            // Redis
            const indexRedis = 'app-version-' + (req.body.os).toLowerCase();
            const valueRedis: any = await redis.get(indexRedis);

            if (valueRedis) {
                data = JSON.parse(valueRedis);                
                latest = data.latest_version.split('.').map(Number);
                force = data.force_version.split('.').map(Number);
                concat = {
                    latest: data.latest_version,
                    force: data.force_version
                };
            } else {
                data = await DB.query("SELECT LATEST_VERSION, FORCE_VERSION FROM APP_VERSION WHERE OS=$1 LIMIT 1", [req.body.os]);                
                latest = data.rows[0].latest_version.split('.').map(Number);
                force = data.rows[0].force_version.split('.').map(Number);
                concat = {
                    latest: data.rows[0].latest_version,
                    force: data.rows[0].force_version
                };
                await redis.set(indexRedis, {
                    latest_version: data.rows[0].latest_version,
                    force_version: data.rows[0].force_version
                }, 604800);
            }

            let fetch: any = {
                your_version: req.body.version,
                latest_version: concat.latest,
                force_version: concat.force,
                is_forced: false,
                is_same: concat.latest === req.body.version ? true : false
            };

            // // Major, Does not care forecd update
            // if (input[0] < latest[0]) {
            //     fetch.is_forced = true;
            // }
            // if (input[0] <= latest[0] && input[1] < latest[1]) {
            //     fetch.is_forced = true;
            // }

            // // Forced
            // if (input[0] <= force[0] && input[1] <= force[1] && input[2] < force[2]) {
            //     fetch.is_forced = true;
            // }
            
            if (compare(concat.force, req.body.version) === 1) {
                fetch.is_forced = true;
            }

            // Latest version pop-up
            if (compare(concat.latest, req.body.version) === -1) {
                fetch.is_same = true;
            }

            this.setRes(true, 200, fetch);
            throw null;

        } catch (err) {

            if (err) { console.log(err); }
            return this.getRes();

        }
    }

};

export default VersionService;