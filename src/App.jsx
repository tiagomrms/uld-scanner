import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Html5Qrcode } from 'html5-qrcode'

function App() {
  const [uld, setUld] = useState('')
  const [tapete, setTapete] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })
  const [cameraAtiva, setCameraAtiva] = useState(false)

  const listaTapetes = [
    "TBC 2", "TBC 3", "TBC 4", "TBC 5", "TBC 6", "TBC 7", 
    "TBC 8", "TBC 9", "TBC 10", "TBC 11", "TBC 12", "TBC 13", "TRF"
  ]

  // Lógica Robusta da Câmara
  useEffect(() => {
    let scanner;

    if (cameraAtiva) {
      // O timeout garante que o HTML teve tempo de desenhar a caixa antes de ligar a câmara
      setTimeout(() => {
        scanner = new Html5Qrcode("leitor-camera");
        
        scanner.start(
          { facingMode: "environment" }, // Força a usar a câmara de trás do telemóvel
          { fps: 10, qrbox: { width: 250, height: 100 } }, // Formato retangular para códigos de barras
          (textoLido) => {
            // Sucesso na leitura!
            setUld(textoLido.toUpperCase());
            setCameraAtiva(false); // Fecha a câmara
            if (scanner) {
              scanner.stop().then(() => scanner.clear()).catch(console.error);
            }
          },
          (erro) => {
            // Ignorar erros silenciosos enquanto tenta focar no código
          }
        ).catch((err) => {
          console.error("Erro ao iniciar a câmara:", err);
          alert("Erro na câmara. Garante que aceitaste as permissões e estás a usar o link da Azure (HTTPS).");
          setCameraAtiva(false);
        });
      }, 100);
    }

    // Limpeza se o utilizador fechar a câmara
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(console.error);
      }
    };
  }, [cameraAtiva]);

  // Lógica de Gravação
  const registarDescarga = async (e) => {
    if (e) e.preventDefault()

    if (!uld || !tapete) {
      setMensagem({ texto: '⚠️ Preenche a matrícula e seleciona o tapete.', tipo: 'erro' })
      return
    }

    setLoading(true)
    setMensagem({ texto: '', tipo: '' })

    try {
      const { error } = await supabase
        .from('descargas_uld')
        .insert([{ uld: uld.toUpperCase(), tapete: tapete }])

      // Se o Supabase rejeitar a gravação, atira o erro!
      if (error) throw error

      setMensagem({ texto: `✅ ${uld.toUpperCase()} registado no ${tapete}!`, tipo: 'sucesso' })
      setUld('') // Limpa a matrícula
      
    } catch (error) {
      console.error('Erro na gravação:', error)
      // Agora o ecrã vai dizer-te EXATAMENTE porque é que falhou (ex: erro de chaves, RLS, etc)
      setMensagem({ texto: `❌ Falhou: ${error.message || 'Erro desconhecido'}`, tipo: 'erro' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex flex-col items-center pt-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Scanner <span className="text-blue-500">Menzies</span>
          </h1>
        </div>

        <form onSubmit={registarDescarga} className="space-y-6">
          
          {/* TAPETE */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Destino
            </label>
            <select
              value={tapete}
              onChange={(e) => setTapete(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-xl text-gray-800 focus:ring-4 focus:ring-blue-500/20 outline-none"
            >
              <option value="">Selecionar destino...</option>
              {listaTapetes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* CÂMARA E MATRÍCULA */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Matrícula ULD
            </label>
            
            {!cameraAtiva ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={uld}
                  onChange={(e) => setUld(e.target.value)}
                  placeholder="Ex: AKE12345TP"
                  disabled={loading}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-300 rounded-lg text-2xl uppercase placeholder:text-gray-400 placeholder:normal-case font-mono focus:border-blue-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setCameraAtiva(true)}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-all flex justify-center items-center gap-2"
                >
                  📸 Abrir Câmara (Código de Barras)
                </button>
              </div>
            ) : (
              <div className="bg-black p-2 rounded-lg relative min-h-[250px]">
                <button 
                  type="button" 
                  onClick={() => setCameraAtiva(false)}
                  className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md z-50 text-sm font-bold shadow-lg"
                >
                  Cancelar
                </button>
                {/* Esta div vazia é onde o código injeta a imagem da câmara */}
                <div id="leitor-camera" className="w-full overflow-hidden rounded-md"></div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg text-white font-bold text-xl uppercase tracking-wide transition-all shadow-md active:scale-[0.98] mt-4
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
          >
            {loading ? 'A Gravar...' : 'Gravar Registo'}
          </button>
        </form>

        {mensagem.texto && (
          <div className={`mt-6 p-4 rounded-lg text-center font-semibold text-lg animate-fade-in
            ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border-2 border-green-200' : 'bg-red-100 text-red-800 border-2 border-red-200'}
          `}>
            {mensagem.texto}
          </div>
        )}
      </div>
    </div>
  )
}

export default App