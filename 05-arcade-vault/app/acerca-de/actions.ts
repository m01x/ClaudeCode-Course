"use server";

import { Resend } from "resend";

export type ContactFormState = {
  name: string;
  email: string;
  msg: string;
};

export type ContactActionResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(data: ContactFormState): Promise<ContactActionResult> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      subject: `[Arcade Vault] Nuevo mensaje de contacto de ${data.name}`,
      text: `De: ${data.name} <${data.email}>\n\n${data.msg}`,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar el mensaje. Intenta de nuevo más tarde." };
  }
}
