import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Without a verified domain, Resend only allows sending from this address.
// Once a domain is verified in Resend, change this to e.g.
// "Eblon Mini Biblio LMF <no-reply@votre-domaine.com>".
const FROM = "Eblon Mini Biblio LMF <onboarding@resend.dev>"

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de votre mot de passe — Eblon Mini Biblio LMF",
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">Eblon Mini Biblio LMF</h2>
        <p style="color: #6b7280; margin-top: 0;">Lycée Moderne Facobly</p>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau. Ce lien expire dans 1 heure.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  })

  if (error) {
    console.log("[v0] Resend error:", error)
    throw new Error("Échec de l'envoi de l'email de réinitialisation.")
  }
}
