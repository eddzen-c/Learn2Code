import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    apiRequest,
} from './api-client.js'

import {
    getBadgeCatalog,
} from './gamification.api.js'

vi.mock('./api-client.js', () => ({
    apiRequest: vi.fn(),
}))

describe('gamification API', () => {
    beforeEach(() => {
        apiRequest.mockReset()
    })

    it('gets the authenticated badge catalog', async () => {
        const catalog = {
            total: 10,
            earnedCount: 1,
            pendingCount: 9,
            badges: [{
                id: 'badge-1',
                name: 'Primer paso',
                earned: true,
            }],
        }

        apiRequest.mockResolvedValue({
            data: catalog,
        })

        const result =
            await getBadgeCatalog(
                'access-token',
            )

        expect(apiRequest).toHaveBeenCalledWith(
            '/gamification/badges',
            {
                accessToken:
                    'access-token',
            },
        )

        expect(result).toEqual(
            catalog,
        )
    })
})