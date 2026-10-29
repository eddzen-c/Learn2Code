
import {
    apiRequest,
} from './api-client.js';

/**
 * Consulta la especialización elegida por el estudiante.
 * No modifica registros.
 */
export const getCurrentStudentRoute = async (
    accessToken,
) => {
    const response = await apiRequest(
        '/student-routes/current',
        {
            accessToken,
        },
    );

    return response.data;
};

/**
 * Guarda una especialización elegida explícitamente.
 * Debe ejecutarse únicamente tras la confirmación
 * del estudiante.
 */
export const selectStudentRoute = async ({
    accessToken,
    specializationKey,
}) => {
    const response = await apiRequest(
        '/student-routes/current',
        {
            method: 'PUT',
            accessToken,
            body: {
                specializationKey,
            },
        },
    );

    return response.data;
};
