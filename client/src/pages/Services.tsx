import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowRight, Footprints, Briefcase, Sparkles, Heart, Ship, Accessibility, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import bootRepair from "@assets/Screenshot_2025-12-29_at_7.34.18_PM_1767055015932.png";
import boatCanvas from "@assets/Screenshot_2025-12-29_at_7.36.31_PM_1767055017502.png";
import vuittonBefore from "@assets/vuitton-handbag01_1767055020889.jpg";
import vuittonAfter from "@assets/vuitton-handbag02_1767055020889.jpg";
import louboutinRepair from "@assets/Christian-Louboutin-Repair-cape-cod-cobbler_1767055020890.jpg";

const shoeRepairServices = [
  "New Balance shoes — Fitted to you and accommodates all widths",
  "Heel repair",
  "Resoling shoes",
  "Shoe stretching",
  "Shoe shining",
  "Shoe dyeing for special occasions",
  "Heel cutting",
  "Re-heeling shoes",
  "Work boot repair",
  "Cowboy boot repair",
  "UGG boot cleaning",
];

const leatherBagServices = [
  "Custom leather work",
  "Zipper repair and replacement",
  "Sports equipment repairs",
  "Leather jacket alterations",
  "Gun holster repairs",
  "Belt repairs",
  "Knife cases",
  "Golf bag, luggage and handbag repairs",
  "Motorcycle bags",
  "Upholstery",
  "Saddles and tack",
  "Motorcycle seat repair",
];

const orthopedicServices = [
  "Custom made orthotics (shoes)",
  "Accommodate all widths",
  "Orthopedic build-ups and modifications",
  "Orthotic refurbishing",
  "Shoe elevations",
  "Sole and heel lifts",
  "Inside lifts",
  "Velcro straps",
  "Metatarsal bars",
  "Plantar fasciitis treatment",
  "Heel pain solutions",
];

const canvasCoverTypes = [
  "Bimini Tops",
  "Mooring Covers",
  "Cockpit Covers",
  "Boat T-Tops",
  "Console Covers",
  "Full Boat Covers",
  "Sail Covers",
  "Fender Covers",
  "Outboard Motor Covers",
  "Custom Canvas Covers",
];

const serviceTypes = [
  "Shoe Repair",
  "Boot Repair",
  "Leather & Bag Repair",
  "Designer Shoe Repair",
  "Orthotics & Orthopedics",
  "Boat Canvas & Sail Repair",
  "Custom Leather Work",
  "Other",
];

