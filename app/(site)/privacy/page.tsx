import { getSettings } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/ui/Section";

export const metadata = pageMetadata({
  title: "Privacy notice",
  description: "How JFL Solar handles personal information sent through this website's inquiry form.",
  path: "/privacy",
});

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy notice" intro="How we handle the information you send through this website." />
      <Container className="py-10 sm:py-14">
        <div className="max-w-3xl space-y-8 text-steel-800 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-steel-950 [&_li]:ml-5 [&_li]:list-disc">
          <p role="note" className="rounded-[var(--radius-control)] border border-[#f0d39a] bg-warn-50 px-4 py-3 text-warn-800">
            Draft notice pending review by the business owner and a legal adviser. It describes how this website actually handles data.
          </p>

          <section>
            <h2>Who we are</h2>
            <p>
              JFL Solar, {s.office_address}. Phone {s.phone_display}
              {s.public_email ? `, email ${s.public_email}` : ""}. Contact us using these details for any privacy question or request.
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <p>When you send an inquiry we receive the details you enter:</p>
            <ul>
              <li>your name, and the phone number and/or email address you give us;</li>
              <li>the type of inquiry, your message, and any package or product you selected;</li>
              <li>optionally, your city or province and an electricity-bill range.</li>
            </ul>
            <p className="mt-2">Please do not include sensitive personal information (for example government ID numbers or payment details) in your message.</p>
          </section>

          <section>
            <h2>How we use it</h2>
            <p>
              Only to reply to your inquiry, prepare a quotation, and follow up on the request you made. We do not sell your information or use it for
              unrelated marketing.
            </p>
          </section>

          <section>
            <h2>How it is sent and stored</h2>
            <ul>
              <li>
                Your inquiry is sent to our business inbox by an email delivery service. The website itself does not save the content of your inquiry
                in its database.
              </li>
              <li>
                To prevent spam and abuse, the website records a one-way, salted fingerprint of your IP address with the time of submission. It cannot
                be turned back into your IP address. Fingerprints are only used for 24 hours and older ones are deleted automatically the
                next time the form is used.
              </li>
              <li>Our hosting provider may keep standard technical access logs for security and reliability.</li>
              <li>Inquiry emails are kept in our mailbox for as long as needed to handle your request and any resulting quotation or sale.</li>
            </ul>
          </section>

          <section>
            <h2>Cookies and tracking</h2>
            <p>
              The public website does not use analytics, advertising or tracking cookies. Staff who sign in to manage the website receive a sign-in
              cookie, which is strictly necessary for that purpose.
            </p>
          </section>

          <section>
            <h2>Messaging apps and phone calls</h2>
            <p>
              If you contact us by phone, WhatsApp or Viber, those services handle your communication under their own privacy policies.
            </p>
          </section>

          <section>
            <h2>Your rights</h2>
            <p>
              Under the Data Privacy Act of 2012 (Republic Act No. 10173) you may ask to access, correct or delete the personal information we hold
              about you, or object to its processing. Contact us using the details above.
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
