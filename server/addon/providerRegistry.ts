import type { ProviderDescriptor } from "./types";

const rawGitHub = (repository: string, file: string) =>
  `https://raw.githubusercontent.com/${repository}/refs/heads/main/${file}`;

/**
 * Only providers that explicitly declare Portuguese are admitted. The source
 * digest is pinned so a mutable upstream file is never executed if it changes.
 */
export const PROVIDERS: readonly ProviderDescriptor[] = [
  {
    id: "fshd",
    name: "FSHD",
    credits: "saimuel",
    repository: "saimuelbr/saimuel-nuvio-repo",
    sourceUrl: rawGitHub("saimuelbr/saimuel-nuvio-repo", "providers/fshd.js"),
    sourceSha256: "a2d291c0183af49f783b4a5969bebe9473d3fe0a6897cd7a3d6686a483531d9f",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["pt"],
    availability: "active",
    availabilityNote: "Ativo, sujeito à disponibilidade do site de origem.",
    sourceVersion: "1.0.0",
  },
  {
    id: "megaembed",
    name: "MegaEmbed",
    credits: "saimuel",
    repository: "saimuelbr/saimuel-nuvio-repo",
    sourceUrl: rawGitHub("saimuelbr/saimuel-nuvio-repo", "providers/megaembed.js"),
    sourceSha256: "1277ae42258917827019cc686497a227254b26ca0de7de1ac8bb2abaabc0bf32",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["pt"],
    availability: "active",
    availabilityNote: "Ativo, sujeito à disponibilidade do site de origem.",
    sourceVersion: "1.0.0",
  },
  {
    id: "peachify",
    name: "Peachify",
    credits: "saimuel",
    repository: "saimuelbr/saimuel-nuvio-repo",
    sourceUrl: rawGitHub("saimuelbr/saimuel-nuvio-repo", "providers/peachify.js"),
    sourceSha256: "a2980eb33e56cade84df09995ef8b3a5850ae645136871484da172ffe4b89f96",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["pt"],
    availability: "active",
    availabilityNote: "Ativo. Única integração de Peachify para evitar duplicidade.",
    sourceVersion: "1.0.0",
  },
  {
    id: "redeflix",
    name: "RedeFlix",
    credits: "saimuel",
    repository: "saimuelbr/saimuel-nuvio-repo",
    sourceUrl: rawGitHub("saimuelbr/saimuel-nuvio-repo", "providers/redeflix.js"),
    sourceSha256: "9d4de3c5664f01da4881e853e7bdc9db80465d19aea912baf1a19dac8a812fd5",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["pt"],
    availability: "active",
    availabilityNote: "Ativo, sujeito à disponibilidade do site de origem.",
    sourceVersion: "1.0.0",
  },
  {
    id: "animezey",
    name: "AnimeZeY",
    credits: "Nuvio Team",
    repository: "D3adlyRocket/All-in-One-Nuvio",
    sourceUrl: rawGitHub("D3adlyRocket/All-in-One-Nuvio", "providers/animezey.js"),
    sourceSha256: "46e83c8d710830679b7f17eacb03e014fc4195237cd423fe63254862549f24ff",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["en", "pt"],
    availability: "active",
    availabilityNote: "Ativo para resultados identificados como português pelo provider de origem.",
    sourceVersion: "1.0.0",
  },
  {
    id: "videasy",
    name: "VideoEasy",
    credits: "Nuvio Team",
    repository: "yoruix/nuvio-providers",
    sourceUrl: rawGitHub("yoruix/nuvio-providers", "providers/videasy.js"),
    sourceSha256: "3e554771641bd6208cd763c6ee6aa12a06ad858a52d7430cd43571fa9cde068d",
    supportedTypes: ["movie", "tv"],
    declaredLanguages: ["en", "de", "it", "fr", "hi", "es", "pt"],
    availability: "disabled-upstream",
    availabilityNote: "Desativado: o manifesto de origem o declara indisponível. Será habilitado somente após validação técnica.",
    sourceVersion: "1.0.0",
  },
] as const;

export function getEligibleProviders() {
  return PROVIDERS.filter(provider => provider.declaredLanguages.includes("pt"));
}

export function getActiveProviders() {
  return getEligibleProviders().filter(provider => provider.availability === "active");
}
