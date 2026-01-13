import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Send, CheckCircle, MapPin } from "lucide-react";
import type { Review } from "@shared/schema";

export default function Reviews() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerLocation: "",
    rating: 5,
    content: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews/published'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/published');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        customerName: "",
        customerLocation: "",
        rating: 5,
        content: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => setFormData({ ...formData, rating: star }) : undefined}
            onMouseEnter={interactive ? () => setHoveredRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
            disabled={!interactive}
            data-testid={interactive ? `star-${star}` : undefined}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (interactive ? (hoveredRating || formData.rating) : rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="reviews-title">
            Customer Reviews
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about their experience with Cobbler's Bench. 
            We take pride in our craftsmanship and customer service.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold mb-6">What Our Customers Say</h2>
            
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="overflow-hidden" data-testid={`review-card-${review.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {review.imageUrl ? (
                          <img
                            src={review.imageUrl}
                            alt={review.customerName}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-primary">
                              {review.customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold" data-testid={`review-name-${review.id}`}>
                                {review.customerName}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {review.customerLocation}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-muted-foreground" data-testid={`review-content-${review.id}`}>
                            "{review.content}"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-bold mb-4">Share Your Experience</h2>
                
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Thank You!</h3>
                    <p className="text-muted-foreground mb-4">
                      Your review has been submitted and will be published after approval.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      data-testid="button-submit-another"
                    >
                      Submit Another Review
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Your Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="John Smith"
                        required
                        data-testid="input-customer-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerLocation">Location *</Label>
                      <Input
                        id="customerLocation"
                        value={formData.customerLocation}
                        onChange={(e) => setFormData({ ...formData, customerLocation: e.target.value })}
                        placeholder="Cape Cod, MA"
                        required
                        data-testid="input-customer-location"
                      />
                    </div>

                    <div>
                      <Label>Rating *</Label>
                      <div className="mt-1">
                        {renderStars(formData.rating, true)}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">Your Review *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Share your experience with our services..."
                        rows={4}
                        required
                        minLength={10}
                        data-testid="input-review-content"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 10 characters
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitMutation.isPending ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Review
                        </>
                      )}
                    </Button>

                    {submitMutation.isError && (
                      <p className="text-sm text-destructive text-center">
                        {submitMutation.error.message}
                      </p>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
