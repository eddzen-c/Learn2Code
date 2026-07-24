export const getAuthErrorMessage = (error) => {
    switch (error?.code) {
        case 'INVALID_CREDENTIALS':
            return 'El correo o la contraseña son incorrectos.'

        case 'EMAIL_ALREADY_REGISTERED':
            return 'Ya existe una cuenta con este correo.'

        case 'VALIDATION_ERROR':
            return 'Revisa los datos ingresados.'

        case 'UNSUPPORTED_PROGRAMMING_LANGUAGE':
            return 'El lenguaje seleccionado no está disponible.'

        case 'AUTHENTICATION_REQUIRED':
            return 'Tu sesión expiró. Inicia sesión nuevamente.'

        case 'NETWORK_ERROR':
            return 'No fue posible conectar con el servidor.'
        default:
            return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
    }
}