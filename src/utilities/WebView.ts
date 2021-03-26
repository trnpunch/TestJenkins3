require('dotenv').config();
export const wrap = (value: string) => {
    const url = 'https://' + process.env.MOBILE_HOST + 'resources/TESCOModernThai-Regular.ttf';
    let text = "<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1.0,user-scalable=no'><style type='text/css'>@font-face { font-family: Tesco; src: url('" + url + "'); } p, body { line-height: 1.5; font-family: Tesco; font-size: 14px; text-align: left; color: #5E7671; background-color: #FFFFFF; }</style></head><body>";
    text += value;
    text += "</body></html>";
    return text;
};