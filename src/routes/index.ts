import express from 'express';
import AccessMiddleware from '../middleware/AccessMiddleware';
import InfoService from '../services/InfoService';
import VersionService from '../services/VersionService';
import PromotionService from '../services/PromotionService';
import CardService from '../services/CardService';
import CouponService from '../services/CouponService';

const router = express.Router();

// Access key middleware
router.use(AccessMiddleware);

// Info service route group
router.get('/info/addresses', async (req, res) => { 
    let Service = new InfoService();
    const data = await Service.getAddress(); 
    res.status(data.code).json(data); 
});
router.get('/info/settings', async (req, res) => { 
    let Service = new InfoService();
    const data = await Service.getSetting(); 
    res.status(data.code).json(data); 
});
router.get('/info/vouchers', async (req, res) => { 
    let Service = new InfoService();
    const data = await Service.getVoucher(); 
    res.status(data.code).json(data); 
});
router.get('/info/feature', async (req, res) => { 
    let Service = new InfoService();
    const data = await Service.checkCashVoucherFeature(); 
    res.status(data.code).json(data); 
});

// Version service route group
router.post('/version/check', async (req, res) => { 
    let Service = new VersionService();
    const data = await Service.check(req);
    res.status(data.code).json(data); 
});

// Promotion service route group
router.get('/promotions', async (req, res) => { 
    let Service = new PromotionService();
    const data = await Service.getList(req);
    res.status(data.code).json(data); 
});
router.get('/promotions/:id', async (req, res) => { 
    let Service = new PromotionService();
    const data = await Service.getDetail(req);
    res.status(data.code).json(data); 
});

// Card service route group
router.get('/cards', async (req, res) => { 
    let Service = new CardService();
    const data = await Service.getCurrent();
    res.status(data.code).json(data); 
});

// Coupon service route group
router.get('/coupons', async (req, res) => { 
    let Service = new CouponService();
    const data = await Service.list(req);
    res.status(data.code).json(data); 
});
router.get('/coupons/:id', async (req, res) => { 
    let Service = new CouponService();
    const data = await Service.detail(req);
    res.status(data.code).json(data); 
});
router.post('/redeem', async (req, res) => { 
    let Service = new CouponService();
    const data = await Service.redeem(req);
    res.status(data.code).json(data); 
});

// Health
router.get('/health', async (req, res) => {
    return res.status(200).json({
        'status': 'OK'
    });
});

export default router;