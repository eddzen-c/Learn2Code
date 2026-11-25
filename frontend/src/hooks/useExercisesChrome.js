import '../pages/dashboard.css'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { useStudentStreak } from './useStudentStreak.js'

// Configuración compartida con Inicio, Perfil y Rutas.
// La racha se consulta al backend, nunca se inventa.
export function useExercisesChrome() {
    const { accessToken } = useAuth()
    const navigate = useNavigate()
    const streakDays = useStudentStreak(accessToken)

    return {
        sidebar: {
            variant: 'profile',
            activeItem: 'exercises',
            mascotSrc: '/images/dragon-laptop-512.png',
            mascotAlt: 'Dragón de Learn2Code programando',
            streakDays,
        },
        topbar: {
            streakDays,
            onOpenNotifications: () => {
                navigate('/profile', {
                    state: { openTab: 'notifications' },
                })
            },
        },
    }
}
