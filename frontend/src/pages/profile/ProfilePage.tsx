import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { profileService } from '../../services/profile.service';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Prénom requis').max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Nom requis').max(100).optional().or(z.literal('')),
  bio: z.string().max(1000, 'Bio limitée à 1000 caractères').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  skills: z.string().optional(), // Entrée en texte libre, séparée par des virgules
});

type ProfileForm = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileService.getMyProfile,
    retry: (failureCount, error: any) => {
      // Ne pas retry sur les 404 (profil pas encore créé)
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  const mutation = useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // Pré-rempli le formulaire dès que le profil est chargé
  useEffect(() => {
    if (profile) {
      reset({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        bio: profile.bio ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        city: profile.city ?? '',
        country: profile.country ?? '',
        skills: profile.skills?.join(', ') ?? '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    const skills = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20)
      : [];

    await mutation.mutateAsync({
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      bio: data.bio || undefined,
      date_of_birth: data.date_of_birth || undefined,
      city: data.city || undefined,
      country: data.country || undefined,
      skills,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
        <p className="text-gray-600 mt-1">Ces informations seront visibles par les recruteurs.</p>
      </div>

      {mutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          ✅ Profil mis à jour avec succès !
        </div>
      )}
      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          ❌ Une erreur est survenue. Veuillez réessayer.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Nom" {...register('last_name')} error={errors.last_name?.message} />
        </div>

        {/* Bio */}
        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            {...register('bio')}
            rows={4}
            placeholder="Parlez-nous de vous, de votre talent..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm resize-none"
          />
          {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Ville" {...register('city')} error={errors.city?.message} />
          <Input label="Pays" {...register('country')} error={errors.country?.message} />
        </div>

        <Input
          label="Date de naissance"
          type="date"
          {...register('date_of_birth')}
          error={errors.date_of_birth?.message}
        />

        <div className="text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compétences / Talents
            <span className="text-gray-400 font-normal ml-1">(séparées par des virgules, max 20)</span>
          </label>
          <input
            {...register('skills')}
            type="text"
            placeholder="Ex: Chant, Piano, Danse contemporaine"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            isLoading={isSubmitting || mutation.isPending}
            disabled={!isDirty && !!profile}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
};
