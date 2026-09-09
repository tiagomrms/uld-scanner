import { useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [uld, setUld] = useState('')
  const [tapete, setTapete] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' })

  const registarDescarga = async (e) => {
    e.preventDefault()

    // Validação simples
    if (!uld || !tapete) {
      setMensagem({ texto: '⚠️ Preenche a matrícula do ULD e o Tapete.', tipo: 'erro' })
      return
    }

    setLoading(true)
    setMensagem({ texto: '', tipo: '' })

    try {
      // Gravação na tabela descargas_uld do Supabase
      const { error } = await supabase
        .from('descargas_uld')
        .insert([
          { uld: uld.toUpperCase(), tapete: tapete }
        ])

      if (error) throw error

      // Feedback de sucesso
      setMensagem({ texto: '✅ Descarga registada com sucesso!', tipo: 'sucesso' })
      setUld('') // Limpa apenas o ULD para a próxima leitura ser mais rápida
      
      // Foca automaticamente no campo do ULD para o PDA poder disparar logo o próximo
      document.getElementById('input-uld')?.focus()

    } catch (error) {
      console.error('Erro na gravação:', error)
      setMensagem({ texto: '❌ Erro ao comunicar com a base de dados.', tipo: 'erro' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans flex flex-col items-center pt-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Scanner <span className="text-blue-500">ULD</span>
          </h1>
        </div>

        <form onSubmit={registarDescarga} className="space-y-6">
          {/* Input do Tapete */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Tapete / Posição
            </label>
            <select
              value={tapete}
              onChange={(e) => setTapete(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-xl text-gray-800 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Selecionar destino...</option>
              <option value="Tapete 1">Tapete 1</option>
              <option value="Tapete 2">Tapete 2</option>
              <option value="Tapete 3">Tapete 3</option>
              <option value="Tapete 4">Tapete 4</option>
              <option value="Parque">Parque de ULDs</option>
            </select>
          </div>

          {/* Input do ULD */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Matrícula ULD
            </label>
            <input
              id="input-uld"
              type="text"
              value={uld}
              onChange={(e) => setUld(e.target.value)}
              placeholder="Ex: AKE12345TP"
              disabled={loading}
              autoFocus
              className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-lg text-2xl uppercase placeholder:text-gray-400 placeholder:normal-case font-mono focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Botão Submeter */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg text-white font-bold text-xl uppercase tracking-wide transition-all shadow-md active:scale-[0.98]
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
          >
            {loading ? 'A Gravar...' : 'Gravar Registo'}
          </button>
        </form>

        {/* Mensagem de Alerta */}
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