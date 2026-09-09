import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Html5Qrcode } from 'html5-qrcode'

function App() {
  const isAdministrador = new URLSearchParams(window.location.search).get('admin') === '1'
  
  // ==========================================
  // ESTADOS DE AUTENTICAÇÃO E UTILIZADOR
  // ==========================================
  const [session, setSession] = useState(null)
  const [emailLogin, setEmailLogin] = useState('')
  const [passwordLogin, setPasswordLogin] = useState('')
  const [isRegisto, setIsRegisto] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [msgAuth, setMsgAuth] = useState('')

  // Verifica se o utilizador já tem sessão iniciada ao abrir a app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Função de Login / Registo
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
    // Só ativa a câmara se houver sessão e não for o admin
    if (cameraAtiva && !isAdministrador && session) {
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
  }, [cameraAtiva, isAdministrador, session]);

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
        .insert([{ 
          uld: uld.toUpperCase(), 
          tapete: tapete,
          operador: session.user.email // Guarda o email automaticamente!
        }])

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
  // ESTADOS DA PESQUISA (ADMIN)
  // ==========================================
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [resultados, setResultados] = useState([])
  const [loadingPesquisa, setLoadingPesquisa] = useState(false)

  const efetuarPesquisa = async (e) => {
    if (e) e.preventDefault()
    if (!termoPesquisa) return
    setLoadingPesquisa(true)
    try {
      const { data, error } = await supabase
        .from('descargas_uld')
        .select('*')
        .ilike('uld', `%${termoPesquisa.toUpperCase()}%`)
        .order('created_at', { ascending: false })
      if (error) throw error
      setResultados(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPesquisa(false)
    }
  }

  // ==========================================
  // ECRÃ DE LOGIN (Se não houver sessão)
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
              <input 
                type="email" 
                required
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="ex: 30066307@myjohnmenzies.aero" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              />
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
  // ECRÃ DO ADMIN
  // ==========================================
  if (isAdministrador) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-3xl font-extrabold text-blue-900">Dashboard de Controlo</h1>
              <p className="text-gray-500 font-medium">Sessão: {session.user.email}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-200">
              Terminar Sessão
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <form onSubmit={efetuarPesquisa} className="flex gap-4">
              <input type="text" value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)} placeholder="Pesquisar matrícula (ex: AKE)" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-lg uppercase font-mono focus:border-blue-500 outline-none" />
              <button type="submit" disabled={loadingPesquisa} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700">
                {loadingPesquisa ? 'A procurar...' : 'Pesquisar Registos'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
                  <th className="p-4 border-b font-bold">Matrícula ULD</th>
                  <th className="p-4 border-b font-bold">Destino</th>
                  <th className="p-4 border-b font-bold">Data da Descarga</th>
                  <th className="p-4 border-b font-bold">Operador (Email)</th>
                </tr>
              </thead>
              <tbody>
                {resultados.length === 0 && !loadingPesquisa && (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Faça uma pesquisa.</td></tr>
                )}
                {resultados.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                    <td className="p-4 border-b font-mono font-bold text-gray-800">{row.uld}</td>
                    <td className="p-4 border-b"><span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{row.tapete}</span></td>
                    <td className="p-4 border-b text-gray-600 font-medium">{new Date(row.created_at).toLocaleString('pt-PT')}</td>
                    <td className="p-4 border-b text-sm text-gray-600">{row.operador || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // ECRÃ DO SCANNER (OPERADOR)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex flex-col items-center pt-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Scanner <span className="text-blue-500">Menzies</span></h1>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-red-600 font-bold hover:underline">Sair</button>
        </div>

        <form onSubmit={registarDescarga} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Destino</label>
            <select value={tapete} onChange={(e) => setTapete(e.target.value)} disabled={loading} className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-xl text-gray-800 outline-none focus:border-blue-500">
              <option value="">Selecionar destino...</option>
              {listaTapetes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Matrícula ULD</label>
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
        </form>
        {mensagem.texto && (
          <div className={`mt-6 p-4 rounded-lg text-center font-semibold text-lg ${mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800 border-2 border-green-200' : 'bg-red-100 text-red-800 border-2 border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}
      </div>
    </div>
  )
}

export default App