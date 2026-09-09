import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const TAPETES = [
  ...Array.from({ length: 12 }, (_, i) => `TBC ${i + 2}`),
  'TRF'
];

export default function App() {
  const [tapeteAtual, setTapeteAtual] = useState(null);
  const [uldsLidos, setUldsLidos] = useState([]);
  const [modoSelecao, setModoSelecao] = useState('botoes');
  const ultimoLido = useRef(''); 

  const precisaCamera = tapeteAtual !== null || modoSelecao === 'escanear';

  useEffect(() => {
    if (!precisaCamera) return;

    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 100 } };

    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
      if (decodedText === ultimoLido.current) return;
      ultimoLido.current = decodedText;
      setTimeout(() => { ultimoLido.current = ''; }, 2000); 

      if (!tapeteAtual) {
        const textoMaiusculo = decodedText.toUpperCase();
        if (textoMaiusculo.includes("TBC") || textoMaiusculo.includes("TRF") || textoMaiusculo.includes("TAPETE")) {
          setTapeteAtual(decodedText);
          setModoSelecao('botoes');
        } else {
          alert(`Etiqueta: ${decodedText}. Aponte a um TBC ou TRF válido!`);
        }
        return;
      }

      setUldsLidos(prev => {
        if (prev.some(item => item.uld === decodedText)) return prev;
        return [{ uld: decodedText, tapete: tapeteAtual, timestamp: new Date().toISOString() }, ...prev];
      });

    }).catch((err) => console.error("Erro a iniciar câmara:", err));

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [precisaCamera, tapeteAtual]); 

  return (
    <div className="p-4 flex flex-col h-screen bg-gray-100">
      <div className={`${tapeteAtual ? 'bg-green-600' : 'bg-blue-600'} text-white p-4 rounded-lg shadow-md mb-4 transition-colors`}>
        <h1 className="text-xl font-bold">Gestão de ULDs - Menzies</h1>
        <p className="text-sm mt-1">
          {tapeteAtual ? `Ativo no ${tapeteAtual} - A ler Ulds...` : "Definir Local de Descarga"}
        </p>
      </div>

      {!tapeteAtual ? (
        <div className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col">
          <div className="flex mb-4 bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => setModoSelecao('botoes')} 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoSelecao === 'botoes' ? 'bg-white text-blue-700 shadow' : 'text-gray-600'}`}
            >
              Escolher (TBCs + TRF)
            </button>
            <button 
              onClick={() => setModoSelecao('escanear')} 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoSelecao === 'escanear' ? 'bg-white text-blue-700 shadow' : 'text-gray-600'}`}
            >
              Scanner Tapete
            </button>
          </div>

          {modoSelecao === 'botoes' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 pb-2">
                {TAPETES.map((tapete) => (
                  <button
                    key={tapete}
                    onClick={() => setTapeteAtual(tapete)}
                    className={`p-4 font-bold border-2 rounded-lg shadow transition-colors text-lg ${
                      tapete === 'TRF' 
                        ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-600 hover:text-white col-span-2' 
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {tapete} {tapete === 'TRF' && '(Transferências)'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-gray-600 text-sm mb-2 text-center">Aponte a câmara ao código do TBC ou TRF</p>
              {precisaCamera && (
                <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg border-4 border-blue-600 bg-black min-h-[250px]"></div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {precisaCamera && (
            <div className="flex justify-center mb-4">
              <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg border-4 border-green-600 bg-black min-h-[250px]"></div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-2">
            <h2 className="text-gray-700 font-bold p-2 border-b flex justify-between items-center">
              <span>Registos no {tapeteAtual}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                Total: {uldsLidos.length}
              </span>
            </h2>
            <ul>
              {uldsLidos.map((item, index) => (
                <li key={index} className="p-3 border-b border-gray-100 flex justify-between items-center text-green-700 font-bold bg-green-50 mb-1 rounded shadow-sm">
                  <span className="font-mono text-lg">{item.uld}</span>
                  <span className="text-xs text-gray-500 font-normal">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button 
            onClick={() => { setTapeteAtual(null); setUldsLidos([]); setModoSelecao('botoes'); }}
            className="mt-4 p-4 bg-red-500 text-white font-bold rounded-lg w-full shadow-lg active:bg-red-700 transition-colors"
          >
            Terminar / Mudar Local
          </button>
        </>
      )}
    </div>
  );
}