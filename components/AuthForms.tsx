import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const { login, register, resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const result = await login(email, password);
        if (!result.success) {
          setError(translateError(result.error));
        }
      } else if (mode === 'REGISTER') {
        if (!name) { setError("Nome é obrigatório"); setLoading(false); return; }
        const result = await register(email, password, name);
        
        if (!result.success) {
          setError(translateError(result.error));
        } else if (result.error) {
           setSuccessMsg(result.error);
           setMode('LOGIN');
        }
      } else if (mode === 'FORGOT_PASSWORD') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
          setMode('LOGIN');
        } else {
          setError(translateError(result.error));
        }
      }
    } catch (err) {
      setError('Ocorreu um erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to translate common Supabase errors
  const translateError = (msg?: string) => {
    if (!msg) return 'Erro desconhecido.';
    if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Email já cadastrado.';
    if (msg.includes('Password should be')) return 'A senha deve ter no mínimo 6 caracteres.';
    if (msg.includes('rate limit')) return 'Muitas tentativas. Tente novamente mais tarde.';
    return msg;
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-slate-900 px-4 transition-colors">
      <div className="max-w-md w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl text-2xl font-bold mb-4 shadow-lg shadow-blue-500/30">
            I
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {mode === 'LOGIN' && 'Bem-vindo'}
            {mode === 'REGISTER' && 'Criar Conta'}
            {mode === 'FORGOT_PASSWORD' && 'Recuperação'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {mode === 'FORGOT_PASSWORD' 
              ? 'Digite seu email para receber instruções.' 
              : 'Gestão inteligente dos seus indicadores.'}
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-lg text-center font-medium border border-emerald-100 dark:border-emerald-800/30">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Seu nome completo"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase ml-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="seu@email.com"
            />
          </div>

          {mode !== 'FORGOT_PASSWORD' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Senha</label>
                {mode === 'LOGIN' && (
                  <button 
                    type="button" 
                    onClick={() => switchMode('FORGOT_PASSWORD')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center mt-6"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              mode === 'LOGIN' ? 'Entrar' : mode === 'REGISTER' ? 'Cadastrar' : 'Enviar Link'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
          {mode === 'LOGIN' && (
            <>
              Não tem conta?{' '}
              <button onClick={() => switchMode('REGISTER')} className="text-primary font-bold hover:underline">
                Criar conta grátis
              </button>
            </>
          )}
          {mode === 'REGISTER' && (
            <>
              Já possui conta?{' '}
              <button onClick={() => switchMode('LOGIN')} className="text-primary font-bold hover:underline">
                Fazer login
              </button>
            </>
          )}
          {mode === 'FORGOT_PASSWORD' && (
            <button onClick={() => switchMode('LOGIN')} className="text-primary font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Voltar para Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};