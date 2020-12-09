import http from "k6/http";
import {
  randomSeed
} from "k6";
import {
  check,
  sleep
} from 'k6';
import {
  Trend,
  Counter
} from 'k6/metrics';
export let options = {
  vus: ARG_VUS,
  duration: 'ARG_DURATIONs',
  userAgent: 'MyK6UserAgentString/1.0',
};

const BaseURL = "ARG_BASE_URL";

//---------------------LINEAR-ARCHITECTURE--------------------
// a -> b -> c -> d -> e -> f -> g -> h -> i -> j
const linearArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_bcdefghij'},
  {'prob': ARG_req2, 'path': '/main/req2_bcdefghij'},
  {'prob': ARG_req3, 'path': '/main/req3_bcdefghij'},
  {'prob': ARG_req4, 'path': '/main/req4_bcdefghij'},
  // {'prob': ARG_req5, 'path': '/main/req5_bcdefghij'},
]
//-------------------TWO-LINE_ARCHITECTURE---------------------
const twoLineArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_bdefgij'},
  {'prob': ARG_req2, 'path': '/main/req2_cdefghj'},
  {'prob': ARG_req3, 'path': '/main/req3_bdfghi'},
  {'prob': ARG_req4, 'path': '/main/req4_egij'},
  // {'prob': ARG_req5, 'path': '/main/req5_hj'},
]
//-------------------BOX_ARCHITECTURE---------------------
const boxArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_dfh'},
  {'prob': ARG_req2, 'path': '/main/req2_dgh'},
  {'prob': ARG_req3, 'path': '/main/req3_cefi'},
  {'prob': ARG_req4, 'path': '/main/req4_bh'},
  // {'prob': ARG_req5, 'path': '/main/req5_dgfj'},
]
//-------------------TWO-LAYERS---------------------
const twoLayersArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_bg'},
  {'prob': ARG_req2, 'path': '/main/req2_ch'},
  {'prob': ARG_req3, 'path': '/main/req3_di'},
  {'prob': ARG_req4, 'path': '/main/req4_ej'},
  // {'prob': ARG_req5, 'path': '/main/req5_fj'},
]
//-------------------STAR---------------------
const starArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_bfg'},
  {'prob': ARG_req2, 'path': '/main/req2_cfh'},
  {'prob': ARG_req3, 'path': '/main/req3_dfi'},
  {'prob': ARG_req4, 'path': '/main/req4_cfj'},
  // {'prob': ARG_req5, 'path': '/main/req5_efj'},
]

//-------------------STAR---------------------
const smallStarArchitecture = [
  {'prob': ARG_req1, 'path': '/main/req1_bde'},
  {'prob': ARG_req2, 'path': '/main/req2_bdf'},
  {'prob': ARG_req3, 'path': '/main/req3_cde'},
  {'prob': ARG_req4, 'path': '/main/req4_cdf'},
]

const architecture = ARG_ARCHITECTURE;

const trends = {};
const counters = {};

for(let i = 0;i < architecture.length; i++){
  architecture[i].type = architecture[i].path.substring(architecture[i].path.lastIndexOf('/')+1, architecture[i].path.lastIndexOf('_'));
  trends[architecture[i].type] = new Trend(architecture[i].type + "_duration" );
  counters[architecture[i].type] = new Counter(architecture[i].type + "_counter");
}

export function setup() {}

export default function (data) {
  const SLEEP_DURATION = ARG_SLEEP_DURATION;

  let uniqueNumber = __VU * 100000000 + __ITER;
  randomSeed(uniqueNumber);

  const requestExecutors = {}
  for(let i = 0;i < architecture.length; i++){
    const option = architecture[i];
    requestExecutors[option.type] = () => {
      let params = {
        headers: {
          'debug_id': new Date().getTime()
        },
        tags: {
          name: option.type
        }
      };
      let response = http.get(
        BaseURL + option.path,
        params
      );
      trends[option.type].add(response.timings.duration);
      counters[option.type].add(1);
      check(response, {
        'is_ok': r => r.status === 200
      });
    }
  }
  const r = Math.random();
  const sTime = Math.random() * SLEEP_DURATION + 0.5 * SLEEP_DURATION;

  sleep(sTime);
  let cr = architecture[0].prob;
  for(let i = 0;i < architecture.length;i++){
    if (r < cr){
      requestExecutors[architecture[i].type]()
      break
    }
    cr += architecture[i+1].prob;
  }
};
export function teardown(data) {}
