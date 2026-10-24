import { useParams } from "wouter";
import Shop from "@/pages/Shop";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  return <Shop initialSlug={params.slug} />;
}
