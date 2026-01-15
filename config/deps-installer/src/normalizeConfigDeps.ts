import getNpmTarballUrl from 'get-npm-tarball-url'
import { PnpmError } from '@pnpm/error'
import { pickRegistryForPackage } from '@pnpm/pick-registry-for-package'
import { type ConfigDependencies, type NormalizedConfigDependencies, type Registries } from '@pnpm/types'

interface NormalizeConfigDepsOpts {
  registries: Registries
}

export function normalizeConfigDeps (configDependencies: ConfigDependencies, opts: NormalizeConfigDepsOpts): NormalizedConfigDependencies {
  const deps: NormalizedConfigDependencies = {}
  for (const [pkgName, pkgSpec] of Object.entries(configDependencies)) {
    if (typeof pkgSpec === 'object') {
      if (!pkgSpec.resolution?.integrity) {
        throw new PnpmError('CONFIG_DEP_NO_INTEGRITY', `Your config dependency called "${pkgName}" at "pnpm.configDependencies" doesn't have an integrity checksum`, {
          hint: `Integrity checksum should either be inlined in the version specifier, or specified in the resolution field. For example:

pnpm-workspace.yaml:
configDependencies:
  my-config:
    version: "1.0.0"
    resolution:
      integrity: "sha512-Xg0tn4HcfTijTwfDwYlvVCl43V6h4KyVVX2aEm4qdO/PC6L2YvzLHFdmxhoeSA3eslcE6+ZVXHgWwopXYLNq4Q=="
`,
        })
      }
      deps[pkgName] = pkgSpec
      continue
    }

    if (typeof pkgSpec === 'string') {
      const sepIndex = pkgSpec.indexOf('+')
      if (sepIndex === -1) {
        throw new PnpmError('CONFIG_DEP_NO_INTEGRITY', `Your config dependency called "${pkgName}" at "pnpm.configDependencies" doesn't have an integrity checksum`, {
          hint: `Integrity checksum should either be inlined in the version specifier, or specified in the resolution field. For example:

pnpm-workspace.yaml:
configDependencies:
  my-config: "1.0.0+sha512-Xg0tn4HcfTijTwfDwYlvVCl43V6h4KyVVX2aEm4qdO/PC6L2YvzLHFdmxhoeSA3eslcE6+ZVXHgWwopXYLNq4Q=="
`,
        })
      }

      const version = pkgSpec.substring(0, sepIndex)
      const integrity = pkgSpec.substring(sepIndex + 1)
      const registry = pickRegistryForPackage(opts.registries, pkgName)
      deps[pkgName] = {
        version,
        resolution: {
          integrity,
          tarball: getNpmTarballUrl(pkgName, version, { registry }),
        },
      }
    }
  }

  return deps
}
