import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import type { SiteContent } from "@shared/schema";

const DEFAULT_TERMS = `<h2>1. Abandoned Property Policy</h2>
<p>Items left at Cobbler's Bench for more than <strong>90 days</strong> beyond the estimated completion date without customer contact will be considered abandoned property under Massachusetts law. Cobbler's Bench reserves the right to dispose of, donate, or sell abandoned items at its sole discretion. Reasonable efforts to contact the customer via email (using our automated notification system) or phone will be made prior to any such action.</p>

<h2>2. Unclaimed Product Sales</h2>
<p>All sales of unclaimed or abandoned products are <strong>final</strong> and sold <strong>AS-IS</strong> with no warranty, express or implied. Unclaimed items sold through our shop have no guarantee of condition, authenticity, or fitness for a particular purpose. By purchasing an unclaimed product, the buyer acknowledges and accepts these terms.</p>

<h2>3. Communication & Notifications</h2>
<p>"Notice" as referenced in these Terms of Service shall mean any communication sent via our automated email system (Gmail API integration) to the email address provided by the customer at the time of service or purchase. It is the customer's responsibility to provide and maintain a valid email address. Notices sent to the email address on file shall be considered delivered upon sending.</p>

<h2>4. Liability Limitations</h2>
<p>Cobbler's Bench operates in the Commonwealth of Massachusetts and provides repair services on a best-effort basis. While we take the utmost care with every item entrusted to us:</p>
<ul>
<li>Cobbler's Bench is <strong>not liable</strong> for pre-existing damage, wear, or defects not caused by our repair work.</li>
<li>Liability for any damage occurring during repair is limited to the <strong>fair market value</strong> of the item at the time of service, not the replacement cost or sentimental value.</li>
<li>Certain materials (aged leather, exotic skins, vintage items) carry inherent risks during repair. Customers will be advised of these risks before work begins.</li>
<li>Cobbler's Bench is not responsible for items left beyond the abandonment grace period as defined in Section 1.</li>
</ul>

<h2>5. Payment Terms</h2>
<p>Payment is accepted via Venmo (@Victor-Hadawar). Orders placed through our website require payment within 48 hours of order confirmation. Failure to remit payment may result in order cancellation. All prices listed include applicable services; Massachusetts sales tax (6.25%) is applied at checkout.</p>

<h2>6. Shipping & Pickup</h2>
<p>Customers may choose between shipping and in-store pickup. Cobbler's Bench is not responsible for items lost or damaged during transit by third-party carriers. Shipping fees are non-refundable. Items available for in-store pickup must be collected within 90 days of completion notification.</p>

<h2>7. Governing Law</h2>
<p>These Terms of Service are governed by the laws of the Commonwealth of Massachusetts. Any disputes arising from these terms or services rendered shall be resolved in the courts of Barnstable County, Massachusetts.</p>

<h2>8. Changes to Terms</h2>
<p>Cobbler's Bench reserves the right to update these Terms of Service at any time. Continued use of our services or website constitutes acceptance of the most current version of these terms.</p>`;

export default function Terms() {
  const { data: termsContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content/terms-of-service"],
    queryFn: async () => {
      const res = await fetch("/api/site-content/terms-of-service");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const title = termsContent?.title || "Terms of Service";
  const content = termsContent?.content || DEFAULT_TERMS;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-2 text-center" data-testid="text-terms-title">
          {title}
        </h1>
        <p className="text-center text-muted-foreground mb-8 text-sm">
          Last updated: {termsContent?.updatedAt ? new Date(termsContent.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="h-px bg-border mb-8" />
        <article
          className="terms-content max-w-none [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2 [&_li]:text-muted-foreground [&_strong]:text-foreground [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: content }}
          data-testid="text-terms-content"
        />
        <div className="h-px bg-border mt-12 mb-6" />
        <p className="text-xs text-muted-foreground text-center">
          Cobbler's Bench &middot; 1600 Falmouth Rd, Centerville, MA 02632 &middot; cobblersbenchcapecod@gmail.com
        </p>
      </div>
    </Layout>
  );
}
