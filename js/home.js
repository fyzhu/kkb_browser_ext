console.log('this is home page');
document.addEventListener('hashchange', ()=>{
  console.log('hashchange', location.href);
})
let id = 1;
