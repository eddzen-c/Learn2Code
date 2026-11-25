
import {
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    getAcademicExerciseAssignment,
    getCurrentExercise,
} from '../api/exercise.api.js'

import {
    toExerciseViewModel,
} from './exercise-view-model.js'

const AUTH_REQUIRED_ERROR =
    new Error('AUTHENTICATION_REQUIRED')

// Obtiene el ejercicio real y conserva
// los datos únicamente para la sesión actual.
export function useExerciseSession({
    accessToken,
    assignmentId = null,
}) {
    const [requestState, setRequestState] = useState(null)

    const sessionKey = JSON.stringify([
        accessToken,
        assignmentId,
    ])

    useEffect(() => {
        if (!accessToken) {
            return undefined
        }

        let active = true

        const request = assignmentId !== null
            ? getAcademicExerciseAssignment({
                accessToken,
                assignmentId,
            })
            : getCurrentExercise(accessToken)

        request
            .then((data) => {
                if (!active) return

                setRequestState({
                    key: sessionKey,
                    session: data,
                    code:
                        data?.exercise?.starterCode ?? '',
                    error: null,
                })
            })
            .catch((requestError) => {
                if (!active) return

                setRequestState({
                    key: sessionKey,
                    session: null,
                    code: '',
                    error: requestError,
                })
            })

        return () => {
            active = false
        }
    }, [accessToken, assignmentId, sessionKey])

    // Descarta los datos de otra sesión
    // sin modificar el estado dentro del efecto.
    const current = requestState?.key === sessionKey
        ? requestState
        : null

    const session = current?.session ?? null
    const realExercise = session?.exercise

    const exercise = useMemo(
        () => toExerciseViewModel(realExercise),
        [realExercise],
    )

    const code = current?.code ?? ''

    // Actualiza solo el código
    // de la asignación que está abierta.
    const setCode = (nextCode) => {
        setRequestState((previous) => {
            if (previous?.key !== sessionKey) {
                return previous
            }

            const updatedCode =
                typeof nextCode === 'function'
                    ? nextCode(previous.code)
                    : nextCode

            return {
                ...previous,
                code: updatedCode,
            }
        })
    }

    return {
        session,
        exercise,
        code,
        setCode,

        isLoading:
            Boolean(accessToken) && !current,

        error:
            !accessToken
                ? AUTH_REQUIRED_ERROR
                : current?.error ?? null,
    }
}