export default function Services() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitInquiry = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/service-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit inquiry");
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        serviceType: "",
        description: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInquiry.mutate(formData);
  };
  return (
    <Layout>
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              For over 3 generations, Cobbler's Bench has been committed to providing the best craftsmanship 
              and service in the Cape Cod area.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Footprints className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">Shoe Repair Services</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                From everyday wear to your most treasured pairs, we bring expert care to every shoe that comes through our doors.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {shoeRepairServices.map((service, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`service-shoe-${index}`}>
                    <span className="text-primary mt-1">•</span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-xl overflow-hidden shadow-lg mb-6">
                <img 
                  src={bootRepair} 
                  alt="Boot repair before and after - leather restored and polished" 
                  className="w-full h-auto"
                  data-testid="img-boot-repair"
                />
              </div>
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-serif text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Do you have a Shoe-Eating Dog?
                </h3>
                <p className="text-muted-foreground">
                  Training a puppy is not always easy, especially if your shoes are part of the learning curve. 
                  Bring us your chewed shoes — we've seen it all and can restore most damage!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={vuittonBefore} 
                  alt="Louis Vuitton handbag before repair - worn seam and broken zipper" 
                  className="w-full h-auto"
                  data-testid="img-vuitton-before"
                />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={vuittonAfter} 
                  alt="Louis Vuitton handbag after repair - good as new" 
                  className="w-full h-auto"
                  data-testid="img-vuitton-after"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">Leather & Bag Repair</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                We expertly restore handbags, luggage, motorcycle gear, and all types of leather goods to their former glory.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {leatherBagServices.map((service, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`service-leather-${index}`}>
                    <span className="text-primary mt-1">•</span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">Designer Shoe Repair</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Cobbler's Bench in Centerville, Mass restores and repairs designer shoes and accessories, 
                including Gucci, Chanel, Coach, Louis Vuitton, Christian Louboutin and many others.
              </p>
              <div className="bg-accent/10 rounded-xl p-6 mb-6">
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">Christian Louboutin Repair</h3>
                <p className="text-muted-foreground">
                  We specialize in restoring the iconic red soles and keeping your designer shoes looking like new.
                </p>
              </div>
              </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src={louboutinRepair} 
                alt="Christian Louboutin shoe repair - before and after red sole restoration" 
                className="w-full h-auto"
                data-testid="img-louboutin-repair"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="bg-secondary/30 rounded-xl p-8 max-w-md">
                <h3 className="font-serif text-xl font-bold text-foreground mb-4 text-center">
                  Personalized Fitting Services
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Let our friendly and experienced staff provide you with the shoe sizes and widths 
                  personalized to your needs. We understand that proper shoes are an important factor 
                  when trying to alleviate pain.
                </p>
                <p className="text-sm text-muted-foreground text-center italic">
                  Over the course of a lifetime most people experience some type of foot problem. 
                  The majority of foot problems are relatively correctable with personal attention from our experts.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Accessibility className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">Orthotics & Orthopedics</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                For over 3 generations, we've been committed to providing the best orthopedic services 
                and referral sources in the Cape Cod area.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {orthopedicServices.map((service, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`service-ortho-${index}`}>
                    <span className="text-primary mt-1">•</span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
              <Link href="/plantar-fasciitis">
                <Button variant="outline" className="gap-2" data-testid="link-plantar-fasciitis">
                  Learn About Plantar Fasciitis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Ship className="h-5 w-5" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground">Boat Canvas & Sail Repair</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                At Cape Cod Shoe Repair aka Cobbler's Bench, we also repair and maintain canvas boat covers and sails. 
                Our expert team is well-versed in the challenges facing boat owners in the Cape Cod climate, 
                from nor'easters to sunny summer days.
              </p>
              <h3 className="font-medium text-foreground mb-3">Canvas Boat Covers We Service:</h3>
              <ul className="grid grid-cols-2 gap-2 mb-6">
                {canvasCoverTypes.map((type, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground" data-testid={`service-canvas-${index}`}>
                    <span className="text-primary mt-1">•</span>
                    <span>{type}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground italic">
                We tailor our services to ensure your covers and sails remain in pristine condition, 
                protecting your investment and enhancing your boating experience.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src={boatCanvas} 
                alt="Various boat canvas covers and bimini tops" 
                className="w-full h-auto"
                data-testid="img-boat-canvas"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Need Something Custom?
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              We specialize in custom leather work and specialty repairs. Contact us to discuss your unique project.
            </p>
            <Button size="lg" asChild>
              <a href="#request-quote" data-testid="link-custom-quote">
                Request a Quote <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section id="request-quote" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 justify-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-foreground">Request a Quote</h2>
            </div>
            <p className="text-muted-foreground text-center mb-8">
              Every repair job is unique, so pricing varies depending on the item and work needed. 
              Fill out this form and we'll get back to you with an estimate, or call us directly.
            </p>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center" data-testid="inquiry-success">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">
                  We've received your inquiry and will get back to you soon.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSubmitted(false)}
                  data-testid="button-new-inquiry"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-background rounded-xl p-6 shadow-lg space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Your full name"
                      data-testid="input-inquiry-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      placeholder="your@email.com"
                      data-testid="input-inquiry-email"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerPhone">Phone (optional)</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      placeholder="(508) 123-4567"
                      data-testid="input-inquiry-phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                      required
                    >
                      <SelectTrigger data-testid="select-service-type">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type} value={type} data-testid={`option-service-${type}`}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Describe Your Item & Repair Needed *</Label>
                  <Textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please describe the item you need repaired and what work is needed. Include details like brand, condition, and any specific concerns."
                    rows={4}
                    data-testid="input-inquiry-description"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitInquiry.isPending || !formData.serviceType}
                  data-testid="button-submit-inquiry"
                >
                  {submitInquiry.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Inquiry
                    </>
                  )}
                </Button>

                {submitInquiry.isError && (
                  <p className="text-red-600 text-sm text-center" data-testid="inquiry-error">
                    Something went wrong. Please try again or call us directly.
                  </p>
                )}
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-2">Prefer to call?</p>
              <Button variant="outline" size="lg" asChild>
                <a href="tel:+15087756221" data-testid="link-call-us">
                  Call Us: (508) 775-6221
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Shop Our Products</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
            Browse our collection of leather goods and accessories available for purchase.
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8" asChild>
            <Link href="/shop" data-testid="link-shop-services">
              Visit Shop <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
