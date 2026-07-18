import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth.service';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
  role: z.enum(['TALENT_MINOR', 'TALENT_MAJOR', 'PARENT', 'RECRUITER'], {
    required_error: 'Veuillez sélectionner un rôle',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        role: data.role,
      });
      navigate('/login');
    } catch (err: any) {
      setError('root', {
        message: err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créer un compte
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
            <Input
              label="Confirmer le mot de passe"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Je suis un :
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="TALENT_MAJOR">Talent (Majeur)</option>
                <option value="TALENT_MINOR">Talent (Mineur)</option>
                <option value="PARENT">Parent / Tuteur</option>
                <option value="RECRUITER">Recruteur</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              S'inscrire
            </Button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
