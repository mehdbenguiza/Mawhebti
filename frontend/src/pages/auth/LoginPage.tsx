import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authService.login(data);
      // Hack: on attend que le token soit setté (via l'interceptor API)
      useAuthStore.setState({ token: response.access_token });
      const user = await authService.getMe();
      setAuth(response.access_token, user);
      navigate('/dashboard/' + user.role.toLowerCase());
    } catch (err: any) {
      setError('root', {
        message: err.response?.data?.detail || 'Une erreur est survenue lors de la connexion',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à Mawhebti
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {errors.root && (
            <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
              {errors.root.message}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Mot de passe"
              type="password"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Se connecter
            </Button>
          </div>
          <div className="text-center text-sm">
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Pas encore de compte ? S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
