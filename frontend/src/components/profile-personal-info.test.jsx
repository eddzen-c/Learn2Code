
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
    ProfilePersonalInfo,
} from './ProfilePersonalInfo.jsx'

const currentUser = {
    fullName: 'Ana García',
    email: 'ana@example.test',
    username: null,
    bio: null,
    githubUrl: null,
    portfolioUrl: null,
    emailVerified: true,
}

describe('ProfilePersonalInfo', () => {
    it('saves all personal fields without changing the full name', async () => {
        const user = userEvent.setup()
        const onSave = vi.fn().mockResolvedValue(true)

        render(
            <ProfilePersonalInfo
                user={currentUser}
                onSave={onSave}
            />,
        )

        await user.type(
            screen.getByLabelText('Nombre de usuario'),
            'Ana_Dev',
        )

        await user.type(
            screen.getByLabelText('Sobre mí'),
            'Aprendiendo React',
        )

        await user.type(
            screen.getByLabelText('GitHub (opcional)'),
            'https://github.com/ana',
        )

        await user.type(
            screen.getByLabelText('Portafolio (opcional)'),
            'https://example.com',
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        expect(onSave).toHaveBeenCalledWith({
            fullName: 'Ana García',
            username: 'ana_dev',
            bio: 'Aprendiendo React',
            githubUrl: 'https://github.com/ana',
            portfolioUrl: 'https://example.com',
        })
    })

    it('allows clearing optional information', async () => {
        const user = userEvent.setup()
        const onSave = vi.fn().mockResolvedValue(true)

        render(
            <ProfilePersonalInfo
                user={{
                    ...currentUser,
                    bio: 'Biografía anterior',
                }}
                onSave={onSave}
            />,
        )

        await user.clear(
            screen.getByLabelText('Sobre mí'),
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Guardar cambios',
            }),
        )

        expect(onSave).toHaveBeenCalledWith({
            fullName: 'Ana García',
            username: null,
            bio: null,
            githubUrl: null,
            portfolioUrl: null,
        })
    })
})
