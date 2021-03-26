import express from 'express';
require('dotenv').config();

const router = express.Router();

// Access key middleware
router.use(function (req, res, next) {

    if (!req.headers['key'] || req.headers['key'] !== process.env.API_KEY) {
        res.status(401).json({
            code: 401,
            error: {
                key: [
                    'The key field is invalid.'
                ]
            }
        });
    } else {
        next();
    }

});

export default router;