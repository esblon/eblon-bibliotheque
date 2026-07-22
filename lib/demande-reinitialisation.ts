export type DemandeReinitialisationDependencies = {
  compteExiste: (email: string) => Promise<boolean>
  envoyerLien: (email: string, redirectTo: string) => Promise<void>
}

export async function demanderReinitialisation(
  email: string,
  redirectTo: string,
  dependencies: DemandeReinitialisationDependencies,
) {
  const emailNormalise = email.trim().toLowerCase()
  const compteExiste = await dependencies.compteExiste(emailNormalise)

  if (compteExiste) {
    await dependencies.envoyerLien(emailNormalise, redirectTo)
  }

  return { compteExiste }
}
