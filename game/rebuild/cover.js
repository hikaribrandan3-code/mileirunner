// Cover artwork readiness only; the menu no longer runs a simulated livestream.
const menu=document.querySelector('#menu');
const poster=menu.querySelector('.tour-poster');
const game=document.querySelector('#game');
// Match the illustration's camera framing to the game panel, not the window.
// Short panels need the pulled-back group to leave the controls on open road.
function fitCover(){
 const {width,height}=game.getBoundingClientRect();
 const compact=width/height>=.64;
 const src=compact?'../art/world-tour-cover-v4.webp':'../art/world-tour-cover-v3.webp';
 if(poster.getAttribute('src')!==src)poster.src=src;
}
fitCover();
new ResizeObserver(fitCover).observe(game);
export const coverReady=Promise.all([...menu.querySelectorAll('img')].map(image=>image.decode().catch(()=>{})));
