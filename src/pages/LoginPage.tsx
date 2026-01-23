import React, { useState } from 'react';
import { BackgroundGradientAnimation } from '@/components/ui/background-gradient-animation';
import { InputWithIcon } from '@/components/global/InputWithIcon';
import { Mail, Lock, Sparkles, Bot } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/services/LoginService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import logo from '@/assets/scope.png';
import { Boxes } from "@/components/ui/background-boxes";

const LoginPage = () => {
    const { login } = useLogin();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({
                variant: 'destructive',
                title: 'Campos obrigatórios',
                description: 'Preencha email e senha para continuar.',
            });
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
            toast({
                title: 'Login realizado com sucesso!',
                description: 'Bem-vindo mestre!',
            });
            navigate('/');
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao fazer login',
                description: err.message || 'Credenciais inválidas.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full overflow-hidden">
            {/* Lado esquerdo - Background Animado */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-900">
                {/* Overlay escuro com mask */}
                <div className="absolute inset-0 z-20 bg-slate-900/40 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />

                {/* Background animado */}
                <Boxes />

                {/* Conteúdo com animações */}
                <div className="absolute inset-0 z-30 flex flex-col justify-center items-center pointer-events-none">
                    <div className="space-y-4 text-center">
                        {/* Texto "Bem-vindo ao" com animação de fade-in e slide */}
                        <h1
                            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-white/90
                animate-fade-in-down"
                            style={{
                                animation: 'fadeInDown 1s ease-out forwards',
                            }}
                        >
                            Bem-vindo ao
                        </h1>

                        {/* Container do Super Jarvis com efeitos */}
                        <div className="flex items-center justify-center gap-3 md:gap-4">

                            <h2
                                className="text-5xl
  sm:text-6xl
  lg:text-7xl
  xl:text-8xl
  max-[800px]:text-6xl
                  bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 
                  bg-[length:200%_auto] animate-gradient-x
                  bg-clip-text text-transparent
                  drop-shadow-[0_0_25px_rgba(139,92,246,0.5)]
                  hover:drop-shadow-[0_0_35px_rgba(139,92,246,0.8)]
                  transition-all duration-500"
                                style={{
                                    animation: 'fadeInUp 1s ease-out 0.3s forwards, gradientShift 3s ease infinite',
                                    opacity: 0,
                                }}
                            >
                                Super Jarvis
                            </h2>

                            {/* Ícone do Bot com animação */}
                            <Bot
                                className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 
                  text-purple-400 
                  drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                                style={{
                                    animation: 'pulse 2s ease-in-out infinite, float 3s ease-in-out infinite',
                                }}
                            />
                        </div>

                        {/* Linha decorativa animada */}
                        <div
                            className="mx-auto h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"
                            style={{
                                animation: 'expandWidth 1.5s ease-out 0.8s forwards',
                                width: '0%',
                            }}
                        />


                    </div>
                </div>


                <style>{`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% center;
            }
            50% {
              background-position: 100% center;
            }
          }

          @keyframes expandWidth {
            from {
              width: 0%;
            }
            to {
              width: 60%;
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes twinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
            </div>

            {/* Lado direito - Formulário de Login */}
            <div className="w-full lg:w-2/5 ... flex items-center justify-center p-8 overflow-y-auto">       <div className="w-full max-w-md space-y-6 lg:space-y-8">


                <div className="flex justify-center">
                    <div className="relative group">
                        {/* Glow effect responsivo */}

                        {/* Ring decorativo */}
                        <div className=" absolute -inset-1 md:-inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition-all duration-300" />

                        {/* Logo com tamanho responsivo */}
                        <img
                            src={logo}
                            alt="Logo"
                            className="relative 
                  h-20 w-20
                  lg:h-36 lg:w-36
                 max-[800px]:h-20 max-[800px]:w-20
                  object-contain
                  drop-shadow-2xl 
                  transition-all duration-500 
                  group-hover:scale-110 
                  group-hover:drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                        />
                    </div>
                </div>

                {/* Header */}
                <div className="text-center space-y-3">
                    <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Entrar na conta
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Digite suas credenciais para acessar o sistema
                    </p>
                </div>

                {/* Formulário com card elevado */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium">
                                    E-mail
                                </Label>
                                <InputWithIcon
                                    id="email"
                                    placeholder="exemplo@email.com"
                                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Senha
                                </Label>
                                <InputWithIcon
                                    id="password"
                                    placeholder="Digite sua senha"
                                    icon={<Lock className="h-5 w-5 text-gray-400" />}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Informação de acesso */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Acesso restrito a usuários autorizados
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
};

export default LoginPage;