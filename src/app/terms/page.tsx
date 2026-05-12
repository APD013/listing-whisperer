import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Listing Whisperer",
  description:
    "Terms of Service for Listing Whisperer. Read our usage terms, subscription policies, and legal agreements.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using Listing Whisperer ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms apply to all users of the Service, including visitors, free trial users, and paid subscribers. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `Listing Whisperer is an AI-powered assistant built for real estate agents. The Service generates marketing copy, listing descriptions, seller meeting prep materials, and related content based on information you provide.

The Service is intended for professional use by licensed real estate agents, brokers, and related real estate professionals. You are responsible for ensuring that any content generated through the Service complies with your local MLS rules, brokerage policies, and applicable laws.`,
  },
  {
    id: "accounts",
    title: "3. Accounts & Registration",
    content: `To access the full features of the Service, you must create an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and promptly update your account information
• Keep your password secure and confidential
• Accept responsibility for all activity that occurs under your account
• Notify us immediately of any unauthorized use of your account

You must be at least 18 years old to use the Service. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    id: "trial",
    title: "4. Free Trial",
    content: `We offer a 24-hour free trial that includes full Pro access and up to 2 listings at no charge. No credit card is required to start your trial.

The free trial is available once per person and once per household. Creating multiple accounts to obtain additional free trials is prohibited and may result in account termination.

After your trial expires, continued use of Pro features requires a paid subscription.`,
  },
  {
    id: "billing",
    title: "5. Subscriptions & Billing",
    content: `Pro subscriptions are billed at $20 per month. Subscriptions automatically renew each month unless cancelled prior to the renewal date.

Payment is processed securely through Stripe. By subscribing, you authorize us to charge your payment method on a recurring monthly basis.

You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you will retain access through the period you have paid for. We do not issue refunds for partial months.

Prices are subject to change with 30 days' notice.`,
  },
  {
    id: "content",
    title: "6. Your Content & Data",
    content: `You retain ownership of the property information, notes, and other inputs you provide to the Service ("Your Content"). By using the Service, you grant Listing Whisperer a limited license to process Your Content solely to provide the Service to you.

You are solely responsible for the accuracy and legality of Your Content. Do not input confidential client information, personally identifiable information about third parties, or any information you are not authorized to share.

AI-generated outputs are provided for your use. We do not claim ownership of content generated on your behalf, but we make no guarantees about its originality, accuracy, or fitness for any particular purpose.`,
  },
  {
    id: "acceptable-use",
    title: "7. Acceptable Use",
    content: `You agree not to use the Service to:

• Violate any applicable law, regulation, or MLS rule
• Generate false, misleading, or deceptive property descriptions
• Infringe on the intellectual property rights of others
• Transmit spam, malware, or harmful code
• Attempt to reverse-engineer, scrape, or extract data from the Service
• Share your account credentials with others
• Resell or sublicense access to the Service
• Use the Service in any way that could harm Listing Whisperer or other users

We reserve the right to suspend or terminate accounts that violate this policy.`,
  },
  {
    id: "ip",
    title: "8. Intellectual Property",
    content: `The Listing Whisperer name, logo, product design, and underlying technology are owned by Listing Whisperer and protected by intellectual property laws. You may not use our brand assets, copy our product design, or create derivative works without written permission.

AI-generated content produced for you through the Service may be used by you for your real estate business. We do not claim copyright over individual outputs generated for you.`,
  },
  {
    id: "disclaimer",
    title: "9. Disclaimers",
    content: `The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that:

• The Service will be uninterrupted or error-free
• AI-generated content will be accurate, complete, or suitable for any specific purpose
• The Service will meet your specific business requirements

AI-generated content should always be reviewed and verified by you before use. You are responsible for compliance with your MLS, brokerage, and any applicable real estate regulations.`,
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, Listing Whisperer shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.

Our total liability to you for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the 3 months preceding the claim.

Some jurisdictions do not allow limitations on liability, so these limitations may not apply to you.`,
  },
  {
    id: "termination",
    title: "11. Termination",
    content: `You may cancel your account at any time from your account settings or by contacting us. We may suspend or terminate your account if you violate these Terms, with or without notice.

Upon termination, your right to use the Service ceases immediately. We may retain certain data as required by law or for legitimate business purposes.`,
  },
  {
    id: "governing-law",
    title: "12. Governing Law",
    content: `These Terms are governed by the laws of the State of California, without regard to its conflict of law provisions. Any disputes shall be resolved in the state or federal courts located in Orange County, California.

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.`,
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: `If you have questions about these Terms, please contact us:

Email: support@listingwhisperer.com

We aim to respond to all inquiries within 2 business days.`,
  },
];

export default function TermsPage() {
  return (
    <div
      style={{ backgroundColor: "#0d1117", minHeight: "100vh", color: "#e6edf3" }}
    >
      {/* Nav */}
      <nav
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(13,17,23,0.95)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "17px",
              color: "#e6edf3",
              letterSpacing: "-0.3px",
            }}
          >
            Listing<span style={{ color: "#1D9E75" }}>Whisperer</span>
          </span>
        </Link>
        <Link
          href="/"
          style={{
            fontSize: "13px",
            color: "#8b949e",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "#e6edf3")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "#8b949e")
          }
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 24px 48px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(29,158,117,0.1)",
            border: "1px solid rgba(29,158,117,0.25)",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "12px",
            color: "#1D9E75",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          Legal
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            margin: "0 0 12px",
            color: "#e6edf3",
          }}
        >
          Terms of Service
        </h1>
        <p style={{ color: "#8b949e", fontSize: "15px", margin: 0 }}>
          Last updated: June 1, 2026
        </p>
      </div>

      {/* Main layout */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px 96px",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "48px",
          alignItems: "start",
        }}
      >
        {/* Sidebar TOC */}
        <aside
          style={{
            position: "sticky",
            top: "80px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#8b949e",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "12px",
            }}
          >
            On this page
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{
                  fontSize: "13px",
                  color: "#8b949e",
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  transition: "background 0.15s, color 0.15s",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(29,158,117,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "#1D9E75";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#8b949e";
                }}
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ minWidth: 0 }}>
          {/* Intro card */}
          <div
            style={{
              backgroundColor: "#1a1d2e",
              border: "1px solid rgba(29,158,117,0.2)",
              borderRadius: "12px",
              padding: "24px 28px",
              marginBottom: "40px",
              borderLeft: "3px solid #1D9E75",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: "#c9d1d9",
                lineHeight: 1.7,
              }}
            >
              Please read these Terms of Service carefully before using Listing
              Whisperer. These Terms govern your access to and use of our
              service. By creating an account or using our platform, you agree
              to these Terms.
            </p>
          </div>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                style={{
                  borderTop:
                    i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  paddingTop: i === 0 ? 0 : "36px",
                  marginTop: i === 0 ? 0 : "36px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#e6edf3",
                    marginBottom: "16px",
                    marginTop: 0,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {section.title}
                </h2>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#8b949e",
                    lineHeight: 1.8,
                    whiteSpace: "pre-line",
                  }}
                >
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Footer CTA */}
          <div
            style={{
              marginTop: "64px",
              backgroundColor: "#1a1d2e",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "#8b949e",
                fontSize: "14px",
                margin: "0 0 16px",
              }}
            >
              Have questions about our Terms?
            </p>
            <a
              href="mailto:support@listingwhisperer.com"
              style={{
                display: "inline-block",
                backgroundColor: "#1D9E75",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Contact Us
            </a>
            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: "20px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/privacy"
                style={{
                  fontSize: "13px",
                  color: "#8b949e",
                  textDecoration: "none",
                }}
              >
                Privacy Policy →
              </Link>
              <Link
                href="/signup"
                style={{
                  fontSize: "13px",
                  color: "#1D9E75",
                  textDecoration: "none",
                }}
              >
                Get Started Free →
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#8b949e", fontSize: "13px", margin: 0 }}>
          © 2026 Listing Whisperer ·{" "}
          <Link
            href="/terms"
            style={{ color: "#1D9E75", textDecoration: "none" }}
          >
            Terms
          </Link>{" "}
          ·{" "}
          <Link
            href="/privacy"
            style={{ color: "#8b949e", textDecoration: "none" }}
          >
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  );
}
