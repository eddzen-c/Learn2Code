import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { buildAcademicSeed } from '../migrations/data/academic-demo-curriculum.js'

test('cada especialización tiene cinco etapas con dos módulos diferentes', () => {
    const seeds = buildAcademicSeed()
    assert.equal(seeds.length, 40)
    assert.equal(new Set(seeds.map((seed) => seed.code)).size, 40)
    for (const key of ['frontend', 'backend', 'fullstack', 'devops']) {
        assert.equal(seeds.filter((seed) => seed.key === key).length, 10)
        for (let stage = 1; stage <= 5; stage++) {
            assert.equal(
                seeds.filter((seed) =>
                    seed.key === key && seed.stagePosition === stage
                ).length,
                2,
            )
        }
    }
})

test('los 120 casos de código se ejecutan y devuelven la salida correcta', () => {
    for (const seed of buildAcademicSeed()) {
        assert.equal(seed.cases.length, 3, seed.code)
        assert.equal(seed.cases.filter((c) => c.isHidden).length, 1)
        for (const item of seed.cases) {
            const run = spawnSync(
                process.execPath,
                ['-e', seed.solutionCode],
                {
                    input: item.input,
                    encoding: 'utf8',
                    timeout: 2000,
                },
            )
            assert.equal(run.status, 0, seed.code + ': ' + run.stderr)
            assert.equal(
                run.stdout.trim(),
                item.expectedOutput,
                seed.code + ': caso ' + item.position,
            )
        }
    }
})
