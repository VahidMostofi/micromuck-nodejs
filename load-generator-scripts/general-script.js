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
  vus: 10,
  duration: '60s',
  userAgent: 'MyK6UserAgentString/1.0',
};

const BaseURL = 'http://localhost:10080'
//---------------------LINEAR-ARCHITECTURE--------------------
// a -> b -> c -> d -> e -> f -> g -> h -> i -> j
const linearArchitecture = [
  {'prob': 0.2, 'path': '/main/req1_bcdefghij'},
  {'prob': 0.2, 'path': '/main/req2_bcdefghij'},
  {'prob': 0.2, 'path': '/main/req3_bcdefghij'},
  {'prob': 0.2, 'path': '/main/req4_bcdefghij'},
  {'prob': 0.2, 'path': '/main/req5_bcdefghij'},
]
//------------------------------------------------------------

const architecture = linearArchitecture;

const trends = {};
const counters = {};

for(let i = 0;i < architecture.length; i++){
  architecture[i].type = architecture[i].path.substring(architecture[i].path.lastIndexOf('/')+1, architecture[i].path.lastIndexOf('_'));
  trends[architecture[i].type] = new Trend(architecture[i].type + "_duration" );
  counters[architecture[i].type] = new Counter(architecture[i].type + "_counter");
}

export function setup() {}

export default function (data) {
  const SLEEP_DURATION = 1;

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
