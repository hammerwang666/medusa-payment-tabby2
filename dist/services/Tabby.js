"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const medusa_1 = require("@medusajs/medusa");
const axios_1 = __importDefault(require("axios"));
const medusa_core_utils_1 = require("medusa-core-utils");
class MyPaymentProcessor extends medusa_1.AbstractPaymentProcessor {
    constructor(container, options) {
        super(container);
        // options contains plugin options
        this.merchants = options.merchants;
    }
    updatePaymentData(sessionId, data) {
        throw new Error("1");
    }
    async capturePayment(paymentSessionData) {
        try {
            var id;
            if (paymentSessionData.hasOwnProperty("payment")) {
                // @ts-ignore
                id = paymentSessionData.payment.id;
            }
            else {
                id = paymentSessionData.id;
            }
            const data = {
                amount: paymentSessionData.amount
            };
            const headers = {
                authorization: `Bearer ${process.env.TABBY_TOKEN_SECRET}`,
            };
            await axios_1.default.post(`${process.env.TABBY_API}/payments/${id}/captures`, data, { headers });
            return await this.retrievePayment(paymentSessionData);
        }
        catch (error) {
            return error;
        }
    }
    async authorizePayment(paymentSessionData, context) {
        try {
            const status = await this.getPaymentStatus(paymentSessionData);
            const temp = await this.retrievePayment(paymentSessionData);
            const data = { ...temp };
            return {
                status,
                data,
            };
        }
        catch (error) {
            const e = {
                "error": error
            };
            return e;
        }
    }
    async cancelPayment(paymentSessionData) {
        return {
            id: "cancel",
        };
    }
    async initiatePayment(context) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const price = context.amount / 100;
        const priceString = price.toString();
        const formattedPrice = priceString.slice(0, 3) + "." + priceString.slice(3);
        const success = `${process.env.WEB_ENDPOINT}/success`;
        const currency = context.currency_code;
        const country = (_a = context.customer.billing_address) === null || _a === void 0 ? void 0 : _a.country_code;
        const merchant = this.merchants.find((merchant) => merchant.currency === currency.toUpperCase())
            || this.merchants.find((merchant) => merchant.type === "DEFAULT");
        const data = {
            "payment": {
                "amount": price,
                "currency": merchant.currency,
                "buyer": {
                    "phone": (_b = context === null || context === void 0 ? void 0 : context.billing_address) === null || _b === void 0 ? void 0 : _b.phone,
                    "email": context.email,
                    "name": `${((_c = context.customer) === null || _c === void 0 ? void 0 : _c.first_name) ? (_d = context.customer) === null || _d === void 0 ? void 0 : _d.first_name : (_e = context.billing_address) === null || _e === void 0 ? void 0 : _e.first_name} ${((_f = context.customer) === null || _f === void 0 ? void 0 : _f.last_name) ? (_g = context.customer) === null || _g === void 0 ? void 0 : _g.last_name : (_h = context.billing_address) === null || _h === void 0 ? void 0 : _h.last_name}` || null,
                },
                "shipping_address": {
                    "city": `${(_j = context.billing_address) === null || _j === void 0 ? void 0 : _j.city}` || null,
                    "address": `${(_k = context.billing_address) === null || _k === void 0 ? void 0 : _k.address_1}` || null,
                    "zip": ((_l = context.billing_address) === null || _l === void 0 ? void 0 : _l.postal_code) || null
                },
                "order": {
                    "reference_id": context.resource_id,
                    "items": [
                        {
                            "title": null,
                            "quantity": 1,
                            "unit_price": "0.00",
                            "category": null,
                        }
                    ]
                },
                "buyer_history": {},
                "order_history": [],
            },
            "lang": "ar",
            "merchant_code": merchant.merchant_code,
            "merchant_urls": {
                "success": `${process.env.WEB_ENDPOINT}/order/confirmed/${context.resource_id}`,
                "cancel": `${process.env.WEB_ENDPOINT}`,
                "failure": `${process.env.WEB_ENDPOINT}`,
            },
        };
        const config = {
            headers: {
                Authorization: `Bearer ${process.env.TABBY_TOKEN}`,
            },
        };
        const url = `${process.env.TABBY_API}/checkout`;
        const response = await axios_1.default.post(url, data, config);
        let responseData;
        let checkoutError;
        try {
            responseData = await response.data;
            console.log('Tabbys response--------------------------------start`');
            console.log({
                param: JSON.stringify(data),
                context: JSON.stringify(context),
                billing_address: JSON.stringify(context.billing_address),
                responseData: JSON.stringify(responseData)
            });
            console.log('Tabbys response--------------------------------end`');
        }
        catch (error) {
            checkoutError = error;
            console.log('Tabby checkout error:', error);
            throw error;
        }
        return { ...responseData, msg: checkoutError, tabby_url_fake: 'http://a.com', tabby_url: (_q = (_p = (_o = (_m = responseData === null || responseData === void 0 ? void 0 : responseData.configuration) === null || _m === void 0 ? void 0 : _m.available_products) === null || _o === void 0 ? void 0 : _o.installments) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.web_url };
    }
    async deletePayment(paymentSessionData) {
        return paymentSessionData;
    }
    async getPaymentStatus(paymentSessionData) {
        const responceData = await this.retrievePayment(paymentSessionData);
        const status = responceData["status"];
        switch (status) {
            case "AUTHORIZED":
                return medusa_1.PaymentSessionStatus.AUTHORIZED;
            case "CANCELED":
                return medusa_1.PaymentSessionStatus.CANCELED;
            case "CREATED":
                return medusa_1.PaymentSessionStatus.PENDING;
            case "CREATED":
                return medusa_1.PaymentSessionStatus.REQUIRES_MORE;
            default:
                return medusa_1.PaymentSessionStatus.ERROR;
        }
    }
    async refundPayment(paymentSessionData, refundAmount) {
        try {
            var id;
            if (paymentSessionData.hasOwnProperty("payment")) {
                // @ts-ignore
                id = paymentSessionData.payment.id;
            }
            else {
                id = paymentSessionData.id;
            }
            const data = {
                //@ts-ignore
                amount: (0, medusa_core_utils_1.humanizeAmount)(refundAmount, paymentSessionData.currency)
            };
            const headers = {
                authorization: `Bearer ${process.env.TABBY_TOKEN_SECRET}`,
            };
            await axios_1.default.post(`${process.env.TABBY_API}/payments/${id}/refunds`, data, { headers });
            return await this.retrievePayment(paymentSessionData);
        }
        catch (error) {
            return error;
        }
    }
    async retrievePayment(paymentSessionData) {
        try {
            var id;
            if (paymentSessionData.hasOwnProperty("payment")) {
                // @ts-ignore
                id = paymentSessionData.payment.id;
            }
            else {
                id = paymentSessionData.id;
            }
            const headers = {
                authorization: `Bearer ${process.env.TABBY_TOKEN_SECRET}`,
            };
            const response = await axios_1.default.get(`${process.env.TABBY_API}/payments/${id}`, { headers });
            const responseData = response.data;
            return responseData;
        }
        catch (error) {
            return error;
        }
    }
    async updatePayment(context) {
        // this.initiatePayment(context)
    }
}
MyPaymentProcessor.identifier = "Tabby";
exports.default = MyPaymentProcessor;
