console.log('this is home page');
document.addEventListener('hashchange', ()=>{
  console.log('hashchange', location.href);
})
let id = 1;
setInterval(()=>{
  console.log('this is home', id++);
}, 1000)