import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function App() {
  const [tapeteAtual, setTapeteAtual] = useState(null);
  const [uldsLidos, setUldsLidos] = useState([]);
  const [cameraAtiva, setCameraAtiva] = useState(true);
  const ultimoLido = useRef(''); 

  useEffect(() => {
    if (!cameraAtiva) return;

    const html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 100 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
      .catch((err) => console.error("Erro a iniciar câmara:", err));

    function onScanSuccess(decodedText) {
      if (decodedText === ultimoLido.current) return;
      ultimoLido.current = decodedText;
      setTimeout(() => { ultimoLido.current = ''; }, 2000); 

      if (!tapeteAtual) {
        setTapeteAtual(decodedText);
      } else {
        const novoUld = {
          uld: decodedText,
          tapete: tapeteAtual,
          timestamp: new Date().toISOString()
        };
        setUldsLidos(prev => [novoUld, ...prev]);
      }
    }

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear());
      }
    };
  }, [cameraAtiva, tapeteAtual]); 

  return (
    <div className="p-4 flex flex-col h-screen bg-gray-100">
      <div className={`${tapeteAtual ? 'bg-green-600' : 'bg-blue-600'} text-white p-4 rounded-lg shadow-md mb-4`}>
        <h1 className="text-xl font-bold">Descarga por Câmara</h1>
        <p className="text-sm">
          {tapeteAtual ? `Tapete: ${tapeteAtual} - A ler contentores...` : "Aponte ao código do Tapete"}
        </p>
      </div>

      {cameraAtiva && (
        <div className="flex justify-center mb-4">
          <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg border-4 border-gray-800 bg-black min-h-[250px]"></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-2">
        <h2 className="text-gray-700 font-bold p-2 border-b">Contentores Registados</h2>
        <ul>
          {uldsLidos.map((item, index) => (
            <li key={index} className="p-3 border-b border-gray-100 flex justify-between items-center text-green-700 font-bold bg-green-50 mb-1 rounded">
              <span>{item.uld}</span>
              <span className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleTimeString().substring(0, 5)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {tapeteAtual && (
        <button 
          onClick={() => { setTapeteAtual(null); setUldsLidos([]); }}
          className="mt-4 p-4 bg-red-500 text-white font-bold rounded-lg w-full shadow-lg active:bg-red-700"
        >
          Limpar / Novo Tapete
        </button>
      )}
    </div>
  );
}