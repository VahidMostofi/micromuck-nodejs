


const beg = new Date().getTime();
const duration = 3000;
let stop = false;
setTimeout(()=>{
  stop=true;
  console.log("!")
},1000);
while(beg + duration > new Date().getTime() || stop){}
const d = new Date().getTime() - beg;
console.log(d)
