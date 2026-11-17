// Abertura animada do app instalado: monograma LC em ouro metálico, com volume 3D
// (camadas empilhadas em profundidade), luz de estúdio passando e brilho final.
// Só aparece no app instalado (ou com ?splash=1 para pré-visualizar), uma vez por abertura.
// Feita em CSS (globals.css, bloco "Abertura do app") em vez de vídeo: fica nítida em
// qualquer tela e não depende de baixar um arquivo pesado antes de aparecer.

const DEPTH_LAYERS = 18;

const SHOW_SCRIPT = `(function(){try{
var q=location.search.indexOf('splash=1')>-1;
var s=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
if(!q&&(!s||sessionStorage.getItem('lc-splash')))return;
sessionStorage.setItem('lc-splash','1');
var d=document.documentElement;d.classList.add('lc-splash-on');
setTimeout(function(){d.classList.add('lc-splash-done')},3900);
}catch(e){}})();`;

export function SplashIntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: SHOW_SCRIPT }} />;
}

export default function SplashIntro() {
  return (
    <div id="lc-splash" aria-hidden="true">
      <div className="lc-splash-beam" />
      <div className="lc-splash-halo" />
      <div className="lc-splash-stage">
        <div className="lc-splash-logo">
          {Array.from({ length: DEPTH_LAYERS }, (_, i) => (
            <span
              key={i}
              className="lc-splash-depth"
              style={{ "--z": `${-(i + 1) * 1.1}px`, "--shade": `${0.42 - (i / DEPTH_LAYERS) * 0.3}` }}
            />
          ))}
          <span className="lc-splash-face" />
          <span className="lc-splash-shine" />
          <span className="lc-splash-glint" />
        </div>
        <div className="lc-splash-shadow" />
      </div>
      <p className="lc-splash-tagline">
        Letícia Cunha <span>·</span> Nutricionista
      </p>
    </div>
  );
}
