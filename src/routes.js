const express = require('express');
const axios = require('axios');
const random = require('random');
const { FORMAT_HTTP_HEADERS } = require('opentracing');
const responseTimes = JSON.parse(process.env.MEAN_RESPONSE_TIMES);

const {trackMiddleware, tracer} = require('./trace_utils');

const router = express.Router();

router.get('/health',[trackMiddleware('health')], async (req,res) => {
    res.status(200).end();
});

router.get('/main/:handle',[trackMiddleware('main')], (req, res) => {
    const mainSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const processSpan = tracer.startSpan("process", {childOf: mainSpanContext});

    const handle = req.params.handle;
    const reqType = req.params.handle.substring(0,4);
    const nextService = req.params.handle[4];
    const restOfParams = req.params.handle.substring(5);
    const mean = responseTimes[reqType];
    let iterCount = 0;
    if(mean >= 0){
        random.poisson(lambda=mean)() + 1;
    }

    // console.log({
    //     handle,
    //     reqType,
    //     nextService,
    //     iterCount,
    //     restOfParams,
    //     mean
    // });

    let count = 0;
    for(let i = 0;i < iterCount * 10000; i++){
        if (i%5 == 0){
            count += 1;
        }
    }
    processSpan.finish();

    if (req.params.handle.length > 4){
        const callSpan = tracer.startSpan("call", {childOf: mainSpanContext});
        const reqHeaders = {};
        tracer.inject(callSpan, FORMAT_HTTP_HEADERS, reqHeaders);
        const API = axios.create({
            baseURL: 'http://service-'+nextService+':1008' + (nextService.charCodeAt(0) - 'a'.charCodeAt(0)),
            headers: reqHeaders
        });

        API.get('/main/' + reqType + restOfParams)
        .then(()=>{
            callSpan.finish();
            return res.status(200).end();
        })
        .catch((err)=>{
            console.log(err);
            callSpan.finish();
            return res.status(500).end();
        });
    }else{
        return res.status(200).end();
    }
});

module.exports = router;