import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Html5Qrcode } from 'html5-qrcode'

function App() {
  // ==========================================
  // ESTADOS DE AUTENTICAÇÃO E NAVEGAÇÃO
  // ==========================================
  const [session, setSession] = useState(null)
  const [ecraAtual, setEcraAtual] = useState('menu') // 'menu', 'leitura' ou 'pesquisa'
  
  const [emailLogin, setEmailLogin] = useState('')
  const [passwordLogin, setPasswordLogin] = useState('')
  const [isRegisto, setIsRegisto] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [msgAuth, setMsgAuth] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      // Se fizer logout, garante que volta ao menu para a próxima sessão
      if (!session) setEcraAtual('menu') 
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoadingAuth(true)
    setMsgAuth('')
    try {
      if (isRegisto) {
        const { error } = await supabase.auth.signUp({ email: emailLogin, password: passwordLogin })
        if (error) throw error
        setMsgAuth('Conta criada! Podes fazer login.')
        setIsRegisto(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: passwordLogin })
        if (error) throw error
      }
    } catch (error) {
      setMsgAuth(error.message)
    } finally {
      setLoadingAuth(false)
    }
  }

  // ==========================================
  // ESTADOS DO SCANNER
  // ==========================================
  const [uld, setUld] = useState('')
  const [tapete, setTapete] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })
  const [cameraAtiva, setCameraAtiva] = useState(false)

  const listaTapetes = [
    "TBC 2", "TBC 3", "TBC 4", "TBC 5", "TBC 6", "TBC 7", 
    "TBC 8", "TBC 9", "TBC 10", "TBC 11", "TBC 12", "TBC 13", "TRF"
  ]

  useEffect(() => {
    let scanner;
    if (cameraAtiva && ecraAtual === 'leitura' && session) {
      setTimeout(() => {
        scanner = new Html5Qrcode("leitor-camera");
        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (textoLido) => {
            setUld(textoLido.toUpperCase());
            setCameraAtiva(false);
            if (scanner) scanner.stop().then(() => scanner.clear()).catch(console.error);
          },
          (erro) => {}
        ).catch((err) => {
          console.error("Erro na câmara:", err);
          alert("Erro na câmara. Garante permissões.");
          setCameraAtiva(false);
        });
      }, 100);
    }
    return () => {
      if (scanner && scanner.isScanning) scanner.stop().then(() => scanner.clear()).catch(console.error);
    };
  }, [cameraAtiva, ecraAtual, session]);

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
        .insert([{ uld: uld.toUpperCase(), tapete: tapete, operador: session.user.email }])

      if (error) throw error
      setMensagem({ texto: `✅ ${uld.toUpperCase()} registado!`, tipo: 'sucesso' })
      setUld('')
    } catch (error) {
      setMensagem({ texto: `❌ Falhou: ${error.message}`, tipo: 'erro' })
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // ESTADOS DA PESQUISA INTELIGENTE
  // ==========================================
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [resultados, setResultados] = useState([])
  const [loadingPesquisa, setLoadingPesquisa] = useState(false)

  const efetuarPesquisa = async (e) => {
    if (e) e.preventDefault()
    if (!termoPesquisa) return
    setLoadingPesquisa(true)
    try {
      const termo = termoPesquisa.toUpperCase()
      
      const { data, error } = await supabase
        .from('descargas_uld')
        .select('*')
        .or(`uld.ilike.%${termo}%,tapete.ilike.%${termo}%`)
        .order('created_at', { ascending: false }) // Mais recentes primeiro
        
      if (error) throw error
      setResultados(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPesquisa(false)
    }
  }

  // ==========================================
  // ECRÃ 1: LOGIN
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-900">Menzies</h1>
            <p className="text-gray-500 font-medium">Controlo de ULDs</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Corporativo</label>
              <input type="email" required value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} placeholder="ex: 30066307@myjohnmenzies.aero" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input type="password" required value={passwordLogin} onChange={(e) => setPasswordLogin(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loadingAuth} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
              {loadingAuth ? 'A aguardar...' : (isRegisto ? 'Criar Conta' : 'Iniciar Sessão')}
            </button>
            <div className="text-center mt-4">
              <button type="button" onClick={() => setIsRegisto(!isRegisto)} className="text-sm text-blue-600 font-medium hover:underline">
                {isRegisto ? 'Já tenho conta, iniciar sessão' : 'Criar nova conta de teste'}
              </button>
            </div>
            {msgAuth && <p className="text-center text-sm font-bold mt-4 text-red-600">{msgAuth}</p>}
          </form>
        </div>
      </div>
    )
  }

  // ==========================================
  // ECRÃ 2: MENU PRINCIPAL
  // ==========================================
  if (ecraAtual === 'menu') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 font-sans flex flex-col items-center pt-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Menzies <span className="text-blue-500">App</span></h1>
            <p className="text-sm text-gray-500 font-medium mt-2 break-all">Bem-vindo, {session.user.email}</p>
          </div>

          <div className="space-y-4">
            <button onClick={() => setEcraAtual('leitura')} className="w-full bg-blue-600 text-white p-6 rounded-xl font-bold text-xl hover:bg-blue-700 transition-all shadow-md flex flex-col items-center gap-2 active:scale-95">
              <span className="text-4xl">📋</span>
              Scanner de ULDs
            </button>

            <button onClick={() => setEcraAtual('pesquisa')} className="w-full bg-gray-800 text-white p-6 rounded-xl font-bold text-xl hover:bg-gray-700 transition-all shadow-md flex flex-col items-center gap-2 active:scale-95">
              <span className="text-4xl">🔍</span>
              Pesquisa / Histórico
            </button>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="w-full mt-8 py-3 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors">
            Terminar Sessão
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // ECRÃ 3: SCANNER OU PESQUISA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex flex-col items-center pt-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        
        {/* CABEÇALHO PARTILHADO COM BOTÃO VOLTAR */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <button onClick={() => { setEcraAtual('menu'); setCameraAtiva(false); setMensagem({texto: '', tipo: ''}); }} className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 px-3 py-2 bg-blue-50 rounded-lg">
            ⬅️ Voltar
          </button>
          <h2 className="text-xl font-extrabold text-gray-800">
            {ecraAtual === 'leitura' ? 'Nova Descarga' : 'Pesquisa'}
          </h2>
        </div>

        {/* --- CONTEÚDO DO SCANNER --- */}
        {ecraAtual === 'leitura' && (
          <form onSubmit={registarDescarga} className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Destino</label>
              <select value={tapete} onChange={(e) => setTapete(e.target.value)} disabled={loading} className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-xl text-gray-800 outline-none focus:border-blue-500">
                <option value="">Selecionar destino...</option>
                {listaTapetes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Matrícula ULD</label>
              {!cameraAtiva ? (
                <div className="space-y-3">
                  <input type="text" value={uld} onChange={(e) => setUld(e.target.value)} placeholder="Ex: AKE12345TP" disabled={loading} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-300 rounded-lg text-2xl uppercase placeholder:text-gray-400 font-mono focus:border-blue-500 outline-none" />
                  <button type="button" onClick={() => setCameraAtiva(true)} className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-all">📸 Abrir Câmara</button>
                </div>
              ) : (
                <div className="bg-black p-2 rounded-lg relative min-h-[250px]">
                  <button type="button" onClick={() => setCameraAtiva(false)} className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md z-50 text-sm font-bold shadow-lg">Cancelar</button>
                  <div id="leitor-camera" className="w-full overflow-hidden rounded-md"></div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className={`w-full py-4 rounded-lg text-white font-bold text-xl uppercase shadow-md ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'A Gravar...' : 'Gravar Registo'}
            </button>
            {mensagem.texto && (
              <div className={`p-4 rounded-lg text-center font-semibold text-lg ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {mensagem.texto}
              </div>
            )}
          </form>
        )}

        {/* --- CONTEÚDO DA PESQUISA --- */}
        {ecraAtual === 'pesquisa' && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={efetuarPesquisa} className="flex flex-col gap-3">
              <input 
                type="text" 
                value={termoPesquisa} 
                onChange={(e) => setTermoPesquisa(e.target.value)} 
                placeholder="Ex: TBC 4 ou AKE123" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-lg uppercase font-mono focus:border-blue-500 outline-none" 
              />
              <button type="submit" disabled={loadingPesquisa} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
                {loadingPesquisa ? 'A pesquisar...' : 'Procurar Registos'}
              </button>
            </form>

            {/* Contador de resultados */}
            {resultados.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center mt-2">
                <span className="text-blue-800 font-bold">Total de ULDs:</span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold">{resultados.length}</span>
              </div>
            )}

            <div className="mt-2 space-y-4 max-h-[450px] overflow-y-auto pr-2 pb-4">
              {resultados.length === 0 && !loadingPesquisa && termoPesquisa && (
                <p className="text-center text-gray-500 font-medium py-4">Nenhum registo encontrado.</p>
              )}
              
              {resultados.map((row) => {
                // Formatar a data para ser mais legível
                const dataObj = new Date(row.created_at);
                const dataFormatada = dataObj.toLocaleDateString('pt-PT');
                const horaFormatada = dataObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                return (
                  <div key={row.id} className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
                    {/* Cabeçalho do Card - Matrícula e Tapete */}
                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                      <span className="font-mono font-extrabold text-xl text-blue-900">{row.uld}</span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold shadow-sm">{row.tapete}</span>
                    </div>
                    
                    {/* Corpo do Card - Data, Hora e Operador */}
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-semibold">Data e Hora:</span>
                        <span className="text-gray-800 font-bold">{dataFormatada} às {horaFormatada}</span>
                      </div>
                      <div className="flex flex-col text-sm border-t border-gray-100 pt-2">
                        <span className="text-gray-500 font-semibold mb-1">Descarregado por:</span>
                        <span className="text-gray-700 font-mono text-xs break-all bg-gray-100 p-1.5 rounded">{row.operador}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App