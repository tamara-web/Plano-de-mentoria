
import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  existingUsers: UserProfile[];
}

const Login: React.FC<LoginProps> = ({ onLogin, existingUsers }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      alert("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    if (isRegistering) {
      if (!name || !email || !password) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }
      const alreadyExists = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (alreadyExists) {
        alert("Este e-mail já está em uso na plataforma.");
        return;
      }

      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name,
        email: email.toLowerCase(),
        password,
        role,
        createdAt: new Date().toISOString(),
      };
      onLogin(newUser);
    } else {
      const user = existingUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (user) {
        onLogin(user);
      } else {
        alert("E-mail ou senha inválidos.");
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 sm:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 max-w-md w-full animate-fadeIn relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-900"></div>
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-blue-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 mx-auto mb-8 transform -rotate-6">
            <i className="fas fa-balance-scale text-white text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Mentoria <br/><span className="text-blue-700">Tamara Farias</span></h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Sua vaga na OAB começa aqui</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome de Aluno(a)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Clara Silva"
                className="w-full px-7 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail Institucional</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-7 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha Segura</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-7 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Acesso</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-4 rounded-2xl font-black text-xs transition-all border-2 flex items-center justify-center gap-2 ${role === 'student' ? 'border-blue-700 bg-blue-50 text-blue-700 shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                   <i className="fas fa-user-graduate"></i>
                  Aluno
                </button>
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`py-4 rounded-2xl font-black text-xs transition-all border-2 flex items-center justify-center gap-2 ${role === 'mentor' ? 'border-indigo-700 bg-indigo-50 text-indigo-700 shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                >
                   <i className="fas fa-star"></i>
                  Mentor
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-6 ${role === 'mentor' && isRegistering ? 'bg-indigo-700' : 'bg-blue-700'} hover:opacity-95 text-white font-black rounded-3xl shadow-2xl transition-all flex items-center justify-center space-x-4 active:scale-[0.98] mt-8`}
          >
            <span>{isRegistering ? 'Cadastrar na Mentoria' : 'Acessar Plataforma'}</span>
            <i className="fas fa-chevron-right text-xs opacity-50"></i>
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-700 transition-colors"
          >
            {isRegistering ? 'Já sou membro da mentoria' : 'Não sou membro, desejo me cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
