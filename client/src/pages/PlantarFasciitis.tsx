import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Footprints, AlertCircle, CheckCircle, Heart, Shield, Activity } from "lucide-react";

const symptoms = [
  "Sharp, stabbing heel pain, especially with first steps in the morning",
  "Pain that worsens after standing or walking for long periods",
  "Discomfort that increases after exercise (not during)",
  "Tenderness on the bottom of the heel",
  "Stiffness and aching in the arch of the foot",
  "Pain that gradually develops over time",
];

const causes = [
  "Flat feet or high arches that alter weight distribution",
  "Wearing shoes with inadequate arch support",
  "Standing on hard surfaces for extended periods",
  "Sudden increase in physical activity",
  "Excess body weight putting strain on the plantar fascia",
  "Tight calf muscles and Achilles tendons",
  "Age-related wear (most common in ages 40-60)",
];

const whySoleSupports = [
  {
    title: "Proper Weight Distribution",
    description: "Sole supports redistribute pressure across your entire foot, reducing the concentrated stress on your plantar fascia.",
  },
  {
    title: "Arch Support",
    description: "Orthotics provide the specific arch support your feet need, preventing the fascia from overstretching.",
  },
  {
    title: "Shock Absorption",
    description: "Quality insoles absorb impact with each step, protecting the heel and reducing inflammation.",
  },
  {
    title: "Alignment Correction",
    description: "Proper sole supports correct biomechanical issues that contribute to plantar fasciitis development.",
  },
  {
    title: "Pain Relief",
    description: "By addressing the root cause, sole supports provide lasting relief rather than just masking symptoms.",
  },
  {
    title: "Prevention",
    description: "Even after recovery, continued use of supportive insoles helps prevent recurrence.",
  },
];

const treatments = [
  "Orthotic insoles tailored to your foot shape",
  "Heel cups and cushioned inserts",
  "Shoe modifications for better support",
  "Stretching exercises and physical therapy",
  "Night splints to maintain stretch while sleeping",
  "Proper footwear selection guidance",
];

export default function PlantarFasciitis() {
  return (
    <Layout>
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Footprints className="h-8 w-8" />
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Plantar Fasciitis
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Understanding this common foot condition and how proper sole support can bring lasting relief.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mb-8">
                <h2 className="font-serif text-2xl font-bold text-foreground mt-0 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                  What is Plantar Fasciitis?
                </h2>
                <p className="text-foreground mb-0">
                  Plantar fasciitis is one of the most common causes of heel pain. It occurs when the thick band of tissue 
                  (plantar fascia) that runs across the bottom of your foot — connecting your heel bone to your toes — becomes 
                  inflamed. This inflammation causes stabbing pain that typically occurs with your first steps in the morning 
                  and can significantly impact your daily activities and quality of life.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Common Symptoms
                  </h3>
                  <ul className="space-y-3">
                    {symptoms.map((symptom, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`symptom-${index}`}>
                        <span className="text-red-500 mt-1 font-bold">•</span>
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Common Causes
                  </h3>
                  <ul className="space-y-3">
                    {causes.map((cause, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`cause-${index}`}>
                        <span className="text-amber-500 mt-1 font-bold">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Sole Supports Are Essential
              </h2>
              <p className="text-muted-foreground text-lg">
                Proper arch support and cushioning are crucial for both treating and preventing plantar fasciitis.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whySoleSupports.map((reason, index) => (
                <div 
                  key={index} 
                  className="bg-background rounded-xl p-6 shadow-sm border border-border"
                  data-testid={`support-reason-${index}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{reason.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary/10 to-amber-100/50 rounded-2xl p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                    The Importance of Orthotics
                  </h2>
                  <p className="text-muted-foreground">
                    While over-the-counter insoles can provide temporary relief, orthotics offer superior benefits.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-foreground">
                  <strong>Every foot is unique.</strong> Generic insoles are designed for an "average" foot, but no two feet 
                  are exactly alike. Orthotics are molded specifically to your foot's contours, providing targeted 
                  support exactly where you need it most.
                </p>
                <p className="text-foreground">
                  <strong>Long-term investment in your health.</strong> While orthotics have a higher upfront cost, 
                  they typically last 2-5 years with proper care. More importantly, they address the underlying biomechanical 
                  issues that cause plantar fasciitis, potentially saving you from chronic pain and more expensive treatments 
                  down the road.
                </p>
                <p className="text-foreground">
                  <strong>Professional fitting matters.</strong> At Cobbler's Bench, we don't just sell insoles — we analyze 
                  your gait, assess your footwear, and create solutions tailored to your lifestyle and activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Treatment Options at Cobbler's Bench
              </h2>
              <p className="text-muted-foreground">
                We offer comprehensive solutions to help you find relief from plantar fasciitis.
              </p>
            </div>

            <div className="bg-background rounded-xl p-8 shadow-sm border border-border mb-8">
              <ul className="grid md:grid-cols-2 gap-4">
                {treatments.map((treatment, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground" data-testid={`treatment-${index}`}>
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <span>{treatment}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h3 className="font-serif text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Don't Ignore the Pain
              </h3>
              <p className="text-foreground mb-0">
                Untreated plantar fasciitis can become chronic and lead to changes in how you walk, which may cause 
                additional problems in your knees, hips, and back. Early intervention with proper support is key to 
                preventing long-term complications. If you're experiencing heel pain, don't wait — visit us for a 
                consultation and take the first step toward pain-free walking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Relief?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Visit Cobbler's Bench for a personalized assessment. Our experienced team will help you find 
              the right solution for your plantar fasciitis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" data-testid="link-services">
                  View All Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-shop">
                  Shop Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
